import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Message } from '../types';
import { SendIcon, ArrowLeftIcon } from './icons';
import { db } from '../firebase';
import { firestoreService } from '../services/firestoreService';
import firebase from 'firebase/compat/app';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import { getSafeAvatarUrl, getUserInitials } from '../utils/avatar';

interface ChatPanelProps {
    user: User;
    currentUser: User;
    onBackToChatList?: () => void;
    isMobile?: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ user, currentUser, onBackToChatList, isMobile }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatId = firestoreService.getChatId(currentUser.id, user.id);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ 
                behavior: "smooth", 
                block: "end",
                inline: "nearest"
            });
        }
    };

    const markAsRead = useCallback(() => {
        // Mark chat as read when user is actively viewing
        firestoreService.markChatAsRead(chatId, currentUser.id);
    }, [chatId, currentUser.id]);

    useEffect(() => {
        // Scroll to bottom when messages change
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    useEffect(() => {
        const chatRef = db.collection('chats').doc(chatId);
        const unsubscribe = chatRef.collection('messages').orderBy('timestamp', 'asc').onSnapshot(snapshot => {
            const fetchedMessages: Message[] = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    senderId: data.senderId,
                    text: data.text,
                    timestamp: data.timestamp.toDate()
                };
            });
            setMessages(fetchedMessages);
            
            // Mark chat as read when messages are loaded
            if (fetchedMessages.length > 0) {
                firestoreService.markChatAsRead(chatId, currentUser.id);
            }
            
            // Always scroll to bottom when first loading messages
            if (fetchedMessages.length > 0) {
                setTimeout(() => scrollToBottom(), 100);
            }
        });
        return () => unsubscribe();
            }, [chatId, currentUser.id]);

    // Mark as read when user scrolls or interacts with chat
    useEffect(() => {
        const handleScroll = () => {
            markAsRead();
            
                    // Mark as read when scrolling
        markAsRead();
        };

        const messagesContainer = document.querySelector('.messages-container');
        if (messagesContainer) {
            messagesContainer.addEventListener('scroll', handleScroll);
            messagesContainer.addEventListener('touchstart', markAsRead);
            messagesContainer.addEventListener('click', markAsRead);
            
            return () => {
                messagesContainer.removeEventListener('scroll', handleScroll);
                messagesContainer.removeEventListener('touchstart', markAsRead);
                messagesContainer.removeEventListener('click', markAsRead);
            };
        }
    }, [markAsRead]);

    // Mark as read when chat window gains focus
    useEffect(() => {
        const handleFocus = () => {
            markAsRead();
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [markAsRead]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;
        
        setIsTyping(true);
        const messageData = {
            senderId: currentUser.id,
            text: newMessage,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        const messageText = newMessage;
        setNewMessage('');
        
        try {
            const chatRef = db.collection('chats').doc(chatId);
            const messagesRef = chatRef.collection('messages').doc();
            const batch = db.batch();
            batch.set(messagesRef, messageData);
            const increment = firebase.firestore.FieldValue.increment(1);
            batch.set(chatRef, { 
                participants: [currentUser.id, user.id],
                lastMessage: messageData,
                unreadCounts: {
                    [user.id]: increment,
                    [currentUser.id]: 0
                }
            }, { merge: true });
            await batch.commit();

            // Create notification for the recipient
            await firestoreService.createMessageNotification(currentUser.id, user.id, currentUser.name, messageText);
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsTyping(false);
            // Ensure scroll to bottom after sending message
            scrollToBottom();
        }
    };

    const formatTime = (timestamp: Date) => {
        const now = new Date();
        const messageDate = new Date(timestamp);
        const isToday = now.toDateString() === messageDate.toDateString();
        
        if (isToday) {
            return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    return (
        <div className="flex flex-col h-full max-h-full bg-gradient-to-br from-slate-950 to-black overflow-hidden">
            {/* Header - Fixed */}
            <div className="flex-shrink-0 flex items-center gap-3 p-2 sm:p-3 border-b border-slate-800/30 bg-gradient-to-r from-slate-900/90 to-black/90 backdrop-blur-sm z-10">
                {onBackToChatList && (
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onBackToChatList}
                        className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-200 border border-slate-700/30"
                    >
                        <ArrowLeftIcon className="w-4 h-4 text-white" />
                    </motion.button>
                )}
                {getSafeAvatarUrl(user) ? (
                    <img 
                        src={getSafeAvatarUrl(user)} 
                        alt={user.name} 
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-slate-700/50 shadow-lg" 
                    />
                ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-slate-700/50 shadow-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-xs font-bold">
                        {getUserInitials(user.name)}
                    </div>
                )}
                <div className="flex-grow min-w-0">
                    <h3 className="font-bold text-white text-base sm:text-lg truncate">{user.name}</h3>
                    <p className="text-xs text-slate-400">{user.role}</p>
                </div>
                {isTyping && (
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                        <div className="flex space-x-1">
                            <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                            />
                            <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                            />
                            <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                            />
                        </div>
                        <span className="ml-1">typing...</span>
                    </div>
                )}
            </div>

            {/* Messages - Scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-gradient-to-br from-slate-950 to-black messages-container">
                {/* Messages Container - Flexbox with proper spacing */}
                <div className="flex flex-col min-h-full p-3 sm:p-4">
                    {/* Spacer to push messages to bottom */}
                    <div className="flex-1"></div>
                    
                    {/* Messages List */}
                    <div className="space-y-3">
                     <AnimatePresence>
                                                 {messages.map((msg, index) => (
                             <motion.div
                                 key={msg.id}
                                 initial={{ opacity: 0, y: 10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 transition={{ duration: 0.2 }}
                                 className={cn(
                                     "flex gap-2 sm:gap-3",
                                     msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'
                                 )}
                             >
                                {msg.senderId !== currentUser.id && (
                                    getSafeAvatarUrl(user) ? (
                                        <img 
                                            src={getSafeAvatarUrl(user)} 
                                            alt={`${user.name}'s avatar`} 
                                            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-slate-700/50 shadow-md" 
                                        />
                                    ) : (
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-slate-700/50 shadow-md bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-xs font-bold">
                                            {getUserInitials(user.name)}
                                        </div>
                                    )
                                )}
                                                                                                  <div className="flex flex-col">
                                     <div className={cn(
                                         "max-w-[200px] sm:max-w-[280px] lg:max-w-[320px] p-2.5 sm:p-3 rounded-2xl shadow-lg",
                                         "transition-all duration-200 hover:shadow-xl",
                                         msg.senderId === currentUser.id 
                                             ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-br-md border border-purple-500/30" 
                                             : "bg-gradient-to-r from-slate-800/80 to-slate-700/80 text-slate-200 rounded-bl-md border border-slate-600/30 backdrop-blur-sm"
                                     )}>
                                         <p className="text-sm sm:text-base leading-relaxed break-words font-normal">{msg.text}</p>
                                     </div>
                                     <p className={cn(
                                         "text-xs mt-1 opacity-50 font-light px-1",
                                         msg.senderId === currentUser.id ? 'text-right text-purple-200' : 'text-left text-slate-400'
                                     )}>
                                         {formatTime(msg.timestamp)}
                                     </p>
                                 </div>
                                {msg.senderId === currentUser.id && (
                                    getSafeAvatarUrl(currentUser) ? (
                                        <img 
                                            src={getSafeAvatarUrl(currentUser)} 
                                            alt="Your avatar" 
                                            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-slate-700/50 shadow-md" 
                                        />
                                    ) : (
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-slate-700/50 shadow-md bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-xs font-bold">
                                            {getUserInitials(currentUser.name)}
                                        </div>
                                    )
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    
                                         {messages.length === 0 && (
                         <div className="flex items-center justify-center h-full min-h-[400px]">
                             <div className="text-center">
                                 <div className="w-16 h-16 mx-auto mb-4 bg-slate-800/50 rounded-full flex items-center justify-center">
                                     <SendIcon className="w-8 h-8 text-slate-600" />
                                 </div>
                                 <h3 className="text-lg font-semibold text-white mb-2">Start a conversation</h3>
                                 <p className="text-slate-400">Send your first message to {user.name}</p>
                             </div>
                         </div>
                     )}
                     <div ref={messagesEndRef} />
                    </div>
                </div>
            </div>

            {/* Message Input - Fixed */}
            <div className="flex-shrink-0 p-2 sm:p-3 border-t border-slate-800/30 bg-gradient-to-r from-slate-900/90 to-black/90 backdrop-blur-sm">
                <form onSubmit={handleSend} className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/30 rounded-xl p-1.5 transition-all duration-200 focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/20">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Message ${user.name}...`}
                        className="flex-1 bg-transparent p-1.5 sm:p-2 text-white placeholder-slate-400 focus:outline-none text-sm sm:text-base"
                        disabled={isTyping}
                    />
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        title="Send message"
                        aria-label="Send message"
                        disabled={!newMessage.trim() || isTyping}
                        className={cn(
                            "p-1.5 sm:p-2 rounded-lg transition-all duration-200",
                            newMessage.trim() && !isTyping
                                ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-500 hover:to-purple-600 shadow-lg hover:shadow-purple-500/25"
                                : "bg-slate-700/50 text-slate-500 cursor-not-allowed"
                        )}
                    >
                        <SendIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>
                </form>
            </div>
        </div>
    );
};

export default ChatPanel;
