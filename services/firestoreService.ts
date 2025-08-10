import { db } from '../firebase';
import { User, Chat, Idea, IdeaJoinRequest, ConnectionRequest, Comment, Negotiation, Offer } from '../types';
import firebase from 'firebase/compat/app';

type UserCreationData = Omit<User, 'id'>;

export const firestoreService = {
    /**
     * Paginated fetch for ideas. Returns { ideas, lastDoc, hasMore }
     */
    getIdeasPaginated: async (startAfterDoc?: any, pageSize: number = 20): Promise<{ ideas: Idea[], lastDoc: any, hasMore: boolean }> => {
        let query = db.collection('ideas').orderBy('status').limit(pageSize);
        if (startAfterDoc) {
            query = query.startAfter(startAfterDoc);
        }
        const snapshot = await query.get();
        const ideas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Idea));
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

    getIdeas: async (): Promise<Idea[]> => {
        const ideasRef = db.collection('ideas').orderBy('status').limit(20);
        const snapshot = await ideasRef.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Idea));
    },

    getIdeasByFounder: async (founderId: string): Promise<Idea[]> => {
        const ideasRef = db.collection('ideas').where('founderId', '==', founderId);
        const snapshot = await ideasRef.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Idea));
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
            status: 'pending',
            timestamp: new Date(),
            offers: [],
        };

        await negotiationRef.set(negotiation);
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

    updateNegotiationStatus: async (negotiationId: string, status: Negotiation['status']): Promise<void> => {
        const negotiationRef = db.collection('negotiations').doc(negotiationId);
        await negotiationRef.update({ status });
    },

    addOfferToNegotiation: async (negotiationId: string, offer: Offer): Promise<void> => {
        const negotiationRef = db.collection('negotiations').doc(negotiationId);
        await negotiationRef.update({
            offers: firebase.firestore.FieldValue.arrayUnion(offer),
            status: 'active' // Making an offer automatically makes the negotiation active
        });
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
};