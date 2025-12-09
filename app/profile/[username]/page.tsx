"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, limit, doc, getDoc } from "firebase/firestore";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User, Trophy, ArrowLeft, Calendar, Shield, Zap, HeartHandshake, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Category } from "@/types";

interface UserProfile {
    uid: string;
    username: string;
    displayName?: string;
    photoURL?: string;
    createdAt?: any;
    score?: number;
}

// Nueva interfaz para guardar los detalles de la coincidencia
interface MatchDetail {
    categoryName: string;
    nomineeName: string;
    nomineeImage?: string;
    nomineeDeveloper?: string;
}

export default function ProfilePage() {
    const { user: currentUser } = useAuth();
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const usernameParam = params.username as string;
    const groupId = searchParams.get("groupId");

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Estados para comparación
    const [commonVotes, setCommonVotes] = useState<number>(0);
    const [totalCompared, setTotalCompared] = useState<number>(0);
    const [gotyMatch, setGotyMatch] = useState<boolean>(false);
    const [matchesList, setMatchesList] = useState<MatchDetail[]>([]);

    useEffect(() => {
        const fetchProfileAndCompare = async () => {
            try {
                // 1. Buscar usuario por username
                const q = query(collection(db, "users"), where("username", "==", usernameParam), limit(1));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    setLoading(false);
                    return;
                }

                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data();
                const targetUid = userDoc.id;

                let displayScore = userData.score || 0;
                if (groupId) {
                    const memberDoc = await getDoc(doc(db, "groups", groupId, "members", targetUid));
                    if (memberDoc.exists()) {
                        displayScore = memberDoc.data().score || 0;
                    }
                }

                setProfile({
                    uid: targetUid,
                    username: userData.username,
                    displayName: userData.displayName,
                    photoURL: userData.photoURL,
                    createdAt: userData.createdAt,
                    score: displayScore
                });

                // 2. LÓGICA DE COMPARACIÓN
                if (currentUser && currentUser.uid !== targetUid) {

                    const catSnap = await getDocs(collection(db, "categories"));
                    const cats = catSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Category[];

                    const theirVotesSnap = await getDocs(collection(db, "users", targetUid, "votes"));
                    const theirVotesData: Record<string, any> = {};
                    theirVotesSnap.forEach(d => theirVotesData[d.id] = d.data());

                    const myVotesSnap = await getDocs(collection(db, "users", currentUser.uid, "votes"));
                    const myVotesData: Record<string, any> = {};
                    myVotesSnap.forEach(d => myVotesData[d.id] = d.data());

                    let matches = 0;
                    let total = 0;
                    let gotySame = false;
                    const newMatchesList: MatchDetail[] = [];

                    cats.forEach(cat => {
                        const myVote = myVotesData[cat.id]?.firstPlace;
                        const theirVote = theirVotesData[cat.id]?.firstPlace;

                        if (myVote && theirVote) {
                            total++;
                            if (myVote === theirVote) {
                                matches++;
                                if (cat.id === "game-of-the-year") gotySame = true;

                                // Buscar detalles del nominado para mostrarlo
                                const nomineeDetails = cat.nominees.find(n => n.id === myVote);
                                if (nomineeDetails) {
                                    newMatchesList.push({
                                        categoryName: cat.name,
                                        nomineeName: nomineeDetails.name,
                                        nomineeImage: nomineeDetails.image,
                                        nomineeDeveloper: nomineeDetails.developer
                                    });
                                }
                            }
                        }
                    });

                    setCommonVotes(matches);
                    setTotalCompared(total);
                    setGotyMatch(gotySame);
                    setMatchesList(newMatchesList);
                }

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileAndCompare();
    }, [usernameParam, currentUser, groupId]);

    if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Cargando perfil...</div>;
    if (!profile) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Usuario no encontrado</div>;

    const isMe = currentUser?.uid === profile.uid;
    const matchPercentage = totalCompared > 0 ? Math.round((commonVotes / totalCompared) * 100) : 0;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <Link
                    href={groupId ? `/group/${groupId}` : "/"}
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft size={20} /> Volver
                </Link>

                {/* Tarjeta de Perfil */}
                <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-600/20 to-transparent pointer-events-none" />

                    <div className="relative flex flex-col items-center text-center">
                        <div className="w-32 h-32 rounded-full bg-gray-700 border-4 border-gray-800 shadow-2xl mb-4 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {profile.photoURL ? (
                                <img src={profile.photoURL} alt={profile.username} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                    <User size={48} />
                                </div>
                            )}
                        </div>

                        <h1 className="text-3xl font-bold mb-1">{profile.displayName || profile.username}</h1>
                        <p className="text-blue-400 font-medium mb-6">@{profile.username}</p>

                        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/50">
                                <div className="flex items-center justify-center gap-2 text-yellow-500 mb-1">
                                    <Trophy size={20} />
                                    <span className="font-bold">Puntos</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{profile.score}</p>
                            </div>

                            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/50">
                                <div className="flex items-center justify-center gap-2 text-purple-500 mb-1">
                                    <Calendar size={20} />
                                    <span className="font-bold">Miembro</span>
                                </div>
                                <p className="text-sm text-gray-300 mt-1">Desde 2025</p>
                            </div>
                        </div>

                        {isMe && (
                            <Link
                                href="/settings"
                                className="mt-8 bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-full font-medium transition-colors"
                            >
                                Editar Perfil
                            </Link>
                        )}
                    </div>
                </div>

                {/* SECCIÓN DE COMPATIBILIDAD */}
                {!isMe && currentUser && (
                    <div className="mt-8 bg-gradient-to-br from-indigo-900/40 to-gray-800 rounded-2xl p-6 border border-indigo-500/30">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-300">
                            <HeartHandshake />
                            Compatibilidad de Gustos
                        </h2>

                        {totalCompared > 0 ? (
                            <div className="space-y-6">
                                {/* Resumen Gráfico */}
                                <div className="flex items-center gap-4">
                                    <div className="relative w-16 h-16 flex-shrink-0">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-700" />
                                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-indigo-500" strokeDasharray={175} strokeDashoffset={175 - (175 * matchPercentage) / 100} />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center font-bold text-sm">{matchPercentage}%</span>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-white">
                                            Coinciden en {commonVotes} de {totalCompared} categorías
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            Basado en sus predicciones principales (1º lugar).
                                        </p>
                                    </div>
                                </div>

                                {/* Alertas GOTY */}
                                {gotyMatch ? (
                                    <div className="bg-green-500/20 border border-green-500/30 p-3 rounded-lg flex items-center gap-3">
                                        <Zap className="text-green-400" size={20} />
                                        <p className="text-sm text-green-200">
                                            ¡Ambos creen que el mismo juego ganará el <strong>GOTY</strong>!
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-orange-500/20 border border-orange-500/30 p-3 rounded-lg flex items-center gap-3">
                                        <Shield className="text-orange-400" size={20} />
                                        <p className="text-sm text-orange-200">
                                            Tienen favoritos diferentes para el <strong>GOTY</strong>. ¡Rivalidad!
                                        </p>
                                    </div>
                                )}

                                {/* LISTA DETALLADA DE COINCIDENCIAS */}
                                {matchesList.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-indigo-500/30">
                                        <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <CheckCircle2 size={16} />
                                            Juegos en común
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {matchesList.map((match, idx) => (
                                                <div key={idx} className="bg-gray-900/60 p-3 rounded-lg flex items-center gap-3 border border-indigo-500/20 hover:border-indigo-500/50 transition-colors">
                                                    <div className="w-12 h-12 rounded bg-gray-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                        {match.nomineeImage ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={match.nomineeImage} alt={match.nomineeName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            // Icono por defecto si no hay imagen (ej: Esports)
                                                            <Trophy size={20} className="text-gray-600" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] text-indigo-400 uppercase font-bold truncate">
                                                            {match.categoryName}
                                                        </p>
                                                        <p className="font-bold text-sm text-white truncate leading-tight">
                                                            {match.nomineeName}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500 truncate">
                                                            {match.nomineeDeveloper}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-400 italic">
                                Aún no hay suficientes datos para comparar. ¡Asegúrate de que ambos hayan votado!
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}