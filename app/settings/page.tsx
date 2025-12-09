"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";
import { collection, doc, getDocs, query, updateDoc, where, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User, Save, ArrowLeft, Camera, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

// ENLACE DIRECTO A TU LOGO
const DEFAULT_AVATAR = "https://i.postimg.cc/d0hTX4t8/Default-Profile-Image.png";

const PRESET_AVATARS = [
    DEFAULT_AVATAR,
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Robot1",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Robot2",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Gamer1",
    "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Mario",
    "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Luigi",
];

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATAR);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Cargar datos actuales
  useEffect(() => {
    const loadUserData = async () => {
        if (!user) return;
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setUsername(data.username || "");
                setSelectedAvatar(data.photoURL || user.photoURL || DEFAULT_AVATAR);
            }
        } catch (err) {
            console.error(err);
            toast.error("Error al cargar datos del usuario");
        } finally {
            setInitialLoading(false);
        }
    };

    if (!authLoading) {
        if (!user) router.push("/login");
        else loadUserData();
    }
  }, [user, authLoading, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    const cleanUsername = username.trim().toLowerCase();
    const displayUsername = username.trim();

    if (cleanUsername.length < 3) {
        toast.error("El nombre de usuario es muy corto");
        setLoading(false);
        return;
    }
    // Permitimos letras, números, guiones bajos y puntos
    if (!/^[a-zA-Z0-9_.]+$/.test(cleanUsername)) {
        toast.error("Solo letras, números, guiones bajos y puntos");
        setLoading(false);
        return;
    }

    try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const currentData = userSnap.data();
        const currentUsername = currentData?.username;

        if (cleanUsername !== currentUsername) {
            const q = query(collection(db, "users"), where("username", "==", cleanUsername));
            const check = await getDocs(q);
            if (!check.empty) {
                toast.error("Ese nombre de usuario ya está ocupado");
                setLoading(false);
                return;
            }
        }

        await updateDoc(userRef, {
            username: cleanUsername,
            displayName: displayUsername,
            photoURL: selectedAvatar,
            updatedAt: new Date()
        });

        await updateProfile(user, {
            displayName: displayUsername,
            photoURL: selectedAvatar
        });

        toast.success("Perfil actualizado correctamente");
        
        setTimeout(() => {
            window.location.reload();
        }, 1000);

    } catch (err) {
        console.error(err);
        toast.error("Error al guardar los cambios");
    } finally {
        setLoading(false);
    }
  };

  if (authLoading || initialLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center text-white">
            <Loader2 className="animate-spin mr-2" /> Cargando...
        </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft size={20} /> Volver al inicio
        </Link>

        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3 text-white">
            <User className="text-blue-500" size={32} />
            Configuración de Perfil
        </h1>

        <form onSubmit={handleSave} className="space-y-8">
            
            {/* Sección Avatar */}
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                    <Camera size={20} className="text-gray-400" />
                    Elige tu Avatar
                </h2>
                
                <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-gray-800 overflow-hidden border-4 border-blue-500 shadow-lg mb-4 relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                            src={selectedAvatar} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }} 
                        />
                    </div>
                    <p className="text-sm text-gray-400">Vista previa</p>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                    {PRESET_AVATARS.map((avatarUrl, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => setSelectedAvatar(avatarUrl)}
                            className={`relative rounded-full overflow-hidden aspect-square border-2 transition-all hover:scale-110 ${
                                selectedAvatar === avatarUrl ? "border-blue-500 ring-2 ring-blue-500/50" : "border-gray-700 hover:border-gray-500"
                            }`}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={avatarUrl} alt={`Avatar ${index}`} className="w-full h-full object-cover" />
                            {selectedAvatar === avatarUrl && (
                                <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center">
                                    <Check size={16} className="text-white drop-shadow-md" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sección Datos Personales */}
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                <h2 className="text-xl font-bold mb-4 text-white">Información Pública</h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Nombre de Usuario
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-500 font-bold">@</span>
                            <input 
                                type="text" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-gray-950 border border-gray-700 rounded-lg py-2.5 pl-8 pr-4 focus:border-blue-500 outline-none font-medium text-white placeholder-gray-600"
                                placeholder="usuario_gamer"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Correo Electrónico
                        </label>
                        <input 
                            type="email" 
                            value={user?.email || ""}
                            disabled
                            className="w-full bg-gray-950/50 border border-gray-800 rounded-lg py-2.5 px-4 text-gray-500 cursor-not-allowed select-none"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Para cambiar tu correo o contraseña, contacta con soporte o espera a futuras actualizaciones de seguridad.
                        </p>
                    </div>
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
                {loading ? (
                    <>
                        <Loader2 className="animate-spin" size={20} /> Guardando...
                    </>
                ) : (
                    <>
                        <Save size={20} /> Guardar Cambios
                    </>
                )}
            </button>
        </form>
    </div>
  );
}