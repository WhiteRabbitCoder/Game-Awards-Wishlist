const { initializeApp } = require("firebase/app");
const {
    getFirestore,
    collection,
    getDocs,
    doc,
    getDoc,
    writeBatch
} = require("firebase/firestore");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateGroupMembers() {
    console.log("🚀 Iniciando migración de miembros de grupos...");

    try {
        const groupsRef = collection(db, "groups");
        const groupsSnap = await getDocs(groupsRef);

        console.log(`📊 Se encontraron ${groupsSnap.docs.length} grupos\n`);

        for (const groupDoc of groupsSnap.docs) {
            const groupId = groupDoc.id;
            const groupData = groupDoc.data();
            console.log(`📌 Procesando grupo: ${groupData.name} (${groupId})`);

            const usersRef = collection(db, "users");
            const usersSnap = await getDocs(usersRef);

            console.log(`   👥 Encontrados ${usersSnap.docs.length} usuarios totales`);

            const batch = writeBatch(db);
            let miembrosAgregados = 0;

            for (const userDoc of usersSnap.docs) {
                const userId = userDoc.id;
                const userData = userDoc.data();
                const score = userData.score || 0;

                const memberRef = doc(db, "groups", groupId, "members", userId);
                batch.set(
                    memberRef,
                    {
                        score: score,
                        username: userData.username || userData.displayName || "Usuario",
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                    { merge: true }
                );

                miembrosAgregados++;
            }

            await batch.commit();
            console.log(`   ✅ ${miembrosAgregados} miembros agregados/actualizados`);

            // Actualizar información del propietario
            if (groupData.ownerId) {
                const ownerRef = doc(db, "users", groupData.ownerId);
                const ownerSnap = await getDoc(ownerRef);

                if (ownerSnap.exists()) {
                    const ownerData = ownerSnap.data();
                    const groupRef = doc(db, "groups", groupId);
                    const updateBatch = writeBatch(db);
                    updateBatch.update(groupRef, {
                        ownerName: ownerData.username || ownerData.displayName || "Admin",
                        ownerEmail: ownerData.email,
                        updatedAt: new Date(),
                    });
                    await updateBatch.commit();
                    console.log(`   👑 Información del propietario actualizada\n`);
                }
            }
        }

        console.log("✨ ¡Migración completada exitosamente!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error durante la migración:", error);
        process.exit(1);
    }
}

migrateGroupMembers();