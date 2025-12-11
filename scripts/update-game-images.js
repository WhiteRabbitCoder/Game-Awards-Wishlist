/* eslint-disable no-console */
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, writeBatch } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID;
const IGDB_CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET;

if (!IGDB_CLIENT_ID || !IGDB_CLIENT_SECRET) {
    console.error('Faltan IGDB_CLIENT_ID o IGDB_CLIENT_SECRET en .env.local');
    process.exit(1);
}

// Categorías que NO son de juegos y se deben omitir
const NON_GAME_CATEGORY_IDS = new Set([
    'best-esports-athlete',
    'best-esports-team',
    'content-creator-of-the-year',
    'best-adaptation', // es cine/series
]);

function igdbCoverUrl(imageId) {
    return `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg`;
}

async function getIGDBAccessToken() {
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `client_id=${IGDB_CLIENT_ID}&client_secret=${IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
    });
    if (!response.ok) throw new Error(`Token error: ${response.status}`);
    const data = await response.json();
    return data.access_token;
}

async function searchGameOnIGDB(name, accessToken) {
    const response = await fetch('https://api.igdb.com/v4/games', {
        method: 'POST',
        headers: {
            'Client-ID': IGDB_CLIENT_ID,
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
        },
        // buscamos por nombre y pedimos cover.image_id
        body: `search "${name}"; fields name,cover.image_id; limit 1;`,
    });
    if (!response.ok) return [];
    return response.json();
}

async function updateGameImages() {
    console.log('🚀 Iniciando actualización de imágenes IGDB (solo categorías de juegos)...');

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const accessToken = await getIGDBAccessToken();
    console.log('✅ Token IGDB obtenido');

    const categoriesRef = collection(db, 'categories');
    const snapshot = await getDocs(categoriesRef);

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const catDoc of snapshot.docs) {
        const cat = catDoc.data();
        const catId = catDoc.id;

        if (NON_GAME_CATEGORY_IDS.has(catId)) {
            console.log(`⏭️ Omitiendo categoría no-juego: ${cat.name} (${catId})`);
            continue;
        }

        if (!Array.isArray(cat.nominees) || cat.nominees.length === 0) continue;

        console.log(`\n📂 Categoría: ${cat.name} (${catId})`);
        const batch = writeBatch(db);
        let catChanges = 0;
        const nominees = [...cat.nominees];

        for (let i = 0; i < nominees.length; i++) {
            const n = nominees[i];

            // Forzar actualización SIEMPRE en categorías de juegos
            await new Promise(r => setTimeout(r, 260)); // rate limit

            try {
                const results = await searchGameOnIGDB(n.name, accessToken);
                if (results.length && results[0].cover && results[0].cover.image_id) {
                    const url = igdbCoverUrl(results[0].cover.image_id);
                    nominees[i] = { ...n, image: url };
                    catChanges++;
                    updated++;
                    console.log(`  ✅ ${n.name} → ${url}`);
                } else {
                    failed++;
                    console.log(`  ⚠️ No encontrado en IGDB: ${n.name}`);
                }
            } catch (e) {
                failed++;
                console.log(`  ❌ Error "${n.name}": ${e.message}`);
            }
        }

        if (catChanges > 0) {
            batch.update(doc(db, 'categories', catDoc.id), { nominees });
            await batch.commit();
            console.log(`  💾 Guardados ${catChanges} cambios en Firestore`);
        } else {
            skipped++;
            console.log('  ⏭️ Sin cambios en esta categoría');
        }
    }

    console.log('\n✨ Finalizado');
    console.log(`   ✅ Actualizadas: ${updated}`);
    console.log(`   ⏭️ Omitidas (sin cambios): ${skipped}`);
    console.log(`   ❌ Fallidas: ${failed}`);

    process.exit(0);
}

updateGameImages().catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
});