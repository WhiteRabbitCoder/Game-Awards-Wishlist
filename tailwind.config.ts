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
                // --- TU CONFIGURACIÓN ORIGINAL ---
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
                    neon: '#FFCC00', // Tu Naranja neón original (Gold)
                    black: '#000000',
                    // NUEVO: Agregado para el contraste "Cyber" frío (necesario para el navbar)
                    cyan: '#00f3ff',
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

                // Navbar Grunge
                'retro-accent': '#ff4d00', // Tu Naranja rojizo fuerte
                // ---------------------------------
            },
            fontFamily: {
                // --- TU CONFIGURACIÓN ORIGINAL ---
                brush: ['var(--font-brush)', 'cursive'],
                digital: ['var(--font-digital)', 'monospace'],
                retro: ['"Courier New"', 'monospace'],
            },
            // NUEVO: Textura de ruido para el fondo "sucio/callejero"
            backgroundImage: {
                'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E\")",
            },
            boxShadow: {
                // --- TU CONFIGURACIÓN ORIGINAL ---
                'retro-card': '0 4px 0 #999',
                'neon': '0 0 10px rgba(255, 204, 0, 0.7), 0 0 20px rgba(255, 204, 0, 0.5)',
                'gold-glow': '0 0 20px rgba(245, 158, 11, 0.6)',

                // NUEVO: Sombras específicas para el Navbar
                'neon-strong': '0 0 5px #00f3ff, 0 0 10px #00f3ff, 0 0 20px #00f3ff', // Brillo cyan fuerte
                'grunge-hard': '4px 4px 0px rgba(0,0,0,1)', // Sombra dura y negra tipo cómic
            },
            animation: {
                // --- TU CONFIGURACIÓN ORIGINAL ---
                'flip-down': 'flipDown 0.6s ease-in-out',
                'glitch': 'glitch 0.3s infinite',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                // --- TU CONFIGURACIÓN ORIGINAL ---
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