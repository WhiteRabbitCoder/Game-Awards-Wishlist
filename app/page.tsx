"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Trophy, Users, PlayCircle, Plus, Hash, Copy, Check, Pencil } from "lucide-react";
import Countdown from "@/components/Countdown";
import Link from "next/link";
import { createGroup, getUserGroups, joinGroup, updateGroup } from "@/lib/groups"; // Importar updateGroup

export default function Home() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  const [groups, setGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // Nuevo modal

  // Inputs
  const [inputName, setInputName] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [editingGroup, setEditingGroup] = useState<any>(null); // Grupo siendo editado

  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Para evitar doble clic

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (!user.emailVerified) {
        router.push("/verify-email");
      } else if (!user.displayName) {
        // SI NO TIENE NOMBRE, LO MANDAMOS A CONFIGURAR
        router.push("/setup-profile");
      }
    }
  }, [user, loading, router]);

  const loadGroups = async () => {
    if (user) {
      const userGroups = await getUserGroups(user.uid);
      setGroups(userGroups);
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [user]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inputName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(""); // Limpiar errores previos
    try {
      // Pasamos el displayName del usuario (o "Anónimo" si no tiene)
      const creatorName = user.displayName || "Usuario";
      await createGroup(user.uid, inputName.trim(), creatorName);

      setShowCreateModal(false);
      setInputName("");
      loadGroups();
    } catch (err: any) {
      console.error(err);
      // Mostramos el mensaje de error (ej: "Ya tienes un grupo con este nombre")
      setError(err.message || "Error al crear grupo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inputCode.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    try {
      await joinGroup(user.uid, inputCode);
      setShowJoinModal(false);
      setInputCode("");
      loadGroups();
    } catch (err: any) {
      setError(err.message || "Error al unirse");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Nueva función para editar
  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup || !inputName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateGroup(editingGroup.id, inputName);
      setShowEditModal(false);
      setEditingGroup(null);
      setInputName("");
      loadGroups();
    } catch (err) {
      console.error(err);
      setError("Error al actualizar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (group: any) => {
    setEditingGroup(group);
    setInputName(group.name);
    setShowEditModal(true);
  };

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      {/* Header */}
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
        {/* Hero Section */}
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
              Editar mis Predicciones Globales
            </Link>
          </div>
        </section>

        {/* Sección de Grupos */}
        <section>
          <div className="flex flex-col sm:flex-row justify-between items-end mb-6 gap-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Users className="text-blue-400" />
              Mis Grupos
            </h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowJoinModal(true)}
                className="flex-1 sm:flex-none text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg border border-gray-600 flex items-center justify-center gap-2 transition-colors"
              >
                <Hash size={16} /> Unirse con Código
              </button>
              <button
                onClick={() => { setInputName(""); setShowCreateModal(true); }}
                className="flex-1 sm:flex-none text-sm bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-semibold"
              >
                <Plus size={16} /> Crear Grupo
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {loadingGroups ? (
              <p className="text-gray-500">Cargando grupos...</p>
            ) : groups.map((group) => {
              const isOwner = group.ownerId === user.uid;
              return (
                <Link href={`/group/${group.id}`} key={group.id} className="block">
                  <div key={group.id} className={`p-6 rounded-xl border transition-colors relative h-full hover:shadow-lg ${group.isGlobal ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-500/30' : 'bg-gray-800 border-gray-700 hover:border-blue-500/50'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                          {group.name}
                          {group.isGlobal && <Trophy size={14} className="text-yellow-500" />}
                          {/* Botón de Editar (Solo dueños y no global) */}
                          {!group.isGlobal && isOwner && (
                            <button
                              onClick={() => openEditModal(group)}
                              className="text-gray-500 hover:text-white transition-colors p-1"
                              title="Editar nombre"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                        </h3>

                        {/* MOSTRAR CREADOR */}
                        <p className="text-gray-400 text-sm">
                          {group.isGlobal
                            ? "Competencia general"
                            : isOwner // Si soy el dueño...
                              ? <span className="text-blue-400 font-medium">Tú eres el administrador</span>
                              : ( // Si es otro...
                                <span className="flex items-center gap-1">
                                  <span className="text-gray-500">por</span>
                                  <span className="text-gray-300 font-medium">
                                    {group.ownerName || "Desconocido"}
                                  </span>
                                </span>
                              )
                          }
                        </p>
                      </div>
                      {group.isGlobal ? (
                        <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded border border-yellow-500/30">Oficial</span>
                      ) : (
                        <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded">Privado</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <button className="text-sm text-gray-300 hover:text-white hover:underline">
                        Ver Tabla de Posiciones
                      </button>

                      {/* Código de invitación (Ahora usa group.code real) */}
                      {!group.isGlobal && (
                        <button
                          onClick={() => copyToClipboard(group.code, group.id)}
                          className="text-xs bg-black/30 hover:bg-black/50 px-2 py-1 rounded flex items-center gap-2 text-gray-400 transition-colors"
                          title={`Código: ${group.code}`}
                        >
                          {copiedId === group.id ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                          Invitar
                        </button>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      {/* Modal Crear Grupo */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleCreateGroup} className="bg-gray-800 p-6 rounded-xl w-full max-w-sm border border-gray-700">
            <h3 className="text-xl font-bold mb-4">Crear Nuevo Grupo</h3>
            <input
              type="text"
              placeholder="Nombre del grupo"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 mb-2 focus:border-blue-500 outline-none"
              value={inputName}
              onChange={e => setInputName(e.target.value)}
              autoFocus
            />

            {/* Mostrar Error Aquí */}
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <div className="flex gap-3 mt-2">
              <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded-lg font-bold disabled:opacity-50">
                {isSubmitting ? "Creando..." : "Crear"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Editar Grupo */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleUpdateGroup} className="bg-gray-800 p-6 rounded-xl w-full max-w-sm border border-gray-700">
            <h3 className="text-xl font-bold mb-4">Editar Grupo</h3>
            <input
              type="text"
              placeholder="Nuevo nombre"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 mb-4 focus:border-blue-500 outline-none"
              value={inputName}
              onChange={e => setInputName(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded-lg font-bold disabled:opacity-50">
                {isSubmitting ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Unirse Grupo */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleJoinGroup} className="bg-gray-800 p-6 rounded-xl w-full max-w-sm border border-gray-700">
            <h3 className="text-xl font-bold mb-4">Unirse a un Grupo</h3>
            <p className="text-sm text-gray-400 mb-4">Pide el código de 6 caracteres al administrador.</p>
            <input
              type="text"
              placeholder="Código (ej: XK9L2M)"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 mb-2 focus:border-blue-500 outline-none uppercase tracking-widest text-center font-mono text-lg"
              value={inputCode}
              onChange={e => setInputCode(e.target.value.toUpperCase())}
              maxLength={6}
              autoFocus
            />
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <div className="flex gap-3 mt-4">
              <button type="button" onClick={() => setShowJoinModal(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded-lg font-bold disabled:opacity-50">
                {isSubmitting ? "Uniendo..." : "Unirse"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}