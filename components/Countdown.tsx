"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
    targetDate: Date;
}

export default function HybridCountdown({ targetDate }: CountdownProps) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const target = new Date("2025-12-11T19:30:00-05:00").getTime();

        const calculateTime = () => {
            const now = new Date().getTime();
            const distance = target - now;

            if (distance < 0) {
                return { days: 0, hours: 0, minutes: 0, seconds: 0 };
            }

            return {
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000),
            };
        };

        setTimeLeft(calculateTime());
        const interval = setInterval(() => {
            setTimeLeft(calculateTime());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    if (!isMounted) return null;

    const f = (n: number) => String(n).padStart(2, "0");

    return (
        // CAMBIO CLAVE: 'grid grid-cols-2' en móvil, 'flex' en desktop
        <div className="grid grid-cols-2 md:flex justify-center items-center gap-4 md:gap-8 max-w-4xl mx-auto my-8 relative z-20">

            {/* --- GRUPO IZQUIERDO (Días/Horas) --- */}
            {/* Usamos fragmentos para que el grid funcione bien en móvil */}

            {/* DÍAS */}
            <div className="flex justify-center group relative">
                <div className="w-24 h-28 md:w-28 md:h-32 bg-[#2a2a2a] border-2 border-retro-accent/50 rounded-sm shadow-[4px_4px_0px_#000] flex flex-col items-center justify-center transform rotate-1 group-hover:rotate-0 transition-transform duration-300">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')] mix-blend-overlay pointer-events-none" />

                    <span className="font-brush text-5xl md:text-6xl text-retro-accent drop-shadow-md">
                        {f(timeLeft.days)}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 border-t border-gray-600 w-full text-center pt-1">
                        DÍAS
                    </span>
                </div>
            </div>

            {/* HORAS */}
            <div className="flex justify-center group relative">
                <div className="w-24 h-28 md:w-28 md:h-32 bg-[#2a2a2a] border-2 border-retro-accent/50 rounded-sm shadow-[4px_4px_0px_#000] flex flex-col items-center justify-center transform -rotate-1 group-hover:rotate-0 transition-transform duration-300">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')] mix-blend-overlay pointer-events-none" />

                    <span className="font-brush text-5xl md:text-6xl text-white drop-shadow-md">
                        {f(timeLeft.hours)}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 border-t border-gray-600 w-full text-center pt-1">
                        HRS
                    </span>
                </div>
            </div>

            {/* SEPARADOR (Solo visible en Desktop) */}
            <div className="hidden md:block w-[2px] h-20 bg-gradient-to-b from-transparent via-gray-600 to-transparent mx-2 opacity-50" />


            {/* --- GRUPO DERECHO (Minutos/Segundos) --- */}

            {/* MINUTOS */}
            <div className="flex justify-center group relative">
                {/* CAMBIO: Eliminada la sombra violeta, ahora es más neutra/cyan suave */}
                <div className="absolute -inset-0.5 bg-gradient-to-br from-cyber-neon/20 to-blue-500/20 opacity-30 group-hover:opacity-100 blur transition duration-500 rounded-lg"></div>

                <div className="relative w-24 h-28 md:w-28 md:h-32 bg-black/80 backdrop-blur-xl border border-cyber-neon/30 rounded-lg flex flex-col items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />

                    <span className="font-digital text-5xl md:text-6xl text-cyber-neon drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]">
                        {f(timeLeft.minutes)}
                    </span>
                    <span className="text-[8px] font-digital text-cyber-neon/70 uppercase tracking-[0.3em] mt-2 animate-pulse">
                        MIN
                    </span>
                </div>
            </div>

            {/* SEGUNDOS */}
            <div className="flex justify-center group relative">
                {/* CAMBIO: Eliminada la sombra violeta, ahora es blanca/cyan suave */}
                <div className="absolute -inset-0.5 bg-gradient-to-br from-white/20 to-cyan-500/20 opacity-30 group-hover:opacity-100 blur transition duration-500 rounded-lg"></div>

                <div className="relative w-24 h-28 md:w-28 md:h-32 bg-black/80 backdrop-blur-xl border border-white/30 rounded-lg flex flex-col items-center justify-center overflow-hidden">

                    <span className="font-digital text-5xl md:text-6xl text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] relative z-10 group-hover:animate-glitch">
                        {f(timeLeft.seconds)}
                    </span>

                    <div className="absolute bottom-2 w-3/4 h-[1px] bg-white/50" />
                    <span className="text-[8px] font-digital text-white/80 uppercase tracking-[0.3em] mt-2 z-10">
                        SEC
                    </span>
                </div>
            </div>

        </div>
    );
}