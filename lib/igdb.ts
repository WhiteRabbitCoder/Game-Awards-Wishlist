import { db } from "./firebase";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";

const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID;
const IGDB_CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET;

// Tipos
export interface GameDetails {
    igdbId: number;
    name: string;
    slug: string;
    summary: string;
    storyline: string | null;
    coverUrl: string | null;
    screenshots: string[];
    videoIds: string[];
    genres: string[];
    platforms: string[];
    releaseDate: string;
    developer: string | null;
    rating: number | null;
    aggregatedRating: number | null;
    fetchedAt: number;
}

// Normalizar nombre para usar como ID en Firestore
export const normalizeGameName = (name: string) => {
    return name.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};

// Obtener Token de Twitch
async function getAccessToken() {
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `client_id=${IGDB_CLIENT_ID}&client_secret=${IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
        cache: 'no-store'
    });

    if (!response.ok) throw new Error(`Twitch Token Error: ${response.statusText}`);
    const data = await response.json();
    return data.access_token;
}

// Buscar y cachear juego
export async function getGameDetails(gameName: string): Promise<GameDetails | null> {
    if (!gameName) return null;

    const normalizedId = normalizeGameName(gameName);
    const gameDocRef = doc(db, "games", normalizedId);

    // 1. Intentar leer de Firestore cache
    try {
        const gameSnap = await getDoc(gameDocRef);
        if (gameSnap.exists()) {
            const data = gameSnap.data() as GameDetails;
            // Opcional: Validar TTL del cache aquí si se desea
            return data;
        }
    } catch (error) {
        console.error("Error reading from cache:", error);
    }

    // 2. Si no está en cache, fetch de IGDB
    try {
        const token = await getAccessToken();

        // Buscar juego (Traemos más candidatos para filtrar mejor)
        const searchRes = await fetch('https://api.igdb.com/v4/games', {
            method: 'POST',
            headers: {
                'Client-ID': IGDB_CLIENT_ID!,
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: `
                search "${gameName}";
                fields name, slug, summary, storyline, cover.image_id, 
                       screenshots.image_id, videos.video_id, 
                       genres.name, platforms.name, first_release_date, 
                       involved_companies.company.name, involved_companies.developer,
                       rating, aggregated_rating, category;
                limit 10;
            `
        });

        if (!searchRes.ok) throw new Error(`IGDB Search Error: ${searchRes.statusText}`);
        const games = await searchRes.json();

        if (!games || games.length === 0) return null;

        // --- LÓGICA DE SELECCIÓN MEJORADA ---
        // Priorizar:
        // 1. Coincidencia exacta de nombre (case insensitive)
        // 2. Main Game (category 0) que tenga cover
        // 3. Remake/Remaster con cover
        // 4. Cualquier cosa con cover

        const targetNameLower = gameName.toLowerCase().trim();

        let selectedGame = games.find((g: any) => g.name.toLowerCase() === targetNameLower);

        if (!selectedGame) {
            // Si no hay exacta, buscar Main Game (0) con Cover
            selectedGame = games.find((g: any) => g.category === 0 && g.cover);
        }

        if (!selectedGame) {
            // Si no, buscar Remake (8) o Remaster (9) con Cover
            selectedGame = games.find((g: any) => (g.category === 8 || g.category === 9) && g.cover);
        }

        if (!selectedGame) {
            // Si no, el primero que tenga cover
            selectedGame = games.find((g: any) => g.cover);
        }

        // Fallback final: el primero
        const rawGame = selectedGame || games[0];

        // Procesar datos
        const developer = rawGame.involved_companies?.find((c: any) => c.developer)?.company?.name
            || rawGame.involved_companies?.[0]?.company?.name;

        // SANITIZACIÓN: Asegurar que undefined se convierta en null
        const gameDetails: GameDetails = {
            igdbId: rawGame.id,
            name: rawGame.name,
            slug: rawGame.slug,
            summary: rawGame.summary || "",
            storyline: rawGame.storyline || null,
            coverUrl: rawGame.cover ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${rawGame.cover.image_id}.jpg` : null,
            screenshots: rawGame.screenshots?.map((s: any) => `https://images.igdb.com/igdb/image/upload/t_screenshot_huge/${s.image_id}.jpg`) || [],
            videoIds: rawGame.videos?.map((v: any) => v.video_id) || [],
            genres: rawGame.genres?.map((g: any) => g.name) || [],
            platforms: rawGame.platforms?.map((p: any) => p.name) || [],
            releaseDate: rawGame.first_release_date ? new Date(rawGame.first_release_date * 1000).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : "TBA",
            developer: developer || null,
            rating: rawGame.rating ? Math.round(rawGame.rating) : null,
            aggregatedRating: rawGame.aggregated_rating ? Math.round(rawGame.aggregated_rating) : null,
            fetchedAt: Date.now()
        };

        // 3. Guardar en Firestore
        // Firestore no acepta 'undefined', por eso la importancia de los nulls arriba
        await setDoc(gameDocRef, gameDetails);

        return gameDetails;

    } catch (error) {
        console.error("IGDB Fetch Error:", error);
        return null;
    }
}
