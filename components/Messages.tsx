import React, { useState } from 'react';
import { Chat, User } from '../types';
import { SearchIcon, SendIcon } from './icons';

interface MessagesProps {
    chats: Chat[];
    currentUser: User;
    onSelectChat: (user: User) => void;
    connections: User[];
}

const Messages: React.FC<MessagesProps> = ({ chats, currentUser, onSelectChat, connections }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Sort chats by the timestamp of the last message in descending order
    const sortedChats = [...chats].sort((a, b) => {
        const timeA = a.lastMessage?.timestamp ? new Date((a.lastMessage.timestamp as any).seconds * 1000).getTime() : 0;
        const timeB = b.lastMessage?.timestamp ? new Date((b.lastMessage.timestamp as any).seconds * 1000).getTime() : 0;
        return timeB - timeA;
    });

    // Filter chats based on search term
    const filteredChats = sortedChats.filter(chat => {
        const partner = chat.participantDetails.find(p => p.id !== currentUser.id);
        return partner && partner.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Find users the current user already has a chat with
    const chatPartners = chats.map(chat => chat.participantDetails.find(p => p.id !== currentUser.id)).filter(Boolean) as User[];
    
    // Filter the connections list to only show users who don't have an active chat
    const connectionsWithoutChats = connections.filter(
        connection => !chatPartners.some(p => p.id === connection.id)
    );

    // Filter connections based on the search term
    const filteredConnections = connectionsWithoutChats.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 mt-9">
            <h1 className="text-3xl font-bold text-white">Messages</h1>
            <p className="text-neutral-400">Start a new conversation or continue an existing one.</p>
            
            <div className="space-y-8">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500"/>
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg py-2 pl-10 pr-4 text-white focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                {filteredChats.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold text-white mb-4">Active Chats</h2>
                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl">
                            <ul className="divide-y divide-neutral-800">
                                {filteredChats.map(chat => {
                                    const partner = chat.participantDetails.find(p => p.id !== currentUser.id);
                                    if (!partner) return null;

                                    return (
                                        <li key={chat.id} onClick={() => onSelectChat(partner)} className="p-4 flex items-center cursor-pointer hover:bg-neutral-800/50 transition-colors rounded-2xl">
                                            <div className="relative mr-4">
                                                <img src={partner.avatarUrl} alt={partner.name} className="w-14 h-14 rounded-full" />
                                                {/* Future: Add online indicator here e.g. <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-neutral-900"></span> */}
                                            </div>
                                            <div className="flex-grow overflow-hidden">
                                                <h3 className="font-bold text-white truncate text-lg">{partner.name}</h3>
                                                {chat.lastMessage ? (
                                                    <p className="text-sm text-neutral-400 truncate pr-2">
                                                        <span className="font-semibold">{chat.lastMessage.senderId === currentUser.id ? "You:" : ""}</span> {chat.lastMessage.text}
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-neutral-500 italic">No messages yet</p>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end justify-between ml-4 flex-shrink-0 h-14">
                                                {chat.lastMessage?.timestamp && (
                                                    <p className="text-xs text-neutral-500">{new Date(chat.lastMessage.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                )}
                                                <div className="w-6 h-6">
                                                    {chat.unreadCounts && chat.unreadCounts[currentUser.id] > 0 && (
                                                        <span className="bg-purple-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                                                            {chat.unreadCounts[currentUser.id]}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                )}

                {filteredConnections.length > 0 && (
                     <div>
                        <h2 className="text-xl font-bold text-white mb-4">Start a New Conversation</h2>
                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl">
                            <ul className="space-y-1">
                                {filteredConnections.map(connection => (
                                    <li key={connection.id} onClick={() => onSelectChat(connection)} className="p-3 flex items-center cursor-pointer hover:bg-neutral-800/50 transition-colors rounded-2xl">
                                        <div className="relative mr-4">
                                            <img src={connection.avatarUrl} alt={connection.name} className="w-14 h-14 rounded-full" />
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="font-bold text-white text-lg">{connection.name}</h3>
                                            <p className="text-sm text-neutral-400">{connection.role}</p>
                                        </div>
                                        <SendIcon className="w-6 h-6 text-neutral-500 hover:text-purple-500 transition-colors" />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {filteredConnections.length === 0 && filteredChats.length === 0 && (
                    <div className="text-center py-16 px-6 bg-neutral-900 border-2 border-dashed border-neutral-700 rounded-2xl">
                        <h3 className="text-xl font-semibold mt-4 text-white">No one to message</h3>
                        <p className="text-neutral-400 mt-2 max-w-md mx-auto">
                            {searchTerm ? `No connections found for "${searchTerm}".` : "Connect with other users to start a conversation."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
