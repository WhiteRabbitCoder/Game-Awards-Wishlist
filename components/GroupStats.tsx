"use client";

import { db } from "@/lib/firebase";
import { Category, Nominee } from "@/types";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { useEffect, useState, useRef } from "react";
import { BarChart3, Loader2, Globe, ChevronLeft, ChevronRight, Trophy, TrendingUp, Zap } from "lucide-react";

interface Props {
    groupId: string;
    memberIds?: string[];
    isGlobal?: boolean;
    variant?: "list" | "carousel";
}

interface StatResult {
    categoryId: string;
    categoryName: string;
    topNominee: Nominee | null;
    voteCount: number;
    totalVotes: number;
}

export default function GroupStats({ groupId, memberIds = [], isGlobal = false, variant = "list" }: Props) {
    const [stats, setStats] = useState<StatResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [sampleSize, setSampleSize] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const calculateStats = async () => {
            if (!isGlobal && memberIds.length <= 2) {
                setLoading(false);
                return;
            }

            try {
                const catSnapshot = await getDocs(collection(db, "categories"));
                const categories = catSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Category[];

                const voteCounts: Record<string, Record<string, number>> = {};
                categories.forEach(cat => {
                    voteCounts[cat.id] = {};
                    cat.nominees.forEach(nom => {
                        voteCounts[cat.id][nom.id] = 0;
                    });
                });

                let targetUserIds: string[] = [];

                if (isGlobal) {
                    const usersQuery = query(collection(db, "users"), limit(50));
                    const usersSnap = await getDocs(usersQuery);
                    targetUserIds = usersSnap.docs.map(d => d.id);
                } else {
                    targetUserIds = memberIds;
                }

                setSampleSize(targetUserIds.length);

                if (targetUserIds.length === 0) {
                    setLoading(false);
                    return;
                }

                const votePromises = targetUserIds.map(async (uid) => {
                    const userVotes: Record<string, string> = {};
                    const globalSnap = await getDocs(collection(db, "users", uid, "votes"));
                    globalSnap.forEach(doc => {
                        const data = doc.data();
                        if (data.firstPlace) userVotes[doc.id] = data.firstPlace;
                    });

                    if (!isGlobal) {
                        const groupSnap = await getDocs(collection(db, "users", uid, "groups", groupId, "votes"));
                        groupSnap.forEach(doc => {
                            const data = doc.data();
                            if (data.firstPlace) userVotes[doc.id] = data.firstPlace;
                        });
                    }
                    return userVotes;
                });

                const allUserVotes = await Promise.all(votePromises);

                allUserVotes.forEach(userVotes => {
                    Object.entries(userVotes).forEach(([catId, winnerId]) => {
                        if (voteCounts[catId] && voteCounts[catId][winnerId] !== undefined) {
                            voteCounts[catId][winnerId]++;
                        }
                    });
                });

                const results: StatResult[] = categories.map(cat => {
                    let topNomineeId: string | null = null;
                    let maxVotes = -1;
                    let totalCategoryVotes = 0;

                    Object.entries(voteCounts[cat.id]).forEach(([nomId, count]) => {
                        totalCategoryVotes += count;
                        if (count > maxVotes) {
                            maxVotes = count;
                            topNomineeId = nomId;
                        }
                    });

                    const topNominee = topNomineeId
                        ? cat.nominees.find(n => n.id === topNomineeId) || null
                        : null;
                    return {
                        categoryId: cat.id,
                        categoryName: cat.name,
                        topNominee,
                        voteCount: maxVotes,
                        totalVotes: totalCategoryVotes
                    };
                });

                setStats(results.filter(r => r.totalVotes > 0));

            } catch (error) {
                console.error("Error calculando estadísticas:", error);
            } finally {
                setLoading(false);
            }
        };

        calculateStats();
    }, [groupId, memberIds, isGlobal]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = 320;
            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    if (!isGlobal && memberIds.length <= 2) {
        return (
            <div className="bg-gradient-to-br from-surface to-deep border border-white/10 rounded-2xl p-12 text-center backdrop-blur-sm">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
                    <BarChart3 className="text-primary" size={32} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Estadísticas Bloqueadas</h3>
                <p className="text-sm text-gray-400">Necesitas al menos 3 miembros para ver las tendencias.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin">
                    <Loader2 className="text-primary" size={40} />
                </div>
            </div>
        );
    }

    // --- MODO CARRUSEL ---
    if (variant === "carousel") {
        return (
            <div className="relative">
                <div className="flex items-center justify-between mb-8 px-2">
                    <div>
                        <h3 className="font-black text-2xl md:text-3xl flex items-center gap-3 text-white mb-1">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 border border-primary/30">
                                <TrendingUp className="text-primary" size={20} />
                            </div>
                            Tendencias Globales
                        </h3>
                        <p className="text-gray-400 text-sm">Lo que más votó la comunidad</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => scroll('left')}
                            className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/30 rounded-lg transition-all text-gray-400 hover:text-white"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/30 rounded-lg transition-all text-gray-400 hover:text-white"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-6 px-2 custom-scrollbar"
                >
                    {stats.map((stat) => {
                        const percentage = Math.round((stat.voteCount / sampleSize) * 100);
                        return (
                            <div
                                key={stat.categoryId}
                                className="min-w-[280px] md:min-w-[320px] snap-center group"
                            >
                                <div className="relative h-72 rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-surface to-deep shadow-xl hover:shadow-2xl hover:border-primary/50 transition-all duration-300 flex flex-col">
                                    {/* Imagen de fondo */}
                                    <div className="absolute inset-0">
                                        {stat.topNominee?.image ? (
                                            <img
                                                src={stat.topNominee.image}
                                                alt={stat.topNominee.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-retro-accent/20" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-deep via-deep/50 to-transparent" />
                                    </div>

                                    {/* Contenido */}
                                    <div className="relative z-10 flex flex-col h-full p-4 justify-between">
                                        {/* Header */}
                                        <div className="flex items-start justify-between">
                                            <div className="bg-primary/20 border border-primary/30 px-3 py-1 rounded-lg backdrop-blur-sm">
                                                <p className="text-xs font-bold text-primary uppercase tracking-wider">
                                                    Favorito
                                                </p>
                                            </div>
                                            <div className="bg-white/10 border border-white/20 px-3 py-1 rounded-lg backdrop-blur-sm">
                                                <p className="text-xs font-bold text-white uppercase tracking-wider">
                                                    {percentage}%
                                                </p>
                                            </div>
                                        </div>

                                        {/* Footer con nombre */}
                                        <div>
                                            <h4 className="text-sm text-gray-300 uppercase tracking-wider font-semibold mb-2 opacity-80">
                                                {stat.categoryName}
                                            </h4>
                                            <h3 className="text-xl font-black text-white leading-tight mb-3 line-clamp-2">
                                                {stat.topNominee?.name || "Sin datos"}
                                            </h3>

                                            {/* Barra de progreso mejorada */}
                                            <div className="relative w-full bg-white/10 h-2 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                                                <div
                                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-1000"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>

                                            <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                                                <span>{stat.voteCount} votos</span>
                                                <span>de {sampleSize}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // --- MODO LISTA MODERNO ---
    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="font-black text-2xl md:text-3xl flex items-center gap-3 text-white mb-1">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 border border-primary/30">
                            <TrendingUp className="text-primary" size={20} />
                        </div>
                        Tendencias del Grupo
                    </h3>
                    <p className="text-gray-400 text-sm">Predicciones más populares</p>
                </div>
            </div>

            <div className="space-y-4">
                {stats.map((stat) => {
                    const percentage = Math.round((stat.voteCount / sampleSize) * 100);
                    return (
                        <div
                            key={stat.categoryId}
                            className="group relative bg-gradient-to-br from-surface to-deep border border-white/10 hover:border-primary/50 rounded-xl p-5 overflow-hidden transition-all hover:shadow-xl hover:shadow-primary/10"
                        >
                            {/* Fondo decorativo */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative z-10 flex gap-4">
                                {/* Imagen */}
                                <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-white/10 bg-deep group-hover:border-primary/30 transition-colors">
                                    {stat.topNominee?.image ? (
                                        <img
                                            src={stat.topNominee.image}
                                            alt={stat.topNominee.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-retro-accent/20 flex items-center justify-center">
                                            <Trophy size={32} className="text-gray-600" />
                                        </div>
                                    )}
                                </div>

                                {/* Contenido */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between mb-2">
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                                                {stat.categoryName}
                                            </p>
                                            <div className="bg-primary/20 text-primary px-3 py-1 rounded text-xs font-bold flex items-center gap-1 ml-2 flex-shrink-0">
                                                <Zap size={12} fill="currentColor" />
                                                {percentage}%
                                            </div>
                                        </div>

                                        <h4 className="font-bold text-white text-sm mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                                            {stat.topNominee?.name || "Sin consenso"}
                                        </h4>
                                    </div>

                                    {/* Barra de progreso */}
                                    <div className="space-y-2">
                                        <div className="relative w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>

                                        <p className="text-xs text-gray-500">
                                            {stat.voteCount} de {sampleSize} votos
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}