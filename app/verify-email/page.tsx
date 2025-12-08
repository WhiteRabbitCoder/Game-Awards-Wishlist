"use client";

import { useAuth } from "@/context/AuthContext";
import { sendEmailVerification } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Mail, RefreshCw, LogOut } from "lucide-react";

export default function VerifyEmailPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  // Si el usuario ya está verificado (o no existe), sacarlo de aquí
  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (user.emailVerified) {
      router.push("/");
    }
  }, [user, router]);

  const checkVerification = async () => {
    if (user) {
      await user.reload();
      window.location.reload();
    }
  };

  const resendEmail = async () => {
    if (user && !sending) {
      setSending(true);
      try {
        await sendEmailVerification(user);
        setMessage("Correo reenviado. Revisa tu bandeja de entrada (y spam).");
      } catch (error) {
        setMessage("Espera unos minutos antes de intentar de nuevo.");
      }
      setSending(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 text-white">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8 text-center">

        <div className="flex justify-center mb-4">
          <div className="bg-yellow-500/20 p-4 rounded-full">
            <Mail className="text-yellow-400" size={48} />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2">Verifica tu correo</h1>
        <p className="text-gray-400 mb-6">
          Hemos enviado un enlace de confirmación a{" "}
          <span className="text-white font-semibold">{user.email}</span>.
          Por favor, haz clic en el enlace para activar tu cuenta.
        </p>

        {message && (
          <div className="bg-blue-500/20 text-blue-200 p-3 rounded mb-4 text-sm">
            {message}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={checkVerification}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={20} />
            Ya confirmé el correo
          </button>

          <button
            onClick={resendEmail}
            disabled={sending}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
          >
            {sending ? "Enviando..." : "Reenviar correo"}
          </button>

          <button
            onClick={() => logout()}
            className="text-gray-500 hover:text-gray-300 text-sm flex items-center justify-center gap-1 w-full mt-4"
          >
            <LogOut size={14} /> Cerrar sesión / Usar otra cuenta
          </button>
        </div>
        
      </div>
    </div>
  );
}
