"use client";

import HybridCountdown from "./HybridCountdown";
import Link from "next/link";
import { Trophy, Sparkles, ExternalLink } from "lucide-react";
import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

// --- CONSTANTES DE IMÁGENES Y MENSAJES ---

// URL de la imagen por defecto
const DEFAULT_CAT_IMAGE_URL = "https://i.postimg.cc/G2gBjfDn/Principal-Logo-Whislist-Awards.png";
// ⚠️ IMPORTANTE: Reemplaza la siguiente URL con la imagen especial para Danieloide
const SPECIAL_CAT_IMAGE_URL = "https://i.postimg.cc/MHGsrTKm/Cupcake-Logo-Cat.png";

// 3. Definir las listas de mensajes
const GENERAL_MESSAGES = [
    "Meow!",
    "¡Haz tu predicción!",
    "¿Quién ganará el GOTY?",
    "¡Vota ahora!",
    "Miau... ¿ya votaste?",
    "El destino de los juegos está en tus manos.",
    "Pssst... ¡no te olvides de guardar!",
];

const SPECIAL_MESSAGES = [
    "Hey… I like you more than I usually admit.",
    "You clicked… Cupcake, and somehow that made my day brighter.",
    "You have this little spark that makes everything feel a bit better.",
    "If moods had buffs, you’d definitely be one of mine, Cupcake.",
    "Sometimes I think you’re a small plot twist in my day — the good kind.",
    "By the way… Split Fiction totally deserves the GOTY — but you still win my personal award for best vibe.",
    "If hearts had rankings, you’d probably be top tier without even trying.",
];


export default function HeroSection() {
    const { user } = useAuth();
    const eventDate = new Date("2025-12-11T19:30:00");
    const catRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const spotlightRef = useRef<HTMLDivElement>(null);

    // Determinar qué imagen mostrar
    const catImageUrl = user?.displayName === "Danieloide" ? SPECIAL_CAT_IMAGE_URL : DEFAULT_CAT_IMAGE_URL;

    // 5. Crear la función para el clic
    const handleCatClick = () => {
        let availableMessages = [...GENERAL_MESSAGES];

        // Si el usuario es "Danieloide", se añaden los mensajes especiales
        if (user?.displayName === "Danieloide") {
            availableMessages = [...availableMessages, ...SPECIAL_MESSAGES];
        }

        const randomMessage = availableMessages[Math.floor(Math.random() * availableMessages.length)];

        // Mostrar el mensaje con un icono
        toast(randomMessage, {
            icon: '🐾',
            duration: 5000, // <--- CAMBIO AQUÍ: Duración en milisegundos (6 segundos)
            style: {
                background: '#333',
                color: '#fff',
                minWidth: '250px', // Opcional: hace que el toast sea un poco más ancho para mensajes largos
            },
        });
    };

    // --- REACTIVITY LOGIC (MOUSE + GYRO) ---
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;

            if (spotlightRef.current) {
                spotlightRef.current.style.background = `radial-gradient(600px circle at ${clientX}px ${clientY}px, rgba(99, 102, 241, 0.07), transparent 40%)`;
            }

            if (catRef.current) {
                const rotateY = (clientX / innerWidth - 0.5) * 40;
                const rotateX = (0.5 - clientY / innerHeight) * 40;
                const shadowX = (clientX / innerWidth - 0.5) * -30;
                const shadowY = (clientY / innerHeight - 0.5) * -30;

                catRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.1, 1.1, 1.1)`;
                catRef.current.style.filter = `drop-shadow(${shadowX}px ${shadowY}px 20px rgba(234, 179, 8, 0.3)) brightness(${1 + (rotateY / 100)})`;
            }
        };

        const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
            if (!catRef.current || !e.gamma || !e.beta) return;
            const rotateY = Math.min(Math.max(e.gamma, -45), 45);
            const rotateX = Math.min(Math.max(e.beta - 45, -45), 45);

            catRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.1, 1.1, 1.1)`;
            catRef.current.style.filter = `drop-shadow(${-rotateY}px ${-rotateX}px 15px rgba(234, 179, 8, 0.4))`;
        };

        window.addEventListener('mousemove', handleMouseMove);
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleDeviceOrientation);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (window.DeviceOrientationEvent) {
                window.removeEventListener('deviceorientation', handleDeviceOrientation);
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative min-h-screen flex flex-col items-center justify-center bg-deep overflow-hidden pt-28 pb-10"
        >
            {/* --- REACTIVE BACKGROUND --- */}

            {/* 1. Cyberpunk Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)] pointer-events-none" />

            {/* 2. Spotlight (Now using Ref) */}
            <div
                ref={spotlightRef}
                className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                style={{
                    // Initial state to avoid flickering before JS loads
                    background: `radial-gradient(600px circle at 50% 50%, rgba(99, 102, 241, 0.07), transparent 40%)`
                }}
            />

            {/* 3. Ambient Blobs */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-retro-accent/10 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse delay-1000" />


            {/* --- MAIN CONTENT --- */}
            <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">

                {/* LOGO */}
                <div className="mb-8 md:mb-10 perspective-1000 relative group">
                    <div className="absolute inset-0 bg-cyber-neon/20 blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 rounded-full" />

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        ref={catRef}
                        src={catImageUrl}
                        alt="Wishlist Awards Logo"
                        className="w-56 md:w-96 mx-auto transition-transform duration-100 ease-out will-change-transform cursor-pointer"
                        style={{ filter: 'drop-shadow(0px 0px 20px rgba(255, 165, 0, 0.15))' }}
                        onClick={handleCatClick}
                    />
                </div>

                {/* TITLE */}
                <h1 className="text-4xl md:text-7xl font-brush text-retro-ink mb-4 tracking-tight leading-none group cursor-default">
                    <span className="bg-gradient-to-r from-retro-accent via-cyber-neon to-primary bg-clip-text text-transparent group-hover:animate-pulse transition-all">
                        WISHLIST GAME AWARDS
                    </span>
                </h1>

                <p className="text-lg md:text-2xl text-gray-400 mb-2 font-medium">
                    El destino de los juegos está en tus manos
                </p>

                <div className="flex items-center justify-center gap-2 text-sm md:text-base text-gray-500 mb-10">
                    <Sparkles size={16} className="text-cyber-neon animate-pulse" />
                    <span className="font-digital tracking-widest">2025 Edition</span>
                    <Sparkles size={16} className="text-cyber-neon animate-pulse" />
                </div>

                {/* COUNTDOWN */}
                <div className="mb-12 inline-block relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-lg blur opacity-10 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative">
                        <h2 className="text-xs md:text-sm text-gray-500 uppercase tracking-[0.3em] mb-6 font-digital">
                            Tiempo restante
                        </h2>
                        <HybridCountdown targetDate={eventDate} />
                    </div>
                </div>

                {/* TGA BUTTON */}
                <div className="mb-12 flex justify-center">
                    <a
                        href="https://thegameawards.com/nominees"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative inline-flex items-center justify-center gap-3 bg-[#0372a6] hover:bg-[#025a85] text-white font-black py-3 px-6 md:py-4 md:px-8 rounded-xl text-base md:text-lg transition-all hover:scale-105 shadow-[0_0_20px_rgba(3,114,166,0.3)] hover:shadow-[0_0_30px_rgba(3,114,166,0.6)] overflow-hidden ring-1 ring-white/10"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />

                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="https://cdn.thegameawards.com//frontend/svgs/tga_icon_2024.svg"
                            alt="TGA Logo"
                            className="w-6 h-6 md:w-8 md:h-8 brightness-0 invert"
                        />
                        <span>VOTO OFICIAL TGA</span>
                        <ExternalLink size={20} className="opacity-70 group-hover:translate-x-1 transition-transform" />
                    </a>
                </div>

                {/* CTA BUTTONS */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pb-20">
                    <Link
                        href="/vote"
                        className="group relative px-8 py-4 bg-gradient-to-r from-primary to-primary-light text-white font-bold text-lg rounded-full shadow-lg hover:shadow-gold-glow transition-all duration-300 hover:scale-110 active:scale-95 flex items-center gap-3 z-20"
                    >
                        <Trophy size={24} className="group-hover:rotate-12 group-hover:text-yellow-200 transition-transform" />
                        <span>HACER MIS PREDICCIONES</span>
                    </Link>

                    <button
                        onClick={() => {
                            const element = document.getElementById('grupos');
                            element?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-8 py-4 border-2 border-gray-700 text-gray-300 font-bold text-lg rounded-full hover:border-cyber-neon hover:text-cyber-neon transition-all duration-300 hover:shadow-neon hover:bg-white/5 active:scale-95"
                    >
                        Ver Rankings
                    </button>
                </div>

            </div>
        </div>
    );
}