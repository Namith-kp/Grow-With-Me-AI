import React, { useEffect, useState } from 'react';
import { firestoreService } from '../services/firestoreService';
import { getSafeAvatarUrl, getUserInitials } from '../utils/avatar';

interface FounderAvatarProps {
    founderId: string;
    founderName: string;
}

const FounderAvatar: React.FC<FounderAvatarProps> = ({ founderId, founderName }) => {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [customAvatar, setCustomAvatar] = useState<boolean>(false);

    useEffect(() => {
        let isMounted = true;
        firestoreService.getUserProfile(founderId).then(profile => {
            if (isMounted && profile) {
                const safeUrl = getSafeAvatarUrl(profile);
                setAvatarUrl(safeUrl);
                setCustomAvatar(!!profile.customAvatar);
            }
        });
        return () => { isMounted = false; };
    }, [founderId]);

    if (avatarUrl) {
        return (
            <img src={avatarUrl} alt={founderName} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-slate-700 shrink-0 shadow-lg" />
        );
    }
    return (
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-slate-700 shrink-0 shadow-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-xs sm:text-sm font-bold">
            {getUserInitials(founderName)}
        </div>
    );
};

export default FounderAvatar;