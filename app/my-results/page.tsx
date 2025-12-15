"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { Category, Nominee } from "@/types";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Loader2, Trophy, Crown, ArrowLeft, Check, X, Medal, Target, TrendingUp, Star } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const CATEGORY_ORDER = [
    "game-of-the-year", "best-game-direction", "best-narrative", "best-art-direction",
    "best-score-and-music", "best-audio-design", "best-performance", "innovation-in-accessibility",
    "games-for-impact", "best-ongoing-game", "best-community-support", "best-independent-game",
    "best-debut-indie-game", "best-mobile-game", "best-vr---ar-game", "best-action-game",
    "best-action---adventure-game", "best-role-playing-game", "best-fighting-game", "best-family-game",
    "best-sim---strategy-game", "best-sports---racing-game", "best-multiplayer-game", "best-adaptation",
    "most-anticipated-game", "content-creator-of-the-year", "best-esports-game", "best-esports-athlete", "best-esports-team"
];

interface CategoryResult {
    categoryId: string;
    categoryName: string;
    winner: Nominee | null;
    userVotes: (Nominee | null)[]; // [1st, 2nd, 3rd]
    hitPosition: number | null; // 0 = 1st, 1 = 2nd, 2 = 3rd, null = miss
    points: number;
}

export default function MyResultsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [results, setResults] = useState<CategoryResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalPoints: 0,
        maxPoints: 0,
        hits: 0,
        misses: 0,
        accuracy: 0
    });

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }

        const loadData = async () => {
            try {
                // 1. Cargar Ganadores Oficiales
                const resultsSnap = await getDoc(doc(db, "admin", "results"));
                const winnersData = resultsSnap.exists() ? resultsSnap.data() as Record<string, string> : {};

                // 2. Cargar Categorías
                const catSnap = await getDocs(collection(db, "categories"));
                const categories = catSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Category[];

                // 3. Cargar votos del usuario
                const votesSnap = await getDocs(collection(db, `users/${user.uid}/votes`));
                const userVotes: Record<string, any> = {};
                votesSnap.forEach(vDoc => {
                    userVotes[vDoc.id] = vDoc.data();
                });

                // 4. Calcular resultados
                const resultsData: CategoryResult[] = [];
                let totalPoints = 0;
                let maxPoints = 0;
                let hits = 0;
                let misses = 0;

                categories.forEach(category => {
                    const winnerId = winnersData[category.id];
                    const winner = category.nominees.find(n => n.id === winnerId) || null;
                    const vote = userVotes[category.id];

                    const isGOTY = category.id === "game-of-the-year";
                    const pointsTable = isGOTY ? [5, 4, 3] : [3, 2, 1];

                    // Máximos puntos posibles
                    if (winnerId) {
                        maxPoints += pointsTable[0];
                    }

                    // Solo procesar si hay ganador oficial
                    if (!winnerId || !winner) return;

                    const votes: (Nominee | null)[] = [
                        category.nominees.find(n => n.id === vote?.firstPlace) || null,
                        category.nominees.find(n => n.id === vote?.secondPlace) || null,
                        category.nominees.find(n => n.id === vote?.thirdPlace) || null,
                    ];

                    let hitPosition: number | null = null;
                    let points = 0;

                    if (vote?.firstPlace === winnerId) {
                        hitPosition = 0;
                        points = pointsTable[0];
                        hits++;
                    } else if (vote?.secondPlace === winnerId) {
                        hitPosition = 1;
                        points = pointsTable[1];
                        hits++;
                    } else if (vote?.thirdPlace === winnerId) {
                        hitPosition = 2;
                        points = pointsTable[2];
                        hits++;
                    } else if (vote?.firstPlace) {
                        misses++;
                    }

                    totalPoints += points;

                    resultsData.push({
                        categoryId: category.id,
                        categoryName: category.name,
                        winner,
                        userVotes: votes,
                        hitPosition,
                        points
                    });
                });

                // Ordenar por CATEGORY_ORDER
                resultsData.sort((a, b) => {
                    const indexA = CATEGORY_ORDER.indexOf(a.categoryId);
                    const indexB = CATEGORY_ORDER.indexOf(b.categoryId);
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;
                    return indexA - indexB;
                });

                setResults(resultsData);
                setStats({
                    totalPoints,
                    maxPoints,
                    hits,
                    misses,
                    accuracy: hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0
                });

            } catch (error) {
                console.error(error);
                toast.error("Error cargando resultados");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user, router]);

    if (loading) return (
        <div className="min-h-screen bg-deep flex items-center justify-center text-white">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="text-gray-400 font-medium tracking-wide">Calculando tus resultados...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-deep text-white overflow-x-hidden pb-20">
            {/* Header / Hero */}
            <div className="relative pt-24 pb-16 px-4 md:px-6 overflow-hidden border-b border-white/10">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-deep" />

                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors absolute left-0 top-0">
                        <ArrowLeft size={20} /> Volver
                    </Link>

                    <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-1.5 rounded-full border border-primary/30 mb-6 backdrop-blur-sm">
                        <Target size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">Tus Resultados</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
                        <span className="bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent drop-shadow-2xl">
                            ¿Cuántos Acertaste?
                        </span>
                    </h1>

                    <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8">
                        Descubre cómo te fue comparando tus predicciones con los ganadores oficiales.
                    </p>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                        <div className="bg-surface border border-white/10 rounded-xl p-4">
                            <div className="text-3xl font-black text-primary mb-1">{stats.totalPoints}</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Puntos</div>
                        </div>
                        <div className="bg-surface border border-white/10 rounded-xl p-4">
                            <div className="text-3xl font-black text-green-400 mb-1">{stats.hits}</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Aciertos</div>
                        </div>
                        <div className="bg-surface border border-white/10 rounded-xl p-4">
                            <div className="text-3xl font-black text-red-400 mb-1">{stats.misses}</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Fallos</div>
                        </div>
                        <div className="bg-surface border border-white/10 rounded-xl p-4">
                            <div className="text-3xl font-black text-yellow-400 mb-1">{stats.accuracy}%</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Precisión</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Listado de Resultados */}
            <main className="max-w-5xl mx-auto px-4 md:px-6 py-16">
                <div className="space-y-6">
                    {results.map((result) => {
                        const isGOTY = result.categoryId === "game-of-the-year";
                        const isHit = result.hitPosition !== null;

                        return (
                            <div
                                key={result.categoryId}
                                className={`bg-surface border rounded-xl overflow-hidden transition-all ${isHit
                                    ? "border-green-500/30 shadow-lg shadow-green-500/10"
                                    : "border-white/10"
                                    } ${isGOTY ? "ring-2 ring-yellow-500/30" : ""}`}
                            >
                                {/* Header */}
                                <div className={`p-4 flex items-center justify-between ${isHit ? "bg-green-500/10" : "bg-deep/50"
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        {isGOTY && <Crown size={20} className="text-yellow-500" />}
                                        <h3 className={`font-bold uppercase tracking-wider ${isGOTY ? "text-yellow-500" : "text-gray-400"
                                            } text-sm`}>
                                            {result.categoryName}
                                        </h3>
                                    </div>

                                    {isHit ? (
                                        <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/30 text-xs font-bold">
                                            <Check size={14} />
                                            +{result.points} pts
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 bg-red-500/10 text-red-400 px-3 py-1 rounded-full border border-red-500/20 text-xs font-bold">
                                            <X size={14} />
                                            Fallaste
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-4 md:p-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Ganador Oficial */}
                                        <div>
                                            <div className="text-xs text-yellow-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <Trophy size={12} /> Ganador Oficial
                                            </div>
                                            <Link href={`/game/${encodeURIComponent(result.winner?.name || '')}`} className="flex items-center gap-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 hover:bg-yellow-500/20 transition-all cursor-pointer group">
                                                {result.winner?.image && (
                                                    <img
                                                        src={result.winner.image}
                                                        alt={result.winner.name}
                                                        className="w-16 h-16 rounded-lg object-cover group-hover:scale-105 transition-transform"
                                                    />
                                                )}
                                                <div>
                                                    <p className="font-bold text-white group-hover:text-yellow-400 transition-colors">{result.winner?.name}</p>
                                                    {result.winner?.developer && (
                                                        <p className="text-sm text-gray-400">{result.winner.developer}</p>
                                                    )}
                                                </div>
                                            </Link>
                                        </div>

                                        {/* Tus Predicciones */}
                                        <div>
                                            <div className="text-xs text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <Target size={12} /> Tus Predicciones
                                            </div>
                                            <div className="space-y-2">
                                                {result.userVotes.map((vote, index) => {
                                                    const isThisTheHit = result.hitPosition === index;
                                                    const medalColors = ["text-yellow-400", "text-gray-300", "text-amber-600"];

                                                    return (
                                                        <div
                                                            key={index}
                                                            className={`flex items-center gap-3 p-2 rounded-lg border ${isThisTheHit
                                                                ? "bg-green-500/10 border-green-500/30"
                                                                : "bg-deep/30 border-transparent"
                                                                }`}
                                                        >
                                                            <div className={`w-6 h-6 flex items-center justify-center font-black text-sm ${medalColors[index]}`}>
                                                                {index + 1}
                                                            </div>
                                                            {vote?.image && (
                                                                <img src={vote.image} alt={vote.name} className="w-8 h-8 rounded object-cover" />
                                                            )}
                                                            <Link href={vote?.name ? `/game/${encodeURIComponent(vote.name)}` : '#'} className={`text-sm ${isThisTheHit ? "text-green-400 font-bold" : "text-gray-400"} hover:underline truncate`}>
                                                                {vote?.name || "Sin selección"}
                                                            </Link>
                                                            {isThisTheHit && <Medal size={16} className="text-green-400 ml-auto" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {results.length === 0 && (
                    <div className="text-center py-20">
                        <Target size={64} className="mx-auto text-gray-700 mb-6" />
                        <h3 className="text-2xl font-bold text-gray-400">No hay resultados disponibles</h3>
                        <p className="text-gray-500 mt-2">Aún no se han anunciado ganadores o no has hecho predicciones.</p>
                    </div>
                )}

                {/* Link to Winners */}
                <div className="mt-12 text-center">
                    <Link
                        href="/winners"
                        className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold px-8 py-4 rounded-xl hover:scale-105 transition-all shadow-lg"
                    >
                        <Trophy size={20} />
                        Ver Todos los Ganadores
                    </Link>
                </div>
            </main>
        </div>
    );
}
