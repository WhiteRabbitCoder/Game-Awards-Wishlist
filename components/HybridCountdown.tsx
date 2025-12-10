"use client";

import { useEffect, useState } from "react";

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

export default function HybridCountdown({ targetDate }: { targetDate: Date }) {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Detectar si es móvil
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

    // En móvil, mostrar solo las partes principales sin el divisor
    if (isMobile) {
        return (
            <div className="relative flex flex-col gap-4 items-center justify-center">
                {/* PARTE RETRO: Días y Horas */}
                <div className="flex gap-2 items-center">
                    <FlipCard value={timeLeft.days} label="Días" />
                    <span className="text-4xl font-bold text-retro-accent drop-shadow-[0_4px_8px_rgba(215,119,6,0.5)]">:</span>
                    <FlipCard value={timeLeft.hours} label="Horas" />
                </div>

                {/* PARTE DIGITAL: Minutos y Segundos */}
                <div className="flex gap-2 items-center">
                    <DigitalCard value={timeLeft.minutes} label="Min" />
                    <span className="text-4xl font-bold text-cyber-neon animate-pulse drop-shadow-[0_0_15px_rgba(255,204,0,0.8)]">:</span>
                    <DigitalCard value={timeLeft.seconds} label="Seg" />
                </div>
            </div>
        );
    }

    // Desktop: diseño original sin sombra violeta
    return (
        <div className="relative flex items-center justify-center gap-2 md:gap-6">
            {/* PARTE RETRO: Días y Horas */}
            <div className="flex gap-3 md:gap-4 items-center">
                <FlipCard value={timeLeft.days} label="Días" />
                <span className="text-5xl md:text-7xl font-bold text-retro-accent drop-shadow-[0_4px_8px_rgba(215,119,6,0.5)]">:</span>
                <FlipCard value={timeLeft.hours} label="Horas" />
            </div>

            {/* DIVISOR CENTRAL */}
            <div className="w-1 md:w-2 h-32 md:h-40 bg-gradient-to-b from-retro-accent via-gray-400 to-cyber-neon transform skew-x-12 shadow-lg" />

            {/* PARTE DIGITAL: Minutos y Segundos */}
            <div className="flex gap-3 md:gap-4 items-center">
                <DigitalCard value={timeLeft.minutes} label="Min" />
                <span className="text-5xl md:text-7xl font-bold text-cyber-neon animate-pulse drop-shadow-[0_0_15px_rgba(255,204,0,0.8)]">:</span>
                <DigitalCard value={timeLeft.seconds} label="Seg" />
            </div>
        </div>
    );
}

// Tarjeta Retro Flip (Estilo Papel Viejo)
function FlipCard({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <div className="relative w-20 h-24 md:w-28 md:h-36 bg-retro-paper rounded-lg overflow-hidden border-4 border-retro-accent shadow-[0_8px_0_rgba(0,0,0,0.3),0_12px_20px_rgba(215,119,6,0.4)]">
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl md:text-7xl font-black font-retro text-retro-ink drop-shadow-sm">
                        {String(value).padStart(2, '0')}
                    </span>
                </div>
                {/* Línea divisoria del flip */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-500/20" />
            </div>
            <span className="mt-3 text-xs md:text-sm font-bold font-retro text-retro-accent uppercase tracking-widest">
                {label}
            </span>
        </div>
    );
}

// Tarjeta Digital VCR (Estilo Pantalla LCD)
function DigitalCard({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <div className="relative w-20 h-24 md:w-28 md:h-36 bg-cyber-black rounded-lg overflow-hidden border-4 border-cyber-neon shadow-[0_0_20px_rgba(255,204,0,0.5),0_0_40px_rgba(255,204,0,0.2)]">
                {/* Grid de fondo */}
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