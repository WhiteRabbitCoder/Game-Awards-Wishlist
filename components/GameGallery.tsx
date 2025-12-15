"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface GameGalleryProps {
    screenshots: string[];
    gameName: string;
}

export default function GameGallery({ screenshots, gameName }: GameGalleryProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Abrir modal
    const openLightbox = (index: number) => {
        setCurrentIndex(index);
        setIsOpen(true);
        document.body.style.overflow = "hidden"; // Bloquear scroll body
    };

    // Cerrar modal
    const closeLightbox = useCallback(() => {
        setIsOpen(false);
        document.body.style.overflow = "auto"; // Restaurar scroll
    }, []);

    // Navegación
    const showNext = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % screenshots.length);
    }, [screenshots.length]);

    const showPrev = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
    }, [screenshots.length]);

    // Teclado
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowRight") showNext();
            if (e.key === "ArrowLeft") showPrev();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, closeLightbox, showNext, showPrev]);

    if (!screenshots || screenshots.length === 0) return null;

    return (
        <section>
            <h2 className="text-2xl font-bold mb-6">Galería</h2>

            {/* GRID MINITATURAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {screenshots.slice(0, 4).map((shot, idx) => (
                    <div
                        key={idx}
                        onClick={() => openLightbox(idx)}
                        className="group relative aspect-video rounded-xl overflow-hidden cursor-zoom-in shadow-lg border border-white/5"
                    >
                        <img
                            src={shot}
                            alt={`${gameName} Screenshot ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <ZoomIn className="text-white drop-shadow-md" size={32} />
                        </div>
                    </div>
                ))}
            </div>

            {/* LIGHTBOX MODAL */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={closeLightbox}
                >
                    {/* Botón Cerrar */}
                    <button
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-50"
                    >
                        <X size={32} />
                    </button>

                    {/* Botón Anterior */}
                    <button
                        onClick={showPrev}
                        className="absolute left-4 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all hidden md:block z-50"
                    >
                        <ChevronLeft size={40} />
                    </button>

                    {/* Imagen Principal */}
                    <div
                        className="relative max-w-7xl w-full h-full p-4 md:p-10 flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()} // Evitar cerrar al hacer click en la imagen (opcional, o permitir cerrar)
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={screenshots[currentIndex].replace("t_screenshot_huge", "t_original")} // Intentar obtener máxima resolución si es posible (IGDB usa prefijos en URL)
                            alt={`${gameName} Fullscreen`}
                            className="max-h-full max-w-full object-contain rounded-md shadow-2xl animate-in zoom-in-95 duration-300"
                        />

                        {/* Contador */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-1 rounded-full text-sm font-medium backdrop-blur-sm border border-white/10">
                            {currentIndex + 1} / {screenshots.length}
                        </div>
                    </div>

                    {/* Botón Siguiente */}
                    <button
                        onClick={showNext}
                        className="absolute right-4 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all hidden md:block z-50"
                    >
                        <ChevronRight size={40} />
                    </button>
                </div>
            )}
        </section>
    );
}
