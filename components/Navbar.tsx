"use client";

import { useAuth } from "@/context/AuthContext";
import { Settings, LogOut, User } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
    const { user, logout } = useAuth();

    // Si no hay usuario cargado aún, mostramos un header básico o vacío
    if (!user) return null;

    return (
        <header className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
            <div>
                <Link href="/">
                    <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 cursor-pointer">
                        Wishlist Awards
                    </h1>
                </Link>
                <p className="text-xs md:text-sm text-gray-400">
                    Hola, <span className="text-white font-medium">{user.displayName || "Gamer"}</span>
                </p>
            </div>

            <div className="flex items-center gap-3">
                {/* Botón Configuración */}
                <Link 
                    href="/settings" 
                    className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors border border-gray-700 text-gray-300 hover:text-white group" 
                    title="Configuración"
                >
                    <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                </Link>

                {/* Botón Cerrar Sesión */}
                <button
                    onClick={logout}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-full transition-colors border border-red-500/20"
                    title="Cerrar Sesión"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    );
}