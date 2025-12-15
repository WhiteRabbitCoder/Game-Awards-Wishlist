"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";
import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User, CheckCircle, AlertCircle, Sparkles, Loader2 } from "lucide-react";

export default function SetupProfilePage() {
    const { user } = useAuth();
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Pre-llenar username con displayName de Google como sugerencia
    useEffect(() => {
        if (!user) return;

        // Si el usuario vino de Google y tiene displayName, sugerirlo como username
        if (user.displayName && !username) {
            const suggestedUsername = user.displayName
                .toLowerCase()
                .replace(/\s+/g, '_')
                .replace(/[^a-z0-9_]/g, '')
                .slice(0, 20);
            setUsername(suggestedUsername);
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !username.trim()) return;

        setLoading(true);
        setError("");

        const cleanUsername = username.trim().toLowerCase();

        // Validaciones básicas
        if (cleanUsername.length < 3) {
            setError("El nombre debe tener al menos 3 caracteres.");
            setLoading(false);
            return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
            setError("Solo se permiten letras, números y guiones bajos (_).");
            setLoading(false);
            return;
        }

        try {
            // 1. Verificar si el username ya existe en Firestore
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("username", "==", cleanUsername));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const existingUser = querySnapshot.docs[0];
                if (existingUser.id !== user.uid) {
                    setError("Este nombre de usuario ya está en uso. Elige otro.");
                    setLoading(false);
                    return;
                }
            }

            // 2. Guardar en Firestore (incluye photoURL de Google)
            await setDoc(doc(db, "users", user.uid), {
                username: cleanUsername,
                displayName: username.trim(),
                photoURL: user.photoURL || null, // Guardar foto de Google
                email: user.email,
                updatedAt: new Date(),
                setupCompleted: true
            }, { merge: true });

            // 3. Actualizar el perfil de Firebase Auth
            await updateProfile(user, {
                displayName: username.trim()
            });

            setSuccess(true);

            setTimeout(() => {
                router.push("/");
            }, 1500);

        } catch (err) {
            console.error(err);
            setError("Ocurrió un error al guardar el perfil.");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-deep flex items-center justify-center p-4 text-white relative overflow-hidden">

            {/* Background decorativo */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)] pointer-events-none" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyber-neon/5 rounded-full blur-[120px] animate-pulse delay-1000" />

            <div className="max-w-md w-full bg-gradient-to-br from-surface to-deep rounded-3xl shadow-2xl p-8 border border-white/10 backdrop-blur-sm relative z-10">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="relative inline-block mb-6">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                        {/* Mostrar foto de Google si existe */}
                        {user.photoURL ? (
                            <div className="relative w-24 h-24 rounded-2xl overflow-hidden mx-auto border-2 border-primary/30 shadow-lg">
                                <img src={user.photoURL} alt="Tu foto" className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="relative bg-gradient-to-br from-primary/20 to-cyber-neon/20 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto border-2 border-primary/30 shadow-lg">
                                <User size={48} className="text-primary" />
                            </div>
                        )}
                    </div>

                    <h1 className="text-3xl font-black mb-2 bg-gradient-to-r from-primary via-cyber-neon to-primary bg-clip-text text-transparent">
                        {user.displayName ? `¡Hola, ${user.displayName.split(' ')[0]}!` : 'Configura tu Perfil'}
                    </h1>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Elige un nombre de usuario único para participar en los grupos y rankings.
                    </p>

                    <div className="flex items-center justify-center gap-2 mt-3">
                        <Sparkles size={12} className="text-cyber-neon animate-pulse" />
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Tu identidad gamer</span>
                        <Sparkles size={12} className="text-cyber-neon animate-pulse" />
                    </div>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">
                            Nombre de Usuario
                        </label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-lg z-10">
                                @
                            </span>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-deep/80 border-2 border-white/10 rounded-xl py-4 pl-10 pr-4 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-white placeholder-gray-600 group-hover:border-white/20"
                                placeholder="usuario_gamer"
                                maxLength={20}
                            />
                        </div>
                        <div className="flex items-start gap-2 mt-3 text-xs text-gray-500">
                            <div className="w-1 h-1 rounded-full bg-primary/50 mt-1.5 flex-shrink-0" />
                            <p>Solo letras, números y guiones bajos. Será visible para todos.</p>
                        </div>
                    </div>

                    {/* Mensajes de error/éxito */}
                    {error && (
                        <div className="bg-red-500/10 border-2 border-red-500/30 text-red-300 p-4 rounded-xl text-sm flex items-start gap-3 animate-in slide-in-from-top-2">
                            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-500/10 border-2 border-green-500/30 text-green-300 p-4 rounded-xl text-sm flex items-start gap-3 animate-in slide-in-from-top-2">
                            <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
                            <span className="font-medium">¡Perfil guardado! Redirigiendo...</span>
                        </div>
                    )}

                    {/* Botón Submit */}
                    <button
                        type="submit"
                        disabled={loading || success}
                        className={`w-full py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-3 relative overflow-hidden group ${success
                            ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-600/30"
                            : "bg-gradient-to-r from-primary to-primary-light text-deep shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-[0.98]"
                            } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                    >
                        {/* Efecto de brillo en hover */}
                        {!success && !loading && (
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                        )}

                        <span className="relative z-10">
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Verificando...
                                </>
                            ) : success ? (
                                <>
                                    <CheckCircle size={20} />
                                    ¡Listo!
                                </>
                            ) : (
                                <>
                                    <Sparkles size={20} />
                                    Guardar y Continuar
                                </>
                            )}
                        </span>
                    </button>
                </form>

                {/* Footer decorativo */}
                <div className="mt-6 pt-6 border-t border-white/5 text-center">
                    <p className="text-xs text-gray-600 uppercase tracking-widest">
                        Wishlist Awards 2025
                    </p>
                </div>
            </div>
        </div>
    );
}