export default function Loading() {
    return (
        <div className="min-h-screen bg-deep flex items-center justify-center">
            <div className="relative flex flex-col items-center">
                {/* Logo del Gato Parpadeando */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="https://i.postimg.cc/G2gBjfDn/Principal-Logo-Whislist-Awards.png"
                    alt="Cargando..."
                    className="w-40 h-40 animate-pulse object-contain drop-shadow-[0_0_25px_rgba(234,179,8,0.4)]"
                />
                <p className="mt-6 text-yellow-500/80 font-black animate-pulse text-xl tracking-[0.2em] uppercase">
                    Cargando...
                </p>

                {/* Efecto de 'resplandor' de fondo adicional */}
                <div className="absolute inset-0 bg-yellow-500/10 blur-3xl -z-10 rounded-full animate-pulse" />
            </div>
        </div>
    );
}
