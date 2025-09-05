import { db } from '../firebase';
import { User, Chat, Idea, IdeaJoinRequest, ConnectionRequest, Comment, Negotiation, Offer, Notification, NotificationType } from '../types';
import firebase from 'firebase/compat/app';

type UserCreationData = Omit<User, 'id'>;

export const firestoreService = {
    /**
     * Paginated fetch for ideas. Returns { ideas, lastDoc, hasMore }
     * Filters ideas based on visibility: public ideas are shown to everyone,
     * private ideas are only shown to connected users
     */
    getIdeasPaginated: async (startAfterDoc?: any, pageSize: number = 20, currentUserId?: string): Promise<{ ideas: Idea[], lastDoc: any, hasMore: boolean }> => {
        let query = db.collection('ideas').orderBy('status').limit(pageSize);
        if (startAfterDoc) {
            query = query.startAfter(startAfterDoc);
        }
        const snapshot = await query.get();
        let ideas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Idea));
        
        // Filter ideas based on visibility if user is logged in
        if (currentUserId) {
            // Get user's connections to check visibility
            const userProfile = await firestoreService.getUserProfile(currentUserId);
            if (userProfile) {
                ideas = ideas.filter(idea => {
                    // Always show public ideas
                    if (idea.visibility === 'public') {
                        return true;
                    }
                    // For private ideas, only show if user is connected to the founder
                    if (idea.visibility === 'private') {
                        return userProfile.connections.includes(idea.founderId) || idea.founderId === currentUserId;
                    }
                    return true;
                });
            }
        } else {
            // If no user logged in, only show public ideas
            ideas = ideas.filter(idea => idea.visibility === 'public');
        }
        
        const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
        // Check if there are more docs
        const hasMore = snapshot.docs.length === pageSize;
        return { ideas, lastDoc, hasMore };
    },
    getUserProfile: async (uid: string): Promise<User | null> => {
        const docRef = db.collection("users").doc(uid);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            return { id: docSnap.id, ...docSnap.data() } as User;
        }
        return null;
    },

    createUserProfile: async (uid: string, data: UserCreationData): Promise<void> => {
        const userRef = db.collection("users").doc(uid);
        await userRef.set(data);
    },

    updateUserProfile: async (uid: string, data: Partial<User>): Promise<void> => {
        const userRef = db.collection("users").doc(uid);
        await userRef.update(data);
    },
    /** For legacy users, remove Gmail/Google-linked avatar URLs and mark as non-custom */
    stripGoogleAvatarsForAllUsers: async (): Promise<number> => {
        const snapshot = await db.collection('users').get();
        let updated = 0;
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            const data = doc.data() as any;
            const photoURL: string | undefined = data.photoURL;
            const avatarUrl: string | undefined = data.avatarUrl;
            const isGoogleUrl = (url?: string) => {
                if (!url) return false;
                try {
                    const host = new URL(url).hostname;
                    return (
                        host.endsWith('googleusercontent.com') ||
                        host.endsWith('gstatic.com') ||
                        host.endsWith('ggpht.com')
                    );
                } catch { return false; }
            };
            if (isGoogleUrl(photoURL) || isGoogleUrl(avatarUrl)) {
                batch.update(doc.ref, { photoURL: firebase.firestore.FieldValue.delete(), avatarUrl: firebase.firestore.FieldValue.delete(), customAvatar: false });
                updated += 1;
            }
        });
        if (updated > 0) {
            await batch.commit();
        }
        return updated;
    },
    /** Uploads an avatar file to Firebase Storage and updates the user's photoURL in Firestore */
    uploadUserAvatarAndSave: async (uid: string, fileOrDataUrl: File | string): Promise<string> => {
        // This project currently doesn't include Storage SDK; if provided a data URL, just store it directly as photoURL
        // In a production setup, replace this with Storage upload and set the downloadURL
        let photoURL: string;
        if (typeof fileOrDataUrl === 'string') {
            photoURL = fileOrDataUrl;
        } else {
            // Fallback: create a local object URL (temporary). For persistence across reloads, prefer data URL or Storage upload.
            photoURL = URL.createObjectURL(fileOrDataUrl);
        }
        const userRef = db.collection('users').doc(uid);
        await userRef.update({ photoURL });
        return photoURL;
    },

    getUsers: async (exceptUid?: string): Promise<User[]> => {
        const usersRef = db.collection("users");
        const querySnapshot = await usersRef.get();
        const users: User[] = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() } as User);
        });

        if(exceptUid) {
            return users.filter(user => user.id !== exceptUid);
        }

        return users;
    },

    getChats: async (uid: string): Promise<Chat[]> => {
        const chatsRef = db.collection("chats").where("participants", "array-contains", uid);
        const querySnapshot = await chatsRef.get();
        const chats: Chat[] = [];
        for (const doc of querySnapshot.docs) {
            const chatData = doc.data();
            const otherParticipantId = chatData.participants.find((p: string) => p !== uid);
            if (otherParticipantId) {
                const otherParticipant = await firestoreService.getUserProfile(otherParticipantId);
                if (otherParticipant) {
                    chats.push({
                        id: doc.id,
                        ...chatData,
                        participantDetails: [otherParticipant]
                    } as Chat);
                }
            }
        }
        return chats;
    },

    getChatsRealtime: (uid: string, callback: (chats: Chat[]) => void) => {
        const chatsRef = db.collection("chats").where("participants", "array-contains", uid);
        return chatsRef.onSnapshot(async (snapshot) => {
            const chats: Chat[] = [];
            for (const doc of snapshot.docs) {
                const chatData = doc.data();
                const otherParticipantId = chatData.participants.find((p: string) => p !== uid);
                if (otherParticipantId) {
                    const otherParticipant = await firestoreService.getUserProfile(otherParticipantId);
                    if (otherParticipant) {
                        chats.push({
                            id: doc.id,
                            ...chatData,
                            participantDetails: [otherParticipant]
                        } as Chat);
                    }
                }
            }
            callback(chats);
        });
    },

    markChatAsRead: async (chatId: string, userId: string) => {
        try {
            const chatRef = db.collection('chats').doc(chatId);
            await chatRef.update({
                [`unreadCounts.${userId}`]: 0
            });
        } catch (error) {
            console.error('Failed to mark chat as read:', error);
        }
    },

    // Notification functions
    createNotification: async (notification: Omit<Notification, 'id' | 'createdAt'>): Promise<string> => {
        const notificationRef = db.collection('notifications').doc();
        const notificationData = {
            ...notification,
            id: notificationRef.id,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        await notificationRef.set(notificationData);
        return notificationRef.id;
    },

    getNotifications: async (userId: string, limit: number = 50): Promise<Notification[]> => {
        const notificationsRef = db.collection('notifications')
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(limit);
        
        const snapshot = await notificationsRef.get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
        } as Notification));
    },

    getNotificationsRealtime: (userId: string, callback: (notifications: Notification[]) => void): (() => void) => {
        const notificationsRef = db.collection('notifications')
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc');
        
        const unsubscribe = notificationsRef.onSnapshot(snapshot => {
            const notifications = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp?.toDate() || new Date(),
                    createdAt: data.createdAt?.toDate() || new Date()
                } as Notification;
            });
            callback(notifications);
        });
        
        return unsubscribe;
    },

    getAllNotificationsRealtime: (userId: string, callback: (notifications: Notification[]) => void): (() => void) => {
        console.log('🔍 Firestore: Setting up getAllNotificationsRealtime for user:', userId);
        
        // First try with orderBy, if it fails, fall back to without orderBy
        const notificationsRef = db.collection('notifications')
            .where('userId', '==', userId);
        
        const unsubscribe = notificationsRef.onSnapshot(
            (snapshot) => {
                console.log('📨 Firestore: Snapshot received, docs count:', snapshot.docs.length);
                console.log('🔍 Firestore: Snapshot metadata:', snapshot.metadata);
                
                const notifications = snapshot.docs.map(doc => {
                    const data = doc.data();
                    console.log('📄 Firestore: Document data:', doc.id, data);
                    
                    const notification = {
                        id: doc.id,
                        ...data,
                        timestamp: data.timestamp?.toDate() || new Date(),
                        createdAt: data.createdAt?.toDate() || new Date()
                    } as Notification;
                    
                    console.log('✅ Firestore: Processed notification:', notification);
                    return notification;
                });
                
                // Sort by timestamp descending after processing
                notifications.sort((a, b) => {
                    const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
                    const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
                    return timeB - timeA;
                });
                
                console.log('📊 Firestore: Total processed notifications:', notifications.length);
                callback(notifications);
            },
            (error) => {
                console.error('❌ Firestore: Error in getAllNotificationsRealtime:', error);
                console.error('❌ Firestore: Error code:', error.code);
                console.error('❌ Firestore: Error message:', error.message);
                
                // Check if it's a permission error
                if (error.code === 'permission-denied') {
                    console.error('❌ Firestore: Permission denied - user may not have access to notifications collection');
                } else if (error.code === 'unauthenticated') {
                    console.error('❌ Firestore: User is not authenticated');
                } else if (error.code === 'not-found') {
                    console.error('❌ Firestore: Collection not found');
                }
                
                // Call callback with empty array on error, but don't crash
                callback([]);
            }
        );
        
        return unsubscribe;
    },

    markNotificationAsRead: async (notificationId: string): Promise<void> => {
        const notificationRef = db.collection('notifications').doc(notificationId);
        await notificationRef.update({
            isRead: true
        });
    },

    markAllNotificationsAsRead: async (userId: string): Promise<void> => {
        const notificationsRef = db.collection('notifications').where('userId', '==', userId).where('isRead', '==', false);
        const snapshot = await notificationsRef.get();
        
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { isRead: true });
        });
        
        await batch.commit();
    },

    updateNotificationData: async (notificationId: string, data: any): Promise<void> => {
        const notificationRef = db.collection('notifications').doc(notificationId);
        const doc = await notificationRef.get();
        if (doc.exists) {
            const currentData = doc.data()?.data || {};
            const updatedData = { ...currentData, ...data };
            await notificationRef.update({
                data: updatedData
            });
        }
    },

    getUnreadNotificationCount: async (userId: string): Promise<number> => {
        const notificationsRef = db.collection('notifications')
            .where('userId', '==', userId)
            .where('isRead', '==', false);
        
        const snapshot = await notificationsRef.get();
        return snapshot.size;
    },

    getUnreadNotificationCountRealtime: (userId: string, callback: (count: number) => void) => {
        console.log('🔍 Firestore: Setting up getUnreadNotificationCountRealtime for user:', userId);
        
        const notificationsRef = db.collection('notifications')
            .where('userId', '==', userId)
            .where('isRead', '==', false);
        
        return notificationsRef.onSnapshot(
            (snapshot) => {
                console.log('🔢 Firestore: Unread count snapshot received, count:', snapshot.size);
                console.log('🔍 Firestore: Unread snapshot metadata:', snapshot.metadata);
                callback(snapshot.size);
            },
            (error) => {
                console.error('❌ Firestore: Error in getUnreadNotificationCountRealtime:', error);
                console.error('❌ Firestore: Error code:', error.code);
                console.error('❌ Firestore: Error message:', error.message);
                
                // Check if it's a permission error
                if (error.code === 'permission-denied') {
                    console.error('❌ Firestore: Permission denied - user may not have access to notifications collection');
                } else if (error.code === 'unauthenticated') {
                    console.error('❌ Firestore: User is not authenticated');
                }
                
                // Call callback with 0 on error, but don't crash
                callback(0);
            }
        );
    },

    // Helper function to create connection request notification
    createConnectionRequestNotification: async (fromUserId: string, toUserId: string, fromUserName: string, connectionRequestId: string): Promise<void> => {
        const toUser = await firestoreService.getUserProfile(toUserId);
        if (!toUser) return;

        await firestoreService.createNotification({
            userId: toUserId,
            type: NotificationType.CONNECTION_REQUEST,
            title: 'New Connection Request',
            message: `${fromUserName} wants to connect with you`,
            data: {
                senderId: fromUserId,
                senderName: fromUserName,
                connectionRequestId: connectionRequestId
            },
            isRead: false,
            timestamp: new Date()
        });
    },

    // Helper function to create message notification
    createMessageNotification: async (fromUserId: string, toUserId: string, fromUserName: string, messageText: string): Promise<void> => {
        const toUser = await firestoreService.getUserProfile(toUserId);
        if (!toUser) return;

        await firestoreService.createNotification({
            userId: toUserId,
            type: NotificationType.MESSAGE,
            title: `New message from ${fromUserName}`,
            message: messageText.length > 50 ? `${messageText.substring(0, 50)}...` : messageText,
            data: {
                senderId: fromUserId,
                senderName: fromUserName,
                chatId: firestoreService.getChatId(fromUserId, toUserId)
            },
            isRead: false,
            timestamp: new Date()
        });
    },

    // Helper function to create negotiation notification
    createNegotiationNotification: async (userId: string, negotiationId: string, title: string, message: string): Promise<void> => {
        await firestoreService.createNotification({
            userId,
            type: NotificationType.NEGOTIATION_UPDATE,
            title,
            message,
            data: {
                negotiationId
            },
            isRead: false,
            timestamp: new Date()
        });
    },

    getChatId: (uid1: string, uid2: string): string => {
        return [uid1, uid2].sort().join('_');
    },

    postIdea: async (idea: Omit<Idea, 'id'>): Promise<void> => {
        const ideaWithExtras = {
            ...idea,
            likes: [],
            comments: [],
        };
        await db.collection('ideas').add(ideaWithExtras);
    },

    getIdeas: async (currentUserId?: string): Promise<Idea[]> => {
        const ideasRef = db.collection('ideas').orderBy('status').limit(20);
        const snapshot = await ideasRef.get();
        let ideas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Idea));
        
        // Filter ideas based on visibility if user is logged in
        if (currentUserId) {
            // Get user's connections to check visibility
            const userProfile = await firestoreService.getUserProfile(currentUserId);
            if (userProfile) {
                ideas = ideas.filter(idea => {
                    // Always show public ideas
                    if (idea.visibility === 'public') {
                        return true;
                    }
                    // For private ideas, only show if user is connected to the founder
                    if (idea.visibility === 'private') {
                        return userProfile.connections.includes(idea.founderId) || idea.founderId === currentUserId;
                    }
                    return true;
                });
            }
        } else {
            // If no user logged in, only show public ideas
            ideas = ideas.filter(idea => idea.visibility === 'public');
        }
        
        return ideas;
    },

    getIdeasByFounder: async (founderId: string, currentUserId?: string): Promise<Idea[]> => {
        const ideasRef = db.collection('ideas').where('founderId', '==', founderId);
        const snapshot = await ideasRef.get();
        let ideas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Idea));
        
        // Filter ideas based on visibility if user is logged in
        if (currentUserId) {
            // Get user's connections to check visibility
            const userProfile = await firestoreService.getUserProfile(currentUserId);
            if (userProfile) {
                ideas = ideas.filter(idea => {
                    // Always show public ideas
                    if (idea.visibility === 'public') {
                        return true;
                    }
                    // For private ideas, only show if user is connected to the founder
                    if (idea.visibility === 'private') {
                        return userProfile.connections.includes(idea.founderId) || idea.founderId === currentUserId;
                    }
                    return true;
                });
            }
        } else {
            // If no user logged in, only show public ideas
            ideas = ideas.filter(idea => idea.visibility === 'public');
        }
        
        return ideas;
    },

    /**
     * Get all ideas visible to a specific user
     * Includes public ideas and private ideas from connected users
     */
    getVisibleIdeasForUser: async (userId: string): Promise<Idea[]> => {
        const userProfile = await firestoreService.getUserProfile(userId);
        if (!userProfile) {
            return [];
        }

        // Get all ideas
        const ideasRef = db.collection('ideas').orderBy('status');
        const snapshot = await ideasRef.get();
        const allIdeas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Idea));
        
        // Filter based on visibility
        return allIdeas.filter(idea => {
            // Always show public ideas
            if (idea.visibility === 'public') {
                return true;
            }
            // For private ideas, only show if user is connected to the founder or is the founder
            if (idea.visibility === 'private') {
                return userProfile.connections.includes(idea.founderId) || idea.founderId === userId;
            }
            return true;
        });
    },

    /**
     * Get ideas for a user's profile page
     * Shows user's own ideas and ideas from connected users
     */
    getIdeasForUserProfile: async (userId: string): Promise<{ ownIdeas: Idea[], connectedIdeas: Idea[] }> => {
        const userProfile = await firestoreService.getUserProfile(userId);
        if (!userProfile) {
            return { ownIdeas: [], connectedIdeas: [] };
        }

        // Get all ideas
        const ideasRef = db.collection('ideas').orderBy('status');
        const snapshot = await ideasRef.get();
        const allIdeas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Idea));
        
        const ownIdeas: Idea[] = [];
        const connectedIdeas: Idea[] = [];
        
        allIdeas.forEach(idea => {
            if (idea.founderId === userId) {
                // User's own ideas
                ownIdeas.push(idea);
            } else if (idea.visibility === 'public' || userProfile.connections.includes(idea.founderId)) {
                // Public ideas or ideas from connected users
                connectedIdeas.push(idea);
            }
        });
        
        return { ownIdeas, connectedIdeas };
    },

    joinIdea: async (ideaId: string, userId: string): Promise<void> => {
        const ideaRef = db.collection('ideas').doc(ideaId);
        await ideaRef.update({
            team: firebase.firestore.FieldValue.arrayUnion(userId)
        });
    },

    createJoinRequest: async (idea: Idea, developer: User): Promise<void> => {
        const request = {
            ideaId: idea.id,
            ideaTitle: idea.title,
            developerId: developer.id,
            developerName: developer.name,
            developerAvatar: developer.avatarUrl,
            founderId: idea.founderId,
            status: 'pending',
            timestamp: new Date(),
        };
        await db.collection('joinRequests').add(request);
    },

    getJoinRequestsForFounder: (founderId: string, callback: (requests: IdeaJoinRequest[]) => void): (() => void) => {
        const requestsRef = db.collection('joinRequests').where('founderId', '==', founderId).where('status', '==', 'pending');
        const unsubscribe = requestsRef.onSnapshot(snapshot => {
            const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IdeaJoinRequest));
            callback(requests);
        });
        return unsubscribe;
    },

    getJoinRequestsForDeveloper: (developerId: string, callback: (requests: IdeaJoinRequest[]) => void): (() => void) => {
        const requestsRef = db.collection('joinRequests').where('developerId', '==', developerId);
        const unsubscribe = requestsRef.onSnapshot(snapshot => {
            const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IdeaJoinRequest));
            callback(requests);
        });
        return unsubscribe;
    },

    updateJoinRequest: async (requestId: string, status: 'approved' | 'rejected'): Promise<void> => {
        const requestRef = db.collection('joinRequests').doc(requestId);
        await requestRef.update({ status });

        if (status === 'approved') {
            const requestDoc = await requestRef.get();
            const request = requestDoc.data() as IdeaJoinRequest;
            await firestoreService.joinIdea(request.ideaId, request.developerId);
        }
    },

    removeTeamMember: async (ideaId: string, memberId: string): Promise<void> => {
        const ideaRef = db.collection('ideas').doc(ideaId);
        
        const joinRequestsRef = db.collection('joinRequests');
        const q = joinRequestsRef
            .where('ideaId', '==', ideaId)
            .where('developerId', '==', memberId)
            .where('status', '==', 'approved');

        const querySnapshot = await q.get();
        const batch = db.batch();

        batch.update(ideaRef, {
            team: firebase.firestore.FieldValue.arrayRemove(memberId)
        });

        querySnapshot.forEach(doc => {
            batch.update(doc.ref, { status: 'rejected' });
        });

        await batch.commit();
    },

    createConnectionRequest: async (fromUser: User, toUserId: string): Promise<void> => {
        const requestId = [fromUser.id, toUserId].sort().join('_');
        const requestRef = db.collection('connectionRequests').doc(requestId);
        const doc = await requestRef.get();

        if (doc.exists) {
            const data = doc.data();
            if (data && data.status === 'pending') {
                throw new Error("Connection request already exists.");
            }
            // If a previous request exists but was rejected or withdrawn, we can create a new one
            // The existing document will be overwritten
        }

        const request = {
            fromUserId: fromUser.id,
            fromUserName: fromUser.name,
            fromUserAvatar: fromUser.avatarUrl,
            fromUserRole: fromUser.role,
            toUserId: toUserId,
            status: 'pending',
            timestamp: new Date(),
        };
        await requestRef.set(request);

        // Add to pending connections for the sender
        const fromUserRef = db.collection('users').doc(fromUser.id);
        await fromUserRef.update({
            pendingConnections: firebase.firestore.FieldValue.arrayUnion(toUserId)
        });

        // Create notification for the recipient
        await firestoreService.createConnectionRequestNotification(fromUser.id, toUserId, fromUser.name, requestId);
    },

    getPendingConnectionRequests: (userId: string, callback: (requests: ConnectionRequest[]) => void): (() => void) => {
        const requestsRef = db.collection('connectionRequests').where('toUserId', '==', userId).where('status', '==', 'pending');
        const unsubscribe = requestsRef.onSnapshot(snapshot => {
            const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConnectionRequest));
            callback(requests);
        });
        return unsubscribe;
    },

    updateConnectionRequest: async (requestId: string, status: 'approved' | 'rejected'): Promise<void> => {
        const requestRef = db.collection('connectionRequests').doc(requestId);
        await requestRef.update({ status });

        if (status === 'approved') {
            const requestDoc = await requestRef.get();
            const request = requestDoc.data();
            if (request) {
                await firestoreService.addConnection(request.fromUserId, request.toUserId);
            }
        }
        
        // Remove from pending connections
        const requestDoc = await requestRef.get();
        const request = requestDoc.data();
        if (request) {
            const fromUserRef = db.collection('users').doc(request.fromUserId);
            await fromUserRef.update({
                pendingConnections: firebase.firestore.FieldValue.arrayRemove(request.toUserId)
            });
        }
    },

    addConnection: async (userId1: string, userId2: string): Promise<void> => {
        const user1Ref = db.collection('users').doc(userId1);
        const user2Ref = db.collection('users').doc(userId2);

        const batch = db.batch();
        batch.update(user1Ref, { connections: firebase.firestore.FieldValue.arrayUnion(userId2) });
        batch.update(user2Ref, { connections: firebase.firestore.FieldValue.arrayUnion(userId1) });
        await batch.commit();
    },

    getSentConnectionRequests: (userId: string, callback: (requests: ConnectionRequest[]) => void): (() => void) => {
        const requestsRef = db.collection('connectionRequests').where('fromUserId', '==', userId);
        const unsubscribe = requestsRef.onSnapshot(snapshot => {
            const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConnectionRequest));
            callback(requests);
        });
        return unsubscribe;
    },

    withdrawConnectionRequest: async (requestId: string): Promise<void> => {
        const requestRef = db.collection('connectionRequests').doc(requestId);
        const requestDoc = await requestRef.get();
        const request = requestDoc.data();

        if (request) {
            const fromUserRef = db.collection('users').doc(request.fromUserId);
            await fromUserRef.update({
                pendingConnections: firebase.firestore.FieldValue.arrayRemove(request.toUserId)
            });
        }

        await requestRef.delete();
    },

    getConnections: async (connectionIds: string[]): Promise<User[]> => {
        if (connectionIds.length === 0) {
            return [];
        }
        const usersRef = db.collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', connectionIds);
        const snapshot = await usersRef.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    },

    getUserConnections: async (userId: string): Promise<User[]> => {
        const userProfile = await firestoreService.getUserProfile(userId);
        if (!userProfile || !userProfile.connections) {
            return [];
        }
        return await firestoreService.getConnections(userProfile.connections);
    },

    removeConnection: async (currentUserId: string, connectionToRemoveId: string): Promise<void> => {
        const user1Ref = db.collection('users').doc(currentUserId);
        const user2Ref = db.collection('users').doc(connectionToRemoveId);
        const connectionRequestId = [currentUserId, connectionToRemoveId].sort().join('_');
        const connectionRequestRef = db.collection('connectionRequests').doc(connectionRequestId);

        const batch = db.batch();
        batch.update(user1Ref, { connections: firebase.firestore.FieldValue.arrayRemove(connectionToRemoveId) });
        batch.update(user2Ref, { connections: firebase.firestore.FieldValue.arrayRemove(currentUserId) });
        batch.delete(connectionRequestRef);
        
        await batch.commit();
    },

    toggleLikeIdea: async (ideaId: string, userId: string): Promise<void> => {
        const ideaRef = db.collection('ideas').doc(ideaId);
        const doc = await ideaRef.get();
        if (doc.exists) {
            const idea = doc.data() as Idea;
            const likes = idea.likes || [];
            if (likes.includes(userId)) {
                await ideaRef.update({
                    likes: firebase.firestore.FieldValue.arrayRemove(userId)
                });
            } else {
                await ideaRef.update({
                    likes: firebase.firestore.FieldValue.arrayUnion(userId)
                });
            }
        }
    },

    addCommentToIdea: async (ideaId: string, comment: Omit<Comment, 'id'>): Promise<void> => {
        const commentWithId = { ...comment, id: db.collection('ideas').doc().id };
        const ideaRef = db.collection('ideas').doc(ideaId);
        await ideaRef.update({
            comments: firebase.firestore.FieldValue.arrayUnion(commentWithId)
        });
    },

    deleteCommentFromIdea: async (ideaId: string, commentToDelete: Comment): Promise<void> => {
        const ideaRef = db.collection('ideas').doc(ideaId);
        await ideaRef.update({
            comments: firebase.firestore.FieldValue.arrayRemove(commentToDelete)
        });
    },

    updateIdea: async (ideaId: string, updatedData: Partial<Idea>): Promise<void> => {
        const ideaRef = db.collection('ideas').doc(ideaId);
        await ideaRef.update(updatedData);
    },

    createNegotiationRequest: async (idea: Idea, investor: User): Promise<string> => {
        const negotiationId = `${idea.id}_${investor.id}`;
        const negotiationRef = db.collection('negotiations').doc(negotiationId);

        const doc = await negotiationRef.get();
        if (doc.exists) {
            throw new Error("A negotiation for this idea with this investor already exists.");
        }

        const negotiation: Omit<Negotiation, 'id'> = {
            ideaId: idea.id,
            ideaTitle: idea.title,
            investorId: investor.id,
            investorName: investor.name,
            investorAvatar: investor.avatarUrl,
            founderId: idea.founderId,
            founderName: idea.founderName,
            status: 'pending',
            timestamp: new Date(),
            offers: [],
            ideaInvestmentDetails: idea.investmentDetails,
        };

        await negotiationRef.set(negotiation);

        // Create notification for the founder
        await firestoreService.createNegotiationNotification(
            idea.founderId,
            negotiationId,
            'New Negotiation Request',
            `${investor.name} wants to negotiate for your idea: ${idea.title}`
        );

        return negotiationId;
    },

    getNegotiationsForFounder: (founderId: string, callback: (negotiations: Negotiation[]) => void): (() => void) => {
        const negotiationsRef = db.collection('negotiations').where('founderId', '==', founderId);
        const unsubscribe = negotiationsRef.onSnapshot(snapshot => {
            const negotiations = snapshot.docs.map(doc => {
                const data = doc.data();
                return { 
                    id: doc.id, 
                    ...data,
                    // Convert Firestore Timestamps to JS Dates
                    timestamp: data.timestamp.toDate ? data.timestamp.toDate() : data.timestamp,
                    offers: data.offers ? data.offers.map((offer: any) => ({
                        ...offer,
                        timestamp: offer.timestamp.toDate ? offer.timestamp.toDate() : offer.timestamp,
                    })) : [],
                } as Negotiation;
            });
            callback(negotiations);
        });
        return unsubscribe;
    },

    getNegotiationsForInvestor: (investorId: string, callback: (negotiations: Negotiation[]) => void): (() => void) => {
        const negotiationsRef = db.collection('negotiations').where('investorId', '==', investorId);
        const unsubscribe = negotiationsRef.onSnapshot(snapshot => {
            const negotiations = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Convert Firestore Timestamps to JS Dates
                    timestamp: data.timestamp.toDate ? data.timestamp.toDate() : data.timestamp,
                    offers: data.offers ? data.offers.map((offer: any) => ({
                        ...offer,
                        timestamp: offer.timestamp.toDate ? offer.timestamp.toDate() : offer.timestamp,
                    })) : [],
                } as Negotiation;
            });
            callback(negotiations);
        });
        return unsubscribe;
    },

    updateNegotiationStatus: async (negotiationId: string, status: Negotiation['status'], finalInvestment?: number, finalEquity?: number): Promise<void> => {
        const negotiationRef = db.collection('negotiations').doc(negotiationId);
        
        // Get the negotiation details first
        const negotiationDoc = await negotiationRef.get();
        if (!negotiationDoc.exists) {
            throw new Error("Negotiation not found");
        }
        
        const negotiation = negotiationDoc.data() as Negotiation;
        
        const updateData: any = { status };
        if (status === 'accepted' && typeof finalInvestment === 'number' && typeof finalEquity === 'number') {
            updateData.finalInvestment = finalInvestment;
            updateData.finalEquity = finalEquity;
        }
        
        // If founder name is missing, try to fetch it from the idea
        if (!negotiation.founderName && negotiation.ideaId) {
            try {
                const ideaDoc = await db.collection('ideas').doc(negotiation.ideaId).get();
                if (ideaDoc.exists) {
                    const ideaData = ideaDoc.data();
                    if (ideaData?.founderName) {
                        updateData.founderName = ideaData.founderName;
                    }
                }
            } catch (error) {
                console.error('Error fetching founder name for negotiation update:', error);
            }
        }
        
        await negotiationRef.update(updateData);

        // Create notifications for status changes
        if (status === 'accepted') {
            // Notify both parties about the accepted deal
            await firestoreService.createNegotiationNotification(
                negotiation.founderId,
                negotiationId,
                'Deal Accepted! 🎉',
                `Your negotiation for "${negotiation.ideaTitle}" has been accepted!`
            );
            
            await firestoreService.createNegotiationNotification(
                negotiation.investorId,
                negotiationId,
                'Deal Accepted! 🎉',
                `Your negotiation for "${negotiation.ideaTitle}" has been accepted!`
            );
        } else if (status === 'rejected') {
            // Notify the other party about the rejection
            const recipientId = negotiation.founderId; // For now, just notify founder
            await firestoreService.createNegotiationNotification(
                recipientId,
                negotiationId,
                'Negotiation Update',
                `The negotiation for "${negotiation.ideaTitle}" has been ${status}.`
            );
        }
    },
    getTotalInvestedAmountForIdeas: async (founderId: string): Promise<number> => {
        // Get all accepted negotiations for this founder's ideas
        const snapshot = await db.collection('negotiations').where('founderId', '==', founderId).where('status', '==', 'accepted').get();
        let total = 0;
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (typeof data.finalInvestment === 'number') {
                total += data.finalInvestment;
            }
        });
        return total;
    },

    addOfferToNegotiation: async (negotiationId: string, offer: Offer): Promise<void> => {
        const negotiationRef = db.collection('negotiations').doc(negotiationId);
        
        // Get the negotiation details first
        const negotiationDoc = await negotiationRef.get();
        if (!negotiationDoc.exists) {
            throw new Error("Negotiation not found");
        }
        
        const negotiation = negotiationDoc.data() as Negotiation;
        
        await negotiationRef.update({
            offers: firebase.firestore.FieldValue.arrayUnion(offer),
            status: 'active' // Making an offer automatically makes the negotiation active
        });

        // Create notification for the other party
        const recipientId = offer.by === 'founder' ? negotiation.investorId : negotiation.founderId;
        const senderName = offer.by === 'founder' ? 'Founder' : negotiation.investorName;
        const offerType = offer.by === 'founder' ? 'investment offer' : 'equity offer';
        
        await firestoreService.createNegotiationNotification(
            recipientId,
            negotiationId,
            'New Offer Received',
            `${senderName} made a new ${offerType} for: ${negotiation.ideaTitle}`
        );
    },

    getAcceptedInvestorCountForIdeas: async (): Promise<Record<string, number>> => {
        const snapshot = await db.collection('negotiations').where('status', '==', 'accepted').get();
        const countMap: Record<string, number> = {};
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.ideaId) {
                countMap[data.ideaId] = (countMap[data.ideaId] || 0) + 1;
            }
        });
        return countMap;
    },

    /**
     * Ideas an investor has invested in (based on accepted negotiations)
     */
    getIdeasInvestedByInvestor: async (investorId: string): Promise<Idea[]> => {
        const negotiationsSnap = await db
            .collection('negotiations')
            .where('investorId', '==', investorId)
            .where('status', '==', 'accepted')
            .get();

        const ideaIds = negotiationsSnap.docs
            .map(doc => (doc.data() as Negotiation).ideaId)
            .filter(Boolean);

        if (ideaIds.length === 0) {
            return [];
        }

        // Fetch ideas individually to avoid Firestore 'in' limit pitfalls
        const ideas: Idea[] = [];
        await Promise.all(
            ideaIds.map(async (ideaId) => {
                try {
                    const ideaDoc = await db.collection('ideas').doc(ideaId).get();
                    if (ideaDoc.exists) {
                        ideas.push({ id: ideaDoc.id, ...ideaDoc.data() } as Idea);
                    }
                } catch (e) {
                    console.error('Error fetching invested idea', ideaId, e);
                }
            })
        );
        return ideas;
    },

    /**
     * Ideas a developer has collaborated on (member of team array)
     */
    getIdeasCollaboratedByDeveloper: async (developerId: string): Promise<Idea[]> => {
        const ideasRef = db.collection('ideas').where('team', 'array-contains', developerId);
        const snapshot = await ideasRef.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Idea));
    },

    getFounderIdeaEngagementAnalytics: async (founderId: string) => {
        const ideas = await firestoreService.getIdeasByFounder(founderId);
        let totalLikes = 0;
        let totalComments = 0;
        ideas.forEach(idea => {
            totalLikes += (idea.likes ? idea.likes.length : 0);
            totalComments += (idea.comments ? idea.comments.length : 0);
        });
        return { totalLikes, totalComments };
    },

    getConnectionStatus: async (currentUserId: string, otherUserId: string): Promise<{ isConnected: boolean; isPending: boolean }> => {
        // Check if users are already connected
        const currentUserRef = db.collection('users').doc(currentUserId);
        const currentUserDoc = await currentUserRef.get();
        const currentUserData = currentUserDoc.data();
        
        if (currentUserData && currentUserData.connections && currentUserData.connections.includes(otherUserId)) {
            return { isConnected: true, isPending: false };
        }

        // Check if there's a pending connection request
        const requestId = [currentUserId, otherUserId].sort().join('_');
        const requestRef = db.collection('connectionRequests').doc(requestId);
        const requestDoc = await requestRef.get();
        
        if (requestDoc.exists) {
            const requestData = requestDoc.data();
            if (requestData && requestData.status === 'pending') {
                // Check if the current user is the sender or receiver
                if (requestData.fromUserId === currentUserId) {
                    return { isConnected: false, isPending: true };
                }
            }
        }

        return { isConnected: false, isPending: false };
    },

    getConnectionStatusRealtime: (currentUserId: string, otherUserId: string, callback: (status: { isConnected: boolean; isPending: boolean }) => void): (() => void) => {
        const unsubscribers: (() => void)[] = [];

        // Listen to current user's connections changes
        const currentUserRef = db.collection('users').doc(currentUserId);
        const unsubCurrentUser = currentUserRef.onSnapshot(snapshot => {
            const userData = snapshot.data();
            if (userData && userData.connections && userData.connections.includes(otherUserId)) {
                callback({ isConnected: true, isPending: false });
                return;
            }
            
            // If not connected, check pending requests
            const requestId = [currentUserId, otherUserId].sort().join('_');
            const requestRef = db.collection('connectionRequests').doc(requestId);
            requestRef.get().then(doc => {
                if (doc.exists) {
                    const requestData = doc.data();
                    if (requestData && requestData.status === 'pending' && requestData.fromUserId === currentUserId) {
                        callback({ isConnected: false, isPending: true });
                    } else {
                        callback({ isConnected: false, isPending: false });
                    }
                } else {
                    callback({ isConnected: false, isPending: false });
                }
            });
        });

        // Listen to connection requests changes
        const requestId = [currentUserId, otherUserId].sort().join('_');
        const requestRef = db.collection('connectionRequests').doc(requestId);
        const unsubRequest = requestRef.onSnapshot(snapshot => {
            if (snapshot.exists) {
                const requestData = snapshot.data();
                if (requestData && requestData.status === 'pending' && requestData.fromUserId === currentUserId) {
                    callback({ isConnected: false, isPending: true });
                } else if (requestData && requestData.status === 'approved') {
                    callback({ isConnected: true, isPending: false });
                } else {
                    callback({ isConnected: false, isPending: false });
                }
            } else {
                callback({ isConnected: false, isPending: false });
            }
        });

        // Also listen to other user's connections changes (in case they accept/reject)
        const otherUserRef = db.collection('users').doc(otherUserId);
        const unsubOtherUser = otherUserRef.onSnapshot(snapshot => {
            const userData = snapshot.data();
            if (userData && userData.connections && userData.connections.includes(currentUserId)) {
                callback({ isConnected: true, isPending: false });
            }
        });

        unsubscribers.push(unsubCurrentUser, unsubRequest, unsubOtherUser);

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    },

    /**
     * Get ideas by a specific founder that are visible to the current user
     */
    getIdeasByFounderForUser: async (founderId: string, currentUserId: string): Promise<Idea[]> => {
        const currentUserProfile = await firestoreService.getUserProfile(currentUserId);
        if (!currentUserProfile) {
            return [];
        }

        // Get all ideas by the founder
        const ideasRef = db.collection('ideas').where('founderId', '==', founderId);
        const snapshot = await ideasRef.get();
        const founderIdeas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Idea));
        
        // Filter based on visibility
        return founderIdeas.filter(idea => {
            // Always show public ideas
            if (idea.visibility === 'public') {
                return true;
            }
            // For private ideas, only show if current user is connected to the founder or is the founder
            if (idea.visibility === 'private') {
                return currentUserProfile.connections.includes(founderId) || founderId === currentUserId;
            }
            return true;
        });
    },

    /**
     * Get all ideas by a specific founder (for the founder's own view)
     * Returns ALL ideas by the founder, regardless of visibility
     */
    getOwnIdeasByFounder: async (founderId: string): Promise<Idea[]> => {
        console.log('🔍 getOwnIdeasByFounder called for founderId:', founderId);
        const ideasRef = db.collection('ideas').where('founderId', '==', founderId);
        const snapshot = await ideasRef.get();
        const ideas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Idea));
        console.log('📋 getOwnIdeasByFounder found ideas:', ideas);
        return ideas;
    },

    /**
     * Get ideas for the current user's dashboard
     * Shows user's own ideas and ideas they can see from others
     */
    getIdeasForDashboard: async (userId: string): Promise<{ ownIdeas: Idea[], visibleIdeas: Idea[] }> => {
        const userProfile = await firestoreService.getUserProfile(userId);
        if (!userProfile) {
            return { ownIdeas: [], visibleIdeas: [] };
        }

        // Get all ideas
        const ideasRef = db.collection('ideas').orderBy('status');
        const snapshot = await ideasRef.get();
        const allIdeas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Idea));
        
        const ownIdeas: Idea[] = [];
        const visibleIdeas: Idea[] = [];
        
        allIdeas.forEach(idea => {
            if (idea.founderId === userId) {
                // User's own ideas
                ownIdeas.push(idea);
            } else if (idea.visibility === 'public' || userProfile.connections.includes(idea.founderId)) {
                // Public ideas or ideas from connected users
                visibleIdeas.push(idea);
            }
        });
        
        return { ownIdeas, visibleIdeas };
    },

    /**
     * Get ideas for the current user's profile page
     * Shows user's own ideas and ideas from connected users
     */
    getIdeasForProfile: async (userId: string): Promise<{ ownIdeas: Idea[], connectedIdeas: Idea[] }> => {
        const userProfile = await firestoreService.getUserProfile(userId);
        if (!userProfile) {
            return { ownIdeas: [], connectedIdeas: [] };
        }

        // Get all ideas
        const ideasRef = db.collection('ideas').orderBy('status');
        const snapshot = await ideasRef.get();
        const allIdeas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Idea));
        
        const ownIdeas: Idea[] = [];
        const connectedIdeas: Idea[] = [];
        
        allIdeas.forEach(idea => {
            if (idea.founderId === userId) {
                // User's own ideas
                ownIdeas.push(idea);
            } else if (idea.visibility === 'public' || userProfile.connections.includes(idea.founderId)) {
                // Public ideas or ideas from connected users
                connectedIdeas.push(idea);
            }
        });
        
        return { ownIdeas, connectedIdeas };
    },

    // Utility function to update existing negotiations with missing founder names
    updateNegotiationsWithFounderNames: async (): Promise<void> => {
        try {
            const negotiationsRef = db.collection('negotiations');
            const snapshot = await negotiationsRef.get();
            
            const batch = db.batch();
            let updateCount = 0;
            
            for (const doc of snapshot.docs) {
                const negotiation = doc.data() as Negotiation;
                
                // If founder name is missing, fetch it from the idea
                if (!negotiation.founderName && negotiation.ideaId) {
                    try {
                        const ideaDoc = await db.collection('ideas').doc(negotiation.ideaId).get();
                        if (ideaDoc.exists) {
                            const ideaData = ideaDoc.data();
                            if (ideaData?.founderName) {
                                batch.update(doc.ref, { founderName: ideaData.founderName });
                                updateCount++;
                            }
                        }
                    } catch (error) {
                        console.error(`Error fetching founder name for negotiation ${doc.id}:`, error);
                    }
                }
            }
            
            if (updateCount > 0) {
                await batch.commit();
                console.log(`Updated ${updateCount} negotiations with founder names`);
            } else {
                console.log('No negotiations needed founder name updates');
            }
        } catch (error) {
            console.error('Error updating negotiations with founder names:', error);
            throw error;
        }
    },
};