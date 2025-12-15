"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, User, Trophy, Target, TrendingUp, Loader2, Zap, Minus, HelpCircle, Medal, Crown } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const CATEGORY_ORDER = [
    "game-of-the-year", "best-game-direction", "best-narrative", "best-art-direction",
    "best-score-and-music", "best-audio-design", "best-performance", "innovation-in-accessibility",
    "games-for-impact", "best-ongoing-game", "best-community-support", "best-independent-game",
    "best-debut-indie-game", "best-mobile-game", "best-vr---ar-game", "best-action-game",
    "best-action---adventure-game", "best-role-playing-game", "best-fighting-game", "best-family-game",
    "best-sim---strategy-game", "best-sports---racing-game", "best-multiplayer-game", "best-adaptation",
    "most-anticipated-game", "content-creator-of-the-year", "best-esports-game", "best-esports-athlete", "best-esports-team"
];

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
    userVotes: (Nominee | null)[]; // [1st, 2nd, 3rd]
    targetVotes: (Nominee | null)[]; // [1st, 2nd, 3rd]
    officialWinnerId?: string;
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
    const [stats, setStats] = useState({ matches: 0, total: 0, percentage: 0 });
    const [ownStats, setOwnStats] = useState({ correctGuesses: 0, totalPredictions: 0, accuracy: 0 });

    useEffect(() => {
        const loadProfile = async () => {
            if (!user) {
                router.push("/login");
                return;
            }

            try {
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

                const categoriesSnap = await getDocs(collection(db, "categories"));
                const categoriesMap = new Map<string, { name: string; nominees: Nominee[] }>();
                categoriesSnap.forEach(catDoc => {
                    const catData = catDoc.data();
                    categoriesMap.set(catDoc.id, { name: catData.name, nominees: catData.nominees || [] });
                });

                const resultsSnap = await getDoc(doc(db, "admin", "results"));
                const officialWinners = resultsSnap.exists() ? resultsSnap.data() : {};

                const userVotesPath = groupId && groupId !== "global"
                    ? `users/${user.uid}/groups/${groupId}/votes`
                    : `users/${user.uid}/votes`;
                const userVotesSnap = await getDocs(collection(db, userVotesPath));
                const userVotes: Record<string, any> = {};
                userVotesSnap.forEach(voteDoc => { userVotes[voteDoc.id] = voteDoc.data(); });

                const targetVotesPath = groupId && groupId !== "global"
                    ? `users/${targetUid}/groups/${groupId}/votes`
                    : `users/${targetUid}/votes`;
                const targetVotesSnap = await getDocs(collection(db, targetVotesPath));
                const targetVotes: Record<string, any> = {};
                targetVotesSnap.forEach(voteDoc => { targetVotes[voteDoc.id] = voteDoc.data(); });

                const comparisonsData: CategoryComparison[] = [];
                let matches = 0;
                let total = 0;
                let correctGuesses = 0;
                let totalPredictions = 0;

                const isOwnProfileCheck = user.uid === targetUid;

                categoriesMap.forEach((categoryData, categoryId) => {
                    const uVote = userVotes[categoryId];
                    const tVote = targetVotes[categoryId];
                    const officialWinner = officialWinners[categoryId];

                    const resolveNominees = (voteData: any) => {
                        if (!voteData) return [null, null, null];
                        return [
                            categoryData.nominees.find((n: Nominee) => n.id === voteData.firstPlace) || null,
                            categoryData.nominees.find((n: Nominee) => n.id === voteData.secondPlace) || null,
                            categoryData.nominees.find((n: Nominee) => n.id === voteData.thirdPlace) || null,
                        ];
                    };

                    // For own profile: show all categories the user voted in
                    if (isOwnProfileCheck && tVote?.firstPlace) {
                        totalPredictions++;
                        if (officialWinner && (
                            tVote.firstPlace === officialWinner ||
                            tVote.secondPlace === officialWinner ||
                            tVote.thirdPlace === officialWinner
                        )) {
                            correctGuesses++;
                        }
                        comparisonsData.push({
                            categoryId,
                            categoryName: categoryData.name,
                            userVotes: resolveNominees(uVote),
                            targetVotes: resolveNominees(tVote),
                            officialWinnerId: officialWinner,
                            match: false
                        });
                    }
                    // For comparison: both must have voted
                    else if (!isOwnProfileCheck && uVote?.firstPlace && tVote?.firstPlace) {
                        total++;
                        const match = uVote.firstPlace === tVote.firstPlace;
                        if (match) matches++;
                        comparisonsData.push({
                            categoryId,
                            categoryName: categoryData.name,
                            userVotes: resolveNominees(uVote),
                            targetVotes: resolveNominees(tVote),
                            officialWinnerId: officialWinner,
                            match
                        });
                    }
                });

                // Sort by CATEGORY_ORDER
                comparisonsData.sort((a, b) => {
                    const indexA = CATEGORY_ORDER.indexOf(a.categoryId);
                    const indexB = CATEGORY_ORDER.indexOf(b.categoryId);
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;
                    return indexA - indexB;
                });

                setComparisons(comparisonsData);
                setStats({ matches, total, percentage: total > 0 ? Math.round((matches / total) * 100) : 0 });
                setOwnStats({ correctGuesses, totalPredictions, accuracy: totalPredictions > 0 ? Math.round((correctGuesses / totalPredictions) * 100) : 0 });

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
            <div className="max-w-6xl mx-auto px-4 md:px-6">
                <Link
                    href={groupId ? `/group/${groupId}` : "/"}
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft size={20} /> Volver
                </Link>

                {/* HERO */}
                <div className="bg-surface border border-white/10 rounded-xl p-8 mb-8">
                    <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-deep border-4 border-primary shadow-lg">
                            {targetProfile.photoURL ? (
                                <img src={targetProfile.photoURL} alt={targetProfile.username} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-white text-4xl font-black">
                                    {targetProfile.username[0].toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{targetProfile.username}</h1>
                            {targetProfile.displayName && <p className="text-gray-400 mb-2">{targetProfile.displayName}</p>}
                            {isOwnProfile && (
                                <div className="inline-flex items-center gap-2 bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-lg text-sm font-bold">
                                    <User size={16} /> Tu perfil
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats for comparison */}
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

                    {/* Stats for own profile */}
                    {isOwnProfile && ownStats.totalPredictions > 0 && (
                        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
                            <div className="text-center">
                                <div className="text-3xl font-black text-green-400 mb-1">{ownStats.correctGuesses}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Aciertos</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-black text-white mb-1">{ownStats.totalPredictions}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Predicciones</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-black text-primary mb-1">{ownStats.accuracy}%</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Efectividad</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Affinity Bar */}
                {!isOwnProfile && stats.total > 0 && (
                    <div className="bg-surface border border-white/10 rounded-xl p-6 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Zap size={20} className="text-yellow-500" /> Nivel de Afinidad
                            </h2>
                            <span className="text-3xl font-black text-yellow-500">{stats.percentage}%</span>
                        </div>
                        <div className="relative w-full bg-deep rounded-full h-6 overflow-hidden border border-white/10 mb-3">
                            <div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 transition-all duration-1000 ease-out"
                                style={{ width: `${stats.percentage}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Comparisons VS */}
                {!isOwnProfile && comparisons.length > 0 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-white mb-4">
                            <Target size={24} className="text-primary" /> Enfrentamientos en Detalle
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

                {/* Own Votes */}
                {isOwnProfile && comparisons.length > 0 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-white mb-4">
                            <Trophy size={24} className="text-primary" /> Tus Predicciones
                        </h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {comparisons.map(comp => (
                                <OwnVoteCard key={comp.categoryId} comparison={comp} />
                            ))}
                        </div>
                    </div>
                )}

                {comparisons.length === 0 && (
                    <div className="bg-surface border border-white/10 rounded-xl p-12 text-center">
                        <Minus className="mx-auto text-gray-600 mb-4" size={48} />
                        <h3 className="text-xl font-bold text-gray-400 mb-2">Sin predicciones</h3>
                        <p className="text-gray-500 text-sm">{targetProfile.username} aún no ha completado predicciones</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function VSCard({ comparison, currentUsername, targetUsername }: {
    comparison: CategoryComparison;
    currentUsername: string;
    targetUsername: string;
}) {
    const isGOTY = comparison.categoryId === "game-of-the-year";

    return (
        <div className="bg-surface border border-white/10 rounded-xl overflow-hidden shadow-lg">
            <div className={`p-4 border-b flex justify-between items-center ${comparison.match ? "bg-green-900/20 border-green-500/30" : "bg-deep/50 border-white/10"}`}>
                <h3 className="font-bold text-white uppercase tracking-wider text-sm">{comparison.categoryName}</h3>
                {comparison.officialWinnerId && (
                    <div className="flex items-center gap-2 text-xs text-yellow-500 font-bold bg-yellow-500/10 px-2 py-1 rounded">
                        <Crown size={14} /> GANADOR DEFINIDO
                    </div>
                )}
            </div>
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
                <UserVotesColumn username={currentUsername} votes={comparison.userVotes} winnerId={comparison.officialWinnerId} isCurrentUser={true} isGOTY={isGOTY} />
                <UserVotesColumn username={targetUsername} votes={comparison.targetVotes} winnerId={comparison.officialWinnerId} isCurrentUser={false} isGOTY={isGOTY} />
            </div>
        </div>
    );
}

function OwnVoteCard({ comparison }: { comparison: CategoryComparison }) {
    const isGOTY = comparison.categoryId === "game-of-the-year";
    const votes = comparison.targetVotes;
    const winnerId = comparison.officialWinnerId;

    // Puntos según la posición: GOTY = 5/4/3, otros = 3/2/1
    const pointsTable = isGOTY ? [5, 4, 3] : [3, 2, 1];

    // Encontrar en qué posición acertó (si acertó)
    let hitPosition: number | null = null;
    if (winnerId) {
        votes.forEach((nominee, idx) => {
            if (nominee?.id === winnerId) hitPosition = idx;
        });
    }

    // Colores y estilos para cada posición de medalla
    const medalStyles = [
        { bg: "bg-yellow-500/20", border: "border-yellow-500/40", text: "text-yellow-400", emoji: "🥇" }, // Oro (1er lugar)
        { bg: "bg-gray-300/20", border: "border-gray-300/40", text: "text-gray-300", emoji: "🥈" }, // Plata (2do lugar)
        { bg: "bg-amber-700/20", border: "border-amber-700/40", text: "text-amber-600", emoji: "🥉" }, // Bronce (3er lugar)
    ];

    return (
        <div className="bg-surface border border-white/10 rounded-xl overflow-hidden shadow-lg flex flex-col">
            <div className={`p-3 border-b flex justify-between items-center ${hitPosition !== null ? "bg-green-900/20 border-green-500/30" : "bg-deep/50 border-white/10"}`}>
                <h3 className="font-bold text-white uppercase tracking-wider text-xs flex-1">{comparison.categoryName}</h3>
                {hitPosition !== null && <span className="text-green-400 text-xs font-bold">+{pointsTable[hitPosition]} pts</span>}
            </div>
            <div className="p-3 flex-1">
                <div className="space-y-2">
                    {votes.map((nominee, index) => {
                        const isWinner = winnerId && nominee?.id === winnerId;
                        const points = pointsTable[index];
                        const medal = medalStyles[index];

                        return (
                            <div
                                key={index}
                                className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${isWinner
                                    ? `${medal.bg} ${medal.border}`
                                    : "bg-deep/30 border-transparent"
                                    }`}
                            >
                                <div className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded ${isWinner
                                    ? `${medal.bg} ${medal.text}`
                                    : "bg-white/5 text-gray-500"
                                    }`}>
                                    {isWinner ? medal.emoji : index + 1}
                                </div>
                                <div className="w-7 h-7 rounded bg-deep overflow-hidden flex-shrink-0">
                                    {nominee?.image && <img src={nominee.image} alt={nominee.name} className="w-full h-full object-cover" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <Link href={nominee?.name ? `/game/${encodeURIComponent(nominee.name)}` : '#'} className={`text-xs truncate block hover:underline ${isWinner ? `${medal.text} font-bold` : "text-gray-400"}`}>
                                        {nominee?.name || "Sin selección"}
                                    </Link>
                                </div>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isWinner
                                    ? `${medal.bg} ${medal.text}`
                                    : "bg-white/5 text-gray-500"
                                    }`}>
                                    {points} pts
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function UserVotesColumn({ username, votes, winnerId, isCurrentUser, isGOTY }: {
    username: string;
    votes: (Nominee | null)[];
    winnerId?: string;
    isCurrentUser: boolean;
    isGOTY: boolean;
}) {
    const getMedalColor = (index: number) => {
        if (index === 0) return "text-yellow-400";
        if (index === 1) return "text-gray-300";
        if (index === 2) return "text-amber-600";
        return "text-gray-600";
    };

    const getMedalBg = (index: number) => {
        if (index === 0) return "bg-yellow-500/10 border-yellow-500/30";
        if (index === 1) return "bg-gray-400/10 border-gray-400/30";
        if (index === 2) return "bg-amber-600/10 border-amber-600/30";
        return "";
    };

    const getPoints = (index: number) => {
        if (isGOTY) {
            if (index === 0) return "5 Pts";
            if (index === 1) return "4 Pts";
            if (index === 2) return "3 Pts";
            return "";
        }
        if (index === 0) return "3 Pts";
        if (index === 1) return "2 Pts";
        if (index === 2) return "1 Pt";
        return "";
    };

    return (
        <div className="p-4 md:p-6">
            <h4 className={`text-sm font-bold uppercase mb-4 flex items-center gap-2 ${isCurrentUser ? "text-primary" : "text-gray-400"}`}>
                <User size={14} /> {username}
            </h4>
            <div className="space-y-3">
                {votes.map((nominee, index) => {
                    const isWinner = winnerId && nominee?.id === winnerId;
                    return (
                        <div
                            key={index}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isWinner ? `${getMedalBg(index)} shadow-[0_0_15px_rgba(0,0,0,0.3)]` : "bg-deep/30 border-transparent hover:bg-deep/50"}`}
                        >
                            <div className={`w-6 h-6 flex items-center justify-center font-black text-sm rounded ${getMedalColor(index)}`}>
                                {index + 1}
                            </div>
                            <div className="w-10 h-10 rounded bg-deep overflow-hidden flex-shrink-0">
                                {nominee?.image ? (
                                    <img src={nominee.image} alt={nominee.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                                        <HelpCircle size={14} className="text-gray-600" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <Link href={nominee?.name ? `/game/${encodeURIComponent(nominee.name)}` : '#'} className={`text-sm font-bold leading-tight truncate block hover:underline ${isWinner ? "text-white" : "text-gray-400"}`}>
                                    {nominee?.name || "Sin selección"}
                                </Link>
                                {isWinner && (
                                    <span className={`text-[10px] font-black uppercase tracking-wider ${getMedalColor(index)}`}>
                                        ¡Acertado - {getPoints(index)}!
                                    </span>
                                )}
                            </div>
                            {isWinner && <Medal size={20} className={getMedalColor(index)} />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
