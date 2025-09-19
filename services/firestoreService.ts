import { db } from '../firebase';
import { User, Chat, Idea, IdeaJoinRequest, ConnectionRequest, Comment, Negotiation, Offer, Notification, NotificationType, MatchAlert, Role } from '../types';
import firebase from 'firebase/compat/app';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getAllCountries, getStatesByCountry } from '../data/locations-comprehensive';
import { validateNoAbuseOrThrow, validateStringArrayNoAbuseOrThrow, filterAbusiveText } from '../utils/abuse';

type UserCreationData = Omit<User, 'id'>;

export const firestoreService = {
    // ===== Match Alerts =====
    createMatchAlert: async (userId: string, alert: Omit<MatchAlert, 'id' | 'createdAt' | 'userId'>): Promise<string> => {
        const ref = db.collection('match_alerts').doc();
        const data: Omit<MatchAlert, 'id'> = {
            ...alert,
            userId,
            createdAt: new Date()
        } as any;
        await ref.set({ id: ref.id, ...data });
        return ref.id;
    },
    updateMatchAlert: async (alertId: string, data: Partial<MatchAlert>): Promise<void> => {
        await db.collection('match_alerts').doc(alertId).update(data);
    },
    deleteMatchAlert: async (alertId: string): Promise<void> => {
        await db.collection('match_alerts').doc(alertId).delete();
    },
    getUserMatchAlerts: async (userId: string): Promise<MatchAlert[]> => {
        const snap = await db.collection('match_alerts').where('userId', '==', userId).where('isActive', '==', true).get();
        return snap.docs.map(d => d.data() as MatchAlert);
    },
    // Lightweight matching for alert criteria
    matchesAlertCriteria: (candidate: User, alert: MatchAlert, candidateIdeaCount?: number): boolean => {
        if (!alert.isActive) return false;
        if (alert.roles && alert.roles.length && !alert.roles.includes(candidate.role)) return false;
        if (alert.locations && alert.locations.length) {
            const cl = candidate.location?.toLowerCase() || '';
            const anyLoc = alert.locations.some(l => cl.includes(l.toLowerCase()));
            if (!anyLoc) return false;
        }
        if (alert.interests && alert.interests.length) {
            const ov = (candidate.interests || []).some(i => alert.interests!.includes(i));
            if (!ov) return false;
        }
        if (alert.skills && alert.skills.length) {
            const ov = (candidate.skills || []).some(s => alert.skills!.includes(s));
            if (!ov) return false;
        }
        if (typeof alert.minExperienceYears === 'number') {
            const years = parseInt((candidate.experience || '').match(/\d+/)?.[0] || '0', 10);
            if (years < alert.minExperienceYears) return false;
        }
        if (alert.investorDomains && alert.investorDomains.length) {
            // If candidate is investor, check their domains; if founder, check interests
            if (candidate.role === Role.Investor) {
                const investorDomains = candidate.investorProfile?.interestedDomains || [];
                const ov = investorDomains.some(d => alert.investorDomains!.includes(d));
                if (!ov) return false;
            } else {
                const ov = (candidate.interests || []).some(d => alert.investorDomains!.includes(d));
                if (!ov) return false;
            }
        }
        if (typeof alert.minIdeaCount === 'number') {
            const count = typeof candidateIdeaCount === 'number' ? candidateIdeaCount : 0;
            if (count < alert.minIdeaCount) return false;
        }
        return true;
    },
    // Watcher: notify user when new/updated users match alert criteria
    startMatchAlertWatcher: (currentUserId: string): (() => void) => {
        let unsubUsers: (() => void) | null = null;
        let unsubAlerts: (() => void) | null = null;
        let currentAlerts: MatchAlert[] = [];

        // Helper: evaluate all users against current alerts
        const evaluate = async (users: User[], alerts: MatchAlert[]) => {
            if (!alerts || alerts.length === 0) return;
            const candidates = users.filter(u => u.id !== currentUserId);
            for (const alert of alerts) {
                for (const user of candidates) {
                    let ideaCount: number | undefined = undefined;
                    if (typeof alert.minIdeaCount === 'number') {
                        try {
                            const map = await firestoreService.getIdeaCountsByUserIds([user.id]);
                            ideaCount = map[user.id] || 0;
                        } catch {}
                    }
                    if (firestoreService.matchesAlertCriteria(user, alert, ideaCount)) {
                        const existing = await db.collection('notifications')
                            .where('userId', '==', currentUserId)
                            .where('type', '==', NotificationType.MATCH_ALERT)
                            .where('data.alertId', '==', alert.id)
                            .where('data.matchedUserId', '==', user.id)
                            .limit(1)
                            .get();
                        if (!existing.empty) continue;
                        await firestoreService.createNotification({
                            userId: currentUserId,
                            type: NotificationType.MATCH_ALERT,
                            title: 'New match alert',
                            message: `${user.name} fits your alert criteria`,
                            data: { alertId: alert.id, matchedUserId: user.id, matchedUserName: user.name },
                            isRead: false,
                            timestamp: new Date()
                        });
                    }
                }
            }
        };

        // Subscribe to users
        let latestUsers: User[] = [];
        unsubUsers = db.collection('users').onSnapshot(async (snapshot) => {
            latestUsers = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User));
            await evaluate(latestUsers, currentAlerts);
        });

        // Subscribe to alerts (realtime)
        unsubAlerts = db.collection('match_alerts')
            .where('userId', '==', currentUserId)
            .where('isActive', '==', true)
            .onSnapshot(async (snap) => {
                currentAlerts = snap.docs.map(d => d.data() as MatchAlert);
                await evaluate(latestUsers, currentAlerts);
            });

        return () => {
            if (unsubUsers) unsubUsers();
            if (unsubAlerts) unsubAlerts();
        };
    },
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
            const data = docSnap.data() as any;
            // Map photoURL to avatarUrl for compatibility
            if (data.photoURL && !data.avatarUrl) {
                data.avatarUrl = data.photoURL;
            }
            return { id: docSnap.id, ...data } as User;
        }
        return null;
    },

    createUserProfile: async (uid: string, data: UserCreationData): Promise<void> => {
        // Validate user fields
        try {
            validateNoAbuseOrThrow('Name', (data as any).name);
            validateNoAbuseOrThrow('Username', (data as any).username);
            validateNoAbuseOrThrow('Location', (data as any).location);
            validateNoAbuseOrThrow('Looking for', (data as any).lookingFor);
            validateStringArrayNoAbuseOrThrow('Skills', (data as any).skills);
            validateStringArrayNoAbuseOrThrow('Interests', (data as any).interests);
        } catch (e) {
            console.warn('Abusive content blocked in createUserProfile:', e);
            throw e;
        }
        const userRef = db.collection('users').doc(uid);
        await userRef.set({
            ...data,
        });
    },

    updateUserProfile: async (uid: string, data: Partial<User>): Promise<void> => {
        // Validate on update for changed fields
        try {
            if (typeof data.name === 'string') validateNoAbuseOrThrow('Name', data.name);
            if (typeof (data as any).username === 'string') validateNoAbuseOrThrow('Username', (data as any).username);
            if (typeof data.location === 'string') validateNoAbuseOrThrow('Location', data.location);
            if (typeof data.lookingFor === 'string') validateNoAbuseOrThrow('Looking for', data.lookingFor);
            if (Array.isArray(data.skills)) validateStringArrayNoAbuseOrThrow('Skills', data.skills);
            if (Array.isArray(data.interests)) validateStringArrayNoAbuseOrThrow('Interests', data.interests);
        } catch (e) {
            console.warn('Abusive content blocked in updateUserProfile:', e);
            throw e;
        }
        const userRef = db.collection('users').doc(uid);
        await userRef.update(data);
        
        // If avatar is being updated, also update founderAvatar in all user's ideas
        const dataWithPhotoURL = data as any;
        if (dataWithPhotoURL.photoURL !== undefined || data.avatarUrl !== undefined || data.customAvatar !== undefined) {
            const newAvatarUrl = data.avatarUrl || dataWithPhotoURL.photoURL;
            const newCustomAvatar = data.customAvatar;
            
            try {
                // Get all ideas by this founder
                const ideasSnapshot = await db.collection('ideas')
                    .where('founderId', '==', uid)
                    .get();
                
                // Update founderAvatar and founderCustomAvatar in all ideas
                const batch = db.batch();
                ideasSnapshot.docs.forEach(doc => {
                    const updateData: any = {};
                    if (newAvatarUrl !== undefined) {
                        updateData.founderAvatar = newAvatarUrl;
                    }
                    if (newCustomAvatar !== undefined) {
                        updateData.founderCustomAvatar = newCustomAvatar;
                    }
                    if (Object.keys(updateData).length > 0) {
                        batch.update(doc.ref, updateData);
                    }
                });
                
                if (ideasSnapshot.docs.length > 0) {
                    await batch.commit();
                    console.log(`Updated founder avatar info in ${ideasSnapshot.docs.length} ideas`);
                }
            } catch (error) {
                console.warn('Failed to update founder avatar info in ideas:', error);
            }
        }
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

    /**
     * Returns a map of userId -> number of ideas they've uploaded
     */
    getIdeaCountsByUserIds: async (userIds: string[]): Promise<Record<string, number>> => {
        if (!userIds || userIds.length === 0) return {};
        const counts: Record<string, number> = {};
        // Firestore 'in' queries allow up to 10 items; chunk the requests
        const chunkSize = 10;
        for (let i = 0; i < userIds.length; i += chunkSize) {
            const chunk = userIds.slice(i, i + chunkSize);
            const snapshot = await db.collection('ideas')
                .where('founderId', 'in', chunk)
                .get();
            snapshot.docs.forEach(doc => {
                const data = doc.data() as Idea;
                const fid = data.founderId;
                if (fid) counts[fid] = (counts[fid] || 0) + 1;
            });
        }
        // Ensure all ids are present with at least 0
        userIds.forEach(id => { if (counts[id] === undefined) counts[id] = 0; });
        return counts;
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

    // Helper function to create join request notification
    createJoinRequestNotification: async (founderId: string, joinRequestId: string, ideaId: string, ideaTitle: string, developerId: string, developerName: string, founderIdParam: string, founderName: string): Promise<void> => {
        console.log('Creating join request notification:', {
            founderId,
            joinRequestId,
            ideaId,
            ideaTitle,
            developerId,
            developerName
        });
        
        await firestoreService.createNotification({
            userId: founderId,
            type: NotificationType.JOIN_REQUEST,
            title: 'New Join Request',
            message: `${developerName} wants to join your idea: ${ideaTitle}`,
            data: {
                joinRequestId,
                ideaId,
                ideaTitle,
                developerId,
                developerName,
                founderId: founderIdParam,
                founderName
            },
            isRead: false,
            timestamp: new Date()
        });
        
        console.log('Join request notification created successfully');
    },

    // Helper function to create join request response notification
    createJoinRequestResponseNotification: async (developerId: string, joinRequestId: string, ideaId: string, ideaTitle: string, founderId: string, founderName: string, status: 'approved' | 'rejected'): Promise<void> => {
        console.log('Creating join request response notification:', {
            developerId,
            joinRequestId,
            ideaId,
            ideaTitle,
            founderId,
            founderName,
            status
        });
        
        await firestoreService.createNotification({
            userId: developerId,
            type: NotificationType.JOIN_REQUEST_RESPONSE,
            title: `Join Request ${status === 'approved' ? 'Approved' : 'Declined'}`,
            message: `Your request to join "${ideaTitle}" has been ${status === 'approved' ? 'approved' : 'declined'} by ${founderName}`,
            data: {
                joinRequestId,
                ideaId,
                ideaTitle,
                developerId,
                founderId,
                founderName,
                responseStatus: status,
                respondedAt: new Date()
            },
            isRead: false,
            timestamp: new Date()
        });
        
        console.log('Join request response notification created successfully');
    },

    // Helper function to create join request confirmation notification for founder
    createJoinRequestConfirmationNotification: async (founderId: string, joinRequestId: string, ideaId: string, ideaTitle: string, developerId: string, developerName: string, status: 'approved' | 'rejected'): Promise<void> => {
        console.log('Creating join request confirmation notification for founder:', {
            founderId,
            joinRequestId,
            ideaId,
            ideaTitle,
            developerId,
            developerName,
            status
        });
        
        await firestoreService.createNotification({
            userId: founderId,
            type: NotificationType.JOIN_REQUEST_RESPONSE,
            title: `Join Request ${status === 'approved' ? 'Approved' : 'Declined'}`,
            message: `You ${status === 'approved' ? 'approved' : 'declined'} ${developerName}'s request to join "${ideaTitle}"`,
            data: {
                joinRequestId,
                ideaId,
                ideaTitle,
                developerId,
                developerName,
                founderId,
                responseStatus: status,
                respondedAt: new Date()
            },
            isRead: false,
            timestamp: new Date()
        });
        
        console.log('Join request confirmation notification created successfully');
    },

    getChatId: (uid1: string, uid2: string): string => {
        return [uid1, uid2].sort().join('_');
    },

    postIdea: async (idea: Omit<Idea, 'id'>): Promise<void> => {
        // Validate idea content
        try {
            validateNoAbuseOrThrow('Idea title', idea.title);
            validateNoAbuseOrThrow('Idea description', idea.description);
        } catch (e) {
            console.warn('Abusive content blocked in postIdea:', e);
            throw e;
        }
        const ideasRef = db.collection('ideas');
        const ideaRef = ideasRef.doc();
        await ideaRef.set({
            ...idea,
            id: ideaRef.id,
        });
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
     * Get all public ideas (for similarity checking)
     */
    getPublicIdeas: async (): Promise<Idea[]> => {
        const ideasRef = db.collection('ideas').where('visibility', '==', 'public');
        const snapshot = await ideasRef.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Idea));
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
            founderName: idea.founderName,
            status: 'pending',
            timestamp: new Date(),
        };
        const requestRef = await db.collection('joinRequests').add(request);
        const joinRequestId = requestRef.id;
        
        // Create notification for the founder
        await firestoreService.createJoinRequestNotification(
            idea.founderId,
            joinRequestId,
            idea.id,
            idea.title,
            developer.id,
            developer.name,
            idea.founderId,
            idea.founderName
        );
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

    updateJoinRequest: async (requestId: string, status: 'approved' | 'rejected' | 'pending'): Promise<void> => {
        const requestRef = db.collection('joinRequests').doc(requestId);
        const requestDoc = await requestRef.get();
        const request = requestDoc.data() as IdeaJoinRequest;
        
        if (!request) {
            throw new Error('Join request not found');
        }

        await requestRef.update({ status });

        if (status === 'approved') {
            await firestoreService.joinIdea(request.ideaId, request.developerId);
        }

        // Send notifications based on status
        if (status === 'pending') {
            // Create notification for the founder about the new/resent join request
            console.log('Creating join request notification for founder (resend):', {
                developerId: request.developerId,
                founderId: request.founderId,
                requestId
            });
            
            await firestoreService.createJoinRequestNotification(
                request.founderId,
                requestId,
                request.ideaId,
                request.ideaTitle,
                request.developerId,
                request.developerName,
                request.founderId,
                request.founderName
            );
        } else if (status === 'approved' || status === 'rejected') {
            // Update existing notifications instead of creating new ones
            await firestoreService.updateJoinRequestNotifications(
                requestId,
                request.ideaId,
                request.ideaTitle,
                request.developerId,
                request.developerName,
                request.founderId,
                request.founderName,
                status
            );
        }
    },

    // Update existing join request notifications instead of creating new ones
    updateJoinRequestNotifications: async (
        joinRequestId: string, 
        ideaId: string, 
        ideaTitle: string, 
        developerId: string, 
        developerName: string, 
        founderId: string, 
        founderName: string, 
        status: 'approved' | 'rejected'
    ): Promise<void> => {
        console.log('Updating join request notifications:', {
            joinRequestId,
            ideaId,
            ideaTitle,
            developerId,
            developerName,
            founderId,
            founderName,
            status
        });

        // Find and update the original join request notification for the founder
        const founderNotificationsQuery = db.collection('notifications')
            .where('userId', '==', founderId)
            .where('type', '==', NotificationType.JOIN_REQUEST)
            .where('data.joinRequestId', '==', joinRequestId);

        const founderNotificationsSnapshot = await founderNotificationsQuery.get();
        
        if (!founderNotificationsSnapshot.empty) {
            const founderNotification = founderNotificationsSnapshot.docs[0];
            await founderNotification.ref.update({
                title: `Join Request ${status === 'approved' ? 'Approved' : 'Declined'}`,
                message: `You ${status === 'approved' ? 'approved' : 'declined'} ${developerName}'s request to join "${ideaTitle}"`,
                type: NotificationType.JOIN_REQUEST_RESPONSE,
                'data.responseStatus': status,
                'data.respondedAt': new Date(),
                timestamp: new Date()
            });
            console.log('Updated founder notification:', founderNotification.id);
        }

        // Find and update the original join request notification for the developer (if it exists)
        const developerNotificationsQuery = db.collection('notifications')
            .where('userId', '==', developerId)
            .where('type', '==', NotificationType.JOIN_REQUEST)
            .where('data.joinRequestId', '==', joinRequestId);

        const developerNotificationsSnapshot = await developerNotificationsQuery.get();
        
        if (!developerNotificationsSnapshot.empty) {
            const developerNotification = developerNotificationsSnapshot.docs[0];
            await developerNotification.ref.update({
                title: `Join Request ${status === 'approved' ? 'Approved' : 'Declined'}`,
                message: `Your request to join "${ideaTitle}" has been ${status === 'approved' ? 'approved' : 'declined'} by ${founderName}`,
                type: NotificationType.JOIN_REQUEST_RESPONSE,
                'data.responseStatus': status,
                'data.respondedAt': new Date(),
                timestamp: new Date()
            });
            console.log('Updated developer notification:', developerNotification.id);
        } else {
            // If no existing notification for developer, create a new one
            await firestoreService.createJoinRequestResponseNotification(
                developerId,
                joinRequestId,
                ideaId,
                ideaTitle,
                founderId,
                founderName,
                status
            );
        }

        console.log('Join request notifications updated successfully');
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
        // Sanitize comment content instead of blocking
        const sanitized = { ...comment, text: filterAbusiveText(comment.text as any) };
        const ideaDocRef = db.collection('ideas').doc(ideaId);
        const commentRef = ideaDocRef.collection('comments').doc();
        const commentWithId = { ...sanitized, id: commentRef.id } as Comment;
        // Write to subcollection (for scalability)
        await commentRef.set(commentWithId);
        // Also reflect in parent idea.comments for existing UI
        await ideaDocRef.update({
            comments: firebase.firestore.FieldValue.arrayUnion(commentWithId)
        });
    },

    deleteCommentFromIdea: async (ideaId: string, commentToDelete: Comment): Promise<void> => {
        const ideaRef = db.collection('ideas').doc(ideaId);
        await ideaRef.update({
            comments: firebase.firestore.FieldValue.arrayRemove(commentToDelete)
        });
    },

    subscribeToIdeaComments: (
        ideaId: string,
        onChange: (comments: Comment[]) => void
    ): (() => void) => {
        const commentsRef = db
            .collection('ideas')
            .doc(ideaId)
            .collection('comments');
        const unsubscribe = commentsRef.onSnapshot((snapshot) => {
            const items = snapshot.docs.map((doc) => doc.data() as Comment);
            onChange(items);
        });
        return unsubscribe;
    },

    subscribeToIdeaMeta: (
        ideaId: string,
        onChange: (idea: Idea) => void
    ): (() => void) => {
        const docRef = db.collection('ideas').doc(ideaId);
        const unsubscribe = docRef.onSnapshot((doc) => {
            if (doc.exists) {
                onChange({ id: doc.id, ...(doc.data() as Idea) });
            }
        });
        return unsubscribe;
    },

    updateIdea: async (ideaId: string, updatedData: Partial<Idea>): Promise<void> => {
        try {
            if (typeof updatedData.title === 'string') validateNoAbuseOrThrow('Idea title', updatedData.title);
            if (typeof updatedData.description === 'string') validateNoAbuseOrThrow('Idea description', updatedData.description);
        } catch (e) {
            console.warn('Abusive content blocked in updateIdea:', e);
            throw e;
        }
        const ideaRef = db.collection('ideas').doc(ideaId);
        await ideaRef.update(updatedData);
    },

    createNegotiationRequest: async (idea: Idea, investor: User): Promise<string> => {
        console.log('Creating negotiation for idea:', idea.id, 'founderUsername:', idea.founderUsername);
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
            investorUsername: investor.username,
            investorAvatar: investor.avatarUrl,
            founderId: idea.founderId,
            founderName: idea.founderName,
            founderUsername: idea.founderUsername || idea.founderName?.toLowerCase().replace(/\s+/g, '') || 'unknown',
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

    // Username validation and management functions
    validateUsername: (username: string): { isValid: boolean; error?: string } => {
        // Username requirements
        if (!username || username.trim().length === 0) {
            return { isValid: false, error: 'Username is required' };
        }
        
        const trimmedUsername = username.trim();
        
        // Length validation
        if (trimmedUsername.length < 3) {
            return { isValid: false, error: 'Username must be at least 3 characters long' };
        }
        
        if (trimmedUsername.length > 20) {
            return { isValid: false, error: 'Username must be no more than 20 characters long' };
        }
        
        // Character validation - only alphanumeric and underscores
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(trimmedUsername)) {
            return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' };
        }
        
        // Cannot start with underscore
        if (trimmedUsername.startsWith('_')) {
            return { isValid: false, error: 'Username cannot start with an underscore' };
        }
        
        // Cannot end with underscore
        if (trimmedUsername.endsWith('_')) {
            return { isValid: false, error: 'Username cannot end with an underscore' };
        }
        
        // Cannot have consecutive underscores
        if (trimmedUsername.includes('__')) {
            return { isValid: false, error: 'Username cannot have consecutive underscores' };
        }
        
        // Reserved usernames
        const reservedUsernames = [
            'admin', 'administrator', 'root', 'user', 'guest', 'test', 'demo',
            'support', 'help', 'api', 'www', 'mail', 'email', 'contact',
            'about', 'privacy', 'terms', 'legal', 'security', 'system',
            'grow', 'growwithme', 'growwithmeai', 'row', 'rowwithme'
        ];
        
        if (reservedUsernames.includes(trimmedUsername.toLowerCase())) {
            return { isValid: false, error: 'This username is reserved and cannot be used' };
        }
        
        return { isValid: true };
    },

    checkUsernameAvailability: async (username: string, excludeUserId?: string): Promise<{ isValid: boolean; error?: string }> => {
        try {
            // First validate the username format
            const validation = firestoreService.validateUsername(username);
            if (!validation.isValid) {
                return { isValid: false, error: validation.error };
            }
            
            const trimmedUsername = username.trim().toLowerCase();
            
            // Add timeout protection for database query
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Database query timeout')), 10000); // 10 second timeout
            });
            
            // Check if username exists in users collection
            const usersRef = db.collection('users').where('username', '==', trimmedUsername);
            const queryPromise = usersRef.get();
            
            const snapshot = await Promise.race([queryPromise, timeoutPromise]);
            
            // If we're excluding a user (for updates), check if any other user has this username
            if (excludeUserId) {
                const conflictingUsers = snapshot.docs.filter(doc => doc.id !== excludeUserId);
                if (conflictingUsers.length > 0) {
                    return { isValid: false, error: 'This username is already taken' };
                }
            } else {
                // For new users, check if any user has this username
                if (!snapshot.empty) {
                    return { isValid: false, error: 'This username is already taken' };
                }
            }
            
            return { isValid: true };
        } catch (error) {
            console.error('Error checking username availability:', error);
            
            // Provide more specific error messages
            if (error instanceof Error) {
                if (error.message.includes('timeout')) {
                    return { isValid: false, error: 'Request timed out. Please try again.' };
                } else if (error.message.includes('permission')) {
                    return { isValid: false, error: 'Permission denied. Please try again.' };
                } else if (error.message.includes('network')) {
                    return { isValid: false, error: 'Network error. Please check your connection.' };
                }
            }
            
            return { isValid: false, error: 'Unable to verify username availability. Please try again.' };
        }
    },

    generateSuggestedUsernames: (name: string, email: string): string[] => {
        const suggestions: string[] = [];
        
        // Clean the name for username generation
        const cleanName = name.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // Remove special characters
            .replace(/\s+/g, '') // Remove spaces
            .substring(0, 10); // Limit length
        
        // Clean the email for username generation
        const emailPrefix = email.split('@')[0].toLowerCase()
            .replace(/[^a-z0-9]/g, '') // Remove special characters
            .substring(0, 8); // Limit length
        
        // Generate suggestions based on name
        if (cleanName) {
            suggestions.push(cleanName);
            suggestions.push(cleanName + Math.floor(Math.random() * 100));
            suggestions.push(cleanName + Math.floor(Math.random() * 1000));
            suggestions.push(cleanName + '_' + Math.floor(Math.random() * 100));
        }
        
        // Generate suggestions based on email
        if (emailPrefix && emailPrefix !== cleanName) {
            suggestions.push(emailPrefix);
            suggestions.push(emailPrefix + Math.floor(Math.random() * 100));
            suggestions.push(emailPrefix + '_' + Math.floor(Math.random() * 100));
        }
        
        // Add some generic suggestions
        suggestions.push('user' + Math.floor(Math.random() * 10000));
        suggestions.push('member' + Math.floor(Math.random() * 1000));
        
        // Remove duplicates and limit to 6 suggestions
        return [...new Set(suggestions)].slice(0, 6);
    },

    updateUserUsername: async (userId: string, newUsername: string): Promise<{ success: boolean; error?: string }> => {
        try {
            // Check if username is available
            const availability = await firestoreService.checkUsernameAvailability(newUsername, userId);
            if (!availability.isValid) {
                return { success: false, error: availability.error };
            }
            
            // Update the user's username
            const userRef = db.collection('users').doc(userId);
            await userRef.update({ 
                username: newUsername.trim().toLowerCase() 
            });
            
            return { success: true };
        } catch (error) {
            console.error('Error updating username:', error);
            return { success: false, error: 'Error updating username' };
        }
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

    validateLocation: (location: string): { isValid: boolean; error?: string } => {
        if (!location || !location.trim()) {
            return { isValid: false, error: 'Location is required' };
        }

        const trimmedLocation = location.trim();
        
        // Check minimum length
        if (trimmedLocation.length < 2) {
            return { isValid: false, error: 'Location must be at least 2 characters long' };
        }
        
        // Check maximum length
        if (trimmedLocation.length > 100) {
            return { isValid: false, error: 'Location must be less than 100 characters' };
        }
        
        // Check for valid location format (city, country or city, state, country)
        const locationPattern = /^[a-zA-Z\s,.-]+$/;
        if (!locationPattern.test(trimmedLocation)) {
            return { isValid: false, error: 'Location can only contain letters, spaces, commas, periods, and hyphens' };
        }
        
        // Check if it contains at least one comma (suggesting city, country format)
        if (!trimmedLocation.includes(',')) {
            return { isValid: false, error: 'Please include country (e.g., "New York, USA" or "London, UK")' };
        }
        
        // Check for reasonable location structure
        const parts = trimmedLocation.split(',').map(part => part.trim());
        if (parts.length < 2) {
            return { isValid: false, error: 'Please include both city and country' };
        }
        
        // Check that each part has reasonable length
        for (const part of parts) {
            if (part.length < 2) {
                return { isValid: false, error: 'Each part of the location must be at least 2 characters' };
            }
        }
        
        return { isValid: true };
    },



    validateLocationFields: (country: string, state: string, city: string): { isValid: boolean; error?: string } => {
        if (!country || !country.trim()) {
            return { isValid: false, error: 'Country is required' };
        }
        
        if (!state || !state.trim()) {
            return { isValid: false, error: 'State/Province is required' };
        }
        
        // City is optional, so we don't validate it
        // State is required, and if provided, it should be valid
        if (state && state.trim() && state.trim().length < 2) {
            return { isValid: false, error: 'State must be at least 2 characters if provided' };
        }
        
        return { isValid: true };
    },

    formatLocationString: (country: string, state: string, city: string): string => {
        if (!country) return '';
        
        // Get full country name
        const countries = getAllCountries();
        const countryData = countries.find(c => c.code === country);
        const countryName = countryData ? countryData.name : country;
        
        // Get full state name
        let stateName = state;
        if (state && state.trim()) {
            const states = getStatesByCountry(country);
            const stateData = states.find(s => s.code === state);
            stateName = stateData ? stateData.name : state;
        }
        
        // City name is already the full name
        const cityName = city || '';
        
        // Format the location string
        if (state && state.trim() && city && city.trim()) {
            return `${cityName}, ${stateName}, ${countryName}`;
        } else if (state && state.trim()) {
            return `${stateName}, ${countryName}`;
        } else if (city && city.trim()) {
            return `${cityName}, ${countryName}`;
        } else {
            return countryName;
        }
    },

    // Helper function to format existing location strings that might contain codes
    formatExistingLocationString: (locationString: string): string => {
        if (!locationString || !locationString.trim()) return '';
        
        // Split the location string by comma
        const parts = locationString.split(',').map(part => part.trim());
        
        if (parts.length === 0) return '';
        
        // If it's already in full name format, return as is
        // Check if the last part (country) is a known country name
        const countries = getAllCountries();
        const lastPart = parts[parts.length - 1];
        const isCountryName = countries.some(c => c.name === lastPart);
        
        if (isCountryName) {
            return locationString; // Already in full name format
        }
        
        // Try to convert codes to full names
        if (parts.length === 3) {
            // Format: "City, State, Country" (with codes)
            const [city, stateCode, countryCode] = parts;
            
            // Find country name
            const countryData = countries.find(c => c.code === countryCode);
            const countryName = countryData ? countryData.name : countryCode;
            
            // Find state name
            let stateName = stateCode;
            if (countryData) {
                const states = getStatesByCountry(countryCode);
                const stateData = states.find(s => s.code === stateCode);
                stateName = stateData ? stateData.name : stateCode;
            }
            
            return `${city}, ${stateName}, ${countryName}`;
        } else if (parts.length === 2) {
            // Format: "State, Country" or "City, Country" (with codes)
            const [firstPart, countryCode] = parts;
            
            // Find country name
            const countryData = countries.find(c => c.code === countryCode);
            const countryName = countryData ? countryData.name : countryCode;
            
            // Check if first part is a state code
            let stateName = firstPart;
            if (countryData) {
                const states = getStatesByCountry(countryCode);
                const stateData = states.find(s => s.code === firstPart);
                if (stateData) {
                    stateName = stateData.name;
                }
            }
            
            return `${stateName}, ${countryName}`;
        } else if (parts.length === 1) {
            // Format: "Country" (with code)
            const countryData = countries.find(c => c.code === parts[0]);
            return countryData ? countryData.name : parts[0];
        }
        
        return locationString; // Return as is if we can't parse it
    },

    // Phone number validation and utilities
    getCountryCode: (countryCode: string): string => {
        const countryCodes: { [key: string]: string } = {
            'IN': '+91',  // India
            'US': '+1',   // United States
            'CA': '+1',   // Canada
            'GB': '+44',  // United Kingdom
            'AU': '+61',  // Australia
            'DE': '+49',  // Germany
            'FR': '+33',  // France
            'IT': '+39',  // Italy
            'ES': '+34',  // Spain
            'NL': '+31',  // Netherlands
            'CN': '+86',  // China
            'JP': '+81',  // Japan
            'KR': '+82',  // South Korea
            'BR': '+55',  // Brazil
            'AR': '+54',  // Argentina
            'ZA': '+27',  // South Africa
            'NG': '+234', // Nigeria
            'AE': '+971', // UAE
            'SA': '+966', // Saudi Arabia
            'MX': '+52',  // Mexico
            'NZ': '+64',  // New Zealand
        };
        return countryCodes[countryCode] || '+1';
    },

    validatePhoneNumber: (phoneNumber: string, countryCode: string): { isValid: boolean; error?: string; formatted?: string } => {
        if (!phoneNumber || !phoneNumber.trim()) {
            return { isValid: false, error: 'Phone number is required' };
        }

        // Remove all non-digit characters except +
        const cleaned = phoneNumber.replace(/[^\d+]/g, '');
        
        // Get expected country code
        const expectedCountryCode = firestoreService.getCountryCode(countryCode);
        
        // Check if phone number already has country code
        if (cleaned.startsWith('+')) {
            // Phone number has country code, validate format
            if (countryCode === 'IN') {
                // Indian phone number validation
                const indianPattern = /^\+91[6-9]\d{9}$/;
                if (!indianPattern.test(cleaned)) {
                    return { isValid: false, error: 'Invalid Indian phone number. Format: +91XXXXXXXXXX' };
                }
            } else {
                // General international format validation
                const internationalPattern = /^\+\d{1,4}\d{4,14}$/;
                if (!internationalPattern.test(cleaned)) {
                    return { isValid: false, error: 'Invalid international phone number format' };
                }
            }
            return { isValid: true, formatted: cleaned };
        } else {
            // Phone number doesn't have country code, add it
            if (countryCode === 'IN') {
                // Indian phone number validation (without country code)
                const indianPattern = /^[6-9]\d{9}$/;
                if (!indianPattern.test(cleaned)) {
                    return { isValid: false, error: 'Invalid Indian phone number. Format: XXXXXXXXXX (10 digits starting with 6-9)' };
                }
                return { isValid: true, formatted: expectedCountryCode + cleaned };
            } else {
                // General validation for other countries
                if (cleaned.length < 7 || cleaned.length > 15) {
                    return { isValid: false, error: 'Phone number must be 7-15 digits' };
                }
                return { isValid: true, formatted: expectedCountryCode + cleaned };
            }
        }
    },

    checkPhoneNumberAvailability: async (phoneNumber: string, currentUserId?: string): Promise<{ available: boolean; error?: string }> => {
        try {
            if (!phoneNumber || !phoneNumber.trim()) {
                return { available: false, error: 'Phone number is required' };
            }

            // Clean the phone number
            const cleaned = phoneNumber.replace(/[^\d+]/g, '');
            
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('phoneNumber', '==', cleaned));
            const querySnapshot = await getDocs(q);

            // Check if any user (other than current user) has this phone number
            const existingUsers = querySnapshot.docs.filter(doc => doc.id !== currentUserId);
            
            if (existingUsers.length > 0) {
                return { available: false, error: 'Phone number is already in use' };
            }

            return { available: true };
        } catch (error) {
            console.error('Error checking phone number availability:', error);
            return { available: false, error: 'Error checking phone number availability' };
        }
    },
};