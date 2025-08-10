import React from 'react';
import { User } from '../types';
import { XIcon, MapPinIcon, BrainCircuitIcon, CodeIcon, BullseyeIcon, MessageSquareIcon, UserPlusIcon, LinkIcon } from './icons';

interface ProfileCardProps {
    user: User;
    onClose: () => void;
    isOwnProfile: boolean;
    onMessage?: (user: User) => void;
    onConnect?: (user: User) => void;
    onViewConnections?: (connectionIds: string[]) => void;
    isConnected?: boolean;
    isPending?: boolean;
    onStartNegotiation?: (user: User) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ 
    user, 
    onClose, 
    isOwnProfile, 
    onMessage, 
    onConnect, 
    onViewConnections, 
    isConnected,
    isPending,
    onStartNegotiation
}) => {
    const connectionCount = user.connections?.length || 0;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full mx-auto p-8 relative animate-fade-in-scale">
                <button onClick={onClose} aria-label="Close profile" className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors">
                    <XIcon className="w-6 h-6" />
                </button>

                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6">
                    <img src={user.avatarUrl} alt={user.name} className="w-32 h-32 rounded-full border-4 border-purple-500" />
                    <div>
                        <h2 className="text-3xl font-bold text-white">{user.name}</h2>
                        <p className="text-xl text-purple-400 font-medium">{user.role}</p>
                        <div className="flex items-center justify-center sm:justify-start gap-4 mt-2 text-neutral-400">
                            <div className="flex items-center gap-2">
                                <MapPinIcon className="w-5 h-5" />
                                <span>{user.location}</span>
                            </div>
                            
                            {isOwnProfile ? (
                                <button 
                                    onClick={() => onViewConnections && onViewConnections(user.connections || [])}
                                    className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
                                    disabled={connectionCount === 0}
                                >
                                    <LinkIcon className="w-5 h-5" />
                                    <span>{connectionCount} {connectionCount === 1 ? 'Connection' : 'Connections'}</span>
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <LinkIcon className="w-5 h-5" />
                                    <span>{connectionCount} {connectionCount === 1 ? 'Connection' : 'Connections'}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-8 space-y-6">
                    <div>
                        <h3 className="font-semibold text-lg text-white flex items-center gap-2 mb-2"><CodeIcon className="w-5 h-5 text-purple-400"/> Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {user.skills.map(skill => (
                                <span key={skill} className="bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full text-sm">{skill}</span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-white flex items-center gap-2 mb-2"><BrainCircuitIcon className="w-5 h-5 text-purple-400"/> Interests</h3>
                        <div className="flex flex-wrap gap-2">
                            {user.interests.map(interest => (
                                <span key={interest} className="bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full text-sm">{interest}</span>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold text-lg text-white flex items-center gap-2 mb-2"><BullseyeIcon className="w-5 h-5 text-purple-400"/> Looking For</h3>
                        <p className="text-neutral-400">{user.lookingFor}</p>
                    </div>
                </div>

                {!isOwnProfile && (
                    <div className="mt-8 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row justify-center gap-4">
                        {isConnected ? (
                            <button 
                                disabled
                                className="flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 px-6 rounded-lg w-full sm:w-auto cursor-not-allowed"
                            >
                                <UserPlusIcon className="w-5 h-5" />
                                Connected
                            </button>
                        ) : isPending ? (
                             <button 
                                disabled
                                className="flex items-center justify-center gap-2 bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg w-full sm:w-auto cursor-not-allowed"
                            >
                                <UserPlusIcon className="w-5 h-5" />
                                Request Sent
                            </button>
                        ) : (
                            <button 
                                onClick={() => onConnect && onConnect(user)}
                                className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors w-full sm:w-auto"
                            >
                                <UserPlusIcon className="w-5 h-5" />
                                Connect
                            </button>
                        )}
                        <button 
                            onClick={() => onMessage && onMessage(user)}
                            className="flex items-center justify-center gap-2 bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3 px-6 rounded-lg transition-colors w-full sm:w-auto"
                        >
                            <MessageSquareIcon className="w-5 h-5" />
                            Message
                        </button>
                        {onStartNegotiation && (
                             <button 
                                onClick={() => onStartNegotiation(user)}
                                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors w-full sm:w-auto"
                            >
                                Start Negotiation
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileCard;
