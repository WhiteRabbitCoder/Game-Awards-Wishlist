import { db } from "@/lib/firebase";
import {
    doc,
    setDoc,
    deleteDoc,
    collection,
    serverTimestamp,
    runTransaction,
    getDoc,
    writeBatch
} from "firebase/firestore";

// --- Tipos ---
export type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';

// --- Funciones Principales ---

/**
 * Envía una solicitud de amistad.
 * Crea un documento en `users/{targetId}/friend_requests/{currentUserId}`
 * y otro en `users/{currentUserId}/sent_requests/{targetId}`.
 */
export const sendFriendRequest = async (currentUserId: string, targetUserId: string, currentUserData: { username: string, photoURL?: string }) => {
    try {
        const batch = writeBatch(db);

        // 1. Crear solicitud en el perfil del destino (Incoming)
        const requestRef = doc(db, "users", targetUserId, "friend_requests", currentUserId);
        batch.set(requestRef, {
            uid: currentUserId,
            username: currentUserData.username,
            photoURL: currentUserData.photoURL || null,
            timestamp: serverTimestamp(),
            status: "pending"
        });

        // 2. Registrar envío en el perfil actual (Outgoing)
        const sentRef = doc(db, "users", currentUserId, "sent_requests", targetUserId);
        batch.set(sentRef, {
            uid: targetUserId,
            timestamp: serverTimestamp(),
            status: "pending"
        });

        await batch.commit();
        return true;
    } catch (error) {
        console.error("Error sending friend request:", error);
        throw error;
    }
};

/**
 * Acepta una solicitud de amistad.
 * Usa una transacción para asegurar que la amistad sea recíproca y
 * se limpien las solicitudes pendientes en ambos lados.
 */
export const acceptFriendRequest = async (currentUserId: string, targetUserId: string) => {
    try {
        await runTransaction(db, async (transaction) => {
            // Referencias
            const currentUserRef = doc(db, "users", currentUserId);
            const targetUserRef = doc(db, "users", targetUserId);

            const friendship1Ref = doc(db, "users", currentUserId, "friends", targetUserId);
            const friendship2Ref = doc(db, "users", targetUserId, "friends", currentUserId);

            const requestRef = doc(db, "users", currentUserId, "friend_requests", targetUserId);
            const sentRef = doc(db, "users", targetUserId, "sent_requests", currentUserId);

            // Leer contadores actuales
            const currentUserDoc = await transaction.get(currentUserRef);
            const targetUserDoc = await transaction.get(targetUserRef);

            const currentCount = currentUserDoc.data()?.friendsCount || 0;
            const targetCount = targetUserDoc.data()?.friendsCount || 0;

            // Operaciones
            // 1. Crear amistad bidireccional
            transaction.set(friendship1Ref, { timestamp: serverTimestamp() });
            transaction.set(friendship2Ref, { timestamp: serverTimestamp() });

            // 2. Eliminar solicitudes pendientes
            transaction.delete(requestRef);
            transaction.delete(sentRef);

            // 3. Actualizar contadores
            transaction.update(currentUserRef, { friendsCount: currentCount + 1 });
            transaction.update(targetUserRef, { friendsCount: targetCount + 1 });
        });
        return true;
    } catch (error) {
        console.error("Error accepting friend request:", error);
        throw error;
    }
};

/**
 * Rechaza (o cancela) una solicitud de amistad.
 * Elimina los documentos de solicitud de ambos lados.
 */
export const rejectFriendRequest = async (currentUserId: string, targetUserId: string) => {
    try {
        const batch = writeBatch(db);

        // Eliminar incoming request
        const requestRef = doc(db, "users", currentUserId, "friend_requests", targetUserId);
        batch.delete(requestRef);

        // Eliminar outgoing request del otro usuario
        const sentRef = doc(db, "users", targetUserId, "sent_requests", currentUserId);
        batch.delete(sentRef);

        await batch.commit();
        return true;
    } catch (error) {
        console.error("Error rejecting friend request:", error);
        throw error;
    }
};

/**
 * Elimina a un amigo.
 * Usa transacción para eliminar de ambos lados y actualizar contadores.
 */
export const removeFriend = async (currentUserId: string, targetUserId: string) => {
    try {
        await runTransaction(db, async (transaction) => {
            const currentUserRef = doc(db, "users", currentUserId);
            const targetUserRef = doc(db, "users", targetUserId);

            const friendship1Ref = doc(db, "users", currentUserId, "friends", targetUserId);
            const friendship2Ref = doc(db, "users", targetUserId, "friends", currentUserId);

            // Leer contadores
            const currentUserDoc = await transaction.get(currentUserRef);
            const targetUserDoc = await transaction.get(targetUserRef);

            const currentCount = currentUserDoc.data()?.friendsCount || 0;
            const targetCount = targetUserDoc.data()?.friendsCount || 0;

            // Eliminar amistad
            transaction.delete(friendship1Ref);
            transaction.delete(friendship2Ref);

            // Decrementar contadores (evitar negativos)
            transaction.update(currentUserRef, { friendsCount: Math.max(0, currentCount - 1) });
            transaction.update(targetUserRef, { friendsCount: Math.max(0, targetCount - 1) });
        });
        return true;
    } catch (error) {
        console.error("Error removing friend:", error);
        throw error;
    }
};

/**
 * Acepta TODAS las solicitudes de amistad pendientes.
 * Itera sobre las solicitudes y ejecuta transacciones individuales (seguro)
 * O podría ser un gran batch, pero para actualizar contadores es mejor transacción.
 * Dado el límite de batch, lo haremos iterativo por simplicidad y seguridad de datos.
 */
export const acceptAllFriendRequests = async (currentUserId: string, requests: any[]) => {
    // requests es un array de objetos { uid: senderId, ... }
    const promises = requests.map(req => acceptFriendRequest(currentUserId, req.uid));
    await Promise.all(promises);
    return true;
};
