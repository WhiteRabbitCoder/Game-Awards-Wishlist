"use client";

import { useState, useEffect } from "react";
import { User, Check, X, Users, Trash2 } from "lucide-react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { acceptFriendRequest, rejectFriendRequest, acceptAllFriendRequests } from "@/lib/social";
import Link from "next/link";
import toast from "react-hot-toast";

interface NotificationsModalProps {
    onClose: () => void;
}

export default function NotificationsModal({ onClose }: NotificationsModalProps) {
    const { user } = useAuth();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "users", user.uid, "friend_requests"),
            orderBy("timestamp", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRequests(reqs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleAccept = async (senderId: string) => {
        if (!user || processing) return;
        setProcessing(true);
        try {
            await acceptFriendRequest(user.uid, senderId);
            toast.success("¡Solicitud aceptada!");
        } catch (error) {
            toast.error("Error al aceptar solicitud");
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async (senderId: string) => {
        if (!user || processing) return;
        setProcessing(true);
        try {
            await rejectFriendRequest(user.uid, senderId);
            toast.success("Solicitud rechazada");
        } catch (error) {
            toast.error("Error al rechazar");
        } finally {
            setProcessing(false);
        }
    };

    const handleAcceptAll = async () => {
        if (!user || processing || requests.length === 0) return;
        setProcessing(true);
        try {
            await acceptAllFriendRequests(user.uid, requests);
            toast.success(`¡${requests.length} solicitudes aceptadas!`);
        } catch (error) {
            toast.error("Error al aceptar solicitudes");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-deep border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in slide-in-from-top-10 duration-300 mt-16 backdrop-blur-xl">

                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
                    <div className="flex items-center gap-2 text-white">
                        <Users size={18} className="text-primary" />
                        <h3 className="font-bold">Solicitudes de Amistad</h3>
                        <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full font-bold ml-1">
                            {requests.length}
                        </span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X size={18} className="text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {loading ? (
                        <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
                    ) : requests.length === 0 ? (
                        <div className="p-8 text-center flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                <Users size={24} className="text-gray-600" />
                            </div>
                            <p className="text-gray-500 text-sm">No tienes solicitudes pendientes.</p>
                        </div>
                    ) : (
                        requests.map((req) => (
                            <div key={req.id} className="bg-white/5 p-3 rounded-xl flex items-center gap-3 group hover:bg-white/10 transition-colors border border-transparent hover:border-white/10">
                                <Link href={`/profile/${req.username}`} onClick={onClose} className="relative w-10 h-10 flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center overflow-hidden border border-white/10">
                                        {req.photoURL ? (
                                            <img src={req.photoURL} alt={req.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={18} className="text-white/50" />
                                        )}
                                    </div>
                                </Link>

                                <div className="flex-1 min-w-0">
                                    <Link href={`/profile/${req.username}`} onClick={onClose} className="text-sm font-bold text-white hover:text-primary truncate block transition-colors">
                                        {req.username}
                                    </Link>
                                    <p className="text-xs text-gray-500">quiere ser tu amigo</p>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleAccept(req.uid)}
                                        disabled={processing}
                                        className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors disabled:opacity-50"
                                        title="Aceptar"
                                    >
                                        <Check size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleReject(req.uid)}
                                        disabled={processing}
                                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                                        title="Rechazar"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Actions */}
                {requests.length > 0 && (
                    <div className="p-3 border-t border-white/10 bg-black/20">
                        <button
                            onClick={handleAcceptAll}
                            disabled={processing}
                            className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 py-2 rounded-lg text-sm font-bold transition-all hover:scale-[1.02] disabled:opacity-50"
                        >
                            <Users size={16} />
                            Aceptar a Todos
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
