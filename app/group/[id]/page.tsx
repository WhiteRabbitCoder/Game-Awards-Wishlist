"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Trophy, Users, Share2, PlayCircle, Crown, User, Globe, Sparkles, BarChart3, Loader2, Copy, Check, Gamepad2 } from "lucide-react";
import Link from "next/link";
import GroupStats from "@/components/GroupStats";
import Leaderboard from "@/components/Leaderboard";

const CATEGORY_ORDER = [
    "game-of-the-year", "best-game-direction", "best-narrative", "best-art-direction",
    "best-score-and-music", "best-audio-design", "best-performance", "innovation-in-accessibility",
    "games-for-impact", "best-ongoing-game", "best-community-support", "best-independent-game",
    "best-debut-indie-game", "best-mobile-game", "best-vr---ar-game", "best-action-game",
    "best-action---adventure-game", "best-role-playing-game", "best-fighting-game", "best-family-game",
    "best-sim---strategy-game", "best-sports---racing-game", "best-multiplayer-game", "best-adaptation",
    "most-anticipated-game", "content-creator-of-the-year", "best-esports-game", "best-esports-athlete", "best-esports-team"
];

interface MemberProfile {
    uid: string;
    username: string;
    photoURL?: string;
    isOwner: boolean;
    score: number;
}

export default function GroupPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const groupId = Array.isArray(params?.id) ? params.id[0] : params?.id;

    const [group, setGroup] = useState<any>(null);
    const [members, setMembers] = useState<MemberProfile[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [stats, setStats] = useState<any[]>([]);
    const [copiedCode, setCopiedCode] = useState(false);

    // Protección de ruta
    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [user, loading, router]);

    // Cargar datos del grupo y miembros (con listener en miembros)
    useEffect(() => {
        if (!user || !groupId) return;

        let unsubscribeMembers: (() => void) | null = null;

        const fetchGroupData = async () => {
            try {
                if (groupId === "global") {
                    setGroup({ id: "global", name: "Ranking Mundial", isGlobal: true, ownerName: "Sistema" });

                    const q = query(collection(db, "users"), orderBy("score", "desc"), limit(50));
                    const querySnapshot = await getDocs(q);
                    const globalMembers = querySnapshot.docs.map(doc => ({
                        uid: doc.id,
                        username: doc.data().username || "Usuario",
                        photoURL: doc.data().photoURL,
                        score: doc.data().score || 0,
                        isOwner: false
                    }));
                    setMembers(globalMembers);
                    setLoadingData(false);
                    return;
                }

                const groupRef = doc(db, "groups", groupId);
                const groupSnap = await getDoc(groupRef);
                if (!groupSnap.exists()) { router.push("/"); return; }

                const groupData = groupSnap.data();
                setGroup({
                    id: groupSnap.id,
                    ...groupData,
                    ownerName: groupData.ownerName || "Admin" // Ahora viene de Firestore
                });

                const membersRef = collection(db, "groups", groupId, "members");
                unsubscribeMembers = onSnapshot(membersRef, async (membersSnap) => {
                    const groupScores: Record<string, number> = {};
                    membersSnap.docs.forEach(d => { groupScores[d.id] = d.data().score || 0; });

                    const memberPromises = membersSnap.docs.map(async (d) => {
                        const uid = d.id;
                        const userDoc = await getDoc(doc(db, "users", uid));
                        if (!userDoc.exists()) return null;
                        const userData = userDoc.data();
                        return {
                            uid,
                            username: userData.username || userData.displayName || "Usuario",
                            photoURL: userData.photoURL,
                            isOwner: uid === groupData.ownerId,
                            score: groupScores[uid] ?? (userData.score || 0),
                        } as MemberProfile;
                    });

                    const resolved = (await Promise.all(memberPromises)).filter(Boolean) as MemberProfile[];
                    resolved.sort((a, b) => (a.isOwner ? -1 : b.isOwner ? 1 : a.username.localeCompare(b.username)));
                    setMembers(resolved);
                });
            } catch (error) {
                console.error("Error cargando grupo:", error);
            } finally {
                setLoadingData(false);
            }
        };

        fetchGroupData();
        return () => { if (unsubscribeMembers) unsubscribeMembers(); };
    }, [user, groupId, router]);

    // Estado para Arcade Mode
    const [arcadeMode, setArcadeMode] = useState(false);
    const [officialWinners, setOfficialWinners] = useState<Record<string, string>>({});
    const [allMemberVotes, setAllMemberVotes] = useState<Record<string, Record<string, any>>>({});
    const [arcadeScores, setArcadeScores] = useState<Record<string, number>>({});
    const [standardScores, setStandardScores] = useState<Record<string, number>>({});
    const [CalculatingArcade, setCalculatingArcade] = useState(false);

    // Cargar Ganadores Oficiales
    useEffect(() => {
        const fetchWinners = async () => {
            try {
                const resultsSnap = await getDoc(doc(db, "admin", "results"));
                if (resultsSnap.exists()) {
                    setOfficialWinners(resultsSnap.data() as Record<string, string>);
                }
            } catch (e) {
                console.error("Error fetching winners", e);
            }
        };
        fetchWinners();
    }, []);

    // Cálculo de estadísticas y votos (Standard + Arcade)
    useEffect(() => {
        const calculateData = async () => {
            if (!user || !groupId || groupId === "global") return;
            try {
                const membersRef = collection(db, "groups", groupId, "members");
                const membersSnap = await getDocs(membersRef);
                const currentMemberIds = membersSnap.docs.map(d => d.id);

                const votesMap: Record<string, Record<string, any>> = {};
                const calculatedStandardScores: Record<string, number> = {};

                const votesPromises = membersSnap.docs.map(async (memberDoc) => {
                    const memberId = memberDoc.id;
                    let memberVotesRef = collection(db, "users", memberId, "groups", groupId, "votes");
                    let votesSnap = await getDocs(memberVotesRef);

                    // FALLBACK: Si no hay votos en el grupo, buscar votos globales
                    if (votesSnap.empty) {
                        memberVotesRef = collection(db, "users", memberId, "votes");
                        votesSnap = await getDocs(memberVotesRef);
                    }

                    votesMap[memberId] = {};
                    let memberScore = 0;

                    const userVotes = votesSnap.docs.map(voteDoc => {
                        const data = voteDoc.data();
                        votesMap[memberId][voteDoc.id] = data;

                        // Calcular Standard Score al vuelo
                        const winnerId = officialWinners[voteDoc.id];
                        if (winnerId) {
                            const isGOTY = voteDoc.id === "game-of-the-year";
                            const pointsTable = isGOTY ? [5, 4, 3] : [3, 2, 1];
                            if (data.firstPlace === winnerId) memberScore += pointsTable[0];
                            else if (data.secondPlace === winnerId) memberScore += pointsTable[1];
                            else if (data.thirdPlace === winnerId) memberScore += pointsTable[2];
                        }

                        return {
                            memberId,
                            categoryId: voteDoc.id,
                        };
                    });

                    calculatedStandardScores[memberId] = memberScore;
                    return userVotes;
                });

                const allVotes = (await Promise.all(votesPromises)).flat();
                setAllMemberVotes(votesMap);
                setStandardScores(calculatedStandardScores);

                const filteredVotes = allVotes.filter(vote => CATEGORY_ORDER.includes(vote.categoryId));

                const statsMap: Record<string, { categoryId: string; totalVotes: number }> = {};
                filteredVotes.forEach(vote => {
                    if (!statsMap[vote.categoryId]) {
                        statsMap[vote.categoryId] = { categoryId: vote.categoryId, totalVotes: 0 };
                    }
                    statsMap[vote.categoryId].totalVotes++;
                });

                const results = Object.values(statsMap);
                results.sort((a, b) => CATEGORY_ORDER.indexOf(a.categoryId) - CATEGORY_ORDER.indexOf(b.categoryId));
                setStats(results.filter(r => r.totalVotes > 0));

            } catch (error) {
                console.error("Error calculando estadísticas:", error);
            }
        };

        if (Object.keys(officialWinners).length > 0) {
            calculateData();
        }
    }, [user, groupId, officialWinners]);

    // Lógica de Arcade Mode (Recálculo de puntajes)
    useEffect(() => {
        if (!arcadeMode || Object.keys(allMemberVotes).length === 0) return;

        setCalculatingArcade(true);

        // 1. Identificar miembros activos (que están en el grupo actual)
        // Usamos 'members' state para saber quiénes siguen en el grupo
        const currentMemberIds = members.map(m => m.uid);
        if (currentMemberIds.length === 0) { setCalculatingArcade(false); return; }

        // 2. Encontrar categorías comunes (Intersección)
        // Empezamos con todas las categorías posibles
        let commonCategories = new Set(CATEGORY_ORDER);

        currentMemberIds.forEach(uid => {
            const userVotes = allMemberVotes[uid] || {};
            // Filtramos categories: nos quedamos solo con las que este usuario HA votado
            // (Asumimos que "votar" significa tener firstPlace al menos)
            const userVotedCats = new Set(Object.keys(userVotes).filter(catId => userVotes[catId]?.firstPlace));

            // Intersección: Mantenemos solo las que están en AMBOS sets
            commonCategories = new Set(
                [...commonCategories].filter(x => userVotedCats.has(x))
            );
        });

        // 3. Calcular puntajes solo en esas categorías
        const newScores: Record<string, number> = {};

        currentMemberIds.forEach(uid => {
            let score = 0;
            const userVotes = allMemberVotes[uid] || {};

            commonCategories.forEach(catId => {
                const vote = userVotes[catId];
                const winnerId = officialWinners[catId];
                if (!winnerId || !vote) return;

                const isGOTY = catId === "game-of-the-year";
                const pointsTable = isGOTY ? [5, 4, 3] : [3, 2, 1];

                if (vote.firstPlace === winnerId) score += pointsTable[0];
                else if (vote.secondPlace === winnerId) score += pointsTable[1];
                else if (vote.thirdPlace === winnerId) score += pointsTable[2];
            });
            newScores[uid] = score;
        });

        setArcadeScores(newScores);
        setCalculatingArcade(false);

    }, [arcadeMode, allMemberVotes, members, officialWinners]);


    if (loading || loadingData) return (
        <div className="min-h-screen bg-deep flex items-center justify-center text-white">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="h-12 w-12 rounded-full border-4 border-t-primary border-r-transparent border-b-surface border-l-transparent animate-spin"></div>
                <span className="text-gray-400 font-medium">Cargando experiencia...</span>
            </div>
        </div>
    );

    if (!group) return null;

    // --- RANKING GLOBAL CON NUEVO DISEÑO ---
    if (group.isGlobal) {
        return (
            <div className="min-h-screen bg-deep text-white overflow-x-hidden">
                {/* Hero Section Mejorada */}
                <div className="relative pt-24 pb-20 px-4 md:px-6 overflow-hidden">
                    {/* Fondo animado */}
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-surface/50" />
                    <div className="absolute inset-0 bg-[url('/grid.svg')] bg-repeat opacity-5"></div>

                    {/* Elementos decorativos */}
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-retro-accent/20 rounded-full blur-[100px] animate-pulse delay-1000" />

                    <div className="max-w-7xl mx-auto relative z-10">
                        {/* Botón de retorno */}
                        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-12 transition-colors group">
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                            Volver al inicio
                        </Link>

                        {/* Contenido principal */}
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <div className="inline-flex items-center gap-3 bg-primary/10 text-primary px-4 py-2 rounded-full border border-primary/30 mb-6 backdrop-blur-sm">
                                    <Globe size={16} className="animate-pulse" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Comunidad Global</span>
                                </div>

                                <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
                                    <span className="bg-gradient-to-r from-primary via-white to-primary bg-clip-text text-transparent">
                                        Ranking
                                    </span>
                                    <br />
                                    <span className="text-white">Mundial</span>
                                </h1>

                                <p className="text-gray-300 text-lg mb-8 leading-relaxed max-w-lg">
                                    Descubre los mejores predictores de la comunidad global y comparte tus propias predicciones en The Game Awards.
                                </p>

                                <Link
                                    href="/vote?groupId=global"
                                    className="inline-flex items-center gap-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-black font-bold py-4 px-8 rounded-xl text-lg transition-all hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] hover:scale-105 group"
                                >
                                    <PlayCircle size={24} className="group-hover:scale-110 transition-transform text-white" />
                                    <span className="text-white">Hacer Predicciones</span>
                                    <Sparkles size={20} className="animate-pulse text-white" />
                                </Link>
                            </div>

                            {/* Ilustración decorativa */}
                            <div className="hidden md:flex items-center justify-center">
                                <div className="relative w-full aspect-square">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-retro-accent/20 rounded-2xl blur-2xl" />
                                    <div className="absolute inset-0 border border-primary/30 rounded-2xl backdrop-blur-sm" />
                                    <div className="flex items-center justify-center h-full">
                                        <Trophy size={120} className="text-primary/50" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contenido Principal */}
                <main className="max-w-7xl mx-auto pb-24 px-4 md:px-6">
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Leaderboard Principal */}
                        <div className="lg:col-span-2">
                            <div className="bg-gradient-to-br from-surface to-deep border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
                                <Leaderboard users={members} currentUserId={user?.uid} />
                            </div>
                        </div>

                        {/* Estadísticas */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 bg-gradient-to-br from-surface to-deep border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
                                <GroupStats
                                    groupId="global"
                                    isGlobal={true}
                                    variant="list"
                                />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // --- GRUPOS PRIVADOS CON NUEVO DISEÑO ---
    return (
        <div className="min-h-screen bg-deep text-white overflow-x-hidden">
            {/* Header con fondo degradado */}
            <div className="relative border-b border-white/10 bg-gradient-to-b from-surface/50 to-deep">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(234,179,8,0.03)_1px,transparent_1px)] opacity-50" />

                <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-primary mb-6 transition-colors group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Volver
                    </Link>

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black mb-2 flex items-center gap-3">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-primary/20 rounded-lg blur-lg animate-pulse" />
                                    <Trophy size={40} className="text-primary relative" />
                                </div>
                                {group.name}
                            </h1>
                            <p className="text-gray-400 flex items-center gap-2">
                                <Users size={16} />
                                {members.length} miembro{members.length !== 1 ? 's' : ''} • Creado por <span className="text-primary font-semibold">{group.ownerName || "Admin"}</span>
                            </p>
                        </div>

                        <Link
                            href={`/vote?groupId=${group.id}`}
                            className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-black font-bold py-4 px-8 rounded-xl transition-all hover:shadow-[0_0_25px_rgba(234,179,8,0.3)] hover:scale-105 group"
                        >
                            <PlayCircle size={20} className="group-hover:scale-110 transition-transform" />
                            Jugar en este Grupo
                        </Link>

                        <div className="flex gap-2">
                            {/* Botón para cambiar/revisar votos */}
                            <Link
                                href={`/vote?groupId=${group.id}`}
                                className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-xl transition-all border border-white/20 hover:border-white/40 group"
                            >
                                <BarChart3 size={18} className="group-hover:scale-110 transition-transform" />
                                Cambiar Votos
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido Principal */}
            <main className="max-w-7xl mx-auto pb-20 px-4 md:px-6 py-12">
                <div className="grid md:grid-cols-12 gap-8">
                    {/* Sidebar Izquierdo */}
                    <div className="md:col-span-4 space-y-6">

                        {/* TOGGLE MODO ARCADE */}
                        <div className={`p-6 rounded-2xl border transition-all duration-300 ${arcadeMode ? "bg-purple-900/20 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.2)]" : "bg-gradient-to-br from-surface to-deep border-white/10 shadow-xl"}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-lg transition-colors ${arcadeMode ? "bg-purple-500 text-white" : "bg-white/10 text-gray-400"}`}>
                                        <Gamepad2 size={20} />
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-lg ${arcadeMode ? "text-purple-300" : "text-white"}`}>Modo Arcade</h3>
                                        <p className="text-xs text-gray-500">Solo categorías comunes</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setArcadeMode(!arcadeMode)}
                                    className={`relative w-14 h-8 rounded-full transition-all duration-300 ${arcadeMode ? "bg-purple-500" : "bg-gray-700"}`}
                                >
                                    <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-all duration-300 shadow-lg ${arcadeMode ? "translate-x-6" : "translate-x-0"}`} />
                                </button>
                            </div>

                            {arcadeMode && (
                                <div className="text-xs text-purple-200/70 bg-purple-500/10 p-3 rounded-lg border border-purple-500/20 animate-in fade-in">
                                    <p>Comparando solo categorías donde <strong>todos</strong> los miembros votaron.</p>
                                </div>
                            )}
                        </div>

                        {/* Card de Código de Invitación */}
                        <div className="bg-gradient-to-br from-surface to-deep border border-white/10 p-6 rounded-2xl shadow-xl backdrop-blur-sm overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2.5 bg-primary/20 rounded-lg">
                                        <Share2 size={18} className="text-primary" />
                                    </div>
                                    <h3 className="font-bold text-lg">Código de Invitación</h3>
                                </div>

                                <div className="bg-black/40 p-4 rounded-xl border border-primary/20 mb-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <code className="text-2xl font-mono font-bold text-primary tracking-widest">
                                            {group.code}
                                        </code>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(group.code);
                                                setCopiedCode(true);
                                                setTimeout(() => setCopiedCode(false), 2000);
                                            }}
                                            className="p-2.5 hover:bg-primary/20 rounded-lg transition-colors text-gray-400 hover:text-primary"
                                            title="Copiar código"
                                        >
                                            {copiedCode ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-400 text-center">Comparte este código con tus amigos</p>
                            </div>
                        </div>

                        {/* Card de Miembros */}
                        <div className="bg-gradient-to-br from-surface to-deep border border-white/10 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                                <div className="p-2.5 bg-primary/20 rounded-lg">
                                    <Users size={18} className="text-primary" />
                                </div>
                                <h3 className="font-bold text-lg">Miembros</h3>
                                <span className="ml-auto bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold">
                                    {members.length}
                                </span>
                            </div>

                            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                                {members.map((member) => (
                                    <div
                                        key={member.uid}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors group/member border border-transparent hover:border-primary/30"
                                    >
                                        <Link href={`/profile/${member.username}?groupId=${group.id}`} className="relative w-10 h-10 flex-shrink-0 cursor-pointer">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-retro-accent/20 flex items-center justify-center overflow-hidden border border-primary/30 group-hover/member:border-primary/60 transition-colors">
                                                {member.photoURL ? (
                                                    <img src={member.photoURL} alt={member.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={18} className="text-gray-400" />
                                                )}
                                            </div>
                                            {member.isOwner && (
                                                <div className="absolute -top-1 -right-1 bg-deep rounded-full p-0.5 border border-primary">
                                                    <Crown size={11} className="text-primary fill-primary" />
                                                </div>
                                            )}
                                        </Link>

                                        <div className="flex-1 min-w-0">
                                            <Link href={`/profile/${member.username}?groupId=${group.id}`} className="font-medium text-sm truncate group-hover/member:text-primary transition-colors cursor-pointer">
                                                {member.username}
                                            </Link>
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                {arcadeMode ? (
                                                    <span className="text-purple-400 font-bold fade-in">{arcadeScores[member.uid] || 0} pts (Arcade)</span>
                                                ) : (
                                                    <span>{standardScores[member.uid] !== undefined ? standardScores[member.uid] : member.score} pts</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Contenido Principal */}
                    <div className="md:col-span-8 space-y-8">
                        {/* Leaderboard */}
                        <div className={`rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm transition-all duration-500 ${arcadeMode ? "border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.15)]" : "bg-gradient-to-br from-surface to-deep border border-white/10"}`}>
                            {arcadeMode && (
                                <div className="bg-purple-900/30 p-4 flex items-center justify-center gap-2 border-b border-purple-500/20">
                                    <Gamepad2 className="text-purple-400 animate-pulse" size={20} />
                                    <span className="font-bold text-purple-200 tracking-wider text-sm">MODO ARCADE ACTIVO</span>
                                </div>
                            )}
                            <Leaderboard
                                users={arcadeMode
                                    ? members.map(m => ({ ...m, score: arcadeScores[m.uid] || 0 })).sort((a, b) => b.score - a.score)
                                    : members.map(m => standardScores[m.uid] !== undefined ? { ...m, score: standardScores[m.uid] } : m).sort((a, b) => b.score - a.score)
                                }
                                currentUserId={user?.uid}
                            />
                        </div>

                        {/* Estadísticas */}
                        {!arcadeMode && members.length > 0 && (
                            <div className="bg-gradient-to-br from-surface to-deep border border-white/10 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
                                <GroupStats
                                    groupId={group.id}
                                    memberIds={members.map(m => m.uid)}
                                    variant="list"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}