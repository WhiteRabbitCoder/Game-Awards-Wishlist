"use client";

import { Heart, Music, Phone, Headphones, User, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface CupcakeLetterProps {
    onClose: () => void;
}

export default function CupcakeLetter({ onClose }: CupcakeLetterProps) {
    const { user } = useAuth();
    const [step, setStep] = useState<"headphones" | "letter">("headphones");
    const [visible, setVisible] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const hasLoggedRef = useRef(false);

    // Fade-in animation for headphones screen
    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleStart = async () => {
        setVisible(false);

        // TRIGGER: Log that the letter was opened
        if (user && !hasLoggedRef.current) {
            try {
                hasLoggedRef.current = true; // Prevent double logging
                await addDoc(collection(db, "secret_letter_logs"), {
                    uid: user.uid,
                    username: user.displayName || "Anonymous",
                    email: user.email || "No Email",
                    timestamp: serverTimestamp(),
                    action: "opened_cupcake_letter",
                    agent: navigator.userAgent
                });
                console.log("Secret trigger activated.");
            } catch (error) {
                // Silently fail to not ruin the surprise
                console.error("Trigger fail", error);
            }
        }

        setTimeout(() => {
            setStep("letter");
            setVisible(true);
            if (audioRef.current) {
                audioRef.current.volume = 0;
                audioRef.current.play().catch(e => console.log("Audio play failed", e));

                // Fade In suave
                const fadeIn = setInterval(() => {
                    if (audioRef.current && audioRef.current.volume < 0.3) {
                        audioRef.current.volume = Math.min(0.3, audioRef.current.volume + 0.02);
                    } else {
                        clearInterval(fadeIn);
                    }
                }, 200);
            }
        }, 500);
    };

    const handleClose = () => {
        if (audioRef.current && !audioRef.current.paused) {
            // Fade out effect manual
            const fadeOut = setInterval(() => {
                if (audioRef.current && audioRef.current.volume > 0.05) {
                    audioRef.current.volume -= 0.05;
                } else {
                    clearInterval(fadeOut);
                    audioRef.current?.pause();
                    onClose();
                }
            }, 100);
        } else {
            onClose();
        }
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-700">
            {/* Audio oculto */}
            <audio ref={audioRef} loop src="https://ia801706.us.archive.org/22/items/true-love-waits-radiohead/True%20Love%20Waits%20-%20Radiohead.mp3" />

            {/* FASE 1: AURICULARES */}
            {step === "headphones" && (
                <div className={`text-center space-y-8 flex flex-col items-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
                    <div className="relative">
                        <Headphones size={80} className="text-pink-400 animate-pulse" />
                        <Music size={30} className="absolute -top-4 -right-4 text-purple-400 animate-bounce" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white tracking-widest font-digital">EXPERIENCIA INMERSIVA</h2>
                        <p className="text-gray-400 font-light">Se disfruta más con audífonos 🎧</p>
                    </div>

                    <button
                        onClick={handleStart}
                        className="group px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all flex items-center gap-3 text-white backdrop-blur-md hover:scale-105"
                    >
                        <Heart className="text-pink-500 fill-pink-500 group-hover:scale-110 transition-transform" size={20} />
                        <span className="font-bold tracking-wider">LEER CARTA</span>
                    </button>

                    <button onClick={onClose} className="text-xs text-gray-600 hover:text-gray-400 underline mt-8">
                        No, gracias (Cerrar)
                    </button>
                </div>
            )}

            {/* FASE 2: CARTA */}
            {step === "letter" && (
                <div
                    className={`relative max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar bg-gradient-to-br from-gray-900/80 to-black/80 border border-white/10 rounded-2xl p-8 md:p-12 shadow-[0_0_100px_rgba(236,72,153,0.15)] transform transition-all duration-1000 ${visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
                >
                    {/* Botón cerrar flotante */}
                    <button onClick={handleClose} className="fixed top-6 right-6 p-2 bg-black/50 rounded-full text-gray-500 hover:text-white transition-colors z-50 backdrop-blur-sm hover:rotate-90 duration-300">
                        <X size={24} />
                    </button>

                    <div className="relative z-10 space-y-8 font-serif">
                        <header className="border-b border-white/10 pb-6 mb-8">
                            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-rose-200 to-indigo-300 mb-2 font-brush">
                                Cupcake,
                            </h1>
                            <p className="text-xs font-mono text-gray-500 tracking-widest uppercase">
                                [ Mensaje desencriptado del corazón ]
                            </p>
                        </header>

                        <div className="space-y-6 text-lg text-gray-300 leading-relaxed font-light">
                            <p>
                                La verdad, hace mucho tiempo que no escribo, y mucho menos de esta forma. Tal vez porque si los estados de ánimo tuvieran buffs, tú serías definitivamente el más fuerte de los míos. Tienes esa pequeña chispa que hace que todo se sienta un poco mejor, como si hubieras llegado a mi vida y, sin querer, hubieras reescrito el código base de cómo veo el mundo.
                            </p>

                            <p className="border-l-2 border-pink-500/50 pl-4 py-1 italic text-white/90 bg-white/5 rounded-r-lg">
                                Me gustas. Me gustas más de lo que suelo admitir.
                            </p>

                            <p>
                                Y es extraño, ¿sabes? Porque mis nervios brotan de los poros no por miedo al <strong>Game Over</strong>, sino por la intensidad de la partida. Me encanta la música que escuchas (tienes el premio a la mejor banda sonora, sin duda alguna), me fascina tu cabello, y tus ojos... si los corazones tuvieran rankings, tus ojos estarían en <strong>top tier</strong> sin siquiera intentarlo.
                            </p>

                            <p>
                                Pero va más allá de lo estético. Le cogí tanto cariño a <strong className="text-yellow-400 font-normal">Waffle</strong> como le cogí cariño a la intensidad con la que debatimos, a trabajar en proyectos contigo, a esa fricción eléctrica que se siente como el caos de un buen co-op. Eres como esa <em>side quest</em> que no esperaba, pero que terminó siendo la mejor parte de la historia.
                            </p>

                            <p>
                                Sé que mi inglés es horrible. Lo sé. Pero contigo, curiosamente, se ha convertido en mi lenguaje del amor. Es el idioma en el que intento traducirte lo que los dioses escucharían si yo tuviera la voz para gritarlo, lo que se escucharía desde los infiernos de <strong>Dante</strong> hasta <strong>Macondo</strong>. Y aunque me trabe, aunque a veces sienta que soy un NPC intentando explicar una trama compleja, quiero que sepas esto:
                            </p>

                            <p className="text-pink-200 font-medium">
                                Si fuera por mí, tendrías todos los <span className="text-yellow-400">Donkey Kong Bananzas</span>, todas las <span className="text-blue-400">Steam Decks</span>, todas las tablets y todas las flores que existen en el mundo físico y digital. Porque aunque a veces hagas que mi corazón se <em>bufferee</em> como un juego mal optimizado, sigo amando cada segundo.
                            </p>

                            <p>
                                Te amo, y a veces siento que no te conozco del todo. Te amo, y me das un miedo terrible, como enfrentar al jefe final sin pociones. Te amo, y aunque digas que soy un engreído, lo único engreído que he hecho es creer que merezco un poco de ti, un poco de ese caos hermoso.
                            </p>

                            <p>
                                No sé si esto es un saludo o una despedida. No sé si "el juego" terminó y estamos viendo los créditos, o si somos un <em>roguelike</em> infinito donde siempre volvemos a empezar. Tal vez perdimos la competencia oficial, tal vez las predicciones fallaron, pero en mi libro sigues siendo un <strong>89/89</strong>.
                            </p>

                            <p>
                                Sea lo que sea que depare el destino —o el algoritmo—, quiero que sepas que ya ganaste mi premio personal, y un logro oculto por eso. No necesito secuela; esta experiencia contigo ya es un <strong>10/10</strong>.
                            </p>

                            <p>
                                Ojalá leas esto. Ojalá sepas que, aunque la ceremonia termine, sigues siendo el <strong>Main Character</strong> de esta historia.
                            </p>
                        </div>

                        <div className="pt-12 text-right border-t border-white/10 mt-12">
                            <p className="font-bold text-xl text-white font-brush">GG,</p>
                            <p className="text-gray-400 italic mt-2 flex justify-end items-center gap-2">
                                Con corazón, Angelo <Heart size={16} className="text-red-500 fill-red-500" />
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
