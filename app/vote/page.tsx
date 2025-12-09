"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Trophy, ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Nominee {
    id: string;
    name: string;
    image?: string;
    developer?: string;
}

interface Category {
    id: string;
    name: string;
    nominees: Nominee[];
}

interface Vote {
    firstPlace: string;
    secondPlace: string;
    thirdPlace: string;
}

export default function VotePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const groupId = searchParams.get("groupId") || "global";

    const [categories, setCategories] = useState<Category[]>([]);
    const [votes, setVotes] = useState<Record<string, Vote>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;

            try {
                // Cargar categorías
                const categoriesSnap = await getDocs(collection(db, "categories"));
                const categoriesData = categoriesSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Category));
                setCategories(categoriesData);

                // Cargar votos existentes
                const votesData: Record<string, Vote> = {};

                if (groupId && groupId !== "global") {
                    const groupVotesSnap = await getDocs(collection(db, "users", user.uid, "groups", groupId, "votes"));
                    if (!groupVotesSnap.empty) {
                        groupVotesSnap.forEach(doc => {
                            votesData[doc.id] = doc.data() as Vote;
                        });
                    } else {
                        const globalVotesSnap = await getDocs(collection(db, "users", user.uid, "votes"));
                        globalVotesSnap.forEach(doc => {
                            votesData[doc.id] = doc.data() as Vote;
                        });
                    }
                } else {
                    const globalVotesSnap = await getDocs(collection(db, "users", user.uid, "votes"));
                    globalVotesSnap.forEach(doc => {
                        votesData[doc.id] = doc.data() as Vote;
                    });
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

    const handleVote = (categoryId: string, position: 'firstPlace' | 'secondPlace' | 'thirdPlace', nomineeId: string) => {
        setVotes(prev => ({
            ...prev,
            [categoryId]: {
                ...prev[categoryId],
                [position]: nomineeId
            }
        }));
    };

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        try {
            const votePath = groupId && groupId !== "global"
                ? `users/${user.uid}/groups/${groupId}/votes`
                : `users/${user.uid}/votes`;

            for (const [categoryId, vote] of Object.entries(votes)) {
                if (vote.firstPlace) {
                    await setDoc(doc(db, votePath, categoryId), vote);
                }
            }

            toast.success("¡Predicciones guardadas!");
            router.push(groupId && groupId !== "global" ? `/group/${groupId}` : "/");
        } catch (error) {
            console.error(error);
            toast.error("Error guardando predicciones");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-deep flex items-center justify-center text-white">
                <Loader2 className="animate-spin mr-2" size={32} />
                <span>Cargando categorías...</span>
            </div>
        );
    }

    const completedVotes = Object.values(votes).filter(v => v?.firstPlace).length;
    const totalCategories = categories.length;
    const progress = totalCategories > 0 ? Math.round((completedVotes / totalCategories) * 100) : 0;

    return (
        <div className="min-h-screen bg-deep text-white pb-24 pt-20">
            <div className="max-w-4xl mx-auto px-4 md:px-6">

                {/* HEADER */}
                <div className="mb-8">
                    <Link
                        href={groupId && groupId !== "global" ? `/group/${groupId}` : "/"}
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft size={20} /> Volver
                    </Link>

                    <div className="bg-surface border border-white/10 rounded-xl p-6">
                        <h1 className="text-3xl font-black text-white mb-4">Editar Predicciones</h1>

                        {/* Barra de progreso */}
                        <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400">Progreso</span>
                                <span className="font-bold text-primary">{completedVotes}/{totalCategories} ({progress}%)</span>
                            </div>
                            <div className="w-full bg-deep rounded-full h-3 overflow-hidden border border-white/10">
                                <div
                                    className="bg-primary h-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving || completedVotes === 0}
                            className="w-full bg-primary hover:bg-primary-light disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    Guardar Predicciones
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* CATEGORÍAS */}
                <div className="space-y-8">
                    {categories.map(category => (
                        <CategoryCard
                            key={category.id}
                            category={category}
                            vote={votes[category.id]}
                            onVote={(position, nomineeId) => handleVote(category.id, position, nomineeId)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

// Componente de Categoría
function CategoryCard({
    category,
    vote,
    onVote
}: {
    category: Category;
    vote?: Vote;
    onVote: (position: 'firstPlace' | 'secondPlace' | 'thirdPlace', nomineeId: string) => void;
}) {
    const medals = [
        { position: 'firstPlace' as const, label: '🥇 1er Lugar', color: 'border-yellow-500' },
        { position: 'secondPlace' as const, label: '🥈 2do Lugar', color: 'border-gray-400' },
        { position: 'thirdPlace' as const, label: '🥉 3er Lugar', color: 'border-orange-600' }
    ];

    return (
        <div className="bg-surface border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Trophy size={24} className="text-primary" />
                {category.name}
            </h2>

            <div className="space-y-4">
                {medals.map(({ position, label, color }) => (
                    <div key={position}>
                        <label className="block text-sm font-bold text-gray-400 mb-2">{label}</label>
                        <select
                            value={vote?.[position] || ""}
                            onChange={(e) => onVote(position, e.target.value)}
                            className="w-full bg-deep border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                        >
                            <option value="">Selecciona un nominado</option>
                            {category.nominees.map(nominee => (
                                <option key={nominee.id} value={nominee.id}>
                                    {nominee.name}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>
        </div>
    );
}