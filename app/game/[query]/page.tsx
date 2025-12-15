import { db } from "@/lib/firebase";
import GameGallery from "@/components/GameGallery";
import { getGameDetails, normalizeGameName } from "@/lib/igdb";
import { Category } from "@/types";
import { collection, getDocs } from "firebase/firestore";
import { ArrowLeft, Calendar, Crown, Gamepad2, Info, LayoutTemplate, Star, Tag, Trophy, Youtube } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{
        query: string;
    }>
}

async function getParticipatingCategories(gameName: string) {
    const catRef = collection(db, "categories");
    const snapshot = await getDocs(catRef);

    // Simplificar nombre para comparación (ignorar case y espacios extra)
    const normalize = (s: string) => s.toLowerCase().trim();
    const targetName = normalize(gameName);

    const participating: { category: Category; winner: boolean }[] = [];

    // Obtenemos también los ganadores
    // Nota: Esto sería más eficiente si los ganadores estuvieran en un documento público accesible o cacheado
    // Por simplicidad en Server Component, asumiremos que leemos de admin/results o verificamos el flag en la UI
    // Pero la estructura Category ya tiene el ganador *si* lo populamos. 
    // En Firestore `categories`, la lista `nominees` no tiene flag de ganador.
    // El ganador está en `admin/results`. 
    // Para no complicar, mostraremos solo participación por ahora.

    snapshot.forEach(doc => {
        const cat = { id: doc.id, ...doc.data() } as Category;
        const isNominated = cat.nominees.some(n => normalize(n.name) === targetName || normalizeGameName(n.name) === normalizeGameName(gameName));

        if (isNominated) {
            participating.push({ category: cat, winner: false });
        }
    });

    return participating;
}

export default async function GameDetailPage(props: PageProps) {
    const params = await props.params;
    // Decodificar nombre del juego
    const gameName = decodeURIComponent(params.query);

    // Fetch paralelo de IGDB y Categorías
    const [gameData, categories] = await Promise.all([
        getGameDetails(gameName),
        getParticipatingCategories(gameName)
    ]);

    if (!gameData) {
        return notFound();
    }

    return (
        <div className="min-h-screen bg-deep text-white pb-20">
            {/* HERO SECTION */}
            <div className="relative h-[60vh] w-full overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center blur-sm scale-105 opacity-40"
                    style={{ backgroundImage: `url(${gameData.coverUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deep via-deep/80 to-transparent" />

                <div className="relative z-10 h-full max-w-7xl mx-auto px-4 md:px-6 flex flex-col justify-end pb-12">
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-auto pt-24 transition-colors w-fit">
                        <ArrowLeft size={20} /> Volver
                    </Link>

                    <div className="flex flex-col md:flex-row gap-8 items-end">
                        {/* Cover Image */}
                        <div className="hidden md:block w-48 aspect-[3/4] rounded-lg shadow-2xl overflow-hidden border border-white/10 shrink-0">
                            {gameData.coverUrl && <img src={gameData.coverUrl} alt={gameData.name} className="w-full h-full object-cover" />}
                        </div>

                        {/* Text Info */}
                        <div className="flex-1">
                            <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
                                {gameData.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-gray-300">
                                {gameData.developer && (
                                    <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full">
                                        <Gamepad2 size={16} className="text-primary" /> {gameData.developer}
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full">
                                    <Calendar size={16} className="text-primary" /> {gameData.releaseDate}
                                </span>
                                {gameData.aggregatedRating && (
                                    <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full font-bold text-yellow-400">
                                        <Star size={16} fill="currentColor" /> {gameData.aggregatedRating}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <main className="max-w-7xl mx-auto px-4 md:px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">

                {/* Left Column: Info & Media */}
                <div className="lg:col-span-2 space-y-12">
                    {/* Synopsis */}
                    <section>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <Info className="text-primary" /> Sinopsis
                        </h2>
                        <p className="text-gray-300 leading-relaxed text-lg">
                            {gameData.summary}
                        </p>
                        {gameData.storyline && (
                            <p className="text-gray-400 mt-4 leading-relaxed text-sm italic border-l-4 border-white/10 pl-4">
                                "{gameData.storyline}"
                            </p>
                        )}
                    </section>

                    {/* Platforms & Genres */}
                    <section className="flex flex-wrap gap-3">
                        {gameData.platforms.map(p => (
                            <span key={p} className="flex items-center gap-1.5 bg-surface border border-white/10 px-3 py-1.5 rounded text-xs uppercase font-bold tracking-wider text-gray-400">
                                <LayoutTemplate size={14} /> {p}
                            </span>
                        ))}
                        {gameData.genres.map(g => (
                            <span key={g} className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded text-xs uppercase font-bold tracking-wider text-primary">
                                <Tag size={14} /> {g}
                            </span>
                        ))}
                    </section>

                    {/* Videos */}
                    {gameData.videoIds.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Youtube className="text-red-500" /> Trailers
                            </h2>
                            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${gameData.videoIds[0]}`}
                                    title="Game Trailer"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </section>
                    )}

                    {/* Screenshots Gallery */}
                    {gameData.screenshots.length > 0 && (
                        <GameGallery screenshots={gameData.screenshots} gameName={gameData.name} />
                    )}
                </div>

                {/* Right Column: Nominations */}
                <div className="space-y-8">
                    <div className="bg-surface border border-white/10 rounded-2xl p-6 sticky top-24">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Trophy className="text-yellow-500" /> Nominaciones
                        </h3>

                        {categories.length > 0 ? (
                            <div className="space-y-4">
                                {categories.map(({ category }) => (
                                    <div key={category.id} className="flex items-center gap-3 p-3 bg-deep rounded-xl border border-white/5 hover:border-white/20 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                            {/* Icono placeholder por categoría si tuviéramos */}
                                            <Crown size={16} className="text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm uppercase tracking-wide">{category.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic pb-4">
                                No se encontraron nominaciones activas con este nombre exacto.
                            </p>
                        )}

                        <div className="mt-8 pt-6 border-t border-white/10">
                            <p className="text-xs text-center text-gray-500">
                                Datos provistos por <a href="https://www.igdb.com" target="_blank" className="text-primary hover:underline">IGDB</a>
                            </p>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
