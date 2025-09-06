import React, { useState, useEffect } from 'react';
import { Idea, User } from '../types';
import { firestoreService } from '../services/firestoreService';
import { XIcon, TrashIcon } from './icons';
import { getSafeAvatarUrl, getUserInitials } from '../utils/avatar';

interface TeamManagementModalProps {
    idea: Idea;
    onClose: () => void;
    onTeamUpdated: () => void;
}

const TeamManagementModal: React.FC<TeamManagementModalProps> = ({ idea, onClose, onTeamUpdated }) => {
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTeamMembers = async () => {
            setIsLoading(true);
            const memberProfiles = await Promise.all(
                idea.team.map(memberId => firestoreService.getUserProfile(memberId))
            );
            setTeamMembers(memberProfiles.filter((p): p is User => p !== null));
            setIsLoading(false);
        };

        fetchTeamMembers();
    }, [idea]);

    const handleRemoveMember = async (memberId: string) => {
        if (window.confirm('Are you sure you want to remove this team member?')) {
            try {
                await firestoreService.removeTeamMember(idea.id, memberId);
                onTeamUpdated();
            } catch (error) {
                console.error('Failed to remove team member:', error);
                alert('An error occurred. Please try again.');
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-lg w-full max-w-md relative">
                <div className="p-6 border-b border-neutral-800">
                    <h2 className="text-xl font-bold text-white">Manage Team for "{idea.title}"</h2>
                    <button onClick={onClose} className="absolute top-4 right-4 text-neutral-500 hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6">
                    {isLoading ? (
                        <p className="text-neutral-400">Loading team members...</p>
                    ) : (
                        <ul className="space-y-3">
                            {teamMembers.map(member => (
                                <li key={member.id} className="flex items-center justify-between bg-neutral-800/50 p-3 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {getSafeAvatarUrl(member) ? (
                                            <img src={getSafeAvatarUrl(member)} alt={member.name} className="w-10 h-10 rounded-full" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-sm font-bold">
                                                {getUserInitials(member.name)}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-semibold text-white">{member.name}</p>
                                            <p className="text-sm text-neutral-400">{member.role}</p>
                                        </div>
                                    </div>
                                    {member.id !== idea.founderId && (
                                        <button 
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-full"
                                            aria-label={`Remove ${member.name}`}
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeamManagementModal;
