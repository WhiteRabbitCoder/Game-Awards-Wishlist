"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { Category, Nominee } from "@/types";
import { collection, doc, getDoc, getDocs, setDoc, writeBatch } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ArrowLeft, Save, Trophy, Users, Gamepad2, Loader2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import VoteModal from "@/components/VoteModal";
import CategorySection from "@/components/CategorySection";

function VoteContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const groupId = searchParams.get("groupId");

    const [categories, setCategories] = useState<Category[]>([]);
    const [votes, setVotes] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [groupName, setGroupName] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedNominee, setSelectedNominee] = useState<Nominee | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;

            try {
                // 1. Cargar Categorías
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

                // 2. Cargar Votos
                let votesData = {};

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
                        if (!globalVotesSnap.empty) {
                            toast("Se cargaron tus predicciones globales como base.");
                        }
                    }
                } else {
                    if (groupId === "global") setGroupName("Ranking Mundial (Global)");
                    const globalVotesSnap = await getDocs(collection(db, "users", user.uid, "votes"));
                    globalVotesSnap.forEach(doc => { votesData[doc.id] = doc.data(); });
                }

                setVotes(votesData);

            } catch (error) {
                console.error(error);
                toast.error("Error cargando datos");
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            if (!user) router.push("/login");
            else loadData();
        }
    }, [user, authLoading, router, groupId]);

    const handleNomineeClick = (category: Category, nominee: Nominee) => {
        setSelectedCategory(category);
        setSelectedNominee(nominee);
        setIsModalOpen(true);
    };

    // --- CORRECCIÓN AQUÍ: Manejar el número que envía el Modal ---
    const handleVote = (position: number) => {
        if (!selectedCategory || !selectedNominee) return;

        setVotes(prev => {
            const categoryId = selectedCategory.id;
            const currentVotes = prev[categoryId] || {};
            const nomineeId = selectedNominee.id;

            // Crear copia de los votos actuales de la categoría
            const newCategoryVotes = { ...currentVotes };

            // 1. Limpiar si el nominado ya estaba en otra posición (para evitar duplicados)
            if (newCategoryVotes.firstPlace === nomineeId) newCategoryVotes.firstPlace = null;
            if (newCategoryVotes.secondPlace === nomineeId) newCategoryVotes.secondPlace = null;
            if (newCategoryVotes.thirdPlace === nomineeId) newCategoryVotes.thirdPlace = null;

            // 2. Asignar nueva posición (si position es 0, solo borramos, que ya se hizo arriba)
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
        if (!user) return;
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

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center text-white">
            <Loader2 className="animate-spin mr-2" /> Cargando boleta...
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-900 text-white pb-20">
            {groupId && groupName && (
                <div className="bg-blue-900/50 border-b border-blue-800 sticky top-0 z-40 backdrop-blur-md">
                    <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-2 rounded-full">
                                {groupId === "global" ? <Trophy size={20} /> : <Users size={20} />}
                            </div>
                            <div>
                                <p className="text-xs text-blue-300 uppercase font-bold">Editando predicciones para</p>
                                <p className="font-bold text-white text-lg leading-none">{groupName}</p>
                            </div>
                        </div>
                        <Link
                            href={groupId === "global" ? "/" : `/group/${groupId}`}
                            className="text-sm text-blue-300 hover:text-white underline"
                        >
                            Cancelar
                        </Link>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto p-4">
                {!groupId && (
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6">
                        <ArrowLeft size={20} /> Volver
                    </Link>
                )}

                <div className="mb-8 mt-4 border-b border-gray-800 pb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Gamepad2 className="text-yellow-500" size={32} />
                        <h1 className="text-3xl md:text-4xl font-bold">Tus Predicciones</h1>
                    </div>
                    <p className="text-gray-400 text-lg">
                        Arma tu <span className="text-white font-bold">Tier List</span> de ganadores. Elige sabiamente, cada punto cuenta para el ranking.
                    </p>
                </div>

                <div className="space-y-8">
                    {categories.map(cat => (
                        <CategorySection
                            key={cat.id}
                            category={cat}
                            userVotes={votes[cat.id]}
                            onNomineeClick={handleNomineeClick}
                        />
                    ))}
                </div>

                <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-30">
                    <button
                        onClick={saveAllVotes}
                        disabled={saving}
                        className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 px-12 rounded-full shadow-lg shadow-yellow-500/20 flex items-center gap-3 transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin" size={24} /> Guardando...
                            </>
                        ) : (
                            <>
                                <Save size={24} /> GUARDAR PICKS
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
                    onVote={handleVote as any} // Cast necesario si el tipo estricto del modal es 1|2|3
                    // --- CORRECCIÓN AQUÍ: Pasar números (1, 2, 3) en lugar de strings ---
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
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
                <Loader2 className="animate-spin mr-2" /> Cargando...
            </div>
        }>
            <VoteContent />
        </Suspense>
    );
}