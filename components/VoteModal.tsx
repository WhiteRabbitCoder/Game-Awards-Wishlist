"use client";

import { Nominee } from "@/types";
import { X, Trophy, Award, Medal, Trash2 } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    nominee: Nominee;
    categoryId: string;
    onVote: (position: 0 | 1 | 2 | 3) => void;
    currentPosition: number | null;
}

export default function VoteModal({ isOpen, onClose, nominee, categoryId, onVote, currentPosition }: Props) {
    if (!isOpen) return null;

    const isGOTY = categoryId === "game-of-the-year";

    const getPoints = (position: 1 | 2 | 3) => {
        if (isGOTY) {
            if (position === 1) return "5 Puntos";
            if (position === 2) return "4 Puntos";
            if (position === 3) return "3 Puntos";
        }
        if (position === 1) return "3 Puntos";
        if (position === 2) return "2 Puntos";
        if (position === 3) return "1 Punto";
        return "";
    };

    // Función para manejar clic en el backdrop
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Solo cerrar si el clic fue directamente en el backdrop, no en sus hijos
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            onClick={handleBackdropClick}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
        >
            <div className="bg-gradient-to-br from-surface to-deep w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl overflow-hidden transform transition-all scale-100 relative">

                {/* Glow effect de fondo */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyber-neon/5 pointer-events-none" />

                {/* Header con Imagen */}
                <div className="relative h-56 bg-deep overflow-hidden">
                    {nominee.image ? (
                        <>
                            <img
                                src={nominee.image}
                                alt={nominee.name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-deep via-deep/70 to-transparent" />
                        </>
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-deep" />
                    )}

                    {/* Botón cerrar */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white p-2.5 rounded-xl transition-all hover:scale-110 border border-white/10"
                    >
                        <X size={20} />
                    </button>

                    {/* Badge GOTY */}
                    {isGOTY && (
                        <div className="absolute top-4 left-4 bg-gradient-to-r from-primary to-yellow-400 text-deep text-xs font-black px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-yellow-500/30">
                            <Trophy size={14} fill="currentColor" />
                            PUNTUACIÓN ESPECIAL
                        </div>
                    )}

                    {/* Info del juego */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-3xl font-black text-white leading-tight mb-1 drop-shadow-lg">
                            {nominee.name}
                        </h3>
                        {nominee.info && (
                            <p className="text-gray-300 text-sm font-medium drop-shadow-md">
                                {nominee.info}
                            </p>
                        )}
                    </div>
                </div>

                {/* Opciones de Voto */}
                <div className="p-6 space-y-3 relative">
                    <div className="text-center mb-6">
                        <p className="text-gray-400 text-xs uppercase tracking-[0.2em] font-bold mb-1">
                            Selecciona tu predicción
                        </p>
                        <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto" />
                    </div>

                    {/* 1er Lugar */}
                    <button
                        onClick={() => onVote(1)}
                        className={`group w-full p-5 rounded-2xl border-2 flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] ${currentPosition === 1
                            ? "bg-gradient-to-r from-primary/20 to-yellow-500/20 border-primary shadow-lg shadow-primary/20"
                            : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                            }`}
                    >
                        <div className={`p-4 rounded-xl transition-all ${currentPosition === 1
                            ? "bg-gradient-to-br from-primary to-yellow-400 text-deep shadow-lg"
                            : "bg-deep border border-white/10 text-gray-500 group-hover:text-primary group-hover:border-primary/30"
                            }`}>
                            <Trophy size={28} fill={currentPosition === 1 ? "currentColor" : "none"} />
                        </div>
                        <div className="text-left flex-1">
                            <div className={`font-black text-xl mb-0.5 ${currentPosition === 1 ? "text-primary" : "text-white"}`}>
                                1º Lugar
                            </div>
                            <div className={`text-sm ${currentPosition === 1 ? "text-yellow-300" : "text-gray-500"}`}>
                                Ganador • {getPoints(1)}
                            </div>
                        </div>
                        {currentPosition === 1 && (
                            <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold">
                                Seleccionado
                            </div>
                        )}
                    </button>

                    {/* 2do Lugar */}
                    <button
                        onClick={() => onVote(2)}
                        className={`group w-full p-5 rounded-2xl border-2 flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] ${currentPosition === 2
                            ? "bg-gradient-to-r from-gray-400/20 to-gray-300/20 border-gray-300 shadow-lg shadow-gray-400/20"
                            : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                            }`}
                    >
                        <div className={`p-4 rounded-xl transition-all ${currentPosition === 2
                            ? "bg-gradient-to-br from-gray-300 to-gray-400 text-deep shadow-lg"
                            : "bg-deep border border-white/10 text-gray-500 group-hover:text-gray-300 group-hover:border-gray-400/30"
                            }`}>
                            <Award size={28} fill={currentPosition === 2 ? "currentColor" : "none"} />
                        </div>
                        <div className="text-left flex-1">
                            <div className={`font-black text-xl mb-0.5 ${currentPosition === 2 ? "text-gray-200" : "text-white"}`}>
                                2º Lugar
                            </div>
                            <div className={`text-sm ${currentPosition === 2 ? "text-gray-300" : "text-gray-500"}`}>
                                Runner-up • {getPoints(2)}
                            </div>
                        </div>
                        {currentPosition === 2 && (
                            <div className="bg-gray-400/20 text-gray-200 px-3 py-1 rounded-full text-xs font-bold">
                                Seleccionado
                            </div>
                        )}
                    </button>

                    {/* 3er Lugar */}
                    <button
                        onClick={() => onVote(3)}
                        className={`group w-full p-5 rounded-2xl border-2 flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] ${currentPosition === 3
                            ? "bg-gradient-to-r from-orange-600/20 to-orange-500/20 border-orange-500 shadow-lg shadow-orange-600/20"
                            : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                            }`}
                    >
                        <div className={`p-4 rounded-xl transition-all ${currentPosition === 3
                            ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg"
                            : "bg-deep border border-white/10 text-gray-500 group-hover:text-orange-500 group-hover:border-orange-600/30"
                            }`}>
                            <Medal size={28} fill={currentPosition === 3 ? "currentColor" : "none"} />
                        </div>
                        <div className="text-left flex-1">
                            <div className={`font-black text-xl mb-0.5 ${currentPosition === 3 ? "text-orange-400" : "text-white"}`}>
                                3º Lugar
                            </div>
                            <div className={`text-sm ${currentPosition === 3 ? "text-orange-300" : "text-gray-500"}`}>
                                Mención • {getPoints(3)}
                            </div>
                        </div>
                        {currentPosition === 3 && (
                            <div className="bg-orange-600/20 text-orange-400 px-3 py-1 rounded-full text-xs font-bold">
                                Seleccionado
                            </div>
                        )}
                    </button>

                    {/* Botón Quitar Voto */}
                    {currentPosition && (
                        <button
                            onClick={() => onVote(0)}
                            className="w-full text-center text-red-400 hover:text-red-300 text-sm font-semibold py-3 mt-4 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-all flex items-center justify-center gap-2"
                        >
                            <Trash2 size={16} />
                            Quitar voto
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}