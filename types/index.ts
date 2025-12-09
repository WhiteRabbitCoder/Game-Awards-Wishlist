export interface Nominee {
    id: string;
    name: string;
    info?: string;
    image?: string;
    developer?: string;
    winner?: boolean;
}

export interface Category {
    id: string;
    name: string;
    nominees: Nominee[];
}

export interface Vote {
    categoryId?: string;
    firstPlace: string | null;
    secondPlace: string | null;
    thirdPlace: string | null;
}

export interface UserProfile {
    uid: string;
    username: string;
    email: string;
    photoURL?: string;
    displayName?: string;
    createdAt?: Date;
}

export interface Group {
    id: string;
    name: string;
    ownerId: string;
    code?: string;
    inviteCode?: string;
    isPublic?: boolean;
    isGlobal?: boolean;
    memberCount?: number;
    createdAt?: Date;
}

export interface MemberProfile {
    uid: string;
    username: string;
    photoURL?: string;
    score?: number;
    votesCount?: number;
}