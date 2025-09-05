import { User } from '../types';

// Domains commonly used by Google/Gmail profile photos
const GOOGLE_AVATAR_DOMAINS = [
    'lh3.googleusercontent.com',
    'googleusercontent.com',
    'gstatic.com',
    'ggpht.com',
];

export const isGoogleAvatarUrl = (url?: string | null): boolean => {
    if (!url || typeof url !== 'string') return false;
    try {
        const parsed = new URL(url);
        return GOOGLE_AVATAR_DOMAINS.some((d) => parsed.hostname.endsWith(d));
    } catch {
        // Not a valid URL (could be data URL) -> treat as non-Google custom
        return false;
    }
};

export const getUserInitials = (name?: string | null): string => {
    if (!name || typeof name !== 'string') return 'U';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    const initials = parts.slice(0, 2).map((p) => p[0]).join('');
    return initials.toUpperCase();
};

/**
 * Returns a safe avatar URL to display, ignoring Gmail/Google default avatars.
 * Preference: photoURL -> avatarUrl -> null.
 * If URL is from Google avatar domains, returns null to force initials.
 */
export const getSafeAvatarUrl = (user: Partial<User> | null | undefined): string | null => {
    if (!user) return null;
    const photoURL = (user as any).photoURL as string | undefined;
    const avatarUrl = (user as any).avatarUrl as string | undefined;

    // If there is an explicit customAvatar flag, honor it
    const customAvatar = (user as any).customAvatar as boolean | undefined;
    if (customAvatar && photoURL) return photoURL;

    // Otherwise, reject Google-provided avatars
    if (photoURL && !isGoogleAvatarUrl(photoURL)) return photoURL;
    if (avatarUrl && !isGoogleAvatarUrl(avatarUrl)) return avatarUrl;
    return null;
};



