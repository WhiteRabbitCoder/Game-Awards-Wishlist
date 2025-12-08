"use client";

import { Category, Nominee } from "@/types";
import { Trophy, ImageOff } from "lucide-react";
import { useState } from "react";
import VoteModal from "./VoteModal";

interface Props {
    category: Category;
    votes: Record<string, number>; // Mapa de ID -> Posición (1, 2, 3)
    onVote: (nomineeId: string, position: 1 | 2 | 3 | 0) => void;
}

// Sub-componente para manejar el estado de cada tarjeta individualmente
const NomineeCard = ({ nominee, rank, onClick }: { nominee: Nominee, rank?: number, onClick: () => void }) => {
    const [imageError, setImageError] = useState(false);

    // Colores según el ranking
    const getBorderColor = () => {
        if (rank === 1) return "border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]";
        if (rank === 2) return "border-gray-300 shadow-[0_0_15px_rgba(209,213,219,0.2)]";
        if (rank === 3) return "border-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.2)]";
        return "border-gray-700 hover:border-yellow-500/50";
    };

    const getBadge = () => {
        if (!rank) return null;
        const colors = {
            1: "bg-yellow-500 text-black",
            2: "bg-gray-300 text-black",
            3: "bg-orange-600 text-white"
        };
        return (
            <div className={`absolute top-2 right-2 z-10 ${colors[rank as 1 | 2 | 3]} w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg animate-in zoom-in`}>
                {rank}º
            </div>
        );
    };

    return (
        <div
            onClick={onClick}
            className={`group relative bg-gray-900 rounded-lg overflow-hidden border-2 transition-all cursor-pointer hover:scale-[1.02] flex flex-col ${getBorderColor()}`}
        >
            {getBadge()}

            {/* Contenedor de Imagen (Aspect Ratio 16:9) */}
            <div className="aspect-video w-full bg-gray-800 relative overflow-hidden">
                {!imageError && nominee.image ? (
                    <img
                        src={nominee.image}
                        alt={nominee.name}
                        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 ${rank ? 'grayscale-0' : 'grayscale-[0.3] group-hover:grayscale-0'}`}
                        onError={() => setImageError(true)}
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-gray-500 p-4 text-center">
                        <ImageOff size={32} className="mb-2 opacity-50" />
                        <span className="text-[10px] uppercase tracking-wider font-semibold">No Image</span>
                    </div>
                )}

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </div>

            {/* Info del juego */}
            <div className="p-4 flex-1 flex flex-col justify-center relative">
                {/* Efecto de brillo para el ganador */}
                {rank === 1 && <div className="absolute inset-0 bg-yellow-500/5 pointer-events-none" />}

                <h3 className={`font-bold text-sm leading-tight mb-1 line-clamp-2 ${rank ? 'text-white' : 'text-gray-200'}`}>
                    {nominee.name}
                </h3>
                {nominee.info && (
                    <p className="text-xs text-gray-400 truncate">
                        {nominee.info}
                    </p>
                )}
            </div>
        </div>
    );
};

export default function CategorySection({ category, votes, onVote }: Props) {
    const [selectedNominee, setSelectedNominee] = useState<Nominee | null>(null);

    return (
        <div className="mb-12 bg-gray-800/30 p-6 rounded-xl border border-gray-700/50">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-700 pb-4">
                <div className="bg-yellow-500/10 p-2 rounded-lg">
                    <Trophy className="text-yellow-500" size={24} />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white">{category.name}</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {category.nominees.map((nominee) => (
                    <NomineeCard
                        key={nominee.id}
                        nominee={nominee}
                        rank={votes[nominee.id]} // Pasamos el ranking si existe (1, 2 o 3)
                        onClick={() => setSelectedNominee(nominee)}
                    />
                ))}
            </div>

            {/* Modal de Votación */}
            {selectedNominee && (
                <VoteModal
                    isOpen={!!selectedNominee}
                    onClose={() => setSelectedNominee(null)}
                    nominee={selectedNominee}
                    currentPosition={votes[selectedNominee.id] || null}
                    onVote={(position) => {
                        onVote(selectedNominee.id, position);
                        setSelectedNominee(null); // Cerrar modal al votar
                    }}
                />
            )}
        </div>
    );
}