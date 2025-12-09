"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, deleteDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Edit, LogOut, Users, Trophy, Copy, Check, Share2, Crown, Loader2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import Leaderboard from "@/components/Leaderboard";

interface MemberProfile {
    uid: string;
    username: string;
    photoURL?: string;
    votesCount?: number;
}

interface GroupData {
    name: string;
    ownerId: string;
    isPublic: boolean;
    inviteCode?: string;
}

export default function GroupPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const groupId = params.id as string;

    const [groupData, setGroupData] = useState<GroupData | null>(null);
    const [members, setMembers] = useState<MemberProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const loadGroupData = async () => {
            if (!user) return;

            try {
                // 1. Cargar datos del grupo
                const groupDoc = await getDoc(doc(db, "groups", groupId));
                if (!groupDoc.exists()) {
                    toast.error("Grupo no encontrado");
                    router.push("/");
                    return;
                }

                const data = groupDoc.data() as GroupData;
                setGroupData(data);

                // 2. Cargar miembros del grupo
                const membersSnap = await getDocs(collection(db, "groups", groupId, "members"));
                const membersData: MemberProfile[] = [];

                for (const memberDoc of membersSnap.docs) {
                    const memberId = memberDoc.id;

                    // 3. Obtener el perfil completo del usuario desde /users/{uid}
                    const userProfileDoc = await getDoc(doc(db, "users", memberId));

                    let username = "Usuario";
                    let photoURL = undefined;

                    if (userProfileDoc.exists()) {
                        const profileData = userProfileDoc.data();
                        username = profileData.username || profileData.displayName || "Usuario";
                        photoURL = profileData.photoURL;
                    }

                    // 4. Contar votos en este grupo específico
                    let votesCount = 0;
                    try {
                        const votesSnap = await getDocs(collection(db, "users", memberId, "groups", groupId, "votes"));
                        votesCount = votesSnap.docs.filter(v => v.data().firstPlace).length;
                    } catch (err) {
                        console.log(`No hay votos para ${username} en este grupo`);
                    }

                    membersData.push({
                        uid: memberId,
                        username,
                        photoURL,
                        votesCount
                    });
                }

                setMembers(membersData);

            } catch (error) {
                console.error("Error cargando grupo:", error);
                toast.error("Error cargando grupo");
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            if (!user) router.push("/login");
            else loadGroupData();
        }
    }, [user, authLoading, router, groupId]);

    const handleLeaveGroup = async () => {
        if (!user || !confirm("¿Seguro que quieres salir del grupo?")) return;

        try {
            await deleteDoc(doc(db, "groups", groupId, "members", user.uid));
            toast.success("Has salido del grupo");
            router.push("/");
        } catch (error) {
            console.error(error);
            toast.error("Error al salir del grupo");
        }
    };

    const copyInviteCode = () => {
        if (!groupData?.inviteCode) return;
        navigator.clipboard.writeText(groupData.inviteCode);
        setCopied(true);
        toast.success("¡Código copiado!");
        setTimeout(() => setCopied(false), 2000);
    };

    const shareGroup = async () => {
        if (!groupData) return;
        const shareUrl = `${window.location.origin}/join-group?code=${groupData.inviteCode}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Únete a ${groupData.name}`,
                    text: `¡Compite conmigo en Wishlist Awards!`,
                    url: shareUrl
                });
            } catch (err) {
                console.log("Share cancelled");
            }
        } else {
            navigator.clipboard.writeText(shareUrl);
            toast.success("¡Link copiado!");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-deep flex items-center justify-center text-white">
                <Loader2 className="animate-spin mr-2" size={32} />
                <span>Cargando grupo...</span>
            </div>
        );
    }

    if (!groupData) return null;

    const isOwner = user?.uid === groupData.ownerId;
    const currentUserProfile = members.find(m => m.uid === user?.uid);
    const totalCategories = 29;
    const completionPercentage = currentUserProfile?.votesCount
        ? Math.round((currentUserProfile.votesCount / totalCategories) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-deep text-white pb-24 pt-20">
            <div className="max-w-6xl mx-auto px-4 md:px-6">

                {/* NAVEGACIÓN */}
                <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft size={20} /> Volver
                </Link>

                {/* HEADER DEL GRUPO */}
                <div className="bg-surface border border-white/10 rounded-xl p-6 md:p-8 mb-8">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
                                {groupData.name}
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Users size={16} />
                                <span>{members.length} {members.length === 1 ? "miembro" : "miembros"}</span>
                            </div>
                        </div>

                        {isOwner && (
                            <div className="bg-primary/20 text-primary border border-primary/30 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold">
                                <Crown size={16} />
                                Owner
                            </div>
                        )}
                    </div>

                    {/* PROGRESO DEL USUARIO */}
                    {currentUserProfile && (
                        <div className="bg-deep/50 border border-white/10 rounded-lg p-4 mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-gray-300">Tu Progreso</span>
                                <span className="text-lg font-black text-primary">{completionPercentage}%</span>
                            </div>
                            <div className="w-full bg-deep rounded-full h-2 overflow-hidden border border-white/10">
                                <div
                                    className="bg-primary h-full transition-all duration-500"
                                    style={{ width: `${completionPercentage}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                {currentUserProfile.votesCount || 0} de {totalCategories} categorías
                            </p>
                        </div>
                    )}

                    {/* BOTONES DE ACCIÓN */}
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href={`/vote?groupId=${groupId}`}
                            className="flex-1 min-w-[180px] bg-primary hover:bg-primary-light text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all"
                        >
                            <Edit size={20} />
                            Editar Predicciones
                        </Link>

                        <button
                            onClick={handleLeaveGroup}
                            className="bg-surface hover:bg-red-900/20 border border-white/10 hover:border-red-500/50 text-gray-400 hover:text-red-400 font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-all"
                        >
                            <LogOut size={20} />
                            Salir
                        </button>
                    </div>
                </div>

                {/* CÓDIGO DE INVITACIÓN */}
                {groupData.inviteCode && (
                    <div className="bg-surface border border-white/10 rounded-xl p-6 mb-8">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-bold">Código de Invitación</p>
                                <p className="text-2xl font-black font-digital text-white tracking-wider">
                                    {groupData.inviteCode}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={copyInviteCode}
                                    className="bg-deep hover:bg-white/5 border border-white/10 text-white p-3 rounded-lg transition-all"
                                    title="Copiar código"
                                >
                                    {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                                </button>
                                <button
                                    onClick={shareGroup}
                                    className="bg-deep hover:bg-white/5 border border-white/10 text-white p-3 rounded-lg transition-all"
                                    title="Compartir"
                                >
                                    <Share2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* GRID: LEADERBOARD + MIEMBROS */}
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* LEADERBOARD */}
                    <div className="lg:col-span-2">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                            <Trophy size={24} className="text-primary" />
                            Ranking
                        </h2>
                        <Leaderboard
                            users={members.map(m => ({ ...m, score: 0 }))}
                            currentUserId={user?.uid}
                            groupId={groupId}
                        />
                    </div>

                    {/* LISTA DE MIEMBROS */}
                    <div>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                            <Users size={24} className="text-primary" />
                            Miembros
                        </h2>
                        <div className="space-y-3">
                            {members.map(member => (
                                // AQUI ESTÁ EL CAMBIO: Envolver con Link
                                <Link
                                    key={member.uid}
                                    href={`/profile/${member.username}?groupId=${groupId}`}
                                    className="block transition-transform hover:scale-[1.02]"
                                >
                                    <MemberCard
                                        member={member}
                                        isOwner={member.uid === groupData.ownerId}
                                        totalCategories={totalCategories}
                                    />
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// CARD DE MIEMBRO (MINIMALISTA)
// CARD DE MIEMBRO (MODIFICADA PARA MOSTRAR CORONA AL LADO DEL NOMBRE)
function MemberCard({ member, isOwner, totalCategories }: {
    member: MemberProfile;
    isOwner: boolean;
    totalCategories: number;
}) {
    const progress = member.votesCount ? Math.round((member.votesCount / totalCategories) * 100) : 0;

    return (
        <div className="bg-surface border border-white/10 hover:border-primary/30 rounded-lg p-4 transition-all">
            <div className="flex items-center gap-3 mb-3">
                {/* AVATAR */}
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-deep border border-white/10 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {member.photoURL ? (
                        <img src={member.photoURL} alt={member.username} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-primary/20 flex items-center justify-center text-white font-bold text-sm">
                            {member.username[0].toUpperCase()}
                        </div>
                    )}
                </div>

                {/* INFO */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <p className="font-bold text-white text-sm truncate">{member.username}</p>
                        {/* AQUI ESTÁ LA CORONA RESTAURADA */}
                        {isOwner && (
                            <Crown size={14} className="text-yellow-500 fill-yellow-500/20" />
                        )}
                    </div>
                    <p className="text-xs text-gray-500">{member.votesCount || 0}/{totalCategories} votos</p>
                </div>
            </div>

            {/* BARRA DE PROGRESO */}
            <div className="w-full bg-deep rounded-full h-1.5 overflow-hidden border border-white/10">
                <div
                    className="bg-primary h-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}