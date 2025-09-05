import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, View } from '../types';
import { firestoreService } from '../services/firestoreService';
import { getSafeAvatarUrl, getUserInitials } from '../utils/avatar';
import { ArrowLeftIcon, UsersIcon, MessageSquareIcon, UserIcon } from './icons';

interface ConnectionsProps {
    currentUser: User | null;
    onBack: () => void;
    onNavigateToProfile: (user: User) => void;
    onNavigateToMessages: (user: User) => void;
}

const Connections: React.FC<ConnectionsProps> = ({ 
    currentUser, 
    onBack, 
    onNavigateToProfile, 
    onNavigateToMessages 
}) => {
    const [connections, setConnections] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadConnections = async () => {
            if (!currentUser) return;
            
            try {
                setLoading(true);
                setError(null);
                
                // Get connected user profiles
                const connectedUsers = await Promise.all(
                    currentUser.connections.map(async (userId) => {
                        try {
                            return await firestoreService.getUserProfile(userId);
                        } catch (error) {
                            console.warn(`Failed to load user ${userId}:`, error);
                            return null;
                        }
                    })
                );
                
                // Filter out null values (users that no longer exist)
                const validConnections = connectedUsers.filter((user): user is User => user !== null);
                setConnections(validConnections);
            } catch (error) {
                console.error('Error loading connections:', error);
                setError('Failed to load connections. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadConnections();
    }, [currentUser]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-screen bg-gradient-to-br from-slate-950 via-black to-slate-950 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>
            
            {/* Content */}
            <div className="relative z-10 h-full flex flex-col pt-16 sm:pt-20 lg:pt-0">
                {/* Header */}
                <div className="flex-shrink-0 bg-slate-900 border-b border-slate-700 shadow-2xl">
                    <div className="w-full px-3 sm:px-4 py-2 sm:py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <motion.button
                                    onClick={onBack}
                                    className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <ArrowLeftIcon className="w-5 h-5 text-white" />
                                </motion.button>
                                <div className="flex items-center space-x-2">
                                    <UsersIcon className="w-6 h-6 text-orange-400" />
                                    <h1 className="text-lg sm:text-xl font-bold text-white">Connections</h1>
                                </div>
                            </div>
                            <div className="text-sm text-slate-400">
                                {connections.length} {connections.length === 1 ? 'connection' : 'connections'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 lg:p-4 xl:p-6">
                    {error && (
                        <motion.div 
                            className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-red-900/30 to-red-800/30 border border-red-700/30 text-red-300 rounded-xl sm:rounded-2xl text-center text-sm sm:text-base"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {error}
                        </motion.div>
                    )}

                    {connections.length === 0 ? (
                        <motion.div 
                            className="flex flex-col items-center justify-center py-12 sm:py-16"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="w-20 h-20 bg-gradient-to-br from-orange-600/20 to-orange-500/20 rounded-full flex items-center justify-center mb-4">
                                <UsersIcon className="w-10 h-10 text-orange-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">No Connections Yet</h3>
                            <p className="text-slate-400 text-center max-w-md">
                                You haven't connected with anyone yet. Start by exploring the People page to find potential connections.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div 
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            {connections.map((user, index) => (
                                <motion.div
                                    key={user.id}
                                    className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl border border-slate-800/50 rounded-xl p-4 sm:p-6 hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10 transition-all duration-300"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * index }}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                >
                                    {/* Avatar */}
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="relative">
                                            {user.avatarUrl ? (
                                                <img
                                                    src={getSafeAvatarUrl(user.avatarUrl)}
                                                    alt={user.name}
                                                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-700"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                        target.nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                            ) : null}
                                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-sm font-bold border-2 border-slate-700 ${user.avatarUrl ? 'hidden' : ''}`}>
                                                {getUserInitials(user.name)}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-white font-semibold text-sm sm:text-base truncate">
                                                {user.name}
                                            </h3>
                                            <p className="text-slate-400 text-xs sm:text-sm truncate">
                                                {user.role}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Location */}
                                    {user.location && (
                                        <div className="mb-4">
                                            <p className="text-slate-300 text-xs sm:text-sm">
                                                📍 {user.location}
                                            </p>
                                        </div>
                                    )}

                                    {/* Skills Preview */}
                                    {user.skills && user.skills.length > 0 && (
                                        <div className="mb-4">
                                            <div className="flex flex-wrap gap-1">
                                                {user.skills.slice(0, 3).map((skill, skillIndex) => (
                                                    <span
                                                        key={skillIndex}
                                                        className="px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded-full"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                                {user.skills.length > 3 && (
                                                    <span className="px-2 py-1 bg-slate-600/20 text-slate-300 text-xs rounded-full">
                                                        +{user.skills.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex space-x-2">
                                        <motion.button
                                            onClick={() => onNavigateToProfile(user)}
                                            className="flex-1 bg-slate-700/50 hover:bg-slate-600/50 text-white text-xs sm:text-sm font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-1"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <UserIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                            <span>Profile</span>
                                        </motion.button>
                                        <motion.button
                                            onClick={() => onNavigateToMessages(user)}
                                            className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white text-xs sm:text-sm font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-1"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <MessageSquareIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                            <span>Message</span>
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Connections;
