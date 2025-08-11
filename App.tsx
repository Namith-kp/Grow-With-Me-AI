import { CacheProvider } from './app/CacheContext';
// Add GoogleAuth plugin import
import { nativeGoogleLogin } from './utils/nativeGoogleAuth';
import { nativeGoogleLogin as nativeLoginWeb } from './utils/nativeGoogleAuth.web';
import { nativeGoogleLogin as nativeLoginAndroid } from './utils/nativeGoogleAuth.android';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import React, { useState, useEffect, useCallback } from 'react';
import firebase from 'firebase/compat/app';
import { User, EnrichedMatch, View, AnalyticsData, UserActivity, Chat, ConnectionRequest } from './types';
import { findMatches } from './services/geminiService';
import { firestoreService } from './services/firestoreService';
import { analyticsService } from './services/analyticsService';
import { auth, googleProvider, firebaseConfig, db } from './firebase';

function getTokenFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("token");
}

function isAndroidWebView() {
    // Detect Android WebView by user agent
    return /wv/.test(navigator.userAgent) || /Android/.test(navigator.userAgent) && /Version\//.test(navigator.userAgent);
}
import Header from './components/Header';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AuthComponent from './components/Auth';
import Messages from './components/Messages';
import ChatModal from './components/ChatModal';
import IdeasBoard from './components/IdeasBoard';
import RequestsBoard from './components/RequestsBoard';
import People from './components/People';
import LandingPage from './components/LandingPage';
import FounderNegotiations from './components/FounderNegotiations';
import InvestorNegotiations from './components/InvestorNegotiations';
import { DUMMY_USERS } from './constants';

const ApiKeysNotice = ({ isDomainError = false }: { isDomainError?: boolean }) => {
    const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'your-app-domain.com';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[100] p-4 text-center">
            <div className="bg-neutral-900 border border-red-500 rounded-lg p-8 max-w-3xl animate-fade-in-scale">
                <h2 className="text-3xl font-bold text-red-400 mb-4">
                    {isDomainError ? "Authentication Domain Error" : "Action Required: App Configuration"}
                </h2>
                <p className="text-neutral-300 mb-6">
                     {isDomainError
                        ? `Firebase has blocked authentication from this domain. To fix this, you need to add your app's domain to the list of authorized domains in your Firebase project.`
                        : "This application requires API keys and Firebase configuration to function correctly. Please follow the steps below."
                    }
                </p>
                <div className="space-y-4 text-left">
                    {!isDomainError && (
                        <div className="bg-neutral-800 p-4 rounded-lg">
                            <p className="font-semibold text-white">1. Configure Firebase</p>
                            <p className="text-neutral-400 text-sm">
                                Open the <code className="bg-neutral-900 px-1 py-0.5 rounded text-yellow-400">firebase.ts</code> file and fill in your full Firebase project configuration object.
                            </p>
                        </div>
                    )}
                    <div className="bg-neutral-800 p-4 rounded-lg">
                        <p className="font-semibold text-white">{isDomainError ? "Authorize Your Domain" : "2. Authorize Your Domain for Firebase Authentication"}</p>
                        <p className="text-neutral-400 text-sm mb-2">
                            To prevent authentication errors (like <code className="bg-neutral-900 px-1 py-0.5 rounded text-red-400">auth/unauthorized-domain</code>), you must add your application's domain to the list of authorized domains in your Firebase project.
                        </p>
                        <p className="text-neutral-400 text-sm">
                            Navigate to: <span className="text-white">Firebase Console</span> &rarr; <span className="text-white">Authentication</span> &rarr; <span className="text-white">Settings</span> &rarr; <span className="text-white">Authorized domains</span>, and click "Add domain".
                        </p>
                        <p className="text-neutral-400 text-sm mt-2">Your current domain is:</p>
                        <div className="bg-neutral-900 text-yellow-300 p-2 rounded mt-2 text-center font-mono select-all">
                            {currentDomain}
                        </div>
                    </div>
                     {!isDomainError && (
                         <div className="bg-neutral-800 p-4 rounded-lg">
                            <p className="font-semibold text-white">3. Configure Gemini API Key</p>
                            <p className="text-neutral-400 text-sm">
                               This application uses the Gemini API for its core matching functionality. The API key is sourced from an environment variable (<code className="bg-neutral-900 px-1 py-0.5 rounded text-yellow-400">process.env.API_KEY</code>). Please ensure this environment variable is set up correctly in your deployment environment.
                            </p>
                        </div>
                    )}
                </div>
                <p className="text-neutral-500 mt-6 text-sm">The application will not function correctly until these steps are completed. You may need to refresh the page after configuration.</p>
            </div>
        </div>
    );
};




const App: React.FC = () => {
    useEffect(() => {
        const platform = Capacitor.getPlatform();
        if (platform === 'android') {
            // Initialize Google Auth for Android
            GoogleAuth.initialize({
                clientId: import.meta.env.VITE_FIREBASE_CLIENT_ID,
                scopes: ['profile', 'email'],
                grantOfflineAccess: true
            });
        }

        // Native Google sign-in from Android WebView
        const token = getTokenFromUrl();
        if (token) {
            const credential = firebase.auth.GoogleAuthProvider.credential(token);
            auth.signInWithCredential(credential)
                .then((result) => {
                    setAuthUser(result.user);
                    setIsGuestMode(false);
                    setAuthLoading(false);
                })
                .catch((e) => {
                    setError("Native sign-in failed: " + e.message);
                    setAuthLoading(false);
                });
        }
    }, []);
    const [view, setView] = useState<View>(View.LANDING);
    const [authUser, setAuthUser] = useState<firebase.User | null>(null);
    const [userProfile, setUserProfile] = useState<User | null>(null);
    const [matches, setMatches] = useState<EnrichedMatch[]>([]);
    const [isAuthLoading, setAuthLoading] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [authConfigError, setAuthConfigError] = useState<string | null>(null);
    const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);
    const [totalIdeas, setTotalIdeas] = useState<number>(0);
    const [totalNegotiations, setTotalNegotiations] = useState<number>(0);
    const [totalDealsAccepted, setTotalDealsAccepted] = useState<number>(0);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedUserForChat, setSelectedUserForChat] = useState<User | null>(null);
    const [pendingConnectionRequests, setPendingConnectionRequests] = useState<ConnectionRequest[]>([]);
    const [sentConnectionRequests, setSentConnectionRequests] = useState<ConnectionRequest[]>([]);
    const [connections, setConnections] = useState<User[]>([]);
    const [founderEngagement, setFounderEngagement] = useState<{ totalLikes: number; totalComments: number } | null>(null);

    const areKeysMissing = firebaseConfig.apiKey.startsWith('REPLACE_');

    const navigate = useCallback((targetView: View) => {
        setError(null);
        setView(targetView);
    }, []);

    useEffect(() => {
        if (authUser && !authUser.isAnonymous && userProfile) {
            const actionMap: Record<View, UserActivity['action']> = {
                [View.LANDING]: 'logout',
                [View.AUTH]: 'login',
                [View.ONBOARDING]: 'login',
                [View.DASHBOARD]: 'find_matches',
                [View.ANALYTICS]: 'view_profile',
                [View.MESSAGES]: 'send_message',
                [View.IDEAS]: 'view_ideas',
                [View.PEOPLE]: 'view_profile', // Or a new action type
                [View.REQUESTS]: 'view_ideas', // Placeholder, adjust as needed
                [View.NEGOTIATIONS]: 'view_profile', // Or a new action type for negotiations
            };
            
            if (actionMap[view]) {
                analyticsService.trackUserActivity(userProfile.id, actionMap[view], { view: view })
                    .catch(error => console.error('Error tracking navigation:', error));
            }
        }
    }, [view, authUser, userProfile]);

    useEffect(() => {
        if (userProfile?.id && !isGuestMode) {
            const unsubscribe = db.collection('users').doc(userProfile.id)
                .onSnapshot(async (doc) => {
                    const updatedProfileData = doc.data() as Omit<User, 'id'>;
                    // Preserve the ID from the existing profile, as doc.data() does not include it.
                    const profileWithId = { ...userProfile, ...updatedProfileData };
                    setUserProfile(profileWithId);

                    if (profileWithId.connections) {
                        const connectionDetails = await firestoreService.getConnections(profileWithId.connections);
                        setConnections(connectionDetails);
                    } else {
                        setConnections([]);
                    }
                });
            return () => unsubscribe();
        }
    }, [userProfile?.id, isGuestMode]);

    useEffect(() => {
        if (userProfile && !isGuestMode) {
            const unsubscribe = db.collection('chats')
                .where('participants', 'array-contains', userProfile.id)
                .onSnapshot(async (snapshot) => {
                    const userChats = await Promise.all(snapshot.docs.map(async (doc) => {
                        const chatData = doc.data();
                        const otherParticipantId = chatData.participants.find((p: string) => p !== userProfile.id);
                        const otherParticipant = await firestoreService.getUserProfile(otherParticipantId);
                        
                        return {
                            id: doc.id,
                            participants: chatData.participants,
                            lastMessage: chatData.lastMessage,
                            unreadCounts: chatData.unreadCounts,
                            participantDetails: [otherParticipant].filter(Boolean) as User[]
                        };
                    }));
                    setChats(userChats);
                });

            return () => unsubscribe();
        }
    }, [userProfile, isGuestMode]);

    // This useEffect hook handles the entire authentication lifecycle.
    // It's been updated to use in-memory persistence to avoid environment-related storage errors.
    useEffect(() => {
        if (areKeysMissing || isGuestMode) {
            setAuthLoading(false);
            return;
        }

        let unsubscribe: firebase.Unsubscribe = () => {};

        const setupAuth = async () => {
            setAuthLoading(true);
            try {
                // Use NONE persistence in WebView with token, LOCAL otherwise
                if (typeof window !== 'undefined' && window.location.search.includes('token')) {
                    await auth.setPersistence(firebase.auth.Auth.Persistence.NONE);
                } else {
                    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
                }
            } catch (err: any) {
                console.error("Firebase Auth persistence setup error:", err);
                // If even this fails, the environment is fundamentally incompatible.
                setError("Your browser does not support authentication. This may be due to private browsing settings. Please try a different browser or continue as a guest.");
                setAuthLoading(false);
                return; // Stop the auth process
            }
    // Removed misplaced <CacheProvider>
            
            // The onAuthStateChanged listener manages the user's session in memory.
            unsubscribe = auth.onAuthStateChanged(async (user) => {
                setAuthLoading(true);
                if (user && !authConfigError) {
                    setAuthUser(user);
                    const profile = await firestoreService.getUserProfile(user.uid);
                    if (profile) {
                        setUserProfile(profile);
                        if (!user.isAnonymous) {
                            try {
                                const sessionId = await analyticsService.startUserSession(user.uid);
                                setCurrentSessionId(sessionId);
                            } catch (error) {
                                console.error('Error starting user session:', error);
                            }
                        }
                        navigate(View.DASHBOARD);
                    } else {
                        navigate(View.ONBOARDING);
                    }
                } else {
                    if (currentSessionId && authUser && !authUser.isAnonymous) {
                        try {
                            await analyticsService.endUserSession(currentSessionId, authUser.uid);
                        } catch (error) {
                            console.error('Error ending user session:', error);
                        }
                    }
                    setAuthUser(null);
                    setUserProfile(null);
                    setMatches([]);
                    setSearchQuery('');
                    setCurrentSessionId(null);
                    // On logout or auth failure, return to the landing page.
                    navigate(View.LANDING);
                }
                setAuthLoading(false);
            });
        };

        setupAuth();

        // Cleanup the listener on component unmount
        return () => unsubscribe();

    }, [areKeysMissing, isGuestMode, navigate, authConfigError]);

    const handleLogin = async () => {
        setError(null);
        if (areKeysMissing) {
            setAuthConfigError('keys-missing');
            return;
        }
        try {
            setAuthLoading(true);
            let result;
            if (Capacitor.getPlatform() === 'android') {
                result = await nativeLoginAndroid();
            } else {
                result = await nativeLoginWeb();
            }
            console.log('Google Sign-In response:', result);
            // If result.user is not set in auth state, sign in with credential (for safety)
            if (result && result.idToken && !auth.currentUser) {
                const credential = firebase.auth.GoogleAuthProvider.credential(result.idToken);
                await auth.signInWithCredential(credential);
            }
            // Successful login is handled by the onAuthStateChanged listener
        } catch (err: any) {
            console.error("Authentication error:", err);
            if (err.message?.includes('cancelled')) {
                setError("The sign-in process was cancelled.");
            } else {
                setError("An error occurred during sign-in. Please try again.");
            }
            setAuthLoading(false);
        }
    };

    const handleContinueAsGuest = () => {
        console.log("Entering guest mode.");
        const guestUser = { 
            uid: `guest_${Date.now()}`, 
            photoURL: `https://api.dicebear.com/8.x/bottts/svg?seed=guest`,
            isAnonymous: true,
        } as firebase.User;
        
        setIsGuestMode(true);
        setAuthUser(guestUser);
        navigate(View.ONBOARDING);
        setAuthLoading(false);
    };

    const handleLogout = async () => {
        if (isGuestMode) {
            console.log("Logging out from guest mode session.");
            setIsGuestMode(false);
            setAuthUser(null);
            setUserProfile(null);
            setMatches([]);
            setSearchQuery('');
            navigate(View.LANDING);
        } else {
            // onAuthStateChanged will handle the state reset after signOut
            await auth.signOut();
        }
    };

    const handleOnboardingComplete = async (profileData: Omit<User, 'id' | 'avatarUrl'>) => {
        if (!authUser) return;

        const newUserProfile: User = {
            id: authUser.uid,
            ...profileData,
            avatarUrl: authUser.photoURL || `https://api.dicebear.com/8.x/bottts/svg?seed=${authUser.uid}`,
            connections: [], // Initialize with an empty array
        };

        if (isGuestMode) {
            console.log("Guest mode: Storing profile locally.");
            setUserProfile(newUserProfile);
        } else {
            await firestoreService.createUserProfile(authUser.uid, {
                ...profileData,
                avatarUrl: newUserProfile.avatarUrl,
                connections: [], // Also initialize in Firestore
            });
            const createdProfile = await firestoreService.getUserProfile(authUser.uid);
            setUserProfile(createdProfile);
        }
        navigate(View.DASHBOARD);
    };

    const handleFindMatches = useCallback(async () => {
        if (!userProfile) return;
        setIsLoading(true);
        setError(null);
        setMatches([]);
        try {
            let potentialPartners: User[];

            if (isGuestMode) {
                console.log("Guest mode: Using dummy data for matches.");
                potentialPartners = DUMMY_USERS.filter(u => u.id !== userProfile.id);
            } else {
                potentialPartners = await firestoreService.getUsers(userProfile.id);
            }
            
            const foundMatches = await findMatches(userProfile, potentialPartners);
            
            const enrichedMatches = foundMatches.map(match => {
                const user = potentialPartners.find(p => p.id === match.userId);
                return user ? { ...match, user } : null;
            }).filter((match): match is EnrichedMatch => match !== null);

            if (!isGuestMode && authUser && !authUser.isAnonymous) {
                try {
                    for (const match of foundMatches) {
                        await analyticsService.trackMatch(userProfile.id, match.userId, match.compatibilityScore);
                    }
                } catch (error) {
                    console.error('Error tracking matches:', error);
                }
            }

            setMatches(enrichedMatches);
        } catch (err) {
            console.error("Error finding matches:", err);
            const errorMessage = err instanceof Error ? err.message : "Sorry, we couldn't find matches at the moment. Please try again later.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [userProfile, isGuestMode]);

    useEffect(() => {
        // Automatically find matches when the user lands on the dashboard after login/onboarding
        if (userProfile && view === View.DASHBOARD && matches.length === 0 && !isLoading) {
            handleFindMatches();
        }
    }, [userProfile, view, matches.length, isLoading, handleFindMatches]);

    const loadAnalyticsData = useCallback(async () => {
        setAnalyticsLoading(true);
        try {
            // Fetch analytics data and counts in parallel, but don't block dashboard render for counts
            const analyticsPromise = analyticsService.getAnalyticsData();
            // Use Firestore cache for instant counts, then update with live counts
            const ideasCachePromise = db.collection('ideas').get({ source: 'cache' });
            const negotiationsCachePromise = db.collection('negotiations').get({ source: 'cache' });
            const dealsAcceptedCachePromise = db.collection('negotiations').where('status', '==', 'accepted').get({ source: 'cache' });

            // Set analytics data as soon as it's ready
            analyticsPromise.then(setAnalyticsData);

            // Set cached counts instantly
            ideasCachePromise.then(snapshot => setTotalIdeas(snapshot.size));
            negotiationsCachePromise.then(snapshot => setTotalNegotiations(snapshot.size));
            dealsAcceptedCachePromise.then(snapshot => setTotalDealsAccepted(snapshot.size));

            // Then update with live counts
            db.collection('ideas').get().then(snapshot => setTotalIdeas(snapshot.size));
            db.collection('negotiations').get().then(snapshot => setTotalNegotiations(snapshot.size));
            db.collection('negotiations').where('status', '==', 'accepted').get().then(snapshot => setTotalDealsAccepted(snapshot.size));

            // Wait for analytics data before hiding loader
            await analyticsPromise;
        } catch (err) {
            console.error("Error loading analytics data:", err);
        } finally {
            setAnalyticsLoading(false);
        }
    }, []);

    const handleMessageUser = (partner: User) => {
        setSelectedUserForChat(partner);
    };

    const handleRemoveConnection = async (connectionToRemove: User) => {
        if (!userProfile) return;
        try {
            await firestoreService.removeConnection(userProfile.id, connectionToRemove.id);
            // The useEffect that listens to userProfile changes will automatically update the connections state
        } catch (error) {
            console.error("Failed to remove connection:", error);
            setError("Could not remove connection. Please try again.");
        }
    };

    useEffect(() => {
        if (userProfile && !isGuestMode) {
            const unsubIncoming = firestoreService.getPendingConnectionRequests(userProfile.id, (requests) => {
                setPendingConnectionRequests(requests);
            });

            const unsubSent = firestoreService.getSentConnectionRequests(userProfile.id, (requests) => {
                setSentConnectionRequests(requests);
            });

            return () => {
                unsubIncoming();
                unsubSent();
            };
        } else {
            setPendingConnectionRequests([]);
            setSentConnectionRequests([]);
        }
    }, [userProfile, isGuestMode]);

    useEffect(() => {
        if (userProfile && userProfile.role === 'Founder') {
            firestoreService.getFounderIdeaEngagementAnalytics(userProfile.id).then(setFounderEngagement);
        }
    }, [userProfile]);

    const filteredMatches = matches.filter(match => {
        if (!searchQuery) return true;
        const user = match.user;
        const query = searchQuery.toLowerCase();
        return (
            user.name.toLowerCase().includes(query) ||
            user.skills.some(skill => skill.toLowerCase().includes(query)) ||
            user.interests.some(interest => interest.toLowerCase().includes(query))
        );
    });

    // Listen for dashboard navigation event from LandingPage
    React.useEffect(() => {
        const handler = () => navigate(View.DASHBOARD);
        window.addEventListener('navigate-dashboard', handler);
        return () => window.removeEventListener('navigate-dashboard', handler);
    }, [navigate]);

    const renderContent = () => {
        if (isAuthLoading && !areKeysMissing && !authConfigError) {
            return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div></div>;
        }

        switch (view) {
            case View.LANDING:
                return <LandingPage
                    onGetStarted={() => navigate(View.AUTH)}
                    authUser={authUser}
                    userProfile={userProfile}
                />;
            case View.AUTH:
                return <AuthComponent onGoogleLogin={handleLogin} onGuestLogin={handleContinueAsGuest} error={error} authUser={authUser} />;
            case View.ONBOARDING:
                return <Onboarding onOnboardingComplete={handleOnboardingComplete} userProfile={userProfile} />;
            case View.DASHBOARD:
                if (userProfile) {
                    return <Dashboard
                        user={userProfile}
                        matches={filteredMatches}
                        isLoading={isLoading}
                        error={error}
                        onFindMatches={handleFindMatches}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        hasActiveSearch={matches.length > 0}
                        onMessage={handleMessageUser}
                        onRequestsUpdated={() => {
                            // This is a simple way to trigger a re-fetch of sent requests
                            // by toggling a state variable or re-calling the fetch function.
                            // For now, we'll just log it.
                            console.log("Requests updated");
                        }}
                    />;
                }
                return null;
            case View.NEGOTIATIONS:
                if (!userProfile) return null;
                // Show founder or investor negotiations component based on role
                if (userProfile.role === 'founder' || userProfile.role === 'Founder') {
                    return <FounderNegotiations user={userProfile} />;
                } else if (userProfile.role === 'investor' || userProfile.role === 'Investor') {
                    return <InvestorNegotiations user={userProfile} />;
                } else {
                    return <div className="text-white p-8">Negotiations not available for this role.</div>;
                }
            case View.ANALYTICS:
                if (!analyticsData && !analyticsLoading) {
                    loadAnalyticsData();
                }

                if (analyticsLoading) {
                    return (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
                        </div>
                    );
                }
                
                if (analyticsData) {
                    return <AnalyticsDashboard
                        data={analyticsData}
                        founderEngagement={founderEngagement}
                        totalIdeas={totalIdeas}
                        totalNegotiations={totalNegotiations}
                        totalDealsAccepted={totalDealsAccepted}
                    />;
                }
                
                // This case is hit if loading finished but there's no data
                return (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-white text-lg">Unable to load analytics data</div>
                    </div>
                );
            case View.MESSAGES:
                if (!userProfile) return null;
                return <Messages 
                    chats={chats} 
                    currentUser={userProfile} 
                    onSelectChat={setSelectedUserForChat}
                    connections={connections}
                />;

            case View.IDEAS:
                if (!userProfile) return null;
                return <IdeasBoard user={userProfile} />;
            case View.REQUESTS:
                return <RequestsBoard 
                            incomingRequests={pendingConnectionRequests} 
                            sentRequests={sentConnectionRequests}
                        />;
            case View.PEOPLE:
                return <People 
                            currentUser={userProfile}
                            connections={connections}
                            onMessage={handleMessageUser}
                            onRemoveConnection={handleRemoveConnection}
                        />;
            default:
                if (!userProfile) return null;
                return <Dashboard user={userProfile} matches={filteredMatches} isLoading={isLoading} error={error} onFindMatches={handleFindMatches} searchQuery={searchQuery} setSearchQuery={setSearchQuery} hasActiveSearch={matches.length > 0} onMessage={handleMessageUser} />;
        }
    };

    return (
        <CacheProvider>
            <div className="bg-black min-h-screen font-sans flex">
                {(areKeysMissing || authConfigError === 'unauthorized-domain') && <ApiKeysNotice isDomainError={authConfigError === 'unauthorized-domain'} />}
                {(view !== View.LANDING && view !== View.AUTH) && (
                    <Header currentView={view} setView={navigate} userProfile={userProfile} onLogin={handleLogin} onLogout={handleLogout} pendingRequestCount={pendingConnectionRequests.length} />
                )}
                <main className={`flex-grow p-4 sm:p-8 pt-16 lg:pt-8 transition-all duration-300 ${(view !== View.LANDING && view !== View.AUTH) ? 'ml-0 lg:ml-64' : ''}`}>
                    {renderContent()}
                </main>
                {selectedUserForChat && userProfile && (
                    <ChatModal 
                        user={selectedUserForChat} 
                        currentUser={userProfile} 
                        onClose={() => setSelectedUserForChat(null)} 
                    />
                )}
            </div>
        </CacheProvider>
    );
};

export default App;
