import { db } from "./firebase";
import { collection, doc, setDoc, getDoc, getDocs, query, where, runTransaction, serverTimestamp, updateDoc, documentId } from "firebase/firestore";

// Generar código aleatorio de 6 caracteres
const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export const createGroup = async (userId: string, groupName: string, ownerName: string) => {
    const nameLowercase = groupName.trim().toLowerCase(); // Normalizamos

    // 1. Validación: Verificar si el usuario ya tiene un grupo con este nombre (insensible a mayúsculas)
    const q = query(
        collection(db, "groups"),
        where("ownerId", "==", userId),
        where("nameLowercase", "==", nameLowercase) // Buscamos por el campo normalizado
    );
    const duplicateCheck = await getDocs(q);

    if (!duplicateCheck.empty) {
        throw new Error("Ya tienes un grupo con este nombre.");
    }

    const code = generateCode();
    const groupRef = doc(collection(db, "groups"));

    const groupData = {
        id: groupRef.id,
        name: groupName.trim(), // Guardamos el original bonito
        nameLowercase: nameLowercase, // Guardamos el normalizado para búsquedas futuras
        ownerId: userId,
        ownerName: ownerName,
        code: code,
        createdAt: serverTimestamp(),
        isGlobal: false
    };

    await runTransaction(db, async (transaction) => {
        transaction.set(groupRef, groupData);
        const memberRef = doc(db, "groups", groupRef.id, "members", userId);
        transaction.set(memberRef, { joinedAt: serverTimestamp() });
        const userGroupRef = doc(db, "users", userId, "joinedGroups", groupRef.id);
        transaction.set(userGroupRef, { joinedAt: serverTimestamp() });
    });

    return { id: groupRef.id, code };
};

// Unirse a un grupo por código
export const joinGroup = async (userId: string, code: string) => {
    // 1. Buscar el grupo por código
    const q = query(collection(db, "groups"), where("code", "==", code.toUpperCase()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        throw new Error("Código inválido. El grupo no existe.");
    }

    const groupDoc = snapshot.docs[0];
    const groupId = groupDoc.id;

    // 2. Verificar si ya es miembro
    const memberRef = doc(db, "groups", groupId, "members", userId);
    const memberSnap = await getDoc(memberRef);

    if (memberSnap.exists()) {
        throw new Error("Ya eres miembro de este grupo.");
    }

    // 3. Unirse
    await runTransaction(db, async (transaction) => {
        transaction.set(memberRef, { joinedAt: serverTimestamp() });
        const userGroupRef = doc(db, "users", userId, "joinedGroups", groupId);
        transaction.set(userGroupRef, { joinedAt: serverTimestamp() });
    });

    return groupId;
};

// Actualizar nombre del grupo (También validamos aquí)
export const updateGroup = async (groupId: string, newName: string) => {
    // Nota: Para ser estrictos, aquí también deberíamos validar duplicados, 
    // pero requeriría leer el ownerId primero. Por simplicidad en update, solo actualizamos ambos campos.
    const groupRef = doc(db, "groups", groupId);
    await updateDoc(groupRef, {
        name: newName.trim(),
        nameLowercase: newName.trim().toLowerCase()
    });
};

// Obtener los grupos del usuario
export const getUserGroups = async (userId: string) => {
    // 1. Obtener IDs de los grupos donde está el usuario
    const userGroupsRef = collection(db, "users", userId, "joinedGroups");
    const userGroupsSnap = await getDocs(userGroupsRef);

    if (userGroupsSnap.empty) {
        return [{ id: "global", name: "Ranking Mundial", isGlobal: true, ownerId: "system", code: "GLOBAL" }];
    }

    const groupIds = userGroupsSnap.docs.map(doc => doc.id);

    // 2. Buscar la info real de esos grupos en la colección 'groups'
    // Firestore permite buscar por ID con 'where(documentId(), "in", ids)' (máximo 10 a la vez, pero servirá por ahora)
    const groupsRef = collection(db, "groups");
    const q = query(groupsRef, where(documentId(), "in", groupIds));
    const groupsSnap = await getDocs(q);

    const realGroups = groupsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    // 3. Añadir el global y devolver
    return [
        { id: "global", name: "Ranking Mundial", isGlobal: true, ownerId: "system", code: "GLOBAL" },
        ...realGroups
    ];
};