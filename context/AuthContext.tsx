"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
    onAuthStateChanged,
    User,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    AuthError
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    loginWithGoogle: () => Promise<void>;
    loginWithEmail: (email: string, pass: string) => Promise<void>;
    signupWithEmail: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            // Si hay un usuario autenticado, sincronizar su photoURL con Firestore
            if (currentUser && currentUser.photoURL) {
                try {
                    const userDocRef = doc(db, "users", currentUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        // Si el documento existe pero no tiene photoURL, actualizarla
                        if (!userData.photoURL && currentUser.photoURL) {
                            await setDoc(userDocRef, {
                                photoURL: currentUser.photoURL
                            }, { merge: true });
                            console.log("PhotoURL sincronizada con Firestore");
                        }
                    }
                } catch (error) {
                    console.error("Error sincronizando photoURL:", error);
                }
            }

            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);

        // Guardar/actualizar la photoURL inmediatamente después del login con Google
        if (result.user.photoURL) {
            try {
                const userDocRef = doc(db, "users", result.user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    // Actualizar photoURL si el documento existe
                    await setDoc(userDocRef, {
                        photoURL: result.user.photoURL
                    }, { merge: true });
                }
            } catch (error) {
                console.error("Error guardando photoURL de Google:", error);
            }
        }
    };

    const loginWithEmail = async (email: string, pass: string) => {
        await signInWithEmailAndPassword(auth, email, pass);
    };

    const signupWithEmail = async (email: string, pass: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        // Enviar correo de verificación inmediatamente después de crear la cuenta
        await sendEmailVerification(userCredential.user);
    };

    const logout = async () => {
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, signupWithEmail, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};