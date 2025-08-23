import React, { useState } from 'react';
import { User } from '../types';
import ProfileCard from './ProfileCard';
import { UsersIcon, XCircleIcon } from './icons';

interface PeopleProps {
    connections: User[];
    currentUser: User;
    onMessage: (user: User) => void;
    onRemoveConnection: (user: User) => void;
}

const People: React.FC<PeopleProps> = ({ connections, currentUser, onMessage, onRemoveConnection }) => {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isManageMode, setManageMode] = useState(false);

    const handleUserClick = (user: User) => {
        if (!isManageMode) {
            setSelectedUser(user);
        }
    };

    const handleCloseProfile = () => {
        setSelectedUser(null);
    };

    const handleRemoveClick = (e: React.MouseEvent, user: User) => {
        e.stopPropagation(); // Prevent the profile card from opening
        if (window.confirm(`Are you sure you want to remove ${user.name} from your connections?`)) {
            onRemoveConnection(user);
        }
    };

    return (
        <>
            <div className="space-y-8 mt-10">
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                <UsersIcon className="w-8 h-8 text-purple-400" />
                                Your People
                            </h1>
                            <p className="text-neutral-400 mt-2">Browse and manage your connections.</p>
                        </div>
                        <button 
                            onClick={() => setManageMode(!isManageMode)}
                            className="bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300"
                        >
                            {isManageMode ? 'Done' : 'Manage'}
                        </button>
                    </div>
                </div>

                {connections.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {connections.map(user => (
                            <div 
                                key={user.id} 
                                onClick={() => handleUserClick(user)} 
                                className="relative bg-neutral-900 p-5 rounded-2xl flex flex-col items-center text-center cursor-pointer hover:bg-neutral-800 transition-all duration-300 border border-neutral-800 hover:border-purple-500 transform hover:-translate-y-1"
                            >
                                {isManageMode && (
                                    <button 
                                        onClick={(e) => handleRemoveClick(e, user)}
                                        className="absolute top-2 right-2 text-neutral-500 hover:text-red-500 transition-colors z-10"
                                        aria-label={`Remove ${user.name}`}
                                    >
                                        <XCircleIcon className="w-6 h-6" />
                                    </button>
                                )}
                                <img src={user.avatarUrl} alt={user.name} className="w-24 h-24 rounded-full mb-4 border-4 border-neutral-700" />
                                <h3 className="font-semibold text-white text-lg">{user.name}</h3>
                                <p className="text-sm text-purple-400">{user.role}</p>
                                <p className="text-xs text-neutral-500 mt-1">{user.location}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 px-6 bg-neutral-900 border-2 border-dashed border-neutral-700 rounded-2xl">
                        <UsersIcon className="w-12 h-12 mx-auto text-neutral-600" />
                        <h3 className="text-xl font-semibold mt-4 text-white">No Connections Yet</h3>
                        <p className="text-neutral-400 mt-2 max-w-md mx-auto">
                            You haven't made any connections. Start by finding matches on the dashboard and sending connection requests!
                        </p>
                    </div>
                )}
            </div>

            {selectedUser && (
                <ProfileCard 
                    user={selectedUser} 
                    onClose={handleCloseProfile} 
                    isOwnProfile={selectedUser.id === currentUser.id}
                    onMessage={onMessage}
                    onConnect={() => {}}
                    currentUserId={currentUser.id}
                />
            )}
        </>
    );
};

export default People;
