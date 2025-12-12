"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { Category, Nominee } from "@/types";
import { collection, doc, getDoc, getDocs, writeBatch } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ArrowLeft, Save, Trophy, Users, Gamepad2, Loader2, Sparkles, Lock, Clock } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import VoteModal from "@/components/VoteModal";
import CategorySection from "@/components/CategorySection";
import { Vote } from "@/types";

// Fecha límite de votación
const VOTING_DEADLINE = new Date("2025-12-11T19:45:00-05:00");

function VoteContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const groupId = searchParams.get("groupId");

    const [categories, setCategories] = useState<Category[]>([]);
    const [votes, setVotes] = useState<Record<string, Partial<Vote>>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [groupName, setGroupName] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedNominee, setSelectedNominee] = useState<Nominee | null>(null);

    // Verificar si las votaciones están cerradas
    const votingClosed = new Date() > VOTING_DEADLINE;

    // Protección de ruta
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push("/login");
            } else if (!user.emailVerified) {
                router.push("/verify-email");
            } else if (votingClosed) {
                // Redirigir si las votaciones están cerradas
                toast.error("Las votaciones han cerrado");
                router.push("/");
            }
        }
    }, [user, authLoading, router, votingClosed]);

    useEffect(() => {
        const loadData = async () => {
            if (!user || !user.emailVerified || votingClosed) return;

            try {
                const catSnap = await getDocs(collection(db, "categories"));
                const catsData = catSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Category[];

                const CATEGORY_ORDER = [
                    "game-of-the-year", "best-game-direction", "best-narrative", "best-art-direction",
                    "best-score-and-music", "best-audio-design", "best-performance", "innovation-in-accessibility",
                    "games-for-impact", "best-ongoing-game", "best-community-support", "best-independent-game",
                    "best-debut-indie-game", "best-mobile-game", "best-vr---ar-game", "best-action-game",
                    "best-action---adventure-game", "best-role-playing-game", "best-fighting-game", "best-family-game",
                    "best-sim---strategy-game", "best-sports---racing-game", "best-multiplayer-game", "best-adaptation",
                    "most-anticipated-game", "content-creator-of-the-year", "best-esports-game", "best-esports-athlete", "best-esports-team"
                ];

                catsData.sort((a, b) => {
                    const indexA = CATEGORY_ORDER.indexOf(a.id);
                    const indexB = CATEGORY_ORDER.indexOf(b.id);
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;
                    return indexA - indexB;
                });

                setCategories(catsData);

                const storageKey = groupId && groupId !== "global"
                    ? `votes_${user.uid}_${groupId}`
                    : `votes_${user.uid}_global`;

                const localVotes = localStorage.getItem(storageKey);
                let votesData: Record<string, Partial<Vote>> = {};

                if (localVotes) {
                    votesData = JSON.parse(localVotes);
                    toast.success("Predicciones recuperadas", { duration: 2000 });
                } else {
                    if (groupId && groupId !== "global") {
                        const groupDoc = await getDoc(doc(db, "groups", groupId));
                        if (groupDoc.exists()) {
                            setGroupName(groupDoc.data().name);
                        }

                        const groupVotesSnap = await getDocs(collection(db, "users", user.uid, "groups", groupId, "votes"));
                        if (!groupVotesSnap.empty) {
                            groupVotesSnap.forEach(doc => { votesData[doc.id] = doc.data(); });
                        } else {
                            const globalVotesSnap = await getDocs(collection(db, "users", user.uid, "votes"));
                            globalVotesSnap.forEach(doc => { votesData[doc.id] = doc.data(); });
                            if (!globalVotesSnap.empty) toast("Se cargaron tus predicciones globales como base.");
                        }
                    } else {
                        if (groupId === "global") setGroupName("Ranking Mundial (Global)");
                        const globalVotesSnap = await getDocs(collection(db, "users", user.uid, "votes"));
                        globalVotesSnap.forEach(doc => { votesData[doc.id] = doc.data(); });
                    }
                }

                setVotes(votesData);

            } catch (error) {
                console.error(error);
                toast.error("Error cargando datos");
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading && user && user.emailVerified && !votingClosed) {
            loadData();
        }
    }, [user, authLoading, groupId, votingClosed]);

    useEffect(() => {
        if (!user || authLoading || loading || votingClosed) return;

        const storageKey = groupId && groupId !== "global"
            ? `votes_${user.uid}_${groupId}`
            : `votes_${user.uid}_global`;

        localStorage.setItem(storageKey, JSON.stringify(votes));
    }, [votes, user, groupId, authLoading, loading, votingClosed]);

    const handleNomineeClick = (category: Category, nominee: Nominee) => {
        if (votingClosed) return;
        setSelectedCategory(category);
        setSelectedNominee(nominee);
        setIsModalOpen(true);
    };

    const handleVote = (position: number) => {
        if (!selectedCategory || !selectedNominee || votingClosed) return;

        setVotes(prev => {
            const categoryId = selectedCategory.id;
            const currentVotes = prev[categoryId] || {};
            const nomineeId = selectedNominee.id;

            const newCategoryVotes: Partial<Vote> = { ...currentVotes };

            if (newCategoryVotes.firstPlace === nomineeId) newCategoryVotes.firstPlace = null;
            if (newCategoryVotes.secondPlace === nomineeId) newCategoryVotes.secondPlace = null;
            if (newCategoryVotes.thirdPlace === nomineeId) newCategoryVotes.thirdPlace = null;

            if (position === 1) newCategoryVotes.firstPlace = nomineeId;
            if (position === 2) newCategoryVotes.secondPlace = nomineeId;
            if (position === 3) newCategoryVotes.thirdPlace = nomineeId;

            return {
                ...prev,
                [categoryId]: newCategoryVotes
            };
        });

        setIsModalOpen(false);
    };

    const saveAllVotes = async () => {
        if (!user || votingClosed) return;
        setSaving(true);
        const toastId = toast.loading("Guardando predicciones...");

        try {
            const batch = writeBatch(db);
            let collectionPath = `users/${user.uid}/votes`;

            if (groupId && groupId !== "global") {
                collectionPath = `users/${user.uid}/groups/${groupId}/votes`;
            }

            Object.entries(votes).forEach(([categoryId, voteData]) => {
                const docRef = doc(db, collectionPath, categoryId);
                batch.set(docRef, voteData);
            });

            await batch.commit();

            const storageKey = groupId && groupId !== "global"
                ? `votes_${user.uid}_${groupId}`
                : `votes_${user.uid}_global`;
            localStorage.removeItem(storageKey);

            toast.success("¡Predicciones guardadas!", { id: toastId });

            if (groupId && groupId !== "global") router.push(`/group/${groupId}`);
            else router.push("/");

        } catch (error) {
            console.error(error);
            toast.error("Error al guardar", { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    // No mostrar nada mientras se carga la autenticación
    if (authLoading || loading) return (
        <div className="min-h-screen flex items-center justify-center text-white bg-deep">
            <Loader2 className="animate-spin mr-2" /> Cargando boleta...
        </div>
    );

    // Si no hay usuario o email no verificado, no renderizar (se redirige arriba)
    if (!user || !user.emailVerified) return null;

    // Pantalla de votaciones cerradas
    if (votingClosed) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-deep via-surface to-deep text-white flex items-center justify-center p-4">
                <div className="max-w-2xl w-full bg-gradient-to-br from-surface to-deep rounded-3xl border border-white/10 shadow-2xl p-12 text-center">
                    <div className="bg-red-500/10 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-red-500/30">
                        <Lock size={64} className="text-red-400" />
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                        Votaciones Cerradas
                    </h1>

                    <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                        Las predicciones cerraron el <span className="text-white font-bold">11 de diciembre a las 8:00 PM</span>.
                        <br />¡Gracias por participar en los Wishlist Awards 2025!
                    </p>

                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-8">
                        <Clock size={16} />
                        <span>Los resultados se revelarán pronto</span>
                    </div>

                    <Link
                        href="/"
                        className="inline-flex items-center gap-3 bg-gradient-to-r from-primary to-orange-500 text-black font-black px-8 py-4 rounded-xl hover:scale-105 transition-transform shadow-lg shadow-primary/30"
                    >
                        <Trophy size={24} />
                        Ver Rankings
                    </Link>
                </div>
            </div>
        );
    }

    // Calcular progreso
    const totalCategories = categories.length;
    const completedCategories = Object.values(votes).filter(v => v.firstPlace).length;
    const progressPercentage = totalCategories > 0 ? Math.round((completedCategories / totalCategories) * 100) : 0;

    return (
        <div className="min-h-screen bg-gradient-to-b from-deep via-surface to-deep text-white pb-32 md:pb-24 pt-20">
            {groupId && groupName && (
                <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-b border-blue-700/30 sticky top-16 z-40 backdrop-blur-xl shadow-lg">
                    <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
                                {groupId === "global" ? <Trophy size={20} className="text-white" /> : <Users size={20} className="text-white" />}
                            </div>
                            <div>
                                <p className="text-xs text-blue-300 uppercase font-bold tracking-wider">Editando predicciones</p>
                                <p className="font-bold text-white text-lg leading-none">{groupName}</p>
                            </div>
                        </div>
                        <Link
                            href={groupId === "global" ? "/" : `/group/${groupId}`}
                            className="text-sm text-blue-300 hover:text-white underline hover:no-underline transition-all"
                        >
                            Cancelar
                        </Link>
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto p-4 md:p-6">
                {!groupId && (
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
                        <ArrowLeft size={20} /> Volver al Inicio
                    </Link>
                )}

                {/* HEADER MEJORADO */}
                <div className="mb-10 mt-6 border-b border-white/10 pb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-4 rounded-2xl shadow-2xl shadow-yellow-500/20">
                            <Gamepad2 size={36} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                                Tus Predicciones
                            </h1>
                            <p className="text-gray-400 text-lg mt-1">
                                Arma tu <span className="text-yellow-400 font-bold">Tier List</span> de ganadores
                            </p>
                        </div>
                    </div>

                    {/* Barra de Progreso */}
                    <div className="bg-surface border border-white/10 rounded-xl p-4 flex items-center gap-4">
                        <Sparkles className="text-yellow-500 flex-shrink-0" size={24} />
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-gray-300">Progreso General</span>
                                <span className="text-sm font-bold text-yellow-400">{completedCategories}/{totalCategories}</span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden border border-gray-700">
                                <div
                                    className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full transition-all duration-500 shadow-lg shadow-yellow-500/50"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                        </div>
                        <span className="text-2xl font-black text-yellow-400">{progressPercentage}%</span>
                    </div>
                </div>

                <div className="space-y-10">
                    {categories.map((cat) => (
                        <CategorySection
                            key={cat.id}
                            category={cat}
                            userVotes={votes[cat.id] ? {
                                firstPlace: votes[cat.id].firstPlace || undefined,
                                secondPlace: votes[cat.id].secondPlace || undefined,
                                thirdPlace: votes[cat.id].thirdPlace || undefined,
                            } : undefined}
                            onNomineeClick={handleNomineeClick}
                        />
                    ))}
                </div>

                {/* BOTÓN FLOTANTE MEJORADO */}
                <div className="fixed left-0 right-0 px-4 flex justify-center z-30 bottom-24 md:bottom-6">
                    <button
                        onClick={saveAllVotes}
                        disabled={saving}
                        className="group relative bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-600 hover:from-yellow-400 hover:to-orange-400 text-black font-black py-5 px-16 rounded-full shadow-2xl shadow-yellow-500/40 flex items-center gap-4 transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin" size={28} /> GUARDANDO...
                            </>
                        ) : (
                            <>
                                <Save size={28} className="group-hover:rotate-12 transition-transform" />
                                <span className="text-xl tracking-wide">GUARDAR PICKS</span>
                                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                                    {completedCategories}
                                </div>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {selectedCategory && selectedNominee && (
                <VoteModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    nominee={selectedNominee}
                    categoryId={selectedCategory.id}
                    onVote={handleVote}
                    currentPosition={
                        votes[selectedCategory.id]?.firstPlace === selectedNominee.id ? 1 :
                            votes[selectedCategory.id]?.secondPlace === selectedNominee.id ? 2 :
                                votes[selectedCategory.id]?.thirdPlace === selectedNominee.id ? 3 : null
                    }
                />
            )}
        </div>
    );
}

export default function VotePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-deep flex items-center justify-center text-white">
                <Loader2 className="animate-spin mr-2" /> Cargando...
            </div>
        }>
            <VoteContent />
        </Suspense>
    );
}