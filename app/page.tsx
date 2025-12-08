"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogOut, Trophy, Users, PlayCircle, Plus } from "lucide-react";
import Countdown from "@/components/Countdown";
import Link from "next/link";

export default function Home() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (!user.emailVerified) router.push("/verify-email");
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      {/* Header Simplificado */}
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <Trophy className="text-yellow-500" />
          <span className="font-bold text-lg">Wishlist Awards</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 hidden sm:inline">{user.email}</span>
          <button onClick={logout} className="text-red-400 hover:text-red-300">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        {/* Hero Section con Countdown */}
        <section className="text-center mb-16 py-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-600">
            The Game Awards 2025
          </h1>
          <p className="text-gray-400 text-lg mb-8">La ceremonia comienza en:</p>
          <Countdown />

          <div className="mt-10">
            <Link
              href="/vote"
              className="inline-flex items-center gap-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-4 px-8 rounded-full text-xl transition-transform hover:scale-105 shadow-lg shadow-yellow-500/20"
            >
              <PlayCircle size={24} />
              Hacer mis predicciones
            </Link>
          </div>
        </section>

        {/* Sección de Grupos (Placeholder por ahora) */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Users className="text-blue-400" />
              Mis Grupos
            </h2>
            <button className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-lg border border-gray-600 flex items-center gap-1 transition-colors">
              <Plus size={16} /> Crear Grupo
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Grupo Global (Siempre existe) */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">Ranking Global</h3>
                  <p className="text-gray-400 text-sm">Todos los participantes</p>
                </div>
                <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded">Público</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Users size={14} /> 1 Participante (Tú)
              </div>
            </div>

            {/* Placeholder para cuando no hay grupos */}
            <div className="border-2 border-dashed border-gray-700 p-6 rounded-xl flex flex-col items-center justify-center text-gray-500 min-h-[150px]">
              <p>No estás en ningún grupo privado.</p>
              <button className="text-yellow-500 hover:underline text-sm mt-2">
                Unirse a uno con código
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}