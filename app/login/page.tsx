"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogIn, Mail, Lock, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { user, loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();
  const router = useRouter();
  
  // Estados para el formulario
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState(""); // Para mensajes de éxito (verificación)

  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      if (isRegistering) {
        await signupWithEmail(email, password);
        setMessage("Cuenta creada. ¡Revisa tu correo para verificarla!");
        // No redirigimos inmediatamente para que lean el mensaje
      } else {
        await loginWithEmail(email, password);
        // El useEffect se encargará de redirigir
      }
    } catch (err: any) {
      console.error(err);
      // Mensajes de error amigables
      if (err.code === 'auth/email-already-in-use') setError("Este correo ya está registrado.");
      else if (err.code === 'auth/invalid-credential') setError("Correo o contraseña incorrectos.");
      else if (err.code === 'auth/weak-password') setError("La contraseña debe tener al menos 6 caracteres.");
      else setError("Ocurrió un error. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-yellow-400 mb-2">Wishlist Awards</h1>
            <p className="text-gray-400">
                {isRegistering ? "Crea tu cuenta para votar" : "Bienvenido de nuevo"}
            </p>
        </div>

        {/* Mensajes de Error o Éxito */}
        {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded mb-4 flex items-center gap-2 text-sm">
                <AlertCircle size={16} /> {error}
            </div>
        )}
        {message && (
            <div className="bg-green-500/20 border border-green-500 text-green-200 p-3 rounded mb-4 text-sm">
                {message}
            </div>
        )}

        {/* Formulario Email/Pass */}
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input 
                    type="email" 
                    placeholder="Correo electrónico"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-yellow-400 transition-colors"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input 
                    type="password" 
                    placeholder="Contraseña"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-yellow-400 transition-colors"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            
            <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 rounded-lg transition-colors">
                {isRegistering ? "Registrarse" : "Iniciar Sesión"}
            </button>
        </form>

        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-600"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-gray-800 text-gray-400">O continúa con</span></div>
        </div>

        <button
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 hover:bg-gray-100 font-bold py-2 px-4 rounded-lg transition-colors"
        >
          <LogIn size={20} />
          Google
        </button>

        <p className="mt-6 text-center text-sm text-gray-400">
            {isRegistering ? "¿Ya tienes cuenta? " : "¿No tienes cuenta? "}
            <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-yellow-400 hover:underline font-semibold"
            >
                {isRegistering ? "Inicia Sesión" : "Regístrate"}
            </button>
        </p>
      </div>
    </div>
  );
}