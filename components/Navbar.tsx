"use client";

import { useAuth } from "@/context/AuthContext";
import { Settings, LogOut, Trophy, Home, Users, User, Search, Bell } from "lucide-react";
import UserSearchModal from "./UserSearchModal";
import NotificationsModal from "./NotificationsModal";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [username, setUsername] = useState<string | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);

    // Cargar username y escuchar notificaciones
    useEffect(() => {
        const fetchUsername = async () => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        setUsername(userDoc.data().username);
                    }
                } catch (error) {
                    console.error("Error fetching username:", error);
                }
            }
        };
        fetchUsername();

        if (user) {
            // Escuchar solicitudes pendientes
            const q = query(collection(db, "users", user.uid, "friend_requests"));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                setNotificationCount(snapshot.size);
            });
            return () => unsubscribe();
        }
    }, [user]);

    const isActive = (path: string) => pathname === path ? "text-primary drop-shadow-[0_0_8px_rgba(234,179,8,0.6)] scale-110" : "text-gray-500 hover:text-white";

    // Fecha de fin del evento
    const eventEndDate = new Date("2025-12-11T23:00:00-05:00");
    const isEventOver = new Date() >= eventEndDate;

    // Generar la URL del perfil
    const profileUrl = username ? `/profile/${username}` : "/settings";

    return (
        <>
            {/* --- BARRA SUPERIOR (TOP NAVBAR) --- */}
            <header className="fixed top-0 w-full z-40 border-b border-white/5 bg-deep/90 backdrop-blur-md transition-all duration-300 h-16 md:h-20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">

                    {/* IZQUIERDA: LOGO GOLD & GRUNGE FINAL */}
                    <Link href="/" className="flex items-center gap-2 md:gap-3 group relative z-50 shrink-0">
                        <div className="relative w-9 h-9 md:w-14 md:h-14 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 flex-shrink-0">
                            <img
                                src="https://i.postimg.cc/G2gBjfDn/Principal-Logo-Whislist-Awards.png"
                                alt="Logo"
                                className="w-full h-full object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]"
                            />
                        </div>

                        <div className="flex flex-col justify-center">
                            <span
                                className="text-xl md:text-3xl leading-none -rotate-2 tracking-tighter bg-gradient-to-r from-orange-700 via-amber-500 to-yellow-400 bg-clip-text text-transparent select-none"
                                style={{
                                    fontFamily: "'Rubik Wet Paint', cursive",
                                    filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,1))'
                                }}
                            >
                                WISHLIST
                            </span>

                            <span className="hidden sm:block text-[10px] font-digital text-gray-400 tracking-[0.3em] ml-1 group-hover:text-primary transition-colors border-t border-gray-700/50 mt-0.5 pt-0.5 w-full text-center">
                                GAME AWARDS_2025
                            </span>
                        </div>
                    </Link>

                    {/* CENTRO: NAVEGACIÓN DESKTOP */}
                    {user && (
                        <nav className="hidden md:flex items-center gap-1 bg-black/60 px-2 py-1.5 rounded-full border border-white/10 shadow-xl backdrop-blur-xl">
                            <Link href="/" className={`px-5 py-2 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${pathname === "/" ? "bg-white/10 text-white shadow-inner border border-white/5" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                                <Home size={14} /> Inicio
                            </Link>
                            <Link href={isEventOver ? "/winners" : "/vote"} className={`px-5 py-2 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${(isEventOver ? pathname === "/winners" : pathname === "/vote") ? "bg-primary/20 text-primary border border-primary/20 shadow-[0_0_15px_rgba(234,179,8,0.15)]" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                                <Trophy size={14} /> {isEventOver ? "Ganadores" : "Votar"}
                            </Link>
                            <Link href="/#grupos" className={`px-5 py-2 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${pathname.includes("/group") ? "bg-blue-500/20 text-blue-300 border border-blue-500/20" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                                <Users size={14} /> Grupos
                            </Link>
                        </nav>
                    )}

                    {/* DERECHA: PERFIL */}
                    {user ? (
                        <div className="flex items-center gap-3 md:gap-5">
                            {/* Link al perfil del usuario */}
                            <Link
                                href={profileUrl}
                                className="flex items-center gap-3 pl-4 pr-1.5 py-1.5 bg-gradient-to-r from-black/60 to-black/30 border border-white/5 rounded-full hover:border-white/20 transition-all group/profile cursor-pointer"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-[8px] text-retro-accent uppercase font-digital tracking-[0.2em] leading-none mb-0.5 opacity-70 group-hover/profile:opacity-100 transition-opacity">
                                        VER_PERFIL
                                    </p>
                                    <p className="text-sm font-bold text-gray-200 leading-none truncate max-w-[100px] group-hover/profile:text-white transition-colors font-sans">
                                        {username || user.displayName || "Gamer"}
                                    </p>
                                </div>
                                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-900 overflow-hidden border-2 border-gray-700 group-hover/profile:border-retro-accent transition-colors shadow-lg">
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-xs font-bold text-gray-500 font-mono">
                                            {(username || user.displayName)?.[0]?.toUpperCase() || "P1"}
                                        </div>
                                    )}
                                </div>
                            </Link>

                            <div className="flex items-center border-l border-white/10 pl-3 md:pl-5 gap-3 md:gap-4">
                                <button
                                    onClick={() => setIsNotificationsOpen(true)}
                                    className="relative text-gray-500 hover:text-white transition-colors transform hover:scale-110 duration-200"
                                >
                                    <Bell size={20} />
                                    {notificationCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-in zoom-in">
                                            {notificationCount}
                                        </span>
                                    )}
                                </button>
                                <button onClick={() => setIsSearchOpen(true)} className="text-gray-500 hover:text-white transition-colors transform hover:scale-110 duration-200" title="Buscar Usuarios">
                                    <Search size={20} />
                                </button>
                                <Link href="/settings" className="text-gray-500 hover:text-white transition-colors transform hover:rotate-45 duration-300">
                                    <Settings size={20} />
                                </Link>
                                <button onClick={logout} className="text-gray-500 hover:text-red-500 transition-colors transform hover:scale-110 duration-200">
                                    <LogOut size={20} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <Link href="/login" className="font-digital text-primary hover:text-black hover:bg-primary transition-all duration-300 text-xs md:text-sm tracking-[0.2em] border border-primary px-4 py-2 rounded-lg shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                            [ INICIAR_SESIÓN ]
                        </Link>
                    )}
                </div>
            </header>

            {/* --- BARRA INFERIOR (MOBILE NAVBAR) - FUERA DEL HEADER --- */}
            {user && (
                <div className="md:hidden fixed bottom-0 left-0 w-full bg-deep/95 backdrop-blur-xl border-t border-white/10 px-6 py-3 flex justify-between items-end z-50 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
                    <Link href="/" className={`flex flex-col items-center gap-1.5 pb-2 transition-all duration-300 ${isActive("/")}`}>
                        <Home size={22} strokeWidth={pathname === "/" ? 2.5 : 2} />
                        <span className="text-[9px] font-bold uppercase tracking-widest font-digital">Inicio</span>
                    </Link>

                    <Link href={isEventOver ? "/winners" : "/vote"} className="relative -top-5 group">
                        <div className={`p-4 rounded-2xl border-b-4 transition-all duration-300 transform ${(isEventOver ? pathname === "/winners" : pathname === "/vote") ? "bg-primary border-yellow-700 translate-y-[-5px] shadow-[0_10px_20px_rgba(234,179,8,0.4)]" : "bg-gray-800 border-gray-950 text-gray-400 group-hover:-translate-y-2"}`}>
                            <Trophy size={28} className={(isEventOver ? pathname === "/winners" : pathname === "/vote") ? "text-black fill-black animate-pulse-slow" : "text-gray-400"} />
                        </div>
                        <span className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-widest font-digital whitespace-nowrap ${(isEventOver ? pathname === "/winners" : pathname === "/vote") ? "text-primary" : "text-gray-500"}`}>
                            {isEventOver ? "Ganadores" : "Votar"}
                        </span>
                    </Link>

                    <Link href="/#grupos" className={`flex flex-col items-center gap-1.5 pb-2 transition-all duration-300 ${isActive("/group")}`}>
                        <Users size={22} strokeWidth={pathname.includes("/group") ? 2.5 : 2} />
                        <span className="text-[9px] font-bold uppercase tracking-widest font-digital">Ligas</span>
                    </Link>
                </div>
            )}

            <UserSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
            {isNotificationsOpen && <NotificationsModal onClose={() => setIsNotificationsOpen(false)} />}
        </>
    );
}