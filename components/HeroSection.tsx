"use client";

import HybridCountdown from "./HybridCountdown";
import Link from "next/link";
import { Trophy, Sparkles } from "lucide-react";

export default function HeroSection() {
    const eventDate = new Date("2025-12-11T19:30:00"); // Ajusta la fecha del evento

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-deep via-surface to-deep overflow-hidden">
            {/* Partículas de fondo (opcional, efecto sutil) */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-neon rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
                {/* LOGO DEL GATO */}
                <div className="mb-8 md:mb-12 animate-fade-in">
                    <img
                        src="https://i.postimg.cc/G2gBjfDn/Principal-Logo-Whislist-Awards.png"
                        alt="Wishlist Awards Logo"
                        className="w-64 md:w-96 mx-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                    />
                </div>

                {/* TÍTULO PRINCIPAL */}
                <h1 className="text-4xl md:text-7xl font-brush text-retro-ink mb-4 tracking-tight leading-none">
                    <span className="bg-gradient-to-r from-retro-accent via-cyber-neon to-primary bg-clip-text text-transparent">
                        WISHLIST GAME AWARDS
                    </span>
                </h1>

                <p className="text-lg md:text-2xl text-gray-400 mb-2 font-medium">
                    El destino de los juegos está en tus manos
                </p>

                <div className="flex items-center justify-center gap-2 text-sm md:text-base text-gray-500 mb-12">
                    <Sparkles size={16} className="text-cyber-neon animate-pulse" />
                    <span className="font-digital">2025 Edition</span>
                    <Sparkles size={16} className="text-cyber-neon animate-pulse" />
                </div>

                {/* CONTADOR HÍBRIDO */}
                <div className="mb-12">
                    <h2 className="text-sm md:text-lg text-gray-400 uppercase tracking-widest mb-6 font-digital">
                        Tiempo restante para el evento
                    </h2>
                    <HybridCountdown targetDate={eventDate} />
                </div>

                {/* CTA BUTTONS */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                        href="/vote"
                        className="group relative px-8 py-4 bg-gradient-to-r from-primary to-primary-light text-white font-bold text-lg rounded-full shadow-lg hover:shadow-gold-glow transition-all duration-300 hover:scale-105 flex items-center gap-3"
                    >
                        <Trophy size={24} className="group-hover:rotate-12 transition-transform" />
                        <span>HACER MIS PREDICCIONES</span>
                    </Link>

                    <Link
                        href="#grupos"
                        className="px-8 py-4 border-2 border-gray-700 text-gray-300 font-bold text-lg rounded-full hover:border-cyber-neon hover:text-cyber-neon transition-all duration-300 hover:shadow-neon"
                    >
                        Ver Rankings
                    </Link>
                </div>

                {/* Badge de "Beta" o "Live" (Opcional) */}
                <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-cyber-black border border-cyber-neon/30 rounded-full">
                    <div className="w-2 h-2 bg-cyber-neon rounded-full animate-pulse" />
                    <span className="text-xs font-digital text-cyber-neon uppercase tracking-wider">
                        Sistema en Vivo
                    </span>
                </div>
            </div>

            {/* Scroll Indicator (Flecha hacia abajo) */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                <div className="w-6 h-10 border-2 border-gray-600 rounded-full flex justify-center pt-2">
                    <div className="w-1 h-3 bg-gray-600 rounded-full animate-pulse" />
                </div>
            </div>
        </div>
    );
}