"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { Category } from "@/types";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Trophy, Save } from "lucide-react";
import CategorySection from "@/components/CategorySection";
import Link from "next/link";

// Definimos el orden exacto de los IDs
const CATEGORY_ORDER = [
    "game-of-the-year",
    "best-game-direction",
    "best-narrative",
    "best-art-direction",
    "best-score-and-music",
    "best-audio-design",
    "best-performance",
    "innovation-in-accessibility",
    "games-for-impact",
    "best-ongoing-game",
    "best-community-support",
    "best-independent-game",
    "best-debut-indie-game",
    "best-mobile-game",
    "best-vr---ar-game",
    "best-action-game",
    "best-action---adventure-game",
    "best-role-playing-game",
    "best-fighting-game",
    "best-family-game",
    "best-sim---strategy-game",
    "best-sports---racing-game",
    "best-multiplayer-game",
    "best-adaptation",
    "most-anticipated-game",
    "content-creator-of-the-year",
    "best-esports-game",
    "best-esports-athlete",
    "best-esports-team"
];

export default function VotePage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // Estado local de votos: { categoryId: { nomineeId: rank } }
    const [userVotes, setUserVotes] = useState<Record<string, Record<string, number>>>({});

    // 1. Protección de ruta
    useEffect(() => {
        if (!loading) {
            if (!user) router.push("/login");
            else if (!user.emailVerified) router.push("/verify-email");
        }
    }, [user, loading, router]);

    // 2. Cargar Categorías y Votos del Usuario
    useEffect(() => {
        const fetchData = async () => {
            if (user && user.emailVerified) {
                try {
                    // A. Cargar Categorías
                    const catSnapshot = await getDocs(collection(db, "categories"));
                    const catData = catSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as Category[];

                    // Ordenar
                    catData.sort((a, b) => {
                        const indexA = CATEGORY_ORDER.indexOf(a.id);
                        const indexB = CATEGORY_ORDER.indexOf(b.id);
                        if (indexA === -1) return 1;
                        if (indexB === -1) return -1;
                        return indexA - indexB;
                    });
                    setCategories(catData);

                    // B. Cargar Votos Existentes del Usuario
                    // Estructura en DB: users/{uid}/votes/{categoryId} -> { firstPlace: "id", secondPlace: "id", ... }
                    const votesSnapshot = await getDocs(collection(db, "users", user.uid, "votes"));
                    const loadedVotes: Record<string, Record<string, number>> = {};

                    votesSnapshot.forEach((doc) => {
                        const data = doc.data();
                        const categoryId = doc.id;
                        loadedVotes[categoryId] = {};

                        if (data.firstPlace) loadedVotes[categoryId][data.firstPlace] = 1;
                        if (data.secondPlace) loadedVotes[categoryId][data.secondPlace] = 2;
                        if (data.thirdPlace) loadedVotes[categoryId][data.thirdPlace] = 3;
                    });

                    setUserVotes(loadedVotes);

                } catch (error) {
                    console.error("Error cargando datos:", error);
                } finally {
                    setLoadingData(false);
                }
            }
        };
        fetchData();
    }, [user]);

    // 3. Función para manejar el voto
    const handleVote = async (categoryId: string, nomineeId: string, position: 1 | 2 | 3 | 0) => {
        if (!user) return;

        // Copiamos el estado actual de esa categoría
        const currentCategoryVotes = { ...(userVotes[categoryId] || {}) };

        // Lógica de reemplazo:
        // Si el usuario elige posición 0, es para borrar el voto
        if (position === 0) {
            delete currentCategoryVotes[nomineeId];
        } else {
            // Si otro juego ya tenía esa posición, se la quitamos (no puede haber dos 1ros lugares)
            Object.keys(currentCategoryVotes).forEach(key => {
                if (currentCategoryVotes[key] === position) {
                    delete currentCategoryVotes[key];
                }
            });
            // Asignamos la nueva posición al juego seleccionado
            currentCategoryVotes[nomineeId] = position;
        }

        // Actualizamos estado local (para que se vea rápido en UI)
        setUserVotes(prev => ({
            ...prev,
            [categoryId]: currentCategoryVotes
        }));

        // Guardamos en Firebase
        // Convertimos el mapa { id: rank } a { firstPlace: id, ... }
        const firestoreData = {
            firstPlace: null as string | null,
            secondPlace: null as string | null,
            thirdPlace: null as string | null,
            updatedAt: new Date()
        };

        Object.entries(currentCategoryVotes).forEach(([id, rank]) => {
            if (rank === 1) firestoreData.firstPlace = id;
            if (rank === 2) firestoreData.secondPlace = id;
            if (rank === 3) firestoreData.thirdPlace = id;
        });

        try {
            const voteRef = doc(db, "users", user.uid, "votes", categoryId);
            await setDoc(voteRef, firestoreData);
        } catch (error) {
            console.error("Error guardando voto:", error);
        }
    };

    if (loading || (user && !categories.length && loadingData)) {
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Cargando premios...</div>;
    }

    if (!user || !user.emailVerified) return null;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
            <header className="flex items-center justify-between mb-8 sticky top-0 bg-gray-900/95 z-40 py-4 border-b border-gray-800 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                        <ArrowLeft />
                    </Link>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Trophy className="text-yellow-500" size={20} />
                        <span className="hidden sm:inline">Votación Oficial</span>
                    </h1>
                </div>

                {/* Indicador de guardado (opcional, visual feedback) */}
                <div className="flex items-center gap-2 text-xs text-green-400 bg-green-900/20 px-3 py-1 rounded-full border border-green-900/50">
                    <Save size={12} />
                    Guardado automático
                </div>
            </header>

            <main className="max-w-7xl mx-auto space-y-8 pb-20">
                {categories.map((cat) => (
                    <CategorySection
                        key={cat.id}
                        category={cat}
                        votes={userVotes[cat.id] || {}} // Pasamos solo los votos de esta categoría
                        onVote={(nomineeId, position) => handleVote(cat.id, nomineeId, position)}
                    />
                ))}
            </main>
        </div>
    );
}