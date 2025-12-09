import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Sistema Base (Fondo Oscuro)
                deep: '#0B0E14',
                surface: '#151B26',

                // Modo Retro (Días/Horas)
                retro: {
                    paper: '#E2E2E2',
                    ink: '#2D2D2D',
                    accent: '#D97706', // Naranja ámbar
                },

                // Modo Digital (Minutos/Segundos)
                cyber: {
                    neon: '#FFCC00', // Naranja neón unificado
                    black: '#000000',
                },

                // Podios (Ranking)
                rank: {
                    gold: '#F59E0B',
                    silver: '#94A3B8',
                    bronze: '#B45309',
                },

                // Acciones
                primary: '#6366F1', // Indigo
                'primary-light': '#8B5CF6', // Violeta
            },
            fontFamily: {
                // AQUÍ ESTÁ EL CAMBIO: Usamos el nombre directo
                brush: ['"Rubik Wet Paint"', 'cursive'],
                digital: ['"Orbitron"', 'monospace'],
                retro: ['"Courier New"', 'monospace'],
            },
            boxShadow: {
                'retro-card': '0 4px 0 #999',
                'neon': '0 0 10px rgba(255, 204, 0, 0.7), 0 0 20px rgba(255, 204, 0, 0.5)',
                'gold-glow': '0 0 20px rgba(245, 158, 11, 0.6)',
            },
            animation: {
                'flip-down': 'flipDown 0.6s ease-in-out',
                'glitch': 'glitch 0.3s infinite',
            },
            keyframes: {
                flipDown: {
                    '0%': { transform: 'rotateX(0deg)', transformOrigin: 'top' },
                    '100%': { transform: 'rotateX(-180deg)', transformOrigin: 'top' },
                },
                glitch: {
                    '0%, 100%': { transform: 'translate(0)' },
                    '20%': { transform: 'translate(-2px, 2px)' },
                    '40%': { transform: 'translate(2px, -2px)' },
                    '60%': { transform: 'translate(-2px, -2px)' },
                    '80%': { transform: 'translate(2px, 2px)' },
                },
            },
        },
    },
    plugins: [],
};

export default config;