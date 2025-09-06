import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { firestoreService } from '../services/firestoreService';
import { motion, AnimatePresence } from 'motion/react';
import { XIcon } from './icons';
import { getSafeAvatarUrl, getUserInitials } from '../utils/avatar';

interface ConnectionsModalProps {
    connectionIds: string[];
    onClose: () => void;
    onSelectUser: (user: User) => void;
}

export const ConnectionsModal: React.FC<ConnectionsModalProps> = ({ connectionIds, onClose, onSelectUser }) => {
    const [connections, setConnections] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConnections = async () => {
            setLoading(true);
            try {
                const users = await firestoreService.getConnections(connectionIds);
                setConnections(users);
            } catch (error) {
                console.error("Failed to fetch connections:", error);
            } finally {
                setLoading(false);
            }
        };

        if (connectionIds.length > 0) {
            fetchConnections();
        } else {
            setConnections([]);
            setLoading(false);
        }
    }, [connectionIds]);

    return (
        <AnimatePresence>
            <motion.div 
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" 
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                <motion.div 
                    className="bg-gradient-to-br from-slate-900/95 to-black/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl shadow-black/50 p-6 w-full max-w-md relative" 
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                >
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all duration-200 hover:scale-110"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>

                    <h2 className="text-2xl font-bold text-white mb-6 text-center">Your Connections</h2>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {loading ? (
                            <motion.div 
                                className="text-center py-8"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <div className="w-8 h-8 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-slate-400 text-sm">Loading connections...</p>
                            </motion.div>
                        ) : connections.length > 0 ? (
                            connections.map((user, idx) => (
                                <motion.div 
                                    key={user.id} 
                                    className="flex items-center bg-slate-800/50 hover:bg-slate-700/50 p-4 rounded-xl cursor-pointer transition-all duration-200 border border-slate-700/30 hover:border-slate-600/50 hover:shadow-lg hover:shadow-slate-500/10" 
                                    onClick={() => onSelectUser(user)}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1, duration: 0.3 }}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                >
                                    {getSafeAvatarUrl(user) ? (
                                        <img 
                                            src={getSafeAvatarUrl(user)} 
                                            alt={user.name} 
                                            className="w-12 h-12 rounded-full mr-4 border-2 border-slate-600 shadow-lg" 
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full mr-4 border-2 border-slate-600 shadow-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-sm font-bold">
                                            {getUserInitials(user.name)}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <p className="font-semibold text-white text-sm">{user.name}</p>
                                        <span className={`${user.role === 'Developer' ? 'text-blue-400' : user.role === 'Founder' ? 'text-purple-400' : 'text-emerald-400'} text-xs font-medium`}>
                                            {user.role}
                                        </span>
                                    </div>
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                </motion.div>
                            ))
                        ) : (
                            <motion.div 
                                className="text-center py-8"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <div className="w-16 h-16 bg-slate-800/50 rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <div className="w-8 h-8 bg-slate-600 rounded-full"></div>
                                </div>
                                <h3 className="text-lg font-medium text-slate-300 mb-2">No connections yet</h3>
                                <p className="text-sm text-slate-500">Start connecting with people to build your network!</p>
                            </motion.div>
                        )}
                    </div>
                    
                    <motion.button 
                        onClick={onClose} 
                        className="mt-6 w-full bg-gradient-to-r from-slate-600 to-slate-500 hover:from-slate-500 hover:to-slate-400 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-slate-500/25 transform hover:scale-105"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        Close
                    </motion.button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
