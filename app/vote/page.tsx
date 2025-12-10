"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { Category, Nominee } from "@/types";
import { collection, doc, getDoc, getDocs, writeBatch } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ArrowLeft, Save, Trophy, Users, Gamepad2, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import VoteModal from "@/components/VoteModal";
import CategorySection from "@/components/CategorySection";
import { Vote } from "@/types";


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

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;

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

                let votesData: Record<string, Partial<Vote>> = {};

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
            else if (!user.emailVerified) {
                router.push("/verify-email");
            }
        }
    }, [user, authLoading, router, groupId]);

    const handleNomineeClick = (category: Category, nominee: Nominee) => {
        setSelectedCategory(category);
        setSelectedNominee(nominee);
        setIsModalOpen(true);
    };

    const handleVote = (position: number) => {
        if (!selectedCategory || !selectedNominee) return;

        const cleanVote: Partial<Vote> = {
            firstPlace: votes[selectedCategory.id]?.firstPlace ?? undefined,
            secondPlace: votes[selectedCategory.id]?.secondPlace ?? undefined,
            thirdPlace: votes[selectedCategory.id]?.thirdPlace ?? undefined,
        };

        if (position === 1) cleanVote.firstPlace = selectedNominee.id;
        else if (position === 2) cleanVote.secondPlace = selectedNominee.id;
        else if (position === 3) cleanVote.thirdPlace = selectedNominee.id;

        setVotes(prev => ({
            ...prev,
            [selectedCategory.id]: cleanVote
        }));

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

    if (loading) {
        return (
            <div className="min-h-screen bg-deep flex items-center justify-center text-white">
                <Loader2 className="animate-spin mr-2" /> Cargando categorías...
            </div>
        );
    }

    // Calcular progreso
    const totalCategories = categories.length;
    const completedCategories = Object.values(votes).filter(v => v.firstPlace).length;
    const progressPercentage = totalCategories > 0 ? Math.round((completedCategories / totalCategories) * 100) : 0;

    return (
        <div className="min-h-screen bg-deep text-white">
            <div className="h-16 md:h-20" />
            <main className="max-w-6xl mx-auto px-4 md:px-6 py-12 pb-24">
                {/* Header */}
                <div className="mb-12">
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-primary mb-6 transition-colors group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Volver
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-black mb-2">
                        {groupId === "global" ? "Ranking Mundial" : groupName || "Votación"}
                    </h1>
                </div>

                {/* Categorías */}
                <div className="space-y-6">
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

                {/* Modal de votación */}
                <VoteModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    nominee={selectedNominee!}
                    categoryId={selectedCategory?.id || ""}
                    onVote={handleVote}
                    currentPosition={
                        selectedCategory
                            ? votes[selectedCategory.id]?.firstPlace === selectedNominee?.id
                                ? 1
                                : votes[selectedCategory.id]?.secondPlace === selectedNominee?.id
                                ? 2
                                : votes[selectedCategory.id]?.thirdPlace === selectedNominee?.id
                                ? 3
                                : null
                            : null
                    }
                />

                {/* Botón guardar */}
                <div className="fixed bottom-8 right-8 z-40">
                    <button
                        onClick={saveAllVotes}
                        disabled={saving}
                        className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 disabled:opacity-50 text-black font-bold py-4 px-8 rounded-xl transition-all hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] hover:scale-105 flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        {saving ? "Guardando..." : "Guardar Votos"}
                    </button>
                </div>
            </main>
        </div>
    );
}

export default function VotePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>}>
            <VoteContent />
        </Suspense>
    );
}