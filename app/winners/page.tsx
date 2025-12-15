"use client";

import { db } from "@/lib/firebase";
import { Category, Nominee } from "@/types";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useState, useRef, useCallback } from "react";
import { Loader2, Trophy, Crown, ArrowLeft, ChevronUp, ChevronDown } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const CATEGORY_ORDER = [
    "game-of-the-year", "best-game-direction", "best-narrative", "best-art-direction",
    "best-score-and-music", "best-audio-design", "best-performance", "innovation-in-accessibility",
    "games-for-impact", "best-ongoing-game", "best-community-support", "best-independent-game",
    "best-debut-indie-game", "best-mobile-game", "best-vr---ar-game", "best-action-game",
    "best-action---adventure-game", "best-role-playing-game", "best-fighting-game", "best-family-game",
    "best-sim---strategy-game", "best-sports---racing-game", "best-multiplayer-game", "best-adaptation",
    "most-anticipated-game", "content-creator-of-the-year", "best-esports-game", "best-esports-athlete", "best-esports-team"
];

export default function WinnersPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [winners, setWinners] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [validCategories, setValidCategories] = useState<Category[]>([]);
    const categoryRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Cargar Ganadores Oficiales
                const resultsSnap = await getDoc(doc(db, "admin", "results"));
                if (!resultsSnap.exists()) {
                    setLoading(false);
                    return;
                }
                const winnersData = resultsSnap.data() as Record<string, string>;
                setWinners(winnersData);

                // 2. Cargar Categorías
                const catSnap = await getDocs(collection(db, "categories"));
                const cats = catSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Category[];

                // Ordenar categorías
                cats.sort((a, b) => {
                    const indexA = CATEGORY_ORDER.indexOf(a.id);
                    const indexB = CATEGORY_ORDER.indexOf(b.id);
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;
                    return indexA - indexB;
                });

                setCategories(cats);

                // Filtrar solo las que tienen ganador
                const valid = cats.filter(c => winnersData[c.id] && c.nominees.find(n => n.id === winnersData[c.id]));
                setValidCategories(valid);

            } catch (error) {
                console.error(error);
                toast.error("Error cargando ganadores");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Función para scroll al índice dado
    const scrollToIndex = useCallback((index: number) => {
        if (index >= 0 && index < categoryRefs.current.length) {
            const element = categoryRefs.current[index];
            if (element) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                setCurrentIndex(index);
            }
        }
    }, []);

    // Manejo de teclas Tab y flechas (navegación circular)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const total = validCategories.length;
            if (total === 0) return;

            if (e.key === 'Tab') {
                e.preventDefault();
                if (e.shiftKey) {
                    // Shift+Tab = anterior (circular)
                    scrollToIndex(currentIndex === 0 ? total - 1 : currentIndex - 1);
                } else {
                    // Tab = siguiente (circular)
                    scrollToIndex(currentIndex === total - 1 ? 0 : currentIndex + 1);
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                scrollToIndex(currentIndex === total - 1 ? 0 : currentIndex + 1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                scrollToIndex(currentIndex === 0 ? total - 1 : currentIndex - 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, validCategories.length, scrollToIndex]);

    if (loading) return (
        <div className="min-h-screen bg-deep flex items-center justify-center text-white">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="text-gray-400 font-medium tracking-wide">Develando a los ganadores...</p>
            </div>
        </div>
    );

    let validIndex = 0;

    return (
        <div className="min-h-screen bg-deep text-white overflow-x-hidden">
            {/* Header / Hero */}
            <div className="relative pt-24 pb-16 px-4 md:px-6 overflow-hidden border-b border-white/10">
                <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 via-transparent to-deep" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-repeat opacity-5"></div>

                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors absolute left-0 top-0">
                        <ArrowLeft size={20} /> Volver
                    </Link>

                    <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-1.5 rounded-full border border-yellow-500/30 mb-6 backdrop-blur-sm animate-fade-in-up">
                        <Crown size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">Resultados Oficiales</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
                        <span className="bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 bg-clip-text text-transparent drop-shadow-2xl">
                            The Winners
                        </span>
                    </h1>

                    <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                        Explora la lista oficial de ganadores de The Game Awards Wishlist 2025.
                    </p>

                    {/* Indicador de navegación */}
                    <div className="mt-6 flex items-center justify-center gap-2 text-gray-500 text-sm">
                        <kbd className="px-2 py-1 bg-surface border border-white/10 rounded text-xs">Tab</kbd>
                        <span>o</span>
                        <kbd className="px-2 py-1 bg-surface border border-white/10 rounded text-xs">↑↓</kbd>
                        <span>para navegar</span>
                    </div>
                </div>
            </div>

            {/* Navegación flotante */}
            <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
                <button
                    onClick={() => {
                        const total = validCategories.length;
                        scrollToIndex(currentIndex === 0 ? total - 1 : currentIndex - 1);
                    }}
                    className="p-3 bg-surface border border-white/10 rounded-full hover:bg-white/10 transition-colors"
                >
                    <ChevronUp size={20} />
                </button>
                <div className="text-center text-xs text-gray-500 py-1">
                    {currentIndex + 1}/{validCategories.length}
                </div>
                <button
                    onClick={() => {
                        const total = validCategories.length;
                        scrollToIndex(currentIndex === total - 1 ? 0 : currentIndex + 1);
                    }}
                    className="p-3 bg-surface border border-white/10 rounded-full hover:bg-white/10 transition-colors"
                >
                    <ChevronDown size={20} />
                </button>
            </div>

            {/* Listado de Ganadores */}
            <main className="max-w-5xl mx-auto px-4 md:px-6 py-16 space-y-24">
                {categories.map((category, index) => {
                    const winnerId = winners[category.id];
                    const winner = category.nominees.find(n => n.id === winnerId);
                    const isGOTY = category.id === "game-of-the-year";

                    // Si no hay ganador definido aún, no mostramos la categoría
                    if (!winner) return null;

                    const currentValidIndex = validIndex;
                    validIndex++;

                    return (
                        <div
                            key={category.id}
                            ref={el => { categoryRefs.current[currentValidIndex] = el; }}
                            className={`group relative ${isGOTY ? "py-12" : ""} ${currentIndex === currentValidIndex ? "ring-2 ring-primary/30 rounded-3xl" : ""}`}
                        >
                            {/* Conector visual entre categorías */}
                            {index !== 0 && (
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-px h-12 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                            )}

                            <div className="flex flex-col items-center text-center mb-8">
                                <h2 className={`font-black uppercase tracking-widest text-gray-500 mb-2 ${isGOTY ? "text-xl text-yellow-500" : "text-sm"}`}>
                                    {category.name}
                                </h2>
                                <h3 className={`font-black text-white ${isGOTY ? "text-5xl md:text-6xl" : "text-3xl md:text-4xl"}`}>
                                    {winner.name}
                                </h3>
                                {winner.developer && (
                                    <p className="text-gray-400 mt-2 text-lg">{winner.developer}</p>
                                )}
                            </div>

                            <div className="relative max-w-4xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 group-hover:border-yellow-500/50 transition-colors duration-500">
                                {/* Imagen de fondo con blur */}
                                {winner.image && (
                                    <>
                                        <div
                                            className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110"
                                            style={{ backgroundImage: `url(${winner.image})` }}
                                        />
                                        <div className="absolute inset-0 bg-black/40" />

                                        {/* Imagen principal */}
                                        <div className="relative h-full w-full flex items-center justify-center p-8">
                                            <img
                                                src={winner.image}
                                                alt={winner.name}
                                                className="max-h-full max-w-full object-contain drop-shadow-2xl rounded-lg transform group-hover:scale-105 transition-transform duration-700"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Badge de Ganador */}
                                <div className="absolute top-4 right-4 bg-yellow-500 text-black font-black px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transform rotate-2 group-hover:rotate-0 transition-transform">
                                    <Trophy size={20} /> WINNER
                                </div>
                            </div>
                        </div>
                    );
                })}

                {Object.keys(winners).length === 0 && (
                    <div className="text-center py-20">
                        <Trophy size={64} className="mx-auto text-gray-700 mb-6" />
                        <h3 className="text-2xl font-bold text-gray-400">Aún no se han anunciado ganadores</h3>
                        <p className="text-gray-500 mt-2">Vuelve pronto para ver los resultados oficiales.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
