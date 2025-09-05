export enum Role {
    Founder = 'Founder',
    Developer = 'Developer',
    Investor = 'Investor',
}

export interface InvestorProfile {
    interestedDomains: string[];
    investmentExperience: string;
    budget: {
        min: number;
        max: number;
    };
    expectedEquity: {
        min: number;
        max: number;
    };
}

export interface User {
    id: string; // Firebase UID
    email: string;
    phone?: string;
    name: string;
    role: Role;
    location: string;
    dateOfBirth: string;
    gender: string;
    skills: string[];
    interests: string[];
    lookingFor: string;
    experience?: string;
    avatarUrl: string;
    connections: string[];
    pendingConnections?: string[];
    investorProfile?: InvestorProfile;
}

export interface Match {
    userId: string; // Firebase UID
    compatibilityScore: number;
    justification: string;
}

export interface EnrichedMatch extends Match {
    user: User;
    isConnected: boolean;
    isPending: boolean;
}

export interface Offer {
    investment: number;
    equity: number;
    by: 'founder' | 'investor';
    timestamp: Date;
}

export interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: Date;
}

export enum View {
    LANDING = 'LANDING',
    AUTH = 'AUTH',
    ONBOARDING = 'ONBOARDING',
    DASHBOARD = 'DASHBOARD',
    ANALYTICS = 'ANALYTICS',
    MESSAGES = 'MESSAGES',
    PEOPLE = 'PEOPLE',
    IDEAS = 'IDEAS',
    NEGOTIATIONS = 'NEGOTIATIONS',
    PROFILE = 'PROFILE',
    NOTIFICATIONS = 'NOTIFICATIONS',
    CONNECTIONS = 'CONNECTIONS',
}

export interface AnalyticsData {
    userEngagement: {
        dailyActiveUsers: number;
        monthlyActiveUsers: number;
        averageSessionDuration: number; // in minutes
    };
    matchSuccess: {
        totalMatchesMade: number;
        successfulConnections: number;
        successRate: number; // percentage
    };
    platformPerformance: {
        dau_data: { name: string; users: number }[];
        match_rate_data: { name: string; rate: number }[];
    };
}

// Notification types
export enum NotificationType {
    CONNECTION_REQUEST = 'connection_request',
    MESSAGE = 'message',
    NEGOTIATION_UPDATE = 'negotiation_update',
    NEW_NEGOTIATION = 'new_negotiation'
}

export interface Notification {
    id: string;
    userId: string; // recipient user ID
    type: NotificationType;
    title: string;
    message: string;
    data?: {
        connectionRequestId?: string;
        chatId?: string;
        negotiationId?: string;
        senderId?: string;
        senderName?: string;
        responseStatus?: 'approved' | 'rejected';
        respondedAt?: Date;
    };
    isRead: boolean;
    timestamp: Date;
    createdAt: Date;
}

// Analytics tracking interfaces
export interface UserSession {
    id: string;
    userId: string;
    startTime: Date;
    endTime?: Date;
    duration?: number; // in minutes
}

export interface UserActivity {
    id: string;
    userId: string;
    action: 'login' | 'logout' | 'find_matches' | 'view_profile' | 'send_message' | 'view_ideas' | 'post_idea' | 'join_idea';
    timestamp: Date;
    metadata?: any;
}

export interface MatchRecord {
    id: string;
    userId: string;
    matchedUserId: string;
    timestamp: Date;
    compatibilityScore: number;
    status: 'pending' | 'connected' | 'declined';
}

export interface Chat {
    id: string;
    participants: string[];
    lastMessage: Message | null;
    participantDetails: User[];
    unreadCounts: { [key: string]: number };
}

export interface Idea {
    id: string;
    founderId: string;
    founderName: string;
    founderAvatar: string;
    title: string;
    description: string;
    requiredSkills: string[];
    status: 'recruiting' | 'building';
    visibility: 'public' | 'private'; // NEW: Controls who can see the idea
    team: string[]; // Array of user IDs
    likes: string[]; // Array of user IDs
    comments: Comment[];
    investmentDetails?: {
        targetInvestment: number;
        equityOffered: number; // percentage
    };
}

export interface IdeaJoinRequest {
    id: string;
    ideaId: string;
    ideaTitle: string;
    developerId: string;
    developerName: string;
    developerAvatar: string;
    founderId: string;
    status: 'pending' | 'approved' | 'rejected';
    timestamp: Date;
}

export interface Negotiation {
    id: string;
    ideaId: string;
    ideaTitle: string;
    investorId: string;
    investorName: string;
    investorAvatar: string;
    founderId: string;
    founderName: string;
    status: 'pending' | 'active' | 'closed' | 'rejected' | 'accepted';
    timestamp: Date;
    offers: Offer[];
    finalInvestment?: number;
    finalEquity?: number;
    isRead?: boolean;
    ideaInvestmentDetails?: {
        targetInvestment: number;
        equityOffered: number; // percentage
    };
}

export interface ConnectionRequest {
    id: string;
    fromUserId: string;
    fromUserName: string;
    fromUserAvatar: string;
    fromUserRole: Role;
    toUserId: string;
    status: 'pending' | 'approved' | 'rejected';
    timestamp: Date;
}

export interface Comment {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    text: string;
    timestamp: Date;
}