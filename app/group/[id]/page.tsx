"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Trophy, Users, Share2, PlayCircle, Crown, User, Globe, Sparkles } from "lucide-react";
import Link from "next/link";
import GroupStats from "@/components/GroupStats";
import Leaderboard from "@/components/Leaderboard"; // <--- IMPORTAR ESTO

interface MemberProfile {
    uid: string;
    username: string;
    photoURL?: string;
    isOwner: boolean;
    score: number; // <--- AGREGAR ESTO
}

export default function GroupPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const groupId = params.id as string;

    const [group, setGroup] = useState<any>(null);
    const [members, setMembers] = useState<MemberProfile[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // Protección de ruta
    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [user, loading, router]);

    // Cargar datos del grupo y miembros
    useEffect(() => {
        const fetchGroupData = async () => {
            if (!user || !groupId) return;
            try {
                // 1. Si es el grupo global
                if (groupId === "global") {
                    setGroup({ id: "global", name: "Ranking Mundial", isGlobal: true, ownerName: "Sistema" });

                    // --- AGREGAR ESTO PARA EL GLOBAL ---
                    // Necesitamos cargar usuarios reales para el ranking global
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
                    // -----------------------------------

                    setLoadingData(false);
                    return;
                }
                // 2. Cargar info del grupo privado
                const groupRef = doc(db, "groups", groupId);
                const groupSnap = await getDoc(groupRef);
                if (!groupSnap.exists()) { router.push("/"); return; }
                const groupData = groupSnap.data();
                setGroup({ id: groupSnap.id, ...groupData });

                // 3. Cargar miembros (IDs y luego Detalles)
                const membersRef = collection(db, "groups", groupId, "members");
                const membersSnap = await getDocs(membersRef);

                // MAPA DE PUNTAJES DEL GRUPO
                const groupScores: Record<string, number> = {};
                membersSnap.docs.forEach(doc => {
                    groupScores[doc.id] = doc.data().score || 0; // <--- AQUÍ LEEMOS EL SCORE DEL GRUPO
                });

                const memberIds = membersSnap.docs.map(d => d.id);

                // Buscamos la info de cada usuario en la colección 'users'
                const memberPromises = memberIds.map(async (uid) => {
                    const userDoc = await getDoc(doc(db, "users", uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        return {
                            uid: uid,
                            username: userData.username || userData.displayName || "Usuario",
                            photoURL: userData.photoURL,
                            isOwner: uid === groupData.ownerId,
                            // USAMOS EL SCORE DEL GRUPO, NO EL GLOBAL
                            score: groupScores[uid] !== undefined ? groupScores[uid] : (userData.score || 0)
                        } as MemberProfile;
                    }
                    return null;
                });

                const resolvedMembers = (await Promise.all(memberPromises)).filter(m => m !== null) as MemberProfile[];

                // Ordenar: Dueño primero, luego alfabético
                resolvedMembers.sort((a, b) => {
                    if (a.isOwner) return -1;
                    if (b.isOwner) return 1;
                    return a.username.localeCompare(b.username);
                });

                setMembers(resolvedMembers);
            } catch (error) { console.error("Error cargando grupo:", error); } finally { setLoadingData(false); }
        };
        fetchGroupData();
    }, [user, groupId]);

    if (loading || loadingData) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Cargando grupo...</div>;
    if (!group) return null;

    // --- VISTA ESPECIAL PARA RANKING MUNDIAL ---
    if (group.isGlobal) {
        return (
            <div className="min-h-screen bg-gray-900 text-white overflow-x-hidden">
                {/* Hero Section Global */}
                <div className="relative bg-gradient-to-b from-blue-900/40 to-gray-900 pt-12 pb-16 px-4">
                    <div className="max-w-6xl mx-auto">
                        <Link href="/" className="inline-flex items-center gap-2 text-blue-300 hover:text-white mb-8 transition-colors">
                            <ArrowLeft size={20} /> Volver al inicio
                        </Link>

                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="text-center md:text-left">
                                <div className="inline-flex items-center gap-2 bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full border border-yellow-500/20 mb-4">
                                    <Globe size={14} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Comunidad Oficial</span>
                                </div>
                                <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                    Ranking Mundial
                                </h1>
                                <p className="text-gray-400 text-lg max-w-xl">
                                    Descubre qué juegos están dominando las predicciones a nivel global.
                                    Estas estadísticas se basan en una muestra en tiempo real de la comunidad.
                                </p>
                            </div>

                            <Link
                                href="/vote?groupId=global"
                                className="group relative inline-flex items-center gap-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 px-8 rounded-full text-lg transition-all hover:scale-105 shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                            >
                                <PlayCircle size={24} />
                                Editar mis Predicciones
                                <Sparkles className="absolute -top-2 -right-2 text-yellow-200 animate-pulse" size={20} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Carousel */}
                <main className="max-w-7xl mx-auto pb-20 px-4 grid lg:grid-cols-3 gap-8"> {/* Convertir en Grid */}
                    <div className="lg:col-span-2">
                        <GroupStats
                            groupId="global"
                            isGlobal={true}
                            variant="carousel"
                        />
                    </div>

                    {/* AÑADIR LEADERBOARD AQUÍ */}
                    <div className="lg:col-span-1">
                        <Leaderboard users={members} currentUserId={user?.uid} />
                    </div>
                </main>
            </div>
        );
    }

    // --- VISTA ESTÁNDAR PARA GRUPOS PRIVADOS ---
    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
            {/* Header */}
            <header className="flex items-center gap-4 mb-8">
                <Link href="/" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                    <ArrowLeft />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        {group.name}
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Creado por {group.ownerName || "Admin"}
                    </p>
                </div>
            </header>

            <main className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">

                {/* Columna Izquierda: Info y Miembros */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <div className="flex items-center gap-2 text-gray-300 mb-4">
                            <Users size={20} />
                            <span className="font-bold">{members.length} Miembros</span>
                        </div>

                        <div className="bg-black/30 p-3 rounded-lg mb-4">
                            <p className="text-xs text-gray-500 uppercase mb-1">Código de invitación</p>
                            <div className="flex justify-between items-center">
                                <code className="text-xl font-mono font-bold text-yellow-500 tracking-widest">
                                    {group.code}
                                </code>
                                <button
                                    onClick={() => navigator.clipboard.writeText(group.code)}
                                    className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                                    title="Copiar"
                                >
                                    <Share2 size={16} />
                                </button>
                            </div>
                        </div>

                        <Link
                            href={`/vote?groupId=${group.id}`}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            <PlayCircle size={20} />
                            Votar para este Grupo
                        </Link>
                    </div>

                    {/* Lista de Miembros */}
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <h3 className="font-bold text-gray-300 mb-4 flex items-center gap-2">
                            <Users size={18} />
                            Integrantes
                        </h3>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {members.map((member) => (
                                <Link
                                    href={`/profile/${member.username}?groupId=${group.id}`}
                                    key={member.uid}
                                    className="flex items-center gap-3 p-2 hover:bg-gray-700/50 rounded-lg transition-colors cursor-pointer"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-600">
                                        {member.photoURL ? (
                                            <img src={member.photoURL} alt={member.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={20} className="text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate flex items-center gap-1">
                                            {member.username}
                                            {member.isOwner && <Crown size={12} className="text-yellow-500" />}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {member.isOwner ? "Administrador" : "Miembro"}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Ranking y Stats */}
                <div className="md:col-span-2 space-y-8">

                    {/* REEMPLAZAR EL PLACEHOLDER CON ESTO: */}
                    <Leaderboard users={members} currentUserId={user?.uid} />

                    {members.length > 0 && (
                        <GroupStats
                            groupId={group.id}
                            memberIds={members.map(m => m.uid)}
                            variant="list" // Modo lista para grupos privados
                        />
                    )}
                </div>
            </main>
        </div>
    );
}