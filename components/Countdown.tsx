"use client";

import { useEffect, useState } from "react";

export default function Countdown() {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        // Fecha objetivo: 11 Diciembre 2025, 19:30 GMT-05:00
        const targetDate = new Date("2025-12-11T19:30:00-05:00").getTime();

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate - now;

            if (distance < 0) {
                clearInterval(interval);
                return;
            }

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000),
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="grid grid-cols-4 gap-4 text-center max-w-2xl mx-auto my-8">
            {[
                { label: "Días", value: timeLeft.days },
                { label: "Horas", value: timeLeft.hours },
                { label: "Minutos", value: timeLeft.minutes },
                { label: "Segundos", value: timeLeft.seconds },
            ].map((item, idx) => (
                <div key={idx} className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg">
                    <div className="text-3xl md:text-5xl font-bold text-yellow-500 font-mono">
                        {String(item.value).padStart(2, "0")}
                    </div>
                    <div className="text-xs md:text-sm text-gray-400 uppercase tracking-wider mt-2">
                        {item.label}
                    </div>
                </div>
            ))}
        </div>
    );
}