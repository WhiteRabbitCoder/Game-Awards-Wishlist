"use client";

import { useAuth } from "@/context/AuthContext";
import { sendEmailVerification } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Mail, RefreshCw, LogOut, CheckCircle, AlertCircle, Loader } from "lucide-react";

export default function VerifyEmailPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [checkingVerification, setCheckingVerification] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (user.emailVerified) {
      router.push("/");
    }
  }, [user, router]);

  const checkVerification = async () => {
    setCheckingVerification(true);
    if (user) {
      await user.reload();
      if (user.emailVerified) {
        router.push("/");
      } else {
        setMessage("Tu correo aún no ha sido verificado. Por favor revisa tu bandeja de entrada.");
      }
    }
    setCheckingVerification(false);
  };

  const resendEmail = async () => {
    if (user && !sending) {
      setSending(true);
      try {
        await sendEmailVerification(user);
        setMessage("✓ Correo reenviado correctamente. Revisa tu bandeja de entrada (y carpeta de spam).");
      } catch (error) {
        setMessage("⚠ Espera unos minutos antes de intentar enviar nuevamente.");
      }
      setSending(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-deep flex items-center justify-center p-4 text-white overflow-hidden relative">
      {/* Fondo animado */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-retro-accent/5" />
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-retro-accent/20 rounded-full blur-[100px] animate-pulse delay-1000" />

      {/* Card Principal */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-gradient-to-br from-surface to-deep border border-white/10 rounded-2xl shadow-2xl p-8 md:p-10 backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50" />

          <div className="relative z-20">
            {/* Icono Animado */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse" />
                <div className="relative bg-primary/20 p-6 rounded-full border border-primary/40 backdrop-blur-sm">
                  <Mail className="text-primary animate-bounce" size={48} strokeWidth={1.5} />
                </div>
              </div>
            </div>

            {/* Contenido */}
            <h1 className="text-3xl font-black text-center mb-3">
              Verifica tu<br />
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Correo Electrónico
              </span>
            </h1>

            <p className="text-gray-400 text-center mb-8 leading-relaxed">
              Hemos enviado un enlace de confirmación a<br />
              <span className="text-primary font-semibold">{user.email}</span>
            </p>

            {/* Mensaje de estado */}
            {message && (
              <div className={`p-4 rounded-xl mb-6 text-sm flex gap-3 items-start border backdrop-blur-sm ${message.includes("✓")
                ? "bg-green-500/10 border-green-500/30 text-green-300"
                : "bg-blue-500/10 border-blue-500/30 text-blue-300"
                }`}>
                {message.includes("✓") ? (
                  <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                )}
                <span>{message}</span>
              </div>
            )}

            {/* Botones */}
            <div className="space-y-3">
              <button
                onClick={checkVerification}
                disabled={checkingVerification}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all hover:shadow-[0_0_25px_rgba(234,179,8,0.3)] hover:scale-105 flex items-center justify-center gap-2 group"
              >
                {checkingVerification ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <RefreshCw size={20} className="group-hover:rotate-180 transition-transform" />
                    Ya confirmé el correo
                  </>
                )}
              </button>

              <button
                onClick={resendEmail}
                disabled={sending}
                className="w-full bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all border border-white/20 hover:border-white/40 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail size={18} />
                    Reenviar correo
                  </>
                )}
              </button>

              <button
                onClick={() => logout()}
                className="w-full text-gray-400 hover:text-primary transition-colors py-3 flex items-center justify-center gap-2 text-sm font-semibold border border-white/10 rounded-xl hover:border-primary/30"
              >
                <LogOut size={16} />
                Usar otra cuenta
              </button>
            </div>

            {/* Info adicional */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                🔒 Tu cuenta está protegida. Después de verificar tu correo, accederás a todas las funciones de Wishlist Awards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
