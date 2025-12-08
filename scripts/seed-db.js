require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, writeBatch } = require('firebase/firestore');

// 1. Configuración de Firebase (usando tus variables de entorno)
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 2. Inicializar
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedDatabase() {
    try {
        console.log("🔥 Conectando a Firebase...");

        // 3. Leer el archivo JSON
        const dataPath = path.join(__dirname, '../tga_data.json');
        const rawData = fs.readFileSync(dataPath, 'utf8');
        const categories = JSON.parse(rawData);

        console.log(`📖 Leídas ${categories.length} categorías del JSON.`);

        // 4. Subir datos por lotes (Batch)
        // Firestore permite escrituras por lotes para mayor eficiencia
        const batch = writeBatch(db);

        categories.forEach((category) => {
            // Referencia al documento: colección 'categories', ID = category.id
            const docRef = doc(db, "categories", category.id);
            batch.set(docRef, category);
        });

        console.log("🚀 Subiendo datos a Firestore...");
        await batch.commit();

        console.log("✅ ¡Éxito! Base de datos poblada correctamente.");
        console.log("Ahora puedes ver tus datos en la consola de Firebase -> Firestore Database.");

    } catch (error) {
        console.error("❌ Error al subir datos:", error);
    }
}

seedDatabase();