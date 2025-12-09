"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { Users, Lock, Globe, Plus, Loader2 } from "lucide-react";
import HeroSection from "@/components/HeroSection";

interface Group {
  id: string;
  name: string;
  isPublic: boolean;
  memberCount: number;
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Cargar grupos donde el usuario es miembro
        const groupsRef = collection(db, "groups");
        const snapshot = await getDocs(groupsRef);

        const userGroups: Group[] = [];

        for (const groupDoc of snapshot.docs) {
          const groupData = groupDoc.data();
          const membersSnap = await getDocs(collection(db, "groups", groupDoc.id, "members"));

          const isMember = membersSnap.docs.some(m => m.id === user.uid);

          if (isMember || groupData.isPublic) {
            userGroups.push({
              id: groupDoc.id,
              name: groupData.name,
              isPublic: groupData.isPublic,
              memberCount: membersSnap.size
            });
          }
        }

        setGroups(userGroups);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchGroups();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-deep flex items-center justify-center">
        <Loader2 className="animate-spin text-cyber-neon" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep">
      {/* HERO SECTION */}
      <HeroSection />

      {/* SECCIÓN DE GRUPOS */}
      <div id="grupos" className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Tus Grupos</h2>
            <p className="text-gray-400">Compite con tus amigos y demuestra quién conoce más</p>
          </div>
          {user && (
            <Link
              href="/create-group"
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-light text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform shadow-lg"
            >
              <Plus size={20} />
              Crear Grupo
            </Link>
          )}
        </div>

        {!user ? (
          <div className="text-center py-16 bg-surface rounded-2xl border border-gray-700">
            <Globe size={64} className="mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-bold text-white mb-2">Inicia sesión para ver tus grupos</h3>
            <p className="text-gray-400 mb-6">Únete a la comunidad y compite por el mejor ranking</p>
            <Link
              href="/login"
              className="inline-block bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary-light transition-colors"
            >
              Iniciar Sesión
            </Link>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16 bg-surface rounded-2xl border border-gray-700">
            <Users size={64} className="mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-bold text-white mb-2">Aún no tienes grupos</h3>
            <p className="text-gray-400 mb-6">Crea tu primer grupo o únete a uno existente</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map(group => (
              <Link
                key={group.id}
                href={`/group/${group.id}`}
                className="group bg-surface border border-gray-700 rounded-2xl p-6 hover:border-primary transition-all duration-300 hover:shadow-gold-glow"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                    {group.name}
                  </h3>
                  {group.isPublic ? (
                    <Globe size={20} className="text-green-500" />
                  ) : (
                    <Lock size={20} className="text-gray-500" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Users size={16} />
                  <span>{group.memberCount} miembros</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}