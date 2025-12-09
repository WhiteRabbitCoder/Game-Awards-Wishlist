import { Category, Nominee } from "@/types";

interface Props {
    category: Category;
    userVotes: { firstPlace?: string; secondPlace?: string; thirdPlace?: string } | undefined;
    onNomineeClick: (category: Category, nominee: Nominee) => void;
}

export default function CategorySection({ category, userVotes, onNomineeClick }: Props) {
    
    // Helper para saber si un nominado tiene ranking (1, 2, 3)
    const getNomineeRank = (nomineeId: string) => {
        if (!userVotes) return null;
        if (userVotes.firstPlace === nomineeId) return 1;
        if (userVotes.secondPlace === nomineeId) return 2;
        if (userVotes.thirdPlace === nomineeId) return 3;
        return null;
    };

    // Verificación robusta: Solo mostrar "Completado" si realmente hay algún voto registrado
    const hasVotes = userVotes && (userVotes.firstPlace || userVotes.secondPlace || userVotes.thirdPlace);

    return (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-yellow-500 flex items-center gap-2">
                {category.name}
                {hasVotes ? (
                    <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded-full border border-green-700 flex items-center gap-1">
                        ✓ Completado
                    </span>
                ) : null}
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {category.nominees.map((nominee) => (
                    <NomineeCard
                        key={nominee.id}
                        nominee={nominee}
                        rank={getNomineeRank(nominee.id)}
                        onClick={() => onNomineeClick(category, nominee)}
                    />
                ))}
            </div>
        </div>
    );
}

// Subcomponente para la tarjeta individual
function NomineeCard({ nominee, rank, onClick }: { nominee: Nominee, rank: number | null, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`relative group text-left transition-all duration-300 w-full ${
                rank ? "scale-105 ring-2 ring-yellow-500 rounded-lg z-10" : "hover:scale-105 opacity-80 hover:opacity-100"
            }`}
        >
            <div className="aspect-[3/4] rounded-lg overflow-hidden mb-2 relative shadow-lg bg-gray-900">
                {nominee.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                        src={nominee.image} 
                        alt={nominee.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                    />
                )}
                
                {/* Badge de Ranking */}
                {rank && (
                    <div className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-black shadow-lg ${
                        rank === 1 ? "bg-yellow-400" :
                        rank === 2 ? "bg-gray-300" :
                        "bg-amber-600 text-white"
                    }`}>
                        {rank}
                    </div>
                )}
                
                {/* Overlay al hacer hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white text-black text-xs font-bold px-3 py-1 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform">
                        Votar
                    </span>
                </div>
            </div>
            
            <h3 className={`font-bold text-sm leading-tight ${rank ? "text-yellow-400" : "text-gray-300"}`}>
                {nominee.name}
            </h3>
            <p className="text-xs text-gray-500 truncate">{nominee.developer}</p>
        </button>
    );
}