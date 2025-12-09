export interface Nominee {
    id: string;
    name: string;
    info?: string;
    image?: string;
    winner?: boolean;
}

export interface Category {
    id: string;
    name: string;
    nominees: Nominee[];
}

export interface Vote {
    categoryId: string;
    firstPlace: string | null;
    secondPlace: string | null;
    thirdPlace: string | null;
}

// --- NUEVO: Tipos para Grupos ---
export interface Group {
    id: string;
    name: string;
    ownerId: string; // Quién lo creó
    code: string;    // Código de invitación (ej: "XK9L2M")
    isGlobal?: boolean; // Para identificar el Ranking Mundial
    memberCount?: number; // Dato calculado para mostrar en UI
}