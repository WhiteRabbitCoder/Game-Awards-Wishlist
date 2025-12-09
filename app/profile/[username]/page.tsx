"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, User, Trophy, Target, TrendingUp, Loader2, Zap, Minus, HelpCircle } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface UserProfile {
    uid: string;
    username: string;
    photoURL?: string;
    displayName?: string;
}

interface Nominee {
    id: string;
    name: string;
    image?: string;
    developer?: string;
}

interface CategoryComparison {
    categoryId: string;
    categoryName: string;
    userNominee: Nominee | null;
    targetNominee: Nominee | null;
    match: boolean;
}

export default function ProfilePage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const username = params.username as string;
    const groupId = searchParams.get("groupId");

    const [targetProfile, setTargetProfile] = useState<UserProfile | null>(null);
    const [comparisons, setComparisons] = useState<CategoryComparison[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        matches: 0,
        total: 0,
        percentage: 0
    });

    useEffect(() => {
        const loadProfile = async () => {
            if (!user) {
                router.push("/login");
                return;
            }

            try {
                // 1. Buscar el usuario por username
                const usersQuery = query(collection(db, "users"), where("username", "==", username));
                const usersSnap = await getDocs(usersQuery);

                if (usersSnap.empty) {
                    toast.error("Usuario no encontrado");
                    router.push("/");
                    return;
                }

                const targetUserDoc = usersSnap.docs[0];
                const targetData = targetUserDoc.data();
                const targetUid = targetUserDoc.id;

                setTargetProfile({
                    uid: targetUid,
                    username: targetData.username,
                    photoURL: targetData.photoURL,
                    displayName: targetData.displayName
                });

                // 2. Cargar TODAS las categorías con sus nominados
                const categoriesSnap = await getDocs(collection(db, "categories"));
                const categoriesMap = new Map<string, { name: string; nominees: Nominee[] }>();

                categoriesSnap.forEach(catDoc => {
                    const catData = catDoc.data();
                    categoriesMap.set(catDoc.id, {
                        name: catData.name,
                        nominees: catData.nominees || []
                    });
                });

                // 3. Cargar votos del usuario actual
                const userVotesPath = groupId && groupId !== "global"
                    ? `users/${user.uid}/groups/${groupId}/votes`
                    : `users/${user.uid}/votes`;
                const userVotesSnap = await getDocs(collection(db, userVotesPath));
                const userVotes: Record<string, any> = {};
                userVotesSnap.forEach(voteDoc => {
                    userVotes[voteDoc.id] = voteDoc.data();
                });

                // 4. Cargar votos del usuario objetivo
                const targetVotesPath = groupId && groupId !== "global"
                    ? `users/${targetUid}/groups/${groupId}/votes`
                    : `users/${targetUid}/votes`;
                const targetVotesSnap = await getDocs(collection(db, targetVotesPath));
                const targetVotes: Record<string, any> = {};
                targetVotesSnap.forEach(voteDoc => {
                    targetVotes[voteDoc.id] = voteDoc.data();
                });

                // 5. Comparar predicciones
                const comparisonsData: CategoryComparison[] = [];
                let matches = 0;
                let total = 0;

                categoriesMap.forEach((categoryData, categoryId) => {
                    const userFirstPlace = userVotes[categoryId]?.firstPlace;
                    const targetFirstPlace = targetVotes[categoryId]?.firstPlace;

                    // Solo comparar si ambos tienen predicción
                    if (userFirstPlace && targetFirstPlace) {
                        total++;
                        const match = userFirstPlace === targetFirstPlace;
                        if (match) matches++;

                        // Buscar los nominados completos
                        const userNominee = categoryData.nominees.find((n: Nominee) => n.id === userFirstPlace) || null;
                        const targetNominee = categoryData.nominees.find((n: Nominee) => n.id === targetFirstPlace) || null;

                        comparisonsData.push({
                            categoryId,
                            categoryName: categoryData.name,
                            userNominee,
                            targetNominee,
                            match
                        });
                    }
                });

                setComparisons(comparisonsData);
                setStats({
                    matches,
                    total,
                    percentage: total > 0 ? Math.round((matches / total) * 100) : 0
                });

            } catch (error) {
                console.error("Error cargando perfil:", error);
                toast.error("Error cargando perfil");
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [user, username, groupId, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-deep flex items-center justify-center text-white">
                <Loader2 className="animate-spin mr-2" size={32} />
                <span>Cargando perfil...</span>
            </div>
        );
    }

    if (!targetProfile) return null;

    const isOwnProfile = user?.uid === targetProfile.uid;

    return (
        <div className="min-h-screen bg-deep text-white pb-24 pt-20">
            <div className="max-w-5xl mx-auto px-4 md:px-6">

                {/* NAVEGACIÓN */}
                <Link
                    href={groupId ? `/group/${groupId}` : "/"}
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft size={20} /> Volver
                </Link>

                {/* HERO DEL PERFIL */}
                <div className="bg-surface border border-white/10 rounded-xl p-8 mb-8">
                    <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-deep border-4 border-primary shadow-lg">
                            {targetProfile.photoURL ? (
                                <img src={targetProfile.photoURL} alt={targetProfile.username} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-white text-4xl font-black">
                                    {targetProfile.username[0].toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
                                {targetProfile.username}
                            </h1>
                            {targetProfile.displayName && (
                                <p className="text-gray-400 mb-2">{targetProfile.displayName}</p>
                            )}
                            {isOwnProfile && (
                                <div className="inline-flex items-center gap-2 bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-lg text-sm font-bold">
                                    <User size={16} />
                                    Tu perfil
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ESTADÍSTICAS DE COMPARACIÓN */}
                    {!isOwnProfile && stats.total > 0 && (
                        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
                            <div className="text-center">
                                <div className="text-3xl font-black text-green-400 mb-1">{stats.matches}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Coincidencias</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-black text-white mb-1">{stats.total}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Comparadas</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-black text-primary mb-1">{stats.percentage}%</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Afinidad</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* BARRA DE AFINIDAD MEJORADA */}
                {!isOwnProfile && stats.total > 0 && (
                    <div className="bg-surface border border-white/10 rounded-xl p-6 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Zap size={20} className="text-primary" />
                                Nivel de Afinidad
                            </h2>
                            <span className="text-3xl font-black text-primary">{stats.percentage}%</span>
                        </div>

                        {/* Barra con segmentos */}
                        <div className="relative w-full bg-deep rounded-full h-6 overflow-hidden border border-white/10 mb-3">
                            <div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary-light transition-all duration-1000 ease-out flex items-center justify-end pr-3"
                                style={{ width: `${stats.percentage}%` }}
                            >
                                {stats.percentage > 15 && (
                                    <span className="text-xs font-black text-white">{stats.percentage}%</span>
                                )}
                            </div>
                        </div>

                        {/* Indicadores de nivel */}
                        <div className="flex justify-between text-xs text-gray-500">
                            <span className={stats.percentage >= 0 ? "text-red-400" : ""}>0%</span>
                            <span className={stats.percentage >= 25 ? "text-orange-400" : ""}>25%</span>
                            <span className={stats.percentage >= 50 ? "text-yellow-400" : ""}>50%</span>
                            <span className={stats.percentage >= 75 ? "text-green-400" : ""}>75%</span>
                            <span className={stats.percentage === 100 ? "text-primary" : ""}>100%</span>
                        </div>

                        <p className="text-sm text-gray-400 mt-3 text-center">
                            {stats.percentage >= 80 ? "🔥 ¡Almas gemelas gamers!" :
                                stats.percentage >= 60 ? "✨ Excelente afinidad" :
                                    stats.percentage >= 40 ? "👍 Coincidencias interesantes" :
                                        stats.percentage >= 20 ? "🤔 Gustos algo diferentes" :
                                            "💀 Mundos completamente opuestos"}
                        </p>
                    </div>
                )}

                {/* COMPARACIONES VS */}
                {!isOwnProfile && comparisons.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-white mb-4">
                            <Target size={24} className="text-primary" />
                            Enfrentamientos
                        </h2>
                        {comparisons.map(comp => (
                            <VSCard
                                key={comp.categoryId}
                                comparison={comp}
                                currentUsername={user?.displayName || user?.email?.split('@')[0] || "Tú"}
                                targetUsername={targetProfile.username}
                            />
                        ))}
                    </div>
                )}

                {/* MENSAJE SI NO HAY COMPARACIONES */}
                {!isOwnProfile && comparisons.length === 0 && (
                    <div className="bg-surface border border-white/10 rounded-xl p-12 text-center">
                        <Minus className="mx-auto text-gray-600 mb-4" size={48} />
                        <h3 className="text-xl font-bold text-gray-400 mb-2">Sin predicciones para comparar</h3>
                        <p className="text-gray-500 text-sm">
                            {targetProfile.username} aún no ha completado predicciones
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// COMPONENTE: CARD DE VS (CON IMÁGENES CIRCULARES)
function VSCard({ comparison, currentUsername, targetUsername }: {
    comparison: CategoryComparison;
    currentUsername: string;
    targetUsername: string;
}) {
    return (
        <div className="bg-surface border border-white/10 rounded-xl overflow-hidden">
            {/* Header de la categoría */}
            <div className={`p-4 border-b ${comparison.match
                    ? "bg-green-900/20 border-green-500/30"
                    : "bg-white/5 border-white/10"
                }`}>
                <h3 className="font-bold text-white text-center">{comparison.categoryName}</h3>
                {comparison.match && (
                    <p className="text-xs text-green-400 text-center mt-1 font-bold">✓ Coinciden</p>
                )}
            </div>

            {/* Enfrentamiento */}
            <div className="grid grid-cols-[1fr_auto_1fr] gap-6 p-6 items-center">

                {/* TU PICK */}
                <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-bold">{currentUsername}</p>
                    {comparison.userNominee ? (
                        <div>
                            <div className="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden bg-deep border-4 border-primary shadow-lg">
                                {comparison.userNominee.image ? (
                                    <img
                                        src={comparison.userNominee.image}
                                        alt={comparison.userNominee.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                                        <HelpCircle size={32} className="text-gray-600" />
                                    </div>
                                )}
                            </div>
                            <p className="text-sm font-bold text-white leading-tight mb-1">{comparison.userNominee.name}</p>
                            {comparison.userNominee.developer && (
                                <p className="text-xs text-gray-500">{comparison.userNominee.developer}</p>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-600 text-sm">Sin predicción</p>
                    )}
                </div>

                {/* VS DIVISOR */}
                <div className="flex flex-col items-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-base border-2 ${comparison.match
                            ? "bg-green-500/20 text-green-400 border-green-500/50"
                            : "bg-white/5 text-gray-500 border-white/10"
                        }`}>
                        VS
                    </div>
                </div>

                {/* SU PICK */}
                <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-bold">{targetUsername}</p>
                    {comparison.targetNominee ? (
                        <div>
                            <div className="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden bg-deep border-4 border-primary shadow-lg">
                                {comparison.targetNominee.image ? (
                                    <img
                                        src={comparison.targetNominee.image}
                                        alt={comparison.targetNominee.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                                        <HelpCircle size={32} className="text-gray-600" />
                                    </div>
                                )}
                            </div>
                            <p className="text-sm font-bold text-white leading-tight mb-1">{comparison.targetNominee.name}</p>
                            {comparison.targetNominee.developer && (
                                <p className="text-xs text-gray-500">{comparison.targetNominee.developer}</p>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-600 text-sm">Sin predicción</p>
                    )}
                </div>
            </div>
        </div>
    );
}