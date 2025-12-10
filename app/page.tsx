"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Users, Plus, Loader2, Trophy, Copy, Check, LogIn, Pencil, Globe, LogOut } from "lucide-react";
import HeroSection from "@/components/HeroSection"; // IMPORTANTE: Tu componente actualizado
import toast from "react-hot-toast";
import Link from "next/link";
import { createGroup, getUserGroups, joinGroup, updateGroup } from "@/lib/groups";

export default function HomePage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [groups, setGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);

  // Estados de formularios
  const [newGroupName, setNewGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [groupToRename, setGroupToRename] = useState<any | null>(null);
  const [newName, setNewName] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 1. PROTECCIÓN DE RUTA ---
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (!user.emailVerified) {
        router.push("/verify-email");
      } else if (!user.displayName) {
        router.push("/setup-profile");
      }
    }
  }, [user, authLoading, router]);

  // --- 2. CARGA DE GRUPOS ---
  const loadGroups = async () => {
    if (user) {
      try {
        const userGroups = await getUserGroups(user.uid);
        setGroups(userGroups);
      } catch (error) {
        console.error("Error cargando grupos:", error);
        toast.error("Error al cargar tus grupos");
      } finally {
        setLoadingGroups(false);
      }
    }
  };

  useEffect(() => {
    loadGroups();
  }, [user]);

  // --- 3. FUNCIONES DE MODALES ---
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newGroupName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const creatorName = user.displayName || "Usuario";
      await createGroup(user.uid, newGroupName.trim(), creatorName);

      toast.success("Grupo creado exitosamente");
      setNewGroupName("");
      setShowCreateModal(false);
      loadGroups();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al crear el grupo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !joinCode.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await joinGroup(user.uid, joinCode);
      toast.success("¡Te uniste al grupo!");
      setShowJoinModal(false);
      setJoinCode("");
      loadGroups();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al unirse o código inválido");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenameGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupToRename || !newName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateGroup(groupToRename.id, newName);
      toast.success("Nombre actualizado");
      setShowRenameModal(false);
      setGroupToRename(null);
      setNewName("");
      loadGroups();
    } catch (err) {
      console.error(err);
      toast.error("Error al renombrar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRenameModal = (group: any) => {
    setGroupToRename(group);
    setNewName(group.name);
    setShowRenameModal(true);
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-deep pb-20">


      {/* HERO SECTION COMPLETO */}
      <HeroSection />

      {/* SECCIÓN DE GRUPOS */}
      <div id="grupos" className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-black text-white mb-2">Tus Ligas</h2>
            <p className="text-gray-400">Gestiona tus grupos privados y el ranking global</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowJoinModal(true)}
              className="bg-surface border border-white/10 hover:bg-white/5 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all"
            >
              <LogIn size={20} />
              Unirse con Código
            </button>
            <button
              onClick={() => { setNewGroupName(""); setShowCreateModal(true); }}
              className="bg-primary hover:bg-primary-light text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
            >
              <Plus size={20} />
              Crear Liga
            </button>
          </div>
        </div>

        {loadingGroups ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* TARJETA RANKING MUNDIAL */}
            <div className="group relative bg-gradient-to-br from-blue-900 via-purple-900 to-blue-900 border-2 border-primary/50 rounded-2xl p-6 flex flex-col justify-between transition-all hover:border-primary hover:shadow-2xl hover:shadow-primary/30 min-h-[220px]">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-primary/30 text-primary border border-primary/50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Oficial
                  </div>
                  <Globe size={24} className="text-blue-400" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Ranking Mundial</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Compara tus predicciones con todos los jugadores del mundo.
                </p>
              </div>
              <div className="mt-auto">
                <Link
                  href="/group/global"
                  className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <Trophy size={18} className="text-yellow-400" />
                  Ver Tabla Global
                </Link>
              </div>
            </div>

            {/* LISTA DE GRUPOS PRIVADOS */}
            {groups.map(group => {
              if (group.isGlobal) return null;
              return (
                <GroupCard
                  key={group.id}
                  group={group}
                  currentUserId={user?.uid}
                  onRename={() => openRenameModal(group)}
                />
              );
            })}

            {/* EMPTY STATE */}
            {groups.length === 0 && (
              <div className="col-span-full md:col-span-2 lg:col-span-2 text-center py-12 bg-surface/30 rounded-2xl border border-white/5 border-dashed flex flex-col items-center justify-center min-h-[220px]">
                <Users className="text-gray-600 mb-4" size={48} />
                <h3 className="text-xl font-bold text-gray-400">No tienes ligas privadas</h3>
                <p className="text-gray-500 mt-2">¡Crea una para competir solo con tus amigos!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- MODALES --- */}
      {/* ... Mismos modales de antes (Create, Join, Rename) ... */}

      {/* MODAL CREAR */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">Crear Nueva Liga</h3>
            <form onSubmit={handleCreateGroup}>
              <div className="mb-6">
                <label className="block text-gray-400 text-sm mb-2">Nombre de la Liga</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-deep border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary placeholder-gray-600"
                  placeholder="Ej: Los Vengadores"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-bold transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-primary hover:bg-primary-light text-white py-3 rounded-lg font-bold flex justify-center items-center transition-colors">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Crear Liga"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL UNIRSE */}
      {showJoinModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">Unirse a una Liga</h3>
            <form onSubmit={handleJoinGroup}>
              <div className="mb-6">
                <label className="block text-gray-400 text-sm mb-2">Código de Invitación</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full bg-deep border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary uppercase tracking-widest text-center font-mono text-xl placeholder-gray-700"
                  placeholder="X7Y9Z2"
                  maxLength={6}
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowJoinModal(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-bold transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-primary hover:bg-primary-light text-white py-3 rounded-lg font-bold flex justify-center items-center transition-colors">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Unirse"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RENOMBRAR */}
      {showRenameModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">Renombrar Liga</h3>
            <form onSubmit={handleRenameGroup}>
              <div className="mb-6">
                <label className="block text-gray-400 text-sm mb-2">Nuevo Nombre</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-deep border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowRenameModal(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-bold transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-primary hover:bg-primary-light text-white py-3 rounded-lg font-bold flex justify-center items-center transition-colors">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// --- COMPONENTE TARJETA DE GRUPO ---
function GroupCard({ group, currentUserId, onRename }: { group: any, currentUserId?: string, onRename: () => void }) {
  const [copied, setCopied] = useState(false);
  const isOwner = currentUserId === group.ownerId;

  const handleCopyCode = () => {
    const code = group.code || group.inviteCode;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Código copiado");
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const displayCode = group.code || group.inviteCode;

  return (
    <div className="bg-surface border border-white/10 rounded-2xl p-6 flex flex-col transition-all hover:border-white/20 hover:shadow-xl group-hover:scale-[1.01] min-h-[220px]">
      <div className="flex justify-between items-start mb-4">
        <div className="bg-deep/50 p-3 rounded-xl border border-white/5">
          <Users className="text-primary" size={24} />
        </div>
        {group.isPublic ? (
          <span className="bg-green-500/10 text-green-400 text-xs px-2 py-1 rounded-full border border-green-500/20">Público</span>
        ) : (
          <span className="bg-yellow-500/10 text-yellow-400 text-xs px-2 py-1 rounded-full border border-yellow-500/20">Privado</span>
        )}
      </div>

      <div className="mb-4 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-xl font-bold text-white truncate max-w-[200px]">{group.name}</h3>
          {isOwner && (
            <button
              onClick={(e) => { e.preventDefault(); onRename(); }}
              className="text-gray-500 hover:text-white transition-colors p-1"
              title="Renombrar grupo"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>

        {isOwner ? (
          <p className="text-sm text-primary font-semibold flex items-center gap-1">
            <Trophy size={12} /> Tú eres el admin
          </p>
        ) : (
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <span>de</span>
            <span className="text-gray-300 font-medium truncate max-w-[150px]">{group.ownerName || "Desconocido"}</span>
          </p>
        )}
      </div>

      <div className="space-y-3 mt-auto">
        <Link
          href={`/group/${group.id}`}
          className="block w-full bg-white/5 hover:bg-white/10 text-white text-center py-2 rounded-lg font-bold transition-colors border border-white/5"
        >
          Ver Tabla
        </Link>

        {displayCode && (
          <button
            onClick={handleCopyCode}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all border ${copied
                ? "bg-green-500/20 border-green-500/50 text-green-400"
                : "bg-deep border-white/10 text-gray-400 hover:text-white hover:border-white/30"
              }`}
          >
            {copied ? (
              <>
                <Check size={16} />
                Copiado
              </>
            ) : (
              <>
                <Copy size={16} />
                Código: <span className="font-mono text-white tracking-wider ml-1">{displayCode}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}