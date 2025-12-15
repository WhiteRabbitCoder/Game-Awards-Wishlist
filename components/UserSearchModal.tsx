"use client";

import { useState, useEffect } from "react";
import { X, Search, User, Loader2, ChevronRight } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface UserSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SearchResult {
    uid: string;
    username: string;
    photoURL?: string;
    displayName?: string;
}

export default function UserSearchModal({ isOpen, onClose }: UserSearchModalProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [allUsers, setAllUsers] = useState<SearchResult[]>([]);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    // Reset al cerrar
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm("");
            setResults([]);
        }
    }, [isOpen]);

    // Cargar todos los usuarios al abrir el modal (para búsqueda local case-insensitive)
    useEffect(() => {
        if (isOpen && allUsers.length === 0) {
            const fetchUsers = async () => {
                setLoading(true);
                try {
                    const usersRef = collection(db, "users");
                    // Obtenemos todos los usuarios para filtrar localmente.
                    const querySnapshot = await getDocs(usersRef);
                    const users: SearchResult[] = [];
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        users.push({
                            uid: doc.id,
                            username: data.username || "Usuario",
                            photoURL: data.photoURL,
                            displayName: data.displayName
                        });
                    });
                    setAllUsers(users);
                    setLoading(false);
                } catch (error) {
                    console.error("Error cargando usuarios:", error);
                    setLoading(false);
                }
            };
            fetchUsers();
        }
    }, [isOpen, allUsers.length]);

    // Búsqueda Local Case-Insensitive
    useEffect(() => {
        if (searchTerm.length < 1) {
            setResults([]);
            return;
        }

        const term = searchTerm.toLowerCase();

        // Filtramos localmente
        const filtered = allUsers.filter(user =>
            user.username.toLowerCase().includes(term) ||
            (user.displayName && user.displayName.toLowerCase().includes(term))
        );

        setResults(filtered.slice(0, 5)); // Limitamos a 5 resultados
    }, [searchTerm, allUsers]);

    if (!isOpen) return null;

    const handleNavigate = (username: string) => {
        router.push(`/profile/${username}`);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-24 px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300">

                {/* Header / Input */}
                <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-deep/50">
                    <Search className="text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar usuarios por nombre..."
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Resultados */}
                <div className="p-2 max-h-[60vh] overflow-y-auto min-h-[100px] bg-deep/95">
                    {loading ? (
                        <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
                            <Loader2 className="animate-spin" size={18} /> Buscando...
                        </div>
                    ) : results.length > 0 ? (
                        <div className="space-y-1">
                            {results.map((user) => (
                                <button
                                    key={user.uid}
                                    onClick={() => handleNavigate(user.username)}
                                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-deep border border-white/10 overflow-hidden shrink-0">
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt={user.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500 text-xs font-bold">
                                                {user.username[0].toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-white group-hover:text-primary transition-colors">{user.username}</p>
                                        {user.displayName && <p className="text-xs text-gray-500">{user.displayName}</p>}
                                    </div>
                                    <ChevronRight size={16} className="text-gray-600 group-hover:text-white transition-colors" />
                                </button>
                            ))}
                        </div>
                    ) : searchTerm.length >= 1 ? (
                        <div className="text-center py-8 text-gray-500">
                            <User className="mx-auto mb-2 opacity-50" size={24} />
                            No se encontraron usuarios
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-600 text-sm">
                            Empieza a escribir para buscar
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
