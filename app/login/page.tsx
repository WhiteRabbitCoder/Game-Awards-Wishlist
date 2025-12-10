"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogIn, Mail, Lock, AlertCircle, UserPlus } from "lucide-react";

// URL de la imagen del gato
const CAT_IMAGE_URL = "https://i.postimg.cc/G2gBjfDn/Principal-Logo-Whislist-Awards.png";

// Componente reutilizable para el panel del gato
const CatPanel = ({ isPasswordFocused }: { isPasswordFocused: boolean }) => (
  <div className="w-full md:w-1/2 p-8 flex flex-col items-center justify-center bg-gray-950/50 relative h-full">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-cyber-neon/5 to-transparent opacity-50"></div>
    <img
      src={CAT_IMAGE_URL}
      alt="Wishlist Awards Cat"
      className={`
                w-48 md:w-64 z-10 
                transition-all duration-500 ease-in-out
                ${isPasswordFocused
          ? 'opacity-10 brightness-50 blur-sm scale-95'
          : 'opacity-100 brightness-100 blur-0 scale-100'}
            `}
      style={{ filter: `drop-shadow(0 0 25px rgba(234, 179, 8, 0.2))` }}
    />
    <h1 className="text-4xl md:text-5xl mt-4 font-brush text-center tracking-wide bg-gradient-to-r from-primary via-cyber-neon to-retro-accent bg-clip-text text-transparent">
      Wishlist Awards
    </h1>
    <p className="font-digital text-gray-400 tracking-[0.2em] text-xs mt-2">
      {isPasswordFocused ? "NO_PEEKING..." : "PREDICT_THE_WINNERS"}
    </p>
  </div>
);

// Componente reutilizable para el panel del formulario
const FormPanel = ({ isRegistering, onSubmit, email, setEmail, password, setPassword, setIsPasswordFocused, error, message, onToggleMode, onGoogleLogin }: any) => (
  <div className="w-full md:w-1/2 p-8 md:p-10 bg-deep flex flex-col justify-center h-full">
    <div className="mb-8">
      <h2 className="text-3xl font-bold text-white">{isRegistering ? "Crear Cuenta" : "Iniciar Sesión"}</h2>
      <p className="text-gray-400">
        {isRegistering ? "Únete para empezar a votar." : "¡Qué bueno verte de nuevo!"}
      </p>
    </div>

    {error && (
      <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg mb-4 flex items-center gap-2 text-sm">
        <AlertCircle size={18} /> {error}
      </div>
    )}
    {message && (
      <div className="bg-green-500/20 border border-green-500 text-green-300 p-3 rounded-lg mb-4 text-sm">
        {message}
      </div>
    )}

    <form onSubmit={onSubmit} className="space-y-5">
      <div className="relative">
        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
        <input type="email" placeholder="Correo electrónico" className="w-full bg-gray-950 border-2 border-gray-700 rounded-lg py-3 pl-11 pr-4 focus:border-primary focus:ring-2 focus:ring-primary/50 outline-none transition-all" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
        <input type="password" placeholder="Contraseña" className="w-full bg-gray-950 border-2 border-gray-700 rounded-lg py-3 pl-11 pr-4 focus:border-primary focus:ring-2 focus:ring-primary/50 outline-none transition-all" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setIsPasswordFocused(true)} onBlur={() => setIsPasswordFocused(false)} required />
      </div>
      <button type="submit" className="w-full group relative font-bold text-lg text-white bg-gradient-to-r from-primary to-primary-light py-3 rounded-full shadow-lg hover:shadow-gold-glow transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-3">
        {isRegistering ? <UserPlus size={22} /> : <LogIn size={22} />}
        {isRegistering ? "Registrarse" : "Iniciar Sesión"}
      </button>
    </form>

    <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700"></div></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-deep text-gray-500">O</span></div></div>
    <button onClick={onGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-gray-800 text-gray-200 border-2 border-gray-700 hover:border-white/50 hover:text-white font-bold py-3 px-4 rounded-full transition-colors">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-5 h-5" />
      Continuar con Google
    </button>
    <p className="mt-8 text-center text-sm text-gray-400">{isRegistering ? "¿Ya tienes una cuenta? " : "¿Aún no tienes cuenta? "}<button onClick={onToggleMode} className="font-semibold text-primary hover:text-primary-light underline">{isRegistering ? "Inicia Sesión" : "Regístrate aquí"}</button></p>
  </div>
);


export default function LoginPage() {
  const { user, loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();
  const router = useRouter();

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  useEffect(() => { if (user) router.push("/"); }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      if (isRegistering) {
        await signupWithEmail(email, password);
        setMessage("¡Cuenta creada! Revisa tu correo para verificarla.");
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') setError("Este correo ya está registrado.");
      else if (err.code === 'auth/invalid-credential') setError("Correo o contraseña incorrectos.");
      else if (err.code === 'auth/weak-password') setError("La contraseña debe tener al menos 6 caracteres.");
      else setError("Ocurrió un error. Inténtalo de nuevo.");
    }
  };

  const handleToggleMode = () => {
    setIsRegistering(!isRegistering);
    setError("");
    setMessage("");
    setEmail("");
    setPassword("");
  };

  const formProps = { email, setEmail, password, setPassword, setIsPasswordFocused, error, message, onToggleMode: handleToggleMode, onSubmit: handleSubmit, onGoogleLogin: loginWithGoogle };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-deep text-white [perspective:1000px]">
      <div className={`relative w-full max-w-4xl h-[750px] md:h-[550px] transition-transform duration-700 ease-in-out [transform-style:preserve-3d] ${isRegistering ? '[transform:rotateY(180deg)]' : ''}`}>
        {/* --- CARA FRONTAL (LOGIN) --- */}
        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden]">
          <div className="flex flex-col md:flex-row rounded-2xl shadow-2xl shadow-black/50 overflow-hidden border border-white/10 h-full">
            <CatPanel isPasswordFocused={isPasswordFocused} />
            <FormPanel isRegistering={false} {...formProps} />
          </div>
        </div>

        {/* --- CARA TRASERA (REGISTER) --- */}
        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="flex flex-col md:flex-row rounded-2xl shadow-2xl shadow-black/50 overflow-hidden border border-white/10 h-full">
            <FormPanel isRegistering={true} {...formProps} />
            <CatPanel isPasswordFocused={isPasswordFocused} />
          </div>
        </div>
      </div>
    </div>
  );
}