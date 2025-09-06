import React, { useState } from 'react';
import { User } from '../types';
// ProfileCard import removed - component no longer exists
import { UsersIcon, XCircleIcon } from './icons';
import { getSafeAvatarUrl, getUserInitials } from '../utils/avatar';

interface PeopleProps {
    connections: User[];
    currentUser: User;
    onMessage: (user: User) => void;
    onRemoveConnection: (user: User) => void;
}

const People: React.FC<PeopleProps> = ({ connections, currentUser, onMessage, onRemoveConnection }) => {
    const [isManageMode, setManageMode] = useState(false);

    // Removed selectedUser state and related functions - no longer needed without ProfileCard

    const handleRemoveClick = (e: React.MouseEvent, user: User) => {
        e.stopPropagation(); // Prevent the profile card from opening
        if (window.confirm(`Are you sure you want to remove ${user.name} from your connections?`)) {
            onRemoveConnection(user);
        }
    };

    return (
        <>
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-sm border border-slate-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
                                <UsersIcon className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300" />
                                Your People
                            </h1>
                            <p className="text-slate-400 text-sm sm:text-base mt-2">Browse and manage your connections.</p>
                        </div>
                        <button 
                            onClick={() => setManageMode(!isManageMode)}
                            className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 hover:from-slate-700/50 hover:to-slate-600/50 text-white font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all duration-300 border border-slate-700/30 hover:border-slate-600/50 text-sm sm:text-base"
                        >
                            {isManageMode ? 'Done' : 'Manage'}
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 pb-20 sm:pb-6">
                    {connections.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                            {connections.map(user => (
                                <div 
                                    key={user.id} 
                                    className="relative bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-sm border border-slate-800/50 rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col items-center text-center hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10 transition-all duration-300 transform hover:-translate-y-1"
                                >
                                    {isManageMode && (
                                        <button 
                                            onClick={(e) => handleRemoveClick(e, user)}
                                            className="absolute top-2 right-2 text-slate-500 hover:text-red-400 transition-colors z-10"
                                            aria-label={`Remove ${user.name}`}
                                        >
                                            <XCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </button>
                                    )}
                                    {getSafeAvatarUrl(user) ? (
                                        <img src={getSafeAvatarUrl(user)} alt={user.name} className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full mb-3 sm:mb-4 border-2 sm:border-4 border-slate-700/50" />
                                    ) : (
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full mb-3 sm:mb-4 border-2 sm:border-4 border-slate-700/50 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-lg sm:text-xl font-bold">
                                            {getUserInitials(user.name)}
                                        </div>
                                    )}
                                    <h3 className="font-semibold text-white text-sm sm:text-base lg:text-lg">{user.name}</h3>
                                    <p className="text-xs sm:text-sm text-slate-300">{user.role}</p>
                                    <p className="text-xs text-slate-500 mt-1">{user.location}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 sm:py-16 px-4 sm:px-6 bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-sm border border-slate-800/50 rounded-xl sm:rounded-2xl">
                            <UsersIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-slate-600" />
                            <h3 className="text-lg sm:text-xl font-semibold mt-4 text-white">No Connections Yet</h3>
                            <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-md mx-auto">
                                You haven't made any connections. Start by finding matches on the dashboard and sending connection requests!
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ProfileCard removed - component no longer exists */}
        </>
    );
};

export default People;
