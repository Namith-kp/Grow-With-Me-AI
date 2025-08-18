import React, { useState } from 'react';
import ChatPanel from './ChatPanel';
import { Chat, User } from '../types';
import { SearchIcon, SendIcon } from './icons';

interface MessagesProps {
    chats: Chat[];
    currentUser: User;
    connections: User[];
}

const Messages: React.FC<MessagesProps> = ({ chats, currentUser, connections }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserForChat, setSelectedUserForChat] = useState<User | null>(null);

    const sortedChats = [...chats].sort((a, b) => {
        const timeA = a.lastMessage?.timestamp ? new Date((a.lastMessage.timestamp as any).seconds * 1000).getTime() : 0;
        const timeB = b.lastMessage?.timestamp ? new Date((b.lastMessage.timestamp as any).seconds * 1000).getTime() : 0;
        return timeB - timeA;
    });

    const filteredChats = sortedChats.filter(chat => {
        const partner = chat.participantDetails.find(p => p.id !== currentUser.id);
        return partner && partner.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const chatPartners = chats.map(chat => chat.participantDetails.find(p => p.id !== currentUser.id)).filter(Boolean) as User[];
    const connectionsWithoutChats = connections.filter(
        connection => !chatPartners.some(p => p.id === connection.id)
    );
    const filteredConnections = connectionsWithoutChats.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
    <div className="flex flex-row h-screen w-full bg-neutral-950 rounded-none overflow-hidden shadow-none m-0 p-0">
            {/* Left: Chat list */}
            <div className="w-80 flex-shrink-0 border-r-2 border-white/10 bg-black flex flex-col m-0 p-0">
                <div className="p-4 border-b border-neutral-800">
                    <h1 className="text-2xl font-bold text-white">Messages</h1>
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full mt-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg py-2 pl-3 pr-4 text-white focus:ring-2 focus:border-emerald-500 transition-all"
                    />
                </div>
                <div className="flex-1 overflow-y-auto">
                    <h2 className="text-lg font-bold text-white px-4 pt-4">Active Chats</h2>
                    <ul className="divide-y divide-neutral-800 px-2">
                        {filteredChats.map(chat => {
                            const partner = chat.participantDetails.find(p => p.id !== currentUser.id);
                            if (!partner) return null;
                            return (
                                <li key={chat.id} onClick={() => setSelectedUserForChat(partner)} className={`p-3 flex items-center cursor-pointer hover:bg-neutral-900/30 transition-colors ${selectedUserForChat?.id === partner.id ? 'bg-neutral-900/50' : ''}`}>
                                    <img src={partner.avatarUrl} alt={partner.name} className="w-10 h-10 rounded-full mr-3" />
                                    <div className="flex-grow overflow-hidden">
                                        <h3 className="font-bold text-white truncate text-base">{partner.name}</h3>
                                        {chat.lastMessage ? (
                                            <p className="text-xs text-neutral-400 truncate pr-2">
                                                <span className="font-semibold">{chat.lastMessage.senderId === currentUser.id ? "You:" : ""}</span> {chat.lastMessage.text}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-neutral-500 italic">No messages yet</p>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                    <h2 className="text-lg font-bold text-white px-4 pt-6">Start a New Conversation</h2>
                    <ul className="space-y-1 px-2 pb-4">
                        {filteredConnections.map(connection => (
                            <li key={connection.id} onClick={() => setSelectedUserForChat(connection)} className={`p-3 flex items-center cursor-pointer hover:bg-neutral-900/30 transition-colors ${selectedUserForChat?.id === connection.id ? 'bg-neutral-900/50' : ''}`}>
                                <img src={connection.avatarUrl} alt={connection.name} className="w-10 h-10 rounded-full mr-3" />
                                <div className="flex-grow">
                                    <h3 className="font-bold text-white text-base">{connection.name}</h3>
                                    <p className="text-xs text-neutral-400">{connection.role}</p>
                                </div>
                                <SendIcon className="w-5 h-5 text-neutral-500 hover:text-purple-500 transition-colors" />
                            </li>
                        ))}
                    </ul>
                    {filteredConnections.length === 0 && filteredChats.length === 0 && (
                        <div className="text-center py-16 px-6">
                            <h3 className="text-xl font-semibold mt-4 text-white">No one to message</h3>
                            <p className="text-neutral-400 mt-2 max-w-md mx-auto">
                                {searchTerm ? `No connections found for "${searchTerm}".` : "Connect with other users to start a conversation."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
            {/* Right: Chat panel */}
            <div className="flex-1 min-w-0 h-full overflow-hidden m-0 p-0 bg-black">
                {selectedUserForChat ? (
                    <ChatPanel user={selectedUserForChat} currentUser={currentUser} />
                ) : (
                    <div className="flex items-center justify-center h-full text-neutral-400 text-xl">Select a chat to start messaging</div>
                )}
            </div>
        </div>
    );
};

export default Messages;