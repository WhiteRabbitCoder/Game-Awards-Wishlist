"use client";

import { Trophy, Medal, User, Crown } from "lucide-react";

interface LeaderboardUser {
    uid: string;
    username: string;
    photoURL?: string;
    score: number;
    isOwner?: boolean;
}

interface Props {
    users: LeaderboardUser[];
    currentUserId?: string;
}

export default function Leaderboard({ users, currentUserId }: Props) {
    // Ordenar por puntaje descendente
    const sortedUsers = [...users].sort((a, b) => b.score - a.score);

    if (sortedUsers.length === 0) {
        return (
            <div className="text-center p-8 text-gray-500 bg-gray-800/50 rounded-xl border border-gray-700">
                <Trophy className="mx-auto mb-2 opacity-20" size={48} />
                <p>Aún no hay puntuaciones registradas.</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 bg-gray-800/50 flex justify-between items-center">
                <h2 className="font-bold text-lg flex items-center gap-2 text-white">
                    <Trophy className="text-yellow-500" size={20} />
                    Tabla de Posiciones
                </h2>
                <span className="text-xs text-gray-500 uppercase font-bold">Puntos</span>
            </div>

            <div className="divide-y divide-gray-700/50">
                {sortedUsers.map((user, index) => {
                    const rank = index + 1;
                    const isMe = user.uid === currentUserId;

                    // Estilos especiales para el Top 3
                    let rankIcon = <span className="font-mono font-bold text-gray-500 w-6 text-center">{rank}</span>;
                    let rowClass = "hover:bg-gray-700/30 transition-colors";
                    let textClass = "text-gray-300";

                    if (rank === 1) {
                        rankIcon = <Trophy size={24} className="text-yellow-400 drop-shadow-md" />;
                        rowClass = "bg-gradient-to-r from-yellow-500/10 to-transparent border-l-4 border-yellow-500";
                        textClass = "text-yellow-100 font-bold";
                    } else if (rank === 2) {
                        rankIcon = <Medal size={24} className="text-gray-300 drop-shadow-md" />;
                        rowClass = "bg-gradient-to-r from-gray-400/10 to-transparent border-l-4 border-gray-400";
                        textClass = "text-gray-100 font-bold";
                    } else if (rank === 3) {
                        rankIcon = <Medal size={24} className="text-amber-600 drop-shadow-md" />;
                        rowClass = "bg-gradient-to-r from-amber-700/10 to-transparent border-l-4 border-amber-700";
                        textClass = "text-amber-100 font-bold";
                    }

                    if (isMe) {
                        rowClass += " bg-blue-500/10"; // Resaltar al usuario actual
                    }

                    return (
                        <div key={user.uid} className={`flex items-center gap-4 p-4 ${rowClass}`}>
                            <div className="flex-shrink-0 w-8 flex justify-center">
                                {rankIcon}
                            </div>

                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border border-gray-600">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt={user.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                                            <User size={20} />
                                        </div>
                                    )}
                                </div>
                                {rank === 1 && (
                                    <Crown size={14} className="absolute -top-2 -right-1 text-yellow-500 transform rotate-12" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className={`truncate ${textClass} flex items-center gap-2`}>
                                    {user.username}
                                    {isMe && <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full ml-1">TÚ</span>}
                                </p>
                            </div>

                            <div className="text-right">
                                <span className={`text-xl font-bold ${rank <= 3 ? "text-white" : "text-gray-400"}`}>
                                    {user.score}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}