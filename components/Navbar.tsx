"use client";

import { useAuth } from "@/context/AuthContext";
import { Settings, LogOut, Trophy, Home, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path ? "text-cyber-neon drop-shadow-[0_0_5px_rgba(255,204,0,0.5)]" : "text-gray-400 hover:text-white";

    return (
        <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-deep/90 backdrop-blur-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">

                {/* IZQUIERDA: LOGO SALVAJE */}
                <Link href="/" className="flex items-center gap-2 group relative">
                    {/* Imagen sin bordes, flotando libre */}
                    <div className="relative w-14 h-14 md:w-16 md:h-16 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                        <img
                            src="https://i.postimg.cc/G2gBjfDn/Principal-Logo-Whislist-Awards.png"
                            alt="Logo"
                            className="w-full h-full object-contain drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]"
                        />
                    </div>

                    {/* TEXTO HÍBRIDO */}
                    <div className="hidden md:flex flex-col justify-center">
                        {/* Parte Grunge: Color óxido, fuente de pintura, sombra sucia */}
                        <span className="font-brush text-2xl text-retro-accent leading-none -rotate-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.8)] group-hover:text-white transition-colors">
                            WISHLIST
                        </span>
                        {/* Parte Digital: Pequeña, técnica, neón */}
                        <span className="text-[10px] font-digital text-gray-500 tracking-[0.4em] ml-1 group-hover:text-cyber-neon transition-colors">
                            AWARDS_2025
                        </span>
                    </div>
                </Link>

                {/* CENTRO: NAVEGACIÓN (Píldora Flotante) */}
                {user && (
                    <nav className="hidden md:flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full border border-white/5 backdrop-blur-md shadow-lg">
                        <Link href="/" className={`px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all ${pathname === "/" ? "bg-white/10 text-white shadow-inner" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                            <Home size={14} /> Inicio
                        </Link>
                        <Link href="/vote" className={`px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all ${pathname === "/vote" ? "bg-cyber-neon/10 text-cyber-neon shadow-[0_0_10px_rgba(255,204,0,0.2)]" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                            <Trophy size={14} /> Votar
                        </Link>
                        <Link href="/#grupos" className={`px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all ${pathname.includes("/group") ? "bg-primary/20 text-primary-light" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                            <Users size={14} /> Grupos
                        </Link>
                    </nav>
                )}

                {/* DERECHA: PERFIL */}
                {user ? (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 pl-3 pr-1 py-1 bg-black/40 border border-white/5 rounded-l-full rounded-r-full hover:border-white/20 transition-colors">
                            <div className="text-right hidden sm:block">
                                <p className="text-[9px] text-retro-accent uppercase font-digital tracking-widest leading-none mb-1">Player_01</p>
                                <p className="text-sm font-bold text-white leading-none truncate max-w-[100px]">
                                    {user.displayName || "Gamer"}
                                </p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-gray-800 overflow-hidden border-2 border-gray-700 group-hover:border-retro-accent transition-colors">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 text-xs font-bold text-gray-400">
                                        {user.displayName?.[0] || "G"}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center border-l border-white/10 pl-4 gap-2">
                            <Link href="/settings" className="text-gray-500 hover:text-white transition-colors"><Settings size={18} /></Link>
                            <button onClick={logout} className="text-gray-500 hover:text-red-500 transition-colors"><LogOut size={18} /></button>
                        </div>
                    </div>
                ) : (
                    <Link href="/login" className="font-digital text-cyber-neon hover:text-white transition-colors text-sm tracking-widest border border-cyber-neon/50 px-4 py-2 rounded hover:bg-cyber-neon/10">
                        [ LOGIN ]
                    </Link>
                )}
            </div>

            {/* Mobile Nav */}
            {user && (
                <div className="md:hidden fixed bottom-0 left-0 w-full bg-deep/95 backdrop-blur-xl border-t border-white/10 p-4 flex justify-around z-50 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
                    <Link href="/" className={isActive("/")}><Home size={24} /></Link>
                    <Link href="/vote" className={isActive("/vote")}><Trophy size={24} /></Link>
                    <Link href="/#grupos" className={isActive("/group")}><Users size={24} /></Link>
                </div>
            )}
        </header>
    );
}