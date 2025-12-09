"use client";

import { Nominee } from "@/types";
import { X, Trophy } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    nominee: Nominee;
    categoryId: string;
    onVote: (position: 0 | 1 | 2 | 3) => void; // Actualizado para incluir 0
    currentPosition: number | null;
}

export default function VoteModal({ isOpen, onClose, nominee, categoryId, onVote, currentPosition }: Props) {
    if (!isOpen) return null;

    const isGOTY = categoryId === "game-of-the-year";

    // Definir puntos según la categoría
    const getPoints = (position: 1 | 2 | 3) => {
        if (isGOTY) {
            if (position === 1) return "5 Puntos";
            if (position === 2) return "4 Puntos";
            if (position === 3) return "3 Puntos";
        }
        // Categorías normales
        if (position === 1) return "3 Puntos";
        if (position === 2) return "2 Puntos";
        if (position === 3) return "1 Punto";
        return "";
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gray-800 w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl overflow-hidden transform transition-all scale-100">

                {/* Header con Imagen */}
                <div className="relative h-48 bg-gray-900">
                    {nominee.image ? (
                        <img src={nominee.image} alt={nominee.name} className="w-full h-full object-cover opacity-60" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
                    )}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>

                    {/* Etiqueta especial para GOTY */}
                    {isGOTY && (
                        <div className="absolute top-4 left-4 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                            PUNTUACIÓN ESPECIAL
                        </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-900 to-transparent">
                        <h3 className="text-2xl font-bold text-white leading-tight">{nominee.name}</h3>
                        <p className="text-gray-300 text-sm">{nominee.info}</p>
                    </div>
                </div>

                {/* Opciones de Voto */}
                <div className="p-6 space-y-3">
                    <p className="text-center text-gray-400 mb-4 text-sm uppercase tracking-wider font-semibold">
                        Selecciona tu predicción
                    </p>

                    {/* Opción 1 */}
                    <button
                        onClick={() => onVote(1)}
                        className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${currentPosition === 1
                                ? "bg-yellow-500/20 border-yellow-500 text-yellow-400"
                                : "bg-gray-700/50 border-gray-600 hover:bg-gray-700 hover:border-gray-500 text-gray-300"
                            }`}
                    >
                        <div className={`p-3 rounded-full ${currentPosition === 1 ? "bg-yellow-500 text-black" : "bg-gray-800 text-gray-500"}`}>
                            <Trophy size={24} />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-lg">1º Lugar</div>
                            <div className="text-xs opacity-70">Ganador ({getPoints(1)})</div>
                        </div>
                    </button>

                    {/* Opción 2 */}
                    <button
                        onClick={() => onVote(2)}
                        className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${currentPosition === 2
                                ? "bg-gray-300/20 border-gray-300 text-gray-200"
                                : "bg-gray-700/50 border-gray-600 hover:bg-gray-700 hover:border-gray-500 text-gray-300"
                            }`}
                    >
                        <div className={`p-3 rounded-full ${currentPosition === 2 ? "bg-gray-300 text-black" : "bg-gray-800 text-gray-500"}`}>
                            <Trophy size={24} />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-lg">2º Lugar</div>
                            <div className="text-xs opacity-70">Runner-up ({getPoints(2)})</div>
                        </div>
                    </button>

                    {/* Opción 3 */}
                    <button
                        onClick={() => onVote(3)}
                        className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${currentPosition === 3
                                ? "bg-orange-700/20 border-orange-600 text-orange-400"
                                : "bg-gray-700/50 border-gray-600 hover:bg-gray-700 hover:border-gray-500 text-gray-300"
                            }`}
                    >
                        <div className={`p-3 rounded-full ${currentPosition === 3 ? "bg-orange-600 text-black" : "bg-gray-800 text-gray-500"}`}>
                            <Trophy size={24} />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-lg">3º Lugar</div>
                            <div className="text-xs opacity-70">Mención ({getPoints(3)})</div>
                        </div>
                    </button>

                    {currentPosition && (
                        <button
                            onClick={() => onVote(0)}
                            className="w-full text-center text-red-400 text-sm hover:underline mt-4 py-2"
                        >
                            Quitar voto
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}