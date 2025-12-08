export interface Nominee {
    id: string;
    name: string;
    info?: string; // Desarrollador o info extra
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
    firstPlace: string | null;  // ID del juego
    secondPlace: string | null; // ID del juego
    thirdPlace: string | null;  // ID del juego
}