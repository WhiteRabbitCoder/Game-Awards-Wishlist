"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { Category } from "@/types";
import { collection, doc, getDocs, setDoc, writeBatch, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Shield, Save, Calculator, CheckCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

// ⚠️ IMPORTANTE: Pon aquí tu email real de administrador
const ADMIN_EMAILS = ["angelogaviriam@gmail.com"];

// El mismo orden que en la página de votación
const CATEGORY_ORDER = [
    "game-of-the-year", "best-game-direction", "best-narrative", "best-art-direction",
    "best-score-and-music", "best-audio-design", "best-performance", "innovation-in-accessibility",
    "games-for-impact", "best-ongoing-game", "best-community-support", "best-independent-game",
    "best-debut-indie-game", "best-mobile-game", "best-vr---ar-game", "best-action-game",
    "best-action---adventure-game", "best-role-playing-game", "best-fighting-game", "best-family-game",
    "best-sim---strategy-game", "best-sports---racing-game", "best-multiplayer-game", "best-adaptation",
    "most-anticipated-game", "content-creator-of-the-year", "best-esports-game", "best-esports-athlete", "best-esports-team"
];

export default function AdminPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [categories, setCategories] = useState<Category[]>([]);
    const [winners, setWinners] = useState<Record<string, string>>({}); // categoryId -> nomineeId
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);

    // Protección de ruta
    useEffect(() => {
        if (!authLoading) {
            if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
                router.push("/"); // Expulsar si no es admin
            } else {
                loadData();
            }
        }
    }, [user, authLoading, router]);

    const loadData = async () => {
        try {
            // 1. Cargar Categorías
            const catSnap = await getDocs(collection(db, "categories"));
            const cats = catSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Category[];

            // ORDENAR LAS CATEGORÍAS
            cats.sort((a, b) => {
                const indexA = CATEGORY_ORDER.indexOf(a.id);
                const indexB = CATEGORY_ORDER.indexOf(b.id);
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            });

            setCategories(cats);

            // 2. Cargar Ganadores ya guardados
            const resultsSnap = await getDoc(doc(db, "admin", "results"));
            if (resultsSnap.exists()) {
                setWinners(resultsSnap.data() as Record<string, string>);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error cargando datos");
        } finally {
            setLoading(false);
        }
    };

    const handleWinnerSelect = (categoryId: string, nomineeId: string) => {
        setWinners(prev => ({ ...prev, [categoryId]: nomineeId }));
    };

    const saveWinners = async () => {
        try {
            await setDoc(doc(db, "admin", "results"), winners);
            toast.success("Selección guardada (Hoja de Respuestas actualizada)");
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar");
        }
    };

    // --- CÁLCULO DE PUNTOS (GLOBAL Y POR GRUPOS) ---
    const calculateGlobalScores = async () => {
        if (!confirm("¿Estás seguro? Esto recalculará TODOS los puntajes (Globales y de Grupos).")) return;

        setCalculating(true);
        const toastId = toast.loading("Iniciando cálculo masivo...");

        try {
            let batch = writeBatch(db);
            let operationCounter = 0;
            let processedUsers = 0;
            let processedGroups = 0;

            // ---------------------------------------------------------
            // FASE 1: CÁLCULO GLOBAL
            // ---------------------------------------------------------
            toast.loading("Calculando Ranking Global...", { id: toastId });

            const usersSnap = await getDocs(collection(db, "users"));

            for (const userDoc of usersSnap.docs) {
                const userId = userDoc.id;
                let score = 0;

                // Leemos votos globales
                const votesSnap = await getDocs(collection(db, "users", userId, "votes"));

                votesSnap.forEach(voteDoc => {
                    const categoryId = voteDoc.id;
                    const userVote = voteDoc.data();
                    const officialWinnerId = winners[categoryId];

                    if (!officialWinnerId) return;
                    const isGOTY = categoryId === "game-of-the-year";

                    if (userVote.firstPlace === officialWinnerId) score += isGOTY ? 5 : 3;
                    else if (userVote.secondPlace === officialWinnerId) score += isGOTY ? 4 : 2;
                    else if (userVote.thirdPlace === officialWinnerId) score += isGOTY ? 3 : 1;
                    else if (isGOTY) score += 1;
                });

                batch.update(doc(db, "users", userId), { score: score });
                operationCounter++;
                processedUsers++;

                if (operationCounter >= 400) { await batch.commit(); batch = writeBatch(db); operationCounter = 0; }
            }

            // ---------------------------------------------------------
            // FASE 2: CÁLCULO POR GRUPOS
            // ---------------------------------------------------------
            toast.loading("Calculando Grupos Privados...", { id: toastId });

            const groupsSnap = await getDocs(collection(db, "groups"));

            for (const groupDoc of groupsSnap.docs) {
                const groupId = groupDoc.id;

                // Obtener miembros del grupo
                const membersSnap = await getDocs(collection(db, "groups", groupId, "members"));

                for (const memberDoc of membersSnap.docs) {
                    const userId = memberDoc.id;
                    let groupScore = 0;

                    // Leemos votos ESPECÍFICOS de este grupo
                    // Ruta: users/{uid}/groups/{groupId}/votes
                    const groupVotesSnap = await getDocs(collection(db, "users", userId, "groups", groupId, "votes"));

                    // Si el usuario no votó específicamente en el grupo, ¿usamos sus votos globales?
                    // DISEÑO: Normalmente en estos juegos, si no votas en el grupo, tienes 0 puntos en el grupo.
                    // O podrías copiar los globales. Asumiremos que cuentan los votos explícitos del grupo.

                    // PERO: Tu sistema actual copia los globales al entrar al voto de grupo, así que siempre habrá votos si el usuario entró a editar.
                    // Si nunca entró a editar para el grupo, esta colección estará vacía.
                    // ESTRATEGIA: Si la colección de grupo está vacía, calculamos con los votos globales (Fallback).

                    let votesToCount = groupVotesSnap;
                    if (groupVotesSnap.empty) {
                        votesToCount = await getDocs(collection(db, "users", userId, "votes"));
                    }

                    votesToCount.forEach(voteDoc => {
                        const categoryId = voteDoc.id;
                        const userVote = voteDoc.data();
                        const officialWinnerId = winners[categoryId];

                        if (!officialWinnerId) return;
                        const isGOTY = categoryId === "game-of-the-year";

                        if (userVote.firstPlace === officialWinnerId) groupScore += isGOTY ? 5 : 3;
                        else if (userVote.secondPlace === officialWinnerId) groupScore += isGOTY ? 4 : 2;
                        else if (userVote.thirdPlace === officialWinnerId) groupScore += isGOTY ? 3 : 1;
                        else if (isGOTY) groupScore += 1;
                    });

                    // Actualizamos el score EN EL MIEMBRO DEL GRUPO
                    // Ruta: groups/{groupId}/members/{uid} -> campo: score
                    batch.update(doc(db, "groups", groupId, "members", userId), { score: groupScore });
                    operationCounter++;

                    if (operationCounter >= 400) { await batch.commit(); batch = writeBatch(db); operationCounter = 0; }
                }
                processedGroups++;
            }

            if (operationCounter > 0) { await batch.commit(); }

            toast.success(`Cálculo total: ${processedUsers} usuarios y ${processedGroups} grupos actualizados.`, { id: toastId });

        } catch (error) {
            console.error(error);
            toast.error("Error en el cálculo", { id: toastId });
        } finally {
            setCalculating(false);
        }
    };

    if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center text-white">Cargando panel...</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-800 pb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3 text-red-500">
                            <Shield size={32} />
                            Panel de Administración
                        </h1>
                        <p className="text-gray-400 mt-1">Define los ganadores oficiales y gestiona el evento.</p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={saveWinners}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-blue-900/20"
                            title="Guarda la respuesta correcta sin afectar el ranking"
                        >
                            <Save size={18} /> Guardar Selección
                        </button>

                        <button
                            onClick={calculateGlobalScores}
                            disabled={calculating}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/20"
                            title="Actualiza los puntos de todos los usuarios"
                        >
                            {calculating ? <Loader2 className="animate-spin" /> : <Calculator size={18} />}
                            Calcular Puntos
                        </button>
                    </div>
                </header>

                <div className="space-y-8 pb-20">
                    {categories.map(cat => (
                        <div key={cat.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                            <h3 className="text-xl font-bold mb-4 text-yellow-500 flex items-center gap-2">
                                {cat.name}
                                {winners[cat.id] && <CheckCircle size={16} className="text-green-500" />}
                            </h3>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {cat.nominees.map(nom => (
                                    <button
                                        key={nom.id}
                                        onClick={() => handleWinnerSelect(cat.id, nom.id)}
                                        className={`relative p-2 rounded-lg border-2 transition-all text-left group ${winners[cat.id] === nom.id
                                            ? "border-green-500 bg-green-500/10 ring-2 ring-green-500/20"
                                            : "border-gray-700 hover:border-gray-500 bg-gray-900"
                                            }`}
                                    >
                                        <div className="aspect-video bg-gray-800 rounded mb-2 overflow-hidden relative">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            {nom.image && <img src={nom.image} alt={nom.name} className="w-full h-full object-cover" />}
                                            {winners[cat.id] === nom.id && (
                                                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-[1px]">
                                                    <span className="bg-green-500 text-black font-bold px-2 py-1 rounded text-xs shadow-lg">GANADOR</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className={`text-sm font-bold leading-tight ${winners[cat.id] === nom.id ? "text-green-400" : "text-gray-300"}`}>
                                            {nom.name}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}