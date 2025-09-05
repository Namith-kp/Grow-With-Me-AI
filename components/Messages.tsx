import React, { useState, useEffect } from 'react';
import ChatPanel from './ChatPanel';
import { Chat, User } from '../types';
import { SearchIcon, SendIcon } from './icons';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import { firestoreService } from '../services/firestoreService';

interface MessagesProps {
    chats: Chat[];
    currentUser: User;
    connections: User[];
    setIsMobileChatOpen: (isOpen: boolean) => void;
    selectedUserForChat?: User | null;
}

const Messages: React.FC<MessagesProps> = ({ chats, currentUser, connections, setIsMobileChatOpen, selectedUserForChat: propSelectedUser }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserForChat, setSelectedUserForChat] = useState<User | null>(null);
    const [isMobileChatOpenLocal, setIsMobileChatOpenLocal] = useState(false);
    const [activeTab, setActiveTab] = useState<'chats' | 'contacts'>('chats');
    const [realtimeChats, setRealtimeChats] = useState<Chat[]>(chats);

    // Set up real-time chat listener
    useEffect(() => {
        const unsubscribe = firestoreService.getChatsRealtime(currentUser.id, (updatedChats) => {
            setRealtimeChats(updatedChats);
        });
        
        return () => unsubscribe();
    }, [currentUser.id]);

    // Handle prop selected user - automatically open chat when user is selected from outside
    useEffect(() => {
        if (propSelectedUser) {
            setSelectedUserForChat(propSelectedUser);
            setIsMobileChatOpenLocal(true);
            setIsMobileChatOpen(true);
            
            // Mark chat as read when user opens it (if chat exists)
            const chat = realtimeChats.find(c => 
                c.participantDetails.some(p => p.id === propSelectedUser.id)
            );
            if (chat) {
                firestoreService.markChatAsRead(chat.id, currentUser.id);
            }
            // If no chat exists, that's fine - ChatPanel will create it when first message is sent
        }
    }, [propSelectedUser, currentUser.id, realtimeChats, setIsMobileChatOpen]);

    const sortedChats = [...realtimeChats].sort((a, b) => {
        const timeA = a.lastMessage?.timestamp ? new Date((a.lastMessage.timestamp as any).seconds * 1000).getTime() : 0;
        const timeB = b.lastMessage?.timestamp ? new Date((b.lastMessage.timestamp as any).seconds * 1000).getTime() : 0;
        return timeB - timeA;
    });

    const filteredChats = sortedChats.filter(chat => {
        const partner = chat.participantDetails.find(p => p.id !== currentUser.id);
        return partner && partner.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const chatPartners = realtimeChats.map(chat => chat.participantDetails.find(p => p.id !== currentUser.id)).filter(Boolean) as User[];
    const connectionsWithoutChats = connections.filter(
        connection => !chatPartners.some(p => p.id === connection.id)
    );
    const filteredConnections = connectionsWithoutChats.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUserSelect = (user: User) => {
        setSelectedUserForChat(user);
        setIsMobileChatOpenLocal(true);
        setIsMobileChatOpen(true);
        
        // Mark chat as read when user opens it
        const chat = realtimeChats.find(c => 
            c.participantDetails.some(p => p.id === user.id)
        );
        if (chat) {
            firestoreService.markChatAsRead(chat.id, currentUser.id);
        }
    };

    const handleBackToChatList = () => {
        setIsMobileChatOpenLocal(false);
        setSelectedUserForChat(null);
        setIsMobileChatOpen(false);
    };

    // Get unread count for a specific chat
    const getUnreadCount = (chat: Chat) => {
        return chat.unreadCounts?.[currentUser.id] || 0;
    };

    // Get total unread count for all chats
    const getTotalUnreadCount = () => {
        return realtimeChats.reduce((total, chat) => total + getUnreadCount(chat), 0);
    };

    return (
        <div className={cn(
            "w-full h-full max-h-full bg-gradient-to-br from-slate-950 to-black overflow-hidden flex",
            isMobileChatOpenLocal ? "pt-0 pb-0" : "pt-16 pb-16 lg:pt-0 lg:pb-0"
        )}>
            {/* Left: Chat list - Hidden on mobile when chat is open */}
            <div className={cn(
                "flex-shrink-0 bg-gradient-to-b from-slate-900/90 to-black/90 backdrop-blur-sm flex flex-col h-full",
                "w-full lg:w-80 xl:w-96 lg:border-r lg:border-slate-800/30",
                "transition-all duration-300 ease-in-out",
                isMobileChatOpenLocal ? "hidden lg:flex" : "flex"
            )}>
                {/* Header */}
                <div className="flex-shrink-0 p-3 sm:p-4 lg:p-6 border-b border-slate-800/30">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Messages</h1>
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700/30 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all backdrop-blur-sm"
                    />
                </div>
                </div>

                                {/* WhatsApp-style tabbed interface */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                    {/* Tab Navigation - Matching app design */}
                    <div className="px-3 sm:px-4 lg:px-6 pt-4">
                        <div className="flex space-x-2 bg-gradient-to-r from-slate-900/90 to-black/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-1.5 shadow-2xl shadow-black/50">
                            <button
                                onClick={() => setActiveTab('chats')}
                                className={cn(
                                    "flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden min-w-0",
                                    activeTab === 'chats'
                                        ? "bg-gradient-to-r from-slate-600 to-slate-500 text-white shadow-lg shadow-slate-500/25 border border-slate-500/30"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800/50 hover:border-slate-600/30 border border-transparent"
                                )}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <span className="relative z-10 truncate">Chats</span>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0",
                                        activeTab === 'chats'
                                            ? "bg-white/20 text-white"
                                            : "bg-slate-700/50 text-slate-300"
                                    )}>
                                        {filteredChats.length}
                                    </span>
                                    {getTotalUnreadCount() > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                                            {getTotalUnreadCount() > 99 ? '99+' : getTotalUnreadCount()}
                                        </span>
                                    )}
                                </div>
                                {activeTab === 'chats' && (
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-slate-600/20 to-slate-500/20"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('contacts')}
                                className={cn(
                                    "flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden min-w-0",
                                    activeTab === 'contacts'
                                        ? "bg-gradient-to-r from-slate-600 to-slate-500 text-white shadow-lg shadow-slate-500/25 border border-slate-500/30"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800/50 hover:border-slate-600/30 border border-transparent"
                                )}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <span className="relative z-10 truncate">Contacts</span>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0",
                                        activeTab === 'contacts'
                                            ? "bg-white/20 text-white"
                                            : "bg-slate-700/50 text-slate-300"
                                    )}>
                                        {filteredConnections.length}
                                    </span>
                                </div>
                                {activeTab === 'contacts' && (
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-slate-600/20 to-slate-500/20"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Tab Content - Matching app design */}
                    <div className="px-3 sm:px-4 lg:px-6 pt-6 flex-1 min-h-0 flex flex-col">
                        {activeTab === 'chats' ? (
                            /* Chats Tab */
                            <div className="flex-1 min-h-0 flex flex-col">
                                {filteredChats.length > 0 ? (
                                    <div className="space-y-2 flex-1 min-h-0 overflow-y-auto">
                        {filteredChats.map(chat => {
                            const partner = chat.participantDetails.find(p => p.id !== currentUser.id);
                            if (!partner) return null;
                            return (
                                                <motion.div
                                                    key={chat.id}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => handleUserSelect(partner)}
                                                    className={cn(
                                                        "p-2.5 sm:p-3 lg:p-4 flex items-center cursor-pointer rounded-xl transition-all duration-200",
                                                        "hover:bg-slate-800/50 hover:shadow-lg hover:shadow-slate-500/10",
                                                        selectedUserForChat?.id === partner.id 
                                                            ? "bg-purple-900/30 border border-purple-700/30 shadow-lg shadow-purple-500/20" 
                                                            : "bg-slate-800/20 border border-slate-700/20"
                                                    )}
                                                >
                                                    <img 
                                                        src={partner.avatarUrl} 
                                                        alt={partner.name} 
                                                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full mr-3 sm:mr-4 border-2 border-slate-700/50 shadow-lg" 
                                                    />
                                                                                                            <div className="flex-grow overflow-hidden min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <h3 className="font-bold text-white truncate text-base sm:text-lg">{partner.name}</h3>
                                                                {getUnreadCount(chat) > 0 && (
                                                                    <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full flex-shrink-0 animate-pulse">
                                                                        {getUnreadCount(chat) > 99 ? '99+' : getUnreadCount(chat)}
                                                                    </span>
                                                                )}
                                                            </div>
                                        {chat.lastMessage ? (
                                                                <p className="text-sm text-slate-400 truncate pr-2">
                                                                    <span className="font-semibold text-purple-400">
                                                                        {chat.lastMessage.senderId === currentUser.id ? "You: " : ""}
                                                                    </span> 
                                                                    {chat.lastMessage.text}
                                            </p>
                                        ) : (
                                                                <p className="text-sm text-slate-500 italic">No messages yet</p>
                                        )}
                                    </div>
                                                </motion.div>
                            );
                        })}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center px-6">
                                        <div className="text-center max-w-sm mx-auto">
                                            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-full flex items-center justify-center border border-slate-700/30 shadow-lg">
                                                <SendIcon className="w-10 h-10 text-slate-500" />
                                            </div>
                                            <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white">No Active Chats</h3>
                                            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                                                Start a conversation with your connections to see them here.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Contacts Tab */
                            <div className="flex-1 min-h-0 flex flex-col">
                                {filteredConnections.length > 0 ? (
                                    <div className="space-y-2 flex-1 min-h-0 overflow-y-auto">
                        {filteredConnections.map(connection => (
                                            <motion.div
                                                key={connection.id}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleUserSelect(connection)}
                                                className={cn(
                                                    "p-2.5 sm:p-3 lg:p-4 flex items-center cursor-pointer rounded-xl transition-all duration-200",
                                                    "hover:bg-slate-800/50 hover:shadow-lg hover:shadow-slate-500/10",
                                                    selectedUserForChat?.id === connection.id 
                                                        ? "bg-emerald-900/30 border border-emerald-700/30 shadow-lg shadow-emerald-500/20" 
                                                        : "bg-slate-800/20 border border-slate-700/20"
                                                )}
                                            >
                                                <img 
                                                    src={connection.avatarUrl} 
                                                    alt={connection.name} 
                                                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full mr-3 sm:mr-4 border-2 border-slate-700/50 shadow-lg" 
                                                />
                                                <div className="flex-grow overflow-hidden min-w-0">
                                                    <h3 className="font-bold text-white text-base sm:text-lg">{connection.name}</h3>
                                                    <p className="text-sm text-slate-400">{connection.role}</p>
                                </div>
                                                <SendIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500 hover:text-emerald-400 transition-colors" />
                                            </motion.div>
                        ))}
                                    </div>
                                ) : (
                        <div className="flex-1 flex items-center justify-center px-6">
                                        <div className="text-center max-w-sm mx-auto">
                                            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-full flex items-center justify-center border border-slate-700/30 shadow-lg">
                                                <SendIcon className="w-10 h-10 text-slate-500" />
                                            </div>
                                            <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white">No Connections Available</h3>
                                            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                                                Connect with other users to start new conversations.
                                            </p>
                                        </div>
                        </div>
                    )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Chat panel */}
            <div className={cn(
                "flex-1 min-w-0 h-full max-h-full overflow-hidden bg-gradient-to-br from-slate-950 to-black flex justify-center",
                "transition-all duration-300 ease-in-out",
                isMobileChatOpenLocal ? "flex" : "hidden lg:flex"
            )}>
                <div className="w-full max-w-4xl h-full max-h-full overflow-hidden">
                    {selectedUserForChat ? (
                        <ChatPanel 
                            user={selectedUserForChat} 
                            currentUser={currentUser}
                            onBackToChatList={handleBackToChatList}
                            isMobile={isMobileChatOpenLocal}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full px-6">
                            <div className="text-center max-w-sm mx-auto">
                                <div className="w-20 h-20 mx-auto mb-6 bg-slate-800/50 rounded-full flex items-center justify-center">
                                    <SendIcon className="w-10 h-10 text-slate-600" />
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Select a chat to start messaging</h2>
                                <p className="text-sm sm:text-base text-slate-400 leading-relaxed">Choose from your active conversations or start a new one</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messages;