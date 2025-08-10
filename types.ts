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
    name: string;
    role: Role;
    location: string;
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
    REQUESTS = 'REQUESTS',
    NEGOTIATIONS = 'NEGOTIATIONS',
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
    status: 'pending' | 'active' | 'closed' | 'rejected';
    timestamp: Date;
    offers: Offer[];
    isRead?: boolean;
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