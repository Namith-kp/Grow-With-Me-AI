import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types';
import { SendIcon } from './icons';
import { db } from '../firebase';
import { firestoreService } from '../services/firestoreService';
import firebase from 'firebase/compat/app';

interface ChatPanelProps {
    user: User;
    currentUser: User;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ user, currentUser }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatId = firestoreService.getChatId(currentUser.id, user.id);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

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
        });
        return () => unsubscribe();
    }, [chatId, currentUser.id]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;
        const messageData = {
            senderId: currentUser.id,
            text: newMessage,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        setNewMessage('');
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
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 p-4 border-b border-neutral-800 bg-black">
                <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full" />
                <h3 className="font-bold text-lg text-white">{user.name}</h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-black">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex gap-3 ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}> 
                        {msg.senderId !== currentUser.id && <img src={user.avatarUrl} alt={`${user.name}'s avatar`} className="w-8 h-8 rounded-full" />}
                        <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.senderId === currentUser.id ? 'bg-purple-600 text-white rounded-br-none' : 'bg-neutral-800 text-neutral-200 rounded-bl-none'}`}> 
                            <p>{msg.text}</p>
                            <p className={`text-xs mt-1 ${msg.senderId === currentUser.id ? 'text-purple-200' : 'text-neutral-500'}`}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        {msg.senderId === currentUser.id && <img src={currentUser.avatarUrl} alt="Your avatar" className="w-8 h-8 rounded-full" />}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="p-4 border-t border-neutral-800 bg-black">
                <div className="flex items-center bg-white/5 rounded-lg">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Message ${user.name}`}
                        className="flex-1 bg-transparent p-3 text-white focus:outline-none"
                    />
                    <button type="submit" title="Send message" aria-label="Send message" className="p-3 text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50" disabled={!newMessage.trim()}>
                        <SendIcon className="w-6 h-6" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatPanel;
