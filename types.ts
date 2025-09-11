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
    username: string; // Unique username for each user
    role: Role;
    location: string; // Keep for backward compatibility
    country?: string; // New separate location fields
    state?: string;
    city?: string;
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
    customAvatar?: boolean; // Flag to indicate if user has uploaded a custom avatar
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

export interface NearMatch {
    userId: string;
    proximityScore: number; // 0-100 similar to compatibility but below threshold
    missingSignals: string[]; // e.g., ["different location", "no overlapping skills"]
    justification: string; // concise reason why close
}

export interface EnrichedNearMatch extends NearMatch {
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
    NEW_NEGOTIATION = 'new_negotiation',
    JOIN_REQUEST = 'join_request',
    JOIN_REQUEST_RESPONSE = 'join_request_response',
    MATCH_ALERT = 'match_alert'
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
        joinRequestId?: string;
        ideaId?: string;
        ideaTitle?: string;
        developerId?: string;
        developerName?: string;
        founderId?: string;
        founderName?: string;
        alertId?: string;
        matchedUserId?: string;
        matchedUserName?: string;
    };
    isRead: boolean;
    timestamp: Date;
    createdAt: Date;
}

// User-configurable matching alerts
export interface MatchAlert {
    id: string;
    userId: string; // owner of this alert
    createdAt: Date;
    isActive: boolean;
    // Criteria fields (all optional, interpreted with AND logic if provided)
    roles?: Role[];
    locations?: string[]; // city/state/country strings
    interests?: string[];
    skills?: string[];
    minExperienceYears?: number;
    investorDomains?: string[]; // for founders looking for investors
    minIdeaCount?: number;
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
    founderUsername?: string;
    founderAvatar: string;
    founderCustomAvatar?: boolean; // Flag to indicate if founder has custom avatar
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
    founderName: string;
    status: 'pending' | 'approved' | 'rejected';
    timestamp: Date;
}

export interface Negotiation {
    id: string;
    ideaId: string;
    ideaTitle: string;
    investorId: string;
    investorName: string;
    investorUsername?: string;
    investorAvatar: string;
    founderId: string;
    founderName: string;
    founderUsername?: string;
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