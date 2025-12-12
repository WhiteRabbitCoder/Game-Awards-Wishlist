"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Sparkles, Trophy } from "lucide-react";

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

export default function HybridCountdown({ targetDate }: { targetDate: Date }) {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isMobile, setIsMobile] = useState(false);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const calculateTime = () => {
            const now = new Date().getTime();
            const distance = targetDate.getTime() - now;

            if (distance < 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                setIsExpired(true);
                return;
            }

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000),
            });
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    // Si el contador expiró, mostrar botón de transmisión
    if (isExpired) {
        return (
            <div className="relative flex flex-col items-center justify-center gap-6 py-8">
                {/* Mensaje épico */}
                <div className="text-center space-y-3">
                    <h2 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-primary via-yellow-400 to-orange-500 bg-clip-text text-transparent animate-pulse drop-shadow-lg">
                        ¡ES LA HORA!
                    </h2>
                    <p className="text-xl md:text-2xl text-gray-300 font-bold flex items-center justify-center gap-2">
                        <Sparkles className="text-yellow-400" size={24} />
                        Los premios están en vivo
                        <Sparkles className="text-yellow-400" size={24} />
                    </p>
                </div>

                {/* Botón principal para ver el stream */}
                <a
                    href="https://thegameawards.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative overflow-hidden bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 hover:from-red-500 hover:via-orange-400 hover:to-yellow-400 text-white font-black text-xl md:text-2xl px-12 py-6 rounded-2xl shadow-2xl shadow-orange-500/50 transition-all hover:scale-105 active:scale-95 border-4 border-yellow-400/30 flex items-center gap-4"
                >
                    {/* Efecto de brillo animado */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                    <Trophy size={36} className="text-white drop-shadow-lg animate-bounce" />
                    <span className="relative z-10 tracking-wide uppercase">
                        Ver Transmisión EN VIVO
                    </span>
                    <ExternalLink size={28} className="text-white drop-shadow-lg" />
                </a>

                {/* Subtexto decorativo */}
                <div className="flex items-center gap-2 text-sm text-gray-500 font-digital uppercase tracking-[0.3em]">
                    <div className="w-12 h-px bg-gradient-to-r from-transparent to-primary" />
                    <span>The Game Awards 2025</span>
                    <div className="w-12 h-px bg-gradient-to-l from-transparent to-primary" />
                </div>
            </div>
        );
    }

    // Diseño normal del countdown
    if (isMobile) {
        return (
            <div className="relative flex flex-col gap-4 items-center justify-center">
                <div className="flex gap-2 items-center">
                    <FlipCard value={timeLeft.days} label="Días" />
                    <span className="text-4xl font-bold text-retro-accent drop-shadow-[0_4px_8px_rgba(215,119,6,0.5)]">:</span>
                    <FlipCard value={timeLeft.hours} label="Horas" />
                </div>

                <div className="flex gap-2 items-center">
                    <DigitalCard value={timeLeft.minutes} label="Min" />
                    <span className="text-4xl font-bold text-cyber-neon animate-pulse drop-shadow-[0_0_15px_rgba(255,204,0,0.8)]">:</span>
                    <DigitalCard value={timeLeft.seconds} label="Seg" />
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex items-center justify-center gap-2 md:gap-6">
            <div className="flex gap-3 md:gap-4 items-center">
                <FlipCard value={timeLeft.days} label="Días" />
                <span className="text-5xl md:text-7xl font-bold text-retro-accent drop-shadow-[0_4px_8px_rgba(215,119,6,0.5)]">:</span>
                <FlipCard value={timeLeft.hours} label="Horas" />
            </div>

            <div className="w-1 md:w-2 h-32 md:h-40 bg-gradient-to-b from-retro-accent via-gray-400 to-cyber-neon transform skew-x-12 shadow-lg" />

            <div className="flex gap-3 md:gap-4 items-center">
                <DigitalCard value={timeLeft.minutes} label="Min" />
                <span className="text-5xl md:text-7xl font-bold text-cyber-neon animate-pulse drop-shadow-[0_0_15px_rgba(255,204,0,0.8)]">:</span>
                <DigitalCard value={timeLeft.seconds} label="Seg" />
            </div>
        </div>
    );
}

function FlipCard({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <div className="relative w-20 h-24 md:w-28 md:h-36 bg-retro-paper rounded-lg overflow-hidden border-4 border-retro-accent shadow-[0_8px_0_rgba(0,0,0,0.3),0_12px_20px_rgba(215,119,6,0.4)]">
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl md:text-7xl font-black font-retro text-retro-ink drop-shadow-sm">
                        {String(value).padStart(2, '0')}
                    </span>
                </div>
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-500/20" />
            </div>
            <span className="mt-3 text-xs md:text-sm font-bold font-retro text-retro-accent uppercase tracking-widest">
                {label}
            </span>
        </div>
    );
}

function DigitalCard({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <div className="relative w-20 h-24 md:w-28 md:h-36 bg-cyber-black rounded-lg overflow-hidden border-4 border-cyber-neon shadow-[0_0_20px_rgba(255,204,0,0.5),0_0_40px_rgba(255,204,0,0.2)]">
                <div className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,204,0,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,204,0,0.2) 1px, transparent 1px)',
                        backgroundSize: '8px 8px'
                    }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl md:text-7xl font-black font-digital text-cyber-neon transition-all duration-75"
                        style={{
                            textShadow: '0 0 15px rgba(255, 204, 0, 1), 0 0 30px rgba(255, 204, 0, 0.6), 0 0 45px rgba(255, 204, 0, 0.3)'
                        }}>
                        {String(value).padStart(2, '0')}
                    </span>
                </div>
            </div>
            <span className="mt-3 text-xs md:text-sm font-bold font-digital text-cyber-neon uppercase tracking-[0.3em]">
                {label}
            </span>
        </div>
    );
}