"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";
import { collection, doc, getDocs, query, updateDoc, where, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User, Save, ArrowLeft, Camera, Check, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

// ENLACE DIRECTO A TU LOGO
const DEFAULT_AVATAR = "https://i.postimg.cc/d0hTX4t8/Default-Profile-Image.png";

const PRESET_AVATARS = [
    // --- Clásicos y por defecto ---
    DEFAULT_AVATAR,
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Robot1",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Gamer1",

    // --- Románticos ---
    "https://api.dicebear.com/7.x/fun-emoji/svg?seed=heart-eyes",
    "https://api.dicebear.com/7.x/fun-emoji/svg?seed=kissing-heart",
    "https://api.dicebear.com/7.x/icons/svg?seed=heart",

    // --- Animales ---
    "https://api.dicebear.com/7.x/micah/svg?seed=Bear",
    "https://api.dicebear.com/7.x/micah/svg?seed=Fox",
    "https://api.dicebear.com/7.x/micah/svg?seed=Panda",
    "https://api.dicebear.com/7.x/micah/svg?seed=Tiger",

    // --- Fantasía y Aventura ---
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Wizard",
    "https://api.dicebear.com/7.x/lorelei/svg?seed=Elf",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Cyborg",
    "https://api.dicebear.com/7.x/pixel-art/svg?seed=Knight",

    // --- Minimalistas y Abstractos ---
    "https://api.dicebear.com/7.x/shapes/svg?seed=Diamond",
    "https://api.dicebear.com/7.x/shapes/svg?seed=Polygon",
    "https://api.dicebear.com/7.x/initials/svg?seed=A",
    "https://api.dicebear.com/7.x/rings/svg?seed=Ring",

    // --- Divertidos ---
    "https://api.dicebear.com/7.x/fun-emoji/svg?seed=ghost",
    "https://api.dicebear.com/7.x/fun-emoji/svg?seed=exploding-head",
    "https://api.dicebear.com/7.x/fun-emoji/svg?seed=alien",
    "https://api.dicebear.com/7.x/fun-emoji/svg?seed=joystick",
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
        <div className="max-w-2xl mx-auto p-4 md:p-8 pt-24 md:pt-28">
            <div className="flex justify-between items-center mb-10">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-primary transition-colors group">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Volver al inicio
                </Link>
                {user?.displayName && (
                    <Link href={`/profile/${user.displayName.toLowerCase()}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-primary transition-colors group">
                        Ver mi perfil <User size={20} className="group-hover:scale-110 transition-transform" />
                    </Link>
                )}
            </div>

            <h1 className="text-4xl md:text-5xl font-brush text-center mb-10 tracking-wide bg-gradient-to-r from-primary via-cyber-neon to-retro-accent bg-clip-text text-transparent">
                Ajusta tu Perfil
            </h1>

            <form onSubmit={handleSave} className="space-y-10">

                {/* Sección Avatar */}
                <div className="relative p-px rounded-xl bg-gradient-to-b from-white/10 to-transparent">
                    <div className="bg-deep p-6 rounded-[11px]">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-white">
                            <Camera size={22} className="text-cyber-neon" />
                            Elige tu Avatar
                        </h2>

                        <div className="flex flex-col items-center mb-6">
                            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-cyber-neon/50 shadow-lg mb-4 relative group ring-4 ring-cyber-neon/20">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={selectedAvatar}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                            {PRESET_AVATARS.map((avatarUrl, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => setSelectedAvatar(avatarUrl)}
                                    className={`relative rounded-full overflow-hidden aspect-square border-2 transition-all duration-300 hover:scale-110 hover:shadow-neon ${selectedAvatar === avatarUrl ? "border-cyber-neon ring-2 ring-cyber-neon/50" : "border-gray-700 hover:border-cyber-neon/50"
                                        }`}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={avatarUrl} alt={`Avatar ${index}`} className="w-full h-full object-cover" />
                                    {selectedAvatar === avatarUrl && (
                                        <div className="absolute inset-0 bg-cyber-neon/40 flex items-center justify-center">
                                            <Check size={20} className="text-white drop-shadow-lg" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sección Datos Personales */}
                <div className="relative p-px rounded-xl bg-gradient-to-b from-white/10 to-transparent">
                    <div className="bg-deep p-6 rounded-[11px]">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-white">
                            <Sparkles size={22} className="text-primary" />
                            Información Pública
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Nombre de Usuario
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">@</span>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-gray-950 border-2 border-gray-700 rounded-lg py-3 pl-9 pr-4 focus:border-primary focus:ring-2 focus:ring-primary/50 outline-none font-medium text-white placeholder-gray-600 transition-all"
                                        placeholder="tu_nombre_de_invocador"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Correo Electrónico
                                </label>
                                <input
                                    type="email"
                                    value={user?.email || ""}
                                    disabled
                                    className="w-full bg-gray-950/50 border-2 border-gray-800 rounded-lg py-3 px-4 text-gray-500 cursor-not-allowed select-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full group relative font-bold text-lg text-white bg-gradient-to-r from-primary to-primary-light py-4 rounded-full shadow-lg hover:shadow-gold-glow transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={20} /> Guardando...
                        </>
                    ) : (
                        <>
                            <Save size={20} className="group-hover:rotate-12 transition-transform" /> Guardar Cambios
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}