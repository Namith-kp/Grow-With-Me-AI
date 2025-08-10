import React, { useState, useEffect } from 'react';
import { IdeaJoinRequest, User } from '../types';
import { firestoreService } from '../services/firestoreService';
import { CheckIcon, XIcon, UsersIcon } from './icons';
import ProfileCard from './ProfileCard';

interface JoinRequestsProps {
    user: User;
    onRequestsUpdated: () => void;
}

const JoinRequests: React.FC<JoinRequestsProps> = ({ user, onRequestsUpdated }) => {
    const [requests, setRequests] = useState<IdeaJoinRequest[]>([]);
    const [viewingProfile, setViewingProfile] = useState<User | null>(null);

    useEffect(() => {
        if (user) {
            const unsubscribe = firestoreService.getJoinRequestsForFounder(user.id, (newRequests) => {
                setRequests(newRequests);
                onRequestsUpdated();
            });
            return () => unsubscribe();
        }
    }, [user, onRequestsUpdated]);

    if (requests.length === 0) {
        return (
            <div className="text-center py-16 px-6 bg-neutral-900 border-2 border-dashed border-neutral-700 rounded-2xl mt-8">
                <UsersIcon className="w-12 h-12 mx-auto text-neutral-600" />
                <h3 className="text-xl font-semibold mt-4 text-white">No Pending Requests</h3>
                <p className="text-neutral-400 mt-2 max-w-md mx-auto">
                    You don't have any pending join requests for your ideas right now.
                </p>
            </div>
        );
    }

    const handleRequest = async (requestId: string, status: 'approved' | 'rejected') => {
        try {
            await firestoreService.updateJoinRequest(requestId, status);
            // Real-time listener will update the state, no need for onRequestsUpdated()
        } catch (error) {
            console.error('Failed to update join request:', error);
        }
    };

    const handleViewProfile = async (developerId: string) => {
        try {
            const profile = await firestoreService.getUserProfile(developerId);
            if (profile) {
                setViewingProfile(profile);
            } else {
                alert("Could not load developer's profile.");
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            alert("An error occurred while fetching the profile.");
        }
    };

    return (
        <>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4 mt-8">
                <h2 className="text-2xl font-bold text-white">Incoming Join Requests</h2>
                <ul className="divide-y divide-neutral-800">
                    {requests.map(request => (
                        <li key={request.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div 
                                className="flex items-center gap-4 cursor-pointer group"
                                onClick={() => handleViewProfile(request.developerId)}
                            >
                                <img src={request.developerAvatar} alt={request.developerName} className="w-12 h-12 rounded-full" />
                                <div>
                                    <p className="text-white">
                                        <span className="font-semibold group-hover:underline">{request.developerName}</span> wants to join your idea: <span className="font-semibold text-purple-400">{request.ideaTitle}</span>
                                    </p>
                                    <p className="text-sm text-neutral-500">{new Date(request.timestamp.toString()).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-center">
                                <button 
                                    aria-label={`Approve ${request.developerName}`}
                                    onClick={() => handleRequest(request.id, 'approved')} 
                                    className="p-2 bg-green-600 hover:bg-green-700 rounded-full text-white transition-colors"
                                >
                                    <CheckIcon className="w-5 h-5" />
                                </button>
                                <button 
                                    aria-label={`Reject ${request.developerName}`}
                                    onClick={() => handleRequest(request.id, 'rejected')} 
                                    className="p-2 bg-red-600 hover:bg-red-700 rounded-full text-white transition-colors"
                                >
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            {viewingProfile && <ProfileCard user={viewingProfile} onClose={() => setViewingProfile(null)} />}
        </>
    );
};

export default JoinRequests;
