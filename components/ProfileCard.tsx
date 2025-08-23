import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { XIcon, MapPinIcon, BrainCircuitIcon, CodeIcon, BullseyeIcon, MessageSquareIcon, UserPlusIcon, LinkIcon } from './icons';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import { firestoreService } from '../services/firestoreService';

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
    currentUserId?: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ 
    user, 
    onClose, 
    isOwnProfile, 
    onMessage, 
    onConnect, 
    onViewConnections, 
    isConnected: propIsConnected,
    isPending: propIsPending,
    onStartNegotiation,
    currentUserId
}) => {
    const [connectionStatus, setConnectionStatus] = useState({
        isConnected: propIsConnected || false,
        isPending: propIsPending || false
    });

    // Update connection status when props change (for initial load)
    useEffect(() => {
        setConnectionStatus({
            isConnected: propIsConnected || false,
            isPending: propIsPending || false
        });
    }, [propIsConnected, propIsPending]);
    
    const connectionCount = user.connections?.length || 0;
    
    // Always use real-time listener for connection status updates when currentUserId is available
    useEffect(() => {
        if (currentUserId && onConnect) {
            console.log(`ProfileCard: Setting up real-time listener for ${user.name} (${user.id})`);
            // Use real-time listener for connection status updates
            const unsubscribe = firestoreService.getConnectionStatusRealtime(
                currentUserId, 
                user.id, 
                (status) => {
                    console.log(`ProfileCard: Real-time status update for ${user.name}:`, status);
                    setConnectionStatus(status);
                }
            );
            
            return unsubscribe;
        }
    }, [user.id, currentUserId, onConnect]);
    
    return (
        <AnimatePresence>
            <motion.div 
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                <motion.div 
                    className="bg-gradient-to-br from-slate-900/95 to-black/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl max-w-2xl w-full mx-auto p-6 sm:p-8 relative shadow-2xl shadow-black/50"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                >
                    <button 
                        onClick={onClose} 
                        aria-label="Close profile" 
                        className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all duration-200 hover:scale-110"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6">
                        <div className="relative">
                            <img 
                                src={user.avatarUrl} 
                                alt={user.name} 
                                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-slate-600 shadow-2xl" 
                            />
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full border-2 border-slate-900 flex items-center justify-center">
                                <div className="w-3 h-3 bg-white rounded-full"></div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{user.name}</h2>
                            <span className={cn(
                                "inline-block text-lg font-medium px-4 py-2 rounded-full mb-3",
                                user.role === 'Developer' ? 'bg-blue-900/30 text-blue-300 border border-blue-700/30' : 
                                user.role === 'Founder' ? 'bg-purple-900/30 text-purple-300 border border-purple-700/30' : 
                                'bg-emerald-900/30 text-emerald-300 border border-emerald-700/30'
                            )}>
                                {user.role}
                            </span>
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-slate-400">
                                <div className="flex items-center gap-2">
                                    <MapPinIcon className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm">{user.location}</span>
                                </div>
                                
                                {isOwnProfile ? (
                                    <button 
                                        onClick={() => onViewConnections && onViewConnections(user.connections || [])}
                                        className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors text-sm"
                                        disabled={connectionCount === 0}
                                    >
                                        <LinkIcon className="w-4 h-4 text-slate-500" />
                                        <span>{connectionCount} {connectionCount === 1 ? 'Connection' : 'Connections'}</span>
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 text-sm">
                                        <LinkIcon className="w-4 h-4 text-slate-500" />
                                        <span>{connectionCount} {connectionCount === 1 ? 'Connection' : 'Connections'}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-6">
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                                <CodeIcon className="w-5 h-5 text-emerald-400"/> 
                                Skills
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {user.skills.map(skill => (
                                    <span 
                                        key={skill} 
                                        className="bg-slate-800/50 text-slate-300 px-3 py-1.5 rounded-full text-sm border border-slate-700/50 hover:border-slate-600/50 transition-colors"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                                <BrainCircuitIcon className="w-5 h-5 text-purple-400"/> 
                                Interests
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {user.interests.map(interest => (
                                    <span 
                                        key={interest} 
                                        className="bg-slate-800/50 text-slate-300 px-3 py-1.5 rounded-full text-sm border border-slate-700/50 hover:border-slate-600/50 transition-colors"
                                    >
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                                <BullseyeIcon className="w-5 h-5 text-amber-400"/> 
                                Looking For
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed">{user.lookingFor}</p>
                        </div>
                    </div>

                    {!isOwnProfile && (
                        <div className="mt-8 pt-6 border-t border-slate-700/30 flex flex-col sm:flex-row justify-center gap-3">
                            {connectionStatus.isConnected ? (
                                <button 
                                    disabled
                                    className="flex items-center justify-center gap-2 bg-emerald-600/20 text-emerald-300 border border-emerald-600/30 font-medium py-3 px-6 rounded-xl w-full sm:w-auto cursor-not-allowed"
                                >
                                    <UserPlusIcon className="w-5 h-5" />
                                    Connected
                                </button>
                            ) : connectionStatus.isPending ? (
                                <button 
                                    disabled
                                    className="flex items-center justify-center gap-2 bg-amber-600/20 text-amber-300 border border-amber-600/30 font-medium py-3 px-6 rounded-xl w-full sm:w-auto cursor-not-allowed"
                                >
                                    <UserPlusIcon className="w-5 h-5" />
                                    Pending
                                </button>
                            ) : (
                                <button 
                                    onClick={async () => {
                                        if (onConnect) {
                                            onConnect(user);
                                            // Optimistically update the status to show pending
                                            setConnectionStatus({ isConnected: false, isPending: true });
                                        }
                                    }}
                                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-slate-600 to-slate-500 hover:from-slate-500 hover:to-slate-400 text-white font-medium py-3 px-6 rounded-xl w-full sm:w-auto transition-all duration-200 hover:shadow-lg hover:shadow-slate-500/25 transform hover:scale-105"
                                >
                                    <UserPlusIcon className="w-5 h-5" />
                                    Connect
                                </button>
                            )}
                            
                            <button 
                                onClick={() => onMessage && onMessage(user)}
                                className="flex items-center justify-center gap-2 bg-slate-800/50 hover:bg-slate-700/50 text-white font-medium py-3 px-6 rounded-xl w-full sm:w-auto transition-all duration-200 hover:shadow-lg hover:shadow-slate-500/25 transform hover:scale-105"
                            >
                                <MessageSquareIcon className="w-5 h-5" />
                                Message
                            </button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ProfileCard;
