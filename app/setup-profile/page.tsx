"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";
import { collection, doc, getDocs, query, setDoc, where, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User, CheckCircle, AlertCircle } from "lucide-react";

export default function SetupProfilePage() {
    const { user } = useAuth();
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Si no hay usuario, volver al login
    useEffect(() => {
        if (!user) return; // Esperar a que cargue auth
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !username.trim()) return;

        setLoading(true);
        setError("");

        const cleanUsername = username.trim().toLowerCase(); // Guardamos en minúsculas para evitar duplicados tipo "User" y "user"

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
                // Si encontramos a alguien con ese nombre...
                // Verificamos si NO soy yo mismo (por si estoy re-guardando mi propio perfil)
                const existingUser = querySnapshot.docs[0];
                if (existingUser.id !== user.uid) {
                    setError("Este nombre de usuario ya está en uso. Elige otro.");
                    setLoading(false);
                    return;
                }
            }

            // 2. Guardar en Firestore
            // Usamos merge: true para no borrar datos existentes (como los votos)
            await setDoc(doc(db, "users", user.uid), {
                username: cleanUsername,
                displayName: username.trim(), // Guardamos el formato original visualmente
                photoURL: user.photoURL,
                email: user.email,
                updatedAt: new Date(),
                setupCompleted: true // Bandera para saber que ya pasó por aquí
            }, { merge: true });

            // 3. Actualizar el perfil de Firebase Auth (para que user.displayName se actualice en toda la app)
            await updateProfile(user, {
                displayName: username.trim()
            });

            setSuccess(true);

            // Redirigir después de un momento
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
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 text-white">
            <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">

                <div className="text-center mb-8">
                    <div className="bg-blue-600/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-blue-500">
                        <User size={40} className="text-blue-400" />
                    </div>
                    <h1 className="text-2xl font-bold">Configura tu Perfil</h1>
                    <p className="text-gray-400 mt-2">
                        Elige un nombre de usuario único para participar en los grupos y rankings.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Nombre de Usuario
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-gray-500 font-bold">@</span>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded-xl py-3 pl-8 pr-4 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-medium"
                                placeholder="usuario_gamer"
                                maxLength={20}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Solo letras, números y guiones bajos. Será visible para todos.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-500/10 border border-green-500/50 text-green-200 p-3 rounded-lg text-sm flex items-center gap-2">
                            <CheckCircle size={16} />
                            ¡Perfil guardado! Redirigiendo...
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || success}
                        className={`w-full py-3 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${success
                                ? "bg-green-600 hover:bg-green-500 text-white"
                                : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {loading ? "Verificando..." : success ? "¡Listo!" : "Guardar y Continuar"}
                    </button>
                </form>
            </div>
        </div>
    );
}