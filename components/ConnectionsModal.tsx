import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { firestoreService } from '../services/firestoreService';

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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-neutral-900 rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-white mb-4">Your Connections</h2>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {loading ? (
                        <p className="text-neutral-400">Loading connections...</p>
                    ) : connections.length > 0 ? (
                        connections.map(user => (
                            <div key={user.id} className="flex items-center bg-neutral-800 p-3 rounded-lg cursor-pointer hover:bg-neutral-700" onClick={() => onSelectUser(user)}>
                                <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full mr-4" />
                                <div>
                                    <p className="font-semibold text-white">{user.name}</p>
                                    <p className="text-sm text-neutral-400">{user.role}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-neutral-400">You have no connections yet.</p>
                    )}
                </div>
                <button onClick={onClose} className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Close
                </button>
            </div>
        </div>
    );
};
