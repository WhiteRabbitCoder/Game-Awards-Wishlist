"use client";

import { Trophy, Medal, Award, Crown, Zap, Lock, Calendar } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface User {
    uid: string;
    username: string;
    photoURL?: string;
    score: number;
    isOwner?: boolean;
}

interface Props {
    users: User[];
    currentUserId?: string;
    groupId?: string;
}

// FECHA DEL EVENTO (Ajusta según tu evento real)
const EVENT_DATE = new Date("2025-12-11T19:30:00");

export default function Leaderboard({ users, currentUserId, groupId }: Props) {
    const [isEventLive, setIsEventLive] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string>("");

    useEffect(() => {
        const checkEventStatus = () => {
            const now = new Date().getTime();
            const distance = EVENT_DATE.getTime() - now;

            if (distance < 0) {
                setIsEventLive(true);
                return;
            }

            // Calcular tiempo restante
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) {
                setTimeLeft(`${days}d ${hours}h`);
            } else if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m`);
            } else {
                setTimeLeft(`${minutes}m`);
            }
        };

        checkEventStatus();
        const interval = setInterval(checkEventStatus, 60000); // Actualizar cada minuto

        return () => clearInterval(interval);
    }, []);

    const sortedUsers = [...users].sort((a, b) => b.score - a.score);
    const topThree = sortedUsers.slice(0, 3);
    const restOfUsers = sortedUsers.slice(3);

    if (sortedUsers.length === 0) {
        return (
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-12 text-center">
                <Trophy className="mx-auto text-gray-600 mb-4" size={48} />
                <h3 className="text-xl font-bold text-gray-400 mb-2">Aún no hay ranking</h3>
                <p className="text-gray-500 text-sm">Los puntajes aparecerán después del evento.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* PODIO VISUAL (Top 3) - CON BLUR SI NO ES LIVE */}
            <div className="relative bg-gradient-to-br from-yellow-900/20 via-gray-800 to-purple-900/20 border border-yellow-500/30 rounded-2xl p-8 overflow-hidden shadow-2xl">
                {/* Efecto de brillo de fondo */}
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-yellow-500/5 to-transparent pointer-events-none" />

                <h2 className="text-2xl font-black text-center mb-8 flex items-center justify-center gap-3 relative z-10">
                    <Crown className="text-yellow-400 " size={32} />
                    <span className="bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 bg-clip-text text-transparent">
                        HALL OF FAME
                    </span>
                </h2>

                {/* CONTENIDO DEL PODIO (Con blur condicional) */}
                <div className={`relative ${!isEventLive ? "blur-lg select-none pointer-events-none" : ""}`}>
                    <div className="flex items-end justify-center gap-4 mb-8 relative z-10">
                        {topThree[1] && <PodiumCard user={topThree[1]} position={2} currentUserId={currentUserId} groupId={groupId} />}
                        {topThree[0] && <PodiumCard user={topThree[0]} position={1} currentUserId={currentUserId} groupId={groupId} />}
                        {topThree[2] && <PodiumCard user={topThree[2]} position={3} currentUserId={currentUserId} groupId={groupId} />}
                    </div>
                </div>

                {/* OVERLAY DE BLOQUEO (Visible solo antes del evento) */}
                {!isEventLive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                        <div className="bg-gray-900 border-2 border-yellow-500/50 rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
                            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/50">
                                <Lock size={36} className="text-white" />
                            </div>

                            <h3 className="text-2xl font-black text-white mb-2">
                                Resultados Bloqueados
                            </h3>

                            <p className="text-gray-400 mb-4">
                                El ranking se revelará después del evento
                            </p>

                            <div className="bg-black/50 border border-yellow-500/30 rounded-lg p-4 flex items-center justify-center gap-3">
                                <Calendar className="text-yellow-400" size={20} />
                                <div className="text-left">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Se desbloquea en</p>
                                    <p className="text-xl font-black text-yellow-400 font-digital">{timeLeft}</p>
                                </div>
                            </div>

                            <p className="text-xs text-gray-600 mt-4">
                                {EVENT_DATE.toLocaleDateString("es-ES", {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* RESTO DEL RANKING (También con blur) */}
            {restOfUsers.length > 0 && (
                <div className="relative bg-gray-800 border border-gray-700 rounded-2xl p-6">
                    <h3 className="font-bold text-gray-300 mb-4 flex items-center gap-2">
                        <Zap className="text-blue-400" size={20} />
                        Resto del Ranking
                    </h3>

                    <div className={`space-y-2 ${!isEventLive ? "blur-md select-none pointer-events-none" : ""}`}>
                        {restOfUsers.map((user, idx) => (
                            <RankingRow
                                key={user.uid}
                                user={user}
                                position={idx + 4}
                                currentUserId={currentUserId}
                                groupId={groupId}
                            />
                        ))}
                    </div>

                    {/* Overlay simple para el resto */}
                    {!isEventLive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl">
                            <div className="text-center">
                                <Lock className="mx-auto text-gray-500 mb-2" size={32} />
                                <p className="text-sm text-gray-400 font-bold">Bloqueado</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// TARJETA DE PODIO (Top 3)
function PodiumCard({ user, position, currentUserId, groupId }: {
    user: User;
    position: number;
    currentUserId?: string;
    groupId?: string;
}) {
    const isCurrentUser = user.uid === currentUserId;

    const heights = {
        1: "h-52",
        2: "h-44",
        3: "h-36"
    };

    const colors = {
        1: { border: "border-yellow-400", bg: "from-yellow-500 to-yellow-600", text: "text-yellow-400", shadow: "shadow-yellow-500/50" },
        2: { border: "border-gray-300", bg: "from-gray-300 to-gray-400", text: "text-gray-300", shadow: "shadow-gray-300/50" },
        3: { border: "border-orange-600", bg: "from-orange-500 to-orange-700", text: "text-orange-500", shadow: "shadow-orange-500/50" }
    };

    const color = colors[position as keyof typeof colors];
    const height = heights[position as keyof typeof heights];

    const icons = {
        1: <Trophy size={24} />,
        2: <Medal size={24} />,
        3: <Award size={24} />
    };

    return (
        <Link
            href={`/profile/${user.username}${groupId ? `?groupId=${groupId}` : ''}`}
            className={`group flex flex-col items-center ${position === 1 ? "scale-110 z-10" : ""} transition-transform hover:scale-105`}
        >
            <div className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 ${color.border} shadow-2xl ${color.shadow} mb-3 ${isCurrentUser ? "ring-4 ring-blue-500 ring-offset-2 ring-offset-gray-900" : ""}`}>
                {user.photoURL ? (
                    <img src={user.photoURL} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${color.bg} flex items-center justify-center text-white text-2xl font-black`}>
                        {user.username[0].toUpperCase()}
                    </div>
                )}
                <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-br ${color.bg} border-4 border-gray-900 flex items-center justify-center text-white shadow-lg ${position === 1 ? "animate-pulse" : ""}`}>
                    {icons[position as keyof typeof icons]}
                </div>
            </div>

            <div className="text-center">
                <p className={`font-black text-sm md:text-base truncate max-w-[100px] ${color.text} ${position === 1 ? "text-lg" : ""}`}>
                    {user.username}
                </p>
                <p className="text-2xl md:text-3xl font-black text-white mt-1">
                    {user.score}
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">puntos</p>
            </div>

            <div className={`w-24 md:w-28 ${height} bg-gradient-to-b ${color.bg} rounded-t-lg mt-4 shadow-xl ${color.shadow} border-t-4 ${color.border} flex items-end justify-center pb-3`}>
                <span className="text-white font-black text-4xl opacity-30">#{position}</span>
            </div>
        </Link>
    );
}

// FILA DE RANKING (4to+)
function RankingRow({ user, position, currentUserId, groupId }: {
    user: User;
    position: number;
    currentUserId?: string;
    groupId?: string;
}) {
    const isCurrentUser = user.uid === currentUserId;

    return (
        <Link
            href={`/profile/${user.username}${groupId ? `?groupId=${groupId}` : ''}`}
            className={`flex items-center gap-4 p-3 rounded-xl transition-all hover:bg-gray-700/50 ${isCurrentUser ? "bg-blue-900/30 border border-blue-500/30 shadow-lg shadow-blue-500/10" : "bg-gray-900/30"
                }`}
        >
            <div className="w-8 text-center">
                <span className="text-xl font-black text-gray-500">#{position}</span>
            </div>

            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 border-2 border-gray-600">
                {user.photoURL ? (
                    <img src={user.photoURL} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white font-bold">
                        {user.username[0].toUpperCase()}
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">{user.username}</p>
                {isCurrentUser && (
                    <p className="text-xs text-blue-400 font-bold">Tú</p>
                )}
            </div>

            <div className="text-right">
                <p className="text-xl font-black text-white">{user.score}</p>
                <p className="text-xs text-gray-500 uppercase">pts</p>
            </div>
        </Link>
    );
}