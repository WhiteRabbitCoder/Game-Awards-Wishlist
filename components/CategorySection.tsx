import { Category, Nominee } from "@/types";
import { HelpCircle, Info } from "lucide-react";
import Link from "next/link";

interface Props {
    category: Category;
    userVotes: { firstPlace?: string; secondPlace?: string; thirdPlace?: string } | undefined;
    onNomineeClick: (category: Category, nominee: Nominee) => void;
}

export default function CategorySection({ category, userVotes, onNomineeClick }: Props) {

    const getNomineeRank = (nomineeId: string) => {
        if (!userVotes) return null;
        if (userVotes.firstPlace === nomineeId) return 1;
        if (userVotes.secondPlace === nomineeId) return 2;
        if (userVotes.thirdPlace === nomineeId) return 3;
        return null;
    };

    const isGOTY = category.id === "game-of-the-year";

    return (
        <div className={`relative bg-gradient-to-br from-surface to-deep rounded-2xl p-6 md:p-8 border transition-all duration-300 ${isGOTY
            ? "border-yellow-500/50 shadow-2xl shadow-yellow-500/20"
            : userVotes
                ? "border-green-500/30 shadow-lg shadow-green-500/10"
                : "border-white/10"
            }`}>

            {/* HEADER DE CATEGORÍA */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <h2 className={`text-xl md:text-2xl font-black tracking-tight ${isGOTY ? "text-yellow-400" : "text-white"
                        }`}>
                        {category.name}
                    </h2>
                    {isGOTY && (
                        /* CAMBIO 1: Eliminado animate-pulse y la estrella */
                        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
                            PRINCIPAL
                        </div>
                    )}
                </div>

                {userVotes && (
                    <div className="flex items-center gap-2 bg-green-900/30 text-green-400 px-4 py-2 rounded-full border border-green-500/30 shadow-lg shadow-green-500/10">
                        {/* Puedes quitar animate-pulse aquí también si lo deseas */}
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider">Completado</span>
                    </div>
                )}
            </div>

            {/* GRID DE NOMINADOS */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
                {category.nominees.map((nominee) => (
                    <NomineeCard
                        key={nominee.id}
                        nominee={nominee}
                        rank={getNomineeRank(nominee.id)}
                        onClick={() => onNomineeClick(category, nominee)}
                        isGOTY={isGOTY}
                    />
                ))}
            </div>
        </div>
    );
}

// CARD INDIVIDUAL DE NOMINADO
function NomineeCard({ nominee, rank, onClick, isGOTY }: {
    nominee: Nominee;
    rank: number | null;
    onClick: () => void;
    isGOTY?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={`relative group text-left transition-all duration-500 w-full ${rank
                ? "scale-105 z-20"
                : "opacity-75 hover:opacity-100 hover:scale-105"
                }`}
        >
            {/* CONTENEDOR DE IMAGEN */}
            <div className={`aspect-[3/4] rounded-xl overflow-hidden mb-3 relative shadow-2xl transition-all duration-500 ${rank
                ? rank === 1
                    ? "ring-4 ring-yellow-400 shadow-yellow-400/50"
                    : rank === 2
                        ? "ring-4 ring-gray-300 shadow-gray-300/50"
                        : "ring-4 ring-orange-600 shadow-orange-600/50"
                : "ring-2 ring-white/10 hover:ring-white/30 group-hover:shadow-white/20"
                }`}>

                {nominee.image ? (
                    <img
                        src={nominee.image}
                        alt={nominee.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <HelpCircle size={48} className="text-gray-600" strokeWidth={1.5} />
                    </div>
                )}

                {/* BOTÓN DE INFO */}
                <Link
                    href={`/game/${encodeURIComponent(nominee.name)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-2 left-2 p-2 bg-black/40 hover:bg-black/80 backdrop-blur-sm rounded-full text-white/70 hover:text-white border border-white/10 transition-all z-30 hover:scale-110"
                    title="Ver información del juego"
                >
                    <Info size={16} />
                </Link>

                {/* BADGE DE RANKING (ORO/PLATA/BRONCE) */}
                {rank && (
                    <div className={`absolute top-3 right-3 w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shadow-2xl border-4 transition-transform duration-300 group-hover:scale-110 ${rank === 1
                        /* CAMBIO 2: Eliminado animate-pulse aquí */
                        ? "bg-gradient-to-br from-yellow-300 to-yellow-600 text-black border-yellow-200 shadow-yellow-400/80"
                        : rank === 2
                            ? "bg-gradient-to-br from-gray-200 to-gray-400 text-black border-gray-100 shadow-gray-300/80"
                            : "bg-gradient-to-br from-orange-500 to-orange-800 text-white border-orange-400 shadow-orange-500/80"
                        }`}>
                        {rank}
                    </div>
                )}

                {/* OVERLAY AL HOVER */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end pb-4 ${rank ? "hidden" : ""
                    }`}>
                    <div className="bg-white text-black text-xs font-black px-4 py-2 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-xl">
                        ✨ VOTAR
                    </div>
                </div>

                {isGOTY && (
                    <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/0 via-yellow-500/5 to-yellow-500/0 pointer-events-none" />
                )}
            </div>

            {/* INFO DEL NOMINADO */}
            <div className="px-1">
                <h3 className={`font-bold text-sm md:text-base leading-tight line-clamp-2 transition-colors ${rank ? "text-yellow-400" : "text-gray-200 group-hover:text-white"
                    }`}>
                    {nominee.name}
                </h3>
                <p className="text-xs text-gray-500 truncate mt-0.5">{nominee.developer}</p>
            </div>

            {/* INDICADOR DE SELECCIÓN ACTIVA */}
            {rank && (
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-green-500 rounded-full border-4 border-deep flex items-center justify-center shadow-lg shadow-green-500/50">
                    <span className="text-xs text-black font-bold">✓</span>
                </div>
            )}
        </button>
    );
}