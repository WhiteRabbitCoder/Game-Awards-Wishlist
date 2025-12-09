"use client";

import { db } from "@/lib/firebase";
import { Category, Nominee } from "@/types";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { useEffect, useState, useRef } from "react";
import { BarChart3, Loader2, Globe, ChevronLeft, ChevronRight, Trophy } from "lucide-react";

interface Props {
    groupId: string;
    memberIds?: string[];
    isGlobal?: boolean;
    variant?: "list" | "carousel"; // Nuevo modo de visualización
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
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
                <BarChart3 className="mx-auto text-gray-600 mb-3" size={32} />
                <h3 className="text-lg font-bold text-gray-400">Estadísticas Bloqueadas</h3>
                <p className="text-sm text-gray-500 mt-2">Necesitas al menos 3 miembros.</p>
            </div>
        );
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-500" /></div>;

    // --- MODO CARRUSEL (NUEVO) ---
    if (variant === "carousel") {
        return (
            <div className="relative group/container">
                <div className="flex items-center justify-between mb-6 px-4">
                    <h3 className="font-bold text-2xl flex items-center gap-2 text-white">
                        <Globe className="text-blue-400" />
                        Tendencia Global
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={() => scroll('left')} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full border border-gray-700 transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={() => scroll('right')} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full border border-gray-700 transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-8 px-4 custom-scrollbar"
                    style={{ scrollPaddingLeft: '1rem', scrollPaddingRight: '1rem' }}
                >
                    {stats.map((stat) => {
                        const percentage = Math.round((stat.voteCount / sampleSize) * 100);
                        return (
                            <div key={stat.categoryId} className="min-w-[280px] md:min-w-[320px] snap-center bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-lg flex flex-col">
                                <div className="bg-gray-900/50 p-3 border-b border-gray-700">
                                    <h4 className="text-xs font-bold text-center text-gray-400 uppercase tracking-wider truncate">
                                        {stat.categoryName}
                                    </h4>
                                </div>

                                <div className="relative h-40 group">
                                    {stat.topNominee?.image ? (
                                        <img src={stat.topNominee.image} alt={stat.topNominee.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-800" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />

                                    <div className="absolute bottom-3 left-4 right-4">
                                        <div className="flex justify-between items-end">
                                            <div className="flex-1 mr-2">
                                                <p className="text-white font-bold leading-tight shadow-black drop-shadow-md line-clamp-2">
                                                    {stat.topNominee?.name || "Sin datos"}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-2xl font-bold text-blue-400">{percentage}%</span>
                                            </div>
                                        </div>
                                        {/* Barra de progreso mini */}
                                        <div className="w-full bg-gray-700/50 h-1.5 rounded-full mt-2 overflow-hidden backdrop-blur-sm">
                                            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
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

    // --- MODO LISTA (ORIGINAL) ---
    return (
        <div className="space-y-4">
            <h3 className="font-bold text-xl flex items-center gap-2 mb-6">
                <BarChart3 className="text-blue-400" />
                Tendencias del Grupo
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stats.map((stat) => (
                    <div key={stat.categoryId} className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex gap-4 items-center">
                        <div className="w-16 h-16 bg-gray-900 rounded-lg overflow-hidden flex-shrink-0 border border-gray-600">
                            {stat.topNominee?.image && <img src={stat.topNominee.image} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1 truncate">{stat.categoryName}</p>
                            <h4 className="font-bold text-white text-sm truncate mb-2">{stat.topNominee?.name || "Sin consenso"}</h4>
                            <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(stat.voteCount / sampleSize) * 100}%` }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}