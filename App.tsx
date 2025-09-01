// Utility: Detect if running in Android WebView
function isAndroidWebView() {
    return typeof navigator !== 'undefined' && (
        /wv/.test(navigator.userAgent) ||
        (/Android/.test(navigator.userAgent) && /Version\//.test(navigator.userAgent))
    );
}
import { CacheProvider } from './app/CacheContext';
// Add GoogleAuth plugin import
import { nativeGoogleLogin } from './utils/nativeGoogleAuth';
// Capacitor will be imported dynamically to avoid web build issues
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Role } from './types';
import LandingPage from './components/LandingPage';
import LandingPageSquares from './components/Landing/LandingPageSquares';
import LandingPageLightRays from './components/Landing/LandingPageLightRays';
import AuthComponent from './components/Auth';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import NegotiationsBoard from './components/NegotiationsBoard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Messages from './components/Messages';
import IdeasBoard from './components/IdeasBoard';
import People from './components/People';
import Profile from './components/Profile';
import NotificationsPage from './components/NotificationsPage';
import { ApiKeysNotice } from './components/ApiKeysNotice';
import Header from './components/Header';
import ChatModal from './components/ChatModal';
import { DUMMY_USERS } from './constants';
import firebase from 'firebase/compat/app';
import { User, EnrichedMatch, View, AnalyticsData, UserActivity, Chat } from './types';
import { findMatches } from './services/geminiService';
import { firestoreService } from './services/firestoreService';
import { analyticsService } from './services/analyticsService';
import { auth, googleProvider, firebaseConfig, db } from './firebase';

function getTokenFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("token");
}




const App: React.FC = () => {
    // Sync SPA view with browser navigation (back/forward)
    useEffect(() => {
        const handlePopState = () => {
            const path = window.location.pathname;
            if (path.endsWith('/Grow-With-Me-AI/') || path === '/Grow-With-Me-AI/') {
                setView(View.LANDING);
            } else if (path.endsWith('/Grow-With-Me-AI/auth')) {
                setView(View.AUTH);
            } // Add more routes as needed
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);
    useEffect(() => {
        // Only try to initialize mobile features if we're in a mobile environment
        const isMobile = typeof window !== 'undefined' && 
            (window.navigator.userAgent.includes('Android') || 
             window.navigator.userAgent.includes('Mobile') ||
             window.navigator.userAgent.includes('iPhone') ||
             window.navigator.userAgent.includes('iPad'));
        
        if (isMobile) {
            // Try to initialize mobile features only if they're available
            // Use a try-catch approach to avoid import analysis issues
            try {
                // Check if we're in a mobile environment that supports these features
                const mobileFeaturesAvailable = typeof window !== 'undefined' && 
                    (window.navigator.userAgent.includes('Android') || 
                     window.navigator.userAgent.includes('Mobile'));
                
                if (mobileFeaturesAvailable) {
                    // Initialize mobile features when available
                    console.log('Mobile environment detected, mobile features may be available');
                }
            } catch (err) {
                console.warn('Mobile features not available:', err);
            }
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
                    console.error('Native sign-in failed:', e);
                    setError("Native sign-in failed: " + (e && e.message ? e.message : JSON.stringify(e)));
                    setAuthLoading(false);
                });
        }
    }, []);
    // Set initial view based on URL path
    const initialView = (() => {
        const path = window.location.pathname;
        if (path === '/Grow-With-Me-AI/auth' || path === '/Grow-With-Me-AI/auth/') return View.AUTH;
        if (path === '/Grow-With-Me-AI/' || path === '/Grow-With-Me-AI') return View.LANDING;
        return View.LANDING;
    })();
    const [view, setView] = useState<View>(initialView);
    const [authUser, setAuthUser] = useState<firebase.User | null>(null);
    const [userProfile, setUserProfile] = useState<User | null>(null);
    const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
    const [isMobileNegotiationOpen, setIsMobileNegotiationOpen] = useState(false);
    const [selectedNegotiationId, setSelectedNegotiationId] = useState<string | null>(null);
    const [showFallbackNotification, setShowFallbackNotification] = useState(false);
    const [nativeUser, setNativeUser] = useState<{ idToken: string; name: string; email: string; avatarUrl?: string } | null>(null);
    const nativeUserRef = useRef(nativeUser);
    useEffect(() => { nativeUserRef.current = nativeUser; }, [nativeUser]);
    // JS bridge: Expose window.setNativeUser for Android to call
    useEffect(() => {
        (window as any).setNativeUser = (idToken: string, name: string, email: string, avatarUrl?: string) => {
            setNativeUser({ idToken, name, email, avatarUrl });
        };
        return () => {
            delete (window as any).setNativeUser;
        };
    }, []);
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
    const [connections, setConnections] = useState<User[]>([]);
    const [founderEngagement, setFounderEngagement] = useState<{ totalLikes: number; totalComments: number } | null>(null);
    const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false);
    const [showPasskeyRegistration, setShowPasskeyRegistration] = useState(false);
    const [showPasskeyVerification, setShowPasskeyVerification] = useState(false);
    const [pendingAuthUser, setPendingAuthUser] = useState<firebase.User | null>(null);
    const [pendingUserProfile, setPendingUserProfile] = useState<User | null>(null);
    const [isInPasskeyFlow, setIsInPasskeyFlow] = useState(false);
    const currentViewRef = useRef<View>(view);

    // Update the ref whenever view changes
    useEffect(() => {
        currentViewRef.current = view;
    }, [view]);

    const areKeysMissing = firebaseConfig.apiKey.startsWith('REPLACE_');

    // Comprehensive function to reset all passkey states
    const resetPasskeyStates = useCallback(() => {
        console.log('Resetting all passkey states');
        setIsInPasskeyFlow(false);
        setShowPasskeyPrompt(false);
        setShowPasskeyRegistration(false);
        setShowPasskeyVerification(false);
        setPendingAuthUser(null);
        setPendingUserProfile(null);
    }, []);

    const navigate = useCallback((targetView: View) => {
        console.log('Navigation requested:', { 
            from: view, 
            to: targetView, 
            isInPasskeyFlow,
            timestamp: new Date().toISOString(),
            stack: new Error().stack?.split('\n').slice(1, 4).join('\n')
        });
        setError(null);
        setView(targetView);
        
        // Safety mechanism: reset passkey flow state when user manually navigates
        if (isInPasskeyFlow && targetView !== View.AUTH) {
            console.log('Resetting passkey flow state due to manual navigation');
            resetPasskeyStates();
        }
    }, [isInPasskeyFlow, view, resetPasskeyStates]);

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
                [View.NEGOTIATIONS]: 'view_profile', // Or a new action type for negotiations
                [View.PROFILE]: 'view_profile',
                [View.NOTIFICATIONS]: 'view_profile',
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

        // If running in Android WebView and nativeUser is set, use it for app logic (bypass Firebase Auth)
        if (isAndroidWebView() && nativeUserRef.current) {
            // Simulate a user profile for the app
            const { idToken, name, email, avatarUrl } = nativeUserRef.current;
            const simulatedUser: User = {
                id: email, // Use email as unique ID for demo; in production, use a backend-verified ID
                name,
                email,
                avatarUrl: avatarUrl || `https://api.dicebear.com/8.x/bottts/svg?seed=${email}`,
                connections: [],
                role: Role.Founder,
                location: '',
                dateOfBirth: '',
                gender: '',
                skills: [],
                interests: [],
                lookingFor: '',
            };
            setUserProfile(simulatedUser);
            setAuthUser(null); // Not using Firebase Auth
            setAuthLoading(false);
            // You may want to check if the user exists in your DB and onboard if not
            // For now, always show onboarding if role is undefined
            if (!simulatedUser.role) {
                navigate(View.ONBOARDING);
            } else {
                navigate(View.DASHBOARD);
            }
            return;
        }

        // ...existing Firebase Auth logic for web/desktop...
        let unsubscribe: firebase.Unsubscribe = () => {};
        const setupAuth = async () => {
            setAuthLoading(true);
            try {
                await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            } catch (err: any) {
                console.error("Firebase Auth persistence setup error:", err);
                setError("Your browser does not support authentication. This may be due to private browsing settings. Please try a different browser or continue as a guest.");
                setAuthLoading(false);
                return;
            }
            unsubscribe = auth.onAuthStateChanged(async (user) => {
                console.log('onAuthStateChanged triggered:', { 
                    user: user?.uid ? 'authenticated' : 'not authenticated', 
                    currentView: view, 
                    isInPasskeyFlow 
                });
                
                setAuthLoading(true);
                if (user && !authConfigError) {
                    setAuthUser(user);
                    let profile = await firestoreService.getUserProfile(user.uid);
                    if (!profile) {
                        await firestoreService.createUserProfile(user.uid, {
                            email: user.email || '',
                            name: user.displayName || '',
                            avatarUrl: user.photoURL || '',
                            connections: [],
                            role: Role.Founder,
                            location: '',
                            dateOfBirth: '',
                            gender: '',
                            skills: [],
                            interests: [],
                            lookingFor: '',
                        });
                        profile = await firestoreService.getUserProfile(user.uid);
                    }
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
                        
                        // Don't automatically navigate to dashboard - let the passkey flow handle navigation
                        // The passkey verification will be triggered by the onAuthSuccess callback
                        // and will handle navigation after completion
                        
                        // Only prevent automatic navigation if we're currently in the AUTH view and passkey flow is active
                        // This allows users to navigate freely after they've completed the passkey flow
                        if (currentViewRef.current === View.AUTH && isInPasskeyFlow) {
                            // Stay on AUTH view during passkey flow
                            return;
                        }
                        
                        // Only handle initial navigation for page refresh scenarios
                        // Don't interfere with user's manual navigation between tabs
                        if (currentViewRef.current === View.LANDING || currentViewRef.current === View.AUTH) {
                            console.log('Handling initial navigation for:', { view: currentViewRef.current, profileRole: profile.role, profileLocation: profile.location });
                            if (!profile.role || profile.role === Role.Founder && !profile.location) {
                                console.log('Navigating to ONBOARDING');
                                navigate(View.ONBOARDING);
                            } else {
                                console.log('Navigating to DASHBOARD');
                                navigate(View.DASHBOARD);
                            }
                        } else {
                            console.log('User already on tab, not changing view:', currentViewRef.current);
                        }
                        // If user is already on a different view (Dashboard, Messages, etc.), don't change it
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
                    const path = window.location.pathname;
                    if (path === '/Grow-With-Me-AI/auth' || path === '/Grow-With-Me-AI/auth/') {
                        navigate(View.AUTH);
                    } else {
                        navigate(View.LANDING);
                    }
                }
                setAuthLoading(false);
            });
        };
        setupAuth();
        return () => unsubscribe();
    }, [areKeysMissing, isGuestMode, navigate, authConfigError, nativeUser]);

    const handleLogin = async () => {
        setError(null);
        if (areKeysMissing) {
            setAuthConfigError('keys-missing');
            return;
        }
        try {
            setAuthLoading(true);
            let result;
            // Use the unified nativeGoogleLogin function that handles platform detection
            result = await nativeGoogleLogin();
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
            window.history.pushState({}, '', '/Grow-With-Me-AI/');
            navigate(View.LANDING);
        } else {
            // onAuthStateChanged will handle the state reset after signOut
            await auth.signOut();
            // If in Android WebView, also sign out from Google
            if (typeof window !== 'undefined' && (window as any).AndroidBridge && typeof (window as any).AndroidBridge.signOutFromGoogle === 'function') {
                (window as any).AndroidBridge.signOutFromGoogle();
            }
        }
    };

    const [onboardingLoading, setOnboardingLoading] = useState(false);
    const handleOnboardingComplete = async (profileData: Omit<User, 'id' | 'avatarUrl'>) => {
        if (!authUser) return;
        setOnboardingLoading(true);
        setError(null);
        try {
            const newUserProfile: User = {
                id: authUser.uid,
                ...profileData,
                avatarUrl: authUser.photoURL || `https://api.dicebear.com/8.x/bottts/svg?seed=${authUser.uid}`,
                connections: [],
            };

            if (isGuestMode) {
                console.log("Guest mode: Storing profile locally.");
                setUserProfile(newUserProfile);
                navigate(View.DASHBOARD);
            } else {
                await firestoreService.createUserProfile(authUser.uid, {
                    ...profileData,
                    avatarUrl: newUserProfile.avatarUrl,
                    connections: [],
                });
                // After onboarding, reload the app with the token in the URL to keep the session alive in WebView
                const token = getTokenFromUrl();
                if (token && (typeof window !== 'undefined' && (window.location.search.includes('token') || isAndroidWebView()))) {
                    window.location.replace(`${window.location.origin}${window.location.pathname}?token=${token}`);
                    return;
                } else {
                    // Fallback for non-WebView
                    await auth.currentUser?.reload();
                    const refreshedUser = auth.currentUser;
                    if (refreshedUser) {
                        setAuthUser(refreshedUser);
                        const createdProfile = await firestoreService.getUserProfile(refreshedUser.uid);
                        setUserProfile(createdProfile);
                        navigate(View.DASHBOARD);
                    } else {
                        setError("Session lost after onboarding. Please sign in again.");
                        navigate(View.LANDING);
                    }
                }
            }
        } catch (err) {
            console.error("Onboarding error:", err);
            setError("Failed to complete onboarding. Please try again.");
        } finally {
            setOnboardingLoading(false);
        }
    };

    const handleProfileUpdate = async (updatedProfile: Partial<User>) => {
        if (!authUser || !userProfile) return;
        setError(null);
        try {
            const updatedUserProfile: User = {
                ...userProfile,
                ...updatedProfile,
            };

            if (isGuestMode) {
                console.log("Guest mode: Updating profile locally.");
                setUserProfile(updatedUserProfile);
            } else {
                await firestoreService.updateUserProfile(authUser.uid, updatedProfile);
                setUserProfile(updatedUserProfile);
            }
        } catch (err) {
            console.error("Profile update error:", err);
            setError("Failed to update profile. Please try again.");
        }
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
            
            const { matches: foundMatches, isFallback } = await findMatches(userProfile, potentialPartners);
            
            // Check if fallback was used
            if (isFallback) {
                console.log("Fallback matching algorithm was used due to API quota limits.");
                // setShowFallbackNotification(true);
                // setTimeout(() => setShowFallbackNotification(false), 5000);
            }
            
            const enrichedMatches = await Promise.all(foundMatches.map(async match => {
                const user = potentialPartners.find(p => p.id === match.userId);
                if (!user) return null;
                
                // Get connection status for this match
                const connectionStatus = await firestoreService.getConnectionStatus(userProfile.id, user.id);
                
                return { 
                    ...match, 
                    user,
                    isConnected: connectionStatus.isConnected,
                    isPending: connectionStatus.isPending
                };
            })).then(matches => matches.filter((match): match is EnrichedMatch => match !== null));

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
        setView(View.MESSAGES);
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

    const handlePasskeyComplete = (skipped: boolean = false) => {
        if (pendingAuthUser && pendingUserProfile) {
            setAuthUser(pendingAuthUser);
            setUserProfile(pendingUserProfile);
            
            // Check if user has completed onboarding
            const hasCompletedOnboarding = pendingUserProfile.name && 
                                         pendingUserProfile.name.trim() !== '' && 
                                         pendingUserProfile.role && 
                                         pendingUserProfile.location && 
                                         pendingUserProfile.skills && 
                                         pendingUserProfile.skills.length > 0;
            
            if (hasCompletedOnboarding) {
                navigate(View.DASHBOARD);
            } else {
                navigate(View.ONBOARDING);
            }
            
            // Reset all passkey states
            resetPasskeyStates();
        }
    };

    const handlePasskeyVerificationSuccess = () => {
        if (pendingAuthUser && pendingUserProfile) {
            setAuthUser(pendingAuthUser);
            setUserProfile(pendingUserProfile);
            
            // Check if user has completed onboarding
            const hasCompletedOnboarding = pendingUserProfile.name && 
                                         pendingUserProfile.name.trim() !== '' && 
                                         pendingUserProfile.role && 
                                         pendingUserProfile.location && 
                                         pendingUserProfile.skills && 
                                         pendingUserProfile.skills.length > 0;
            
            if (hasCompletedOnboarding) {
                navigate(View.DASHBOARD);
            } else {
                navigate(View.ONBOARDING);
            }
            
            // Reset all passkey states
            resetPasskeyStates();
        }
    };

    const handlePasskeySkip = () => {
        handlePasskeyComplete(true);
    };

    const checkUserHasPasskeys = async (uid: string): Promise<boolean> => {
        try {
            const functionsBase = (import.meta as any).env?.VITE_FUNCTIONS_BASE_URL || '/api';
            const response = await fetch(`${functionsBase}/webauthn/login/begin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid })
            });
            
            if (response.ok) {
                const data = await response.json();
                // If allowCredentials exists and has items, user has passkeys
                return data.allowCredentials && data.allowCredentials.length > 0;
            }
            return false;
        } catch (error) {
            console.error('Error checking passkeys:', error);
            return false;
        }
    };

    const renderContent = () => {
        if (isAuthLoading && !areKeysMissing && !authConfigError) {
            return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div></div>;
        }

        switch (view) {
            case View.LANDING:
                // return <LandingPageLightRays onGetStarted={() => navigate(View.AUTH)} authUser={authUser} userProfile={userProfile} />;
                return <LandingPageLightRays/>;
            case View.AUTH:
                return <AuthComponent error={error} onAuthSuccess={async (user) => {
                    // After successful authentication, check for passkeys and show appropriate prompt
                    if (user) {
                        const hasPasskeys = await checkUserHasPasskeys(user.uid);
                        const profile = await firestoreService.getUserProfile(user.uid);
                        
                        // Set passkey flow state to prevent background navigation
                        setIsInPasskeyFlow(true);
                        
                        if (hasPasskeys) {
                            // User has passkeys - require 2FA verification
                            setPendingAuthUser(user);
                            setPendingUserProfile(profile);
                            setShowPasskeyVerification(true);
                        } else {
                            // No passkeys yet, show passkey registration prompt
                            setPendingAuthUser(user);
                            setPendingUserProfile(profile);
                            setShowPasskeyPrompt(true);
                        }
                    }
                }} />;
            case View.ONBOARDING:
                return <Onboarding onOnboardingComplete={handleOnboardingComplete} userProfile={userProfile} loading={onboardingLoading} error={error} />;
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
                return <NegotiationsBoard 
                    user={userProfile} 
                    setIsMobileNegotiationOpen={setIsMobileNegotiationOpen}
                    selectedNegotiationId={selectedNegotiationId}
                    onNegotiationSelected={() => setSelectedNegotiationId(null)}
                />;
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
                    connections={connections}
                    setIsMobileChatOpen={setIsMobileChatOpen}
                    selectedUserForChat={selectedUserForChat}
                />;

            case View.IDEAS:
                if (!userProfile) return null;
                return <IdeasBoard 
                    user={userProfile} 
                    onNavigateToNegotiation={(negotiationId) => {
                        setSelectedNegotiationId(negotiationId);
                        setView(View.NEGOTIATIONS);
                    }}
                />;
            case View.PEOPLE:
                return <People 
                            currentUser={userProfile}
                            connections={connections}
                            onMessage={handleMessageUser}
                            onRemoveConnection={handleRemoveConnection}
                        />;
            case View.PROFILE:
                if (!userProfile) return null;
                return <Profile 
                    userProfile={userProfile}
                    onUpdateProfile={handleProfileUpdate}
                    onBack={() => navigate(View.DASHBOARD)}
                    loading={false}
                    error={error}
                />;
            case View.NOTIFICATIONS:
                if (!userProfile) return null;
                return <NotificationsPage 
                    currentUser={userProfile}
                    onNavigateToView={navigate}
                    onBack={() => navigate(View.DASHBOARD)}
                />;
            default:
                if (!userProfile) return null;
                return <Dashboard user={userProfile} matches={filteredMatches} isLoading={isLoading} error={error} onFindMatches={handleFindMatches} searchQuery={searchQuery} setSearchQuery={setSearchQuery} hasActiveSearch={matches.length > 0} onMessage={handleMessageUser} />;
        }
    };

    // Safety timeout to reset passkey flow state if something goes wrong
    useEffect(() => {
        if (isInPasskeyFlow) {
            const timeout = setTimeout(() => {
                console.warn('Passkey flow timeout - resetting state');
                resetPasskeyStates();
            }, 30000); // 30 seconds timeout
            
            return () => clearTimeout(timeout);
        }
    }, [isInPasskeyFlow, resetPasskeyStates]);

    return (
        <CacheProvider>
            <div className={`bg-black font-sans flex ${view === View.MESSAGES || view === View.NEGOTIATIONS || view === View.ANALYTICS ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
                {(areKeysMissing || authConfigError === 'unauthorized-domain') && <ApiKeysNotice isDomainError={authConfigError === 'unauthorized-domain'} />}
                {(view !== View.LANDING && view !== View.AUTH) && (
                    <Header 
                        currentView={view} 
                        setView={navigate} 
                        userProfile={userProfile} 
                        onLogin={handleLogin} 
                        onLogout={handleLogout} 
                        isMobileChatOpen={isMobileChatOpen}
                        isMobileNegotiationOpen={isMobileNegotiationOpen}
                    />
                )}
                <main className={`flex-grow transition-all duration-300 ${(view !== View.LANDING && view !== View.AUTH) ? 'ml-0 lg:ml-64' : ''} ${view === View.MESSAGES || view === View.NEGOTIATIONS || view === View.ANALYTICS || view === View.PROFILE || view === View.NOTIFICATIONS ? 'p-0 overflow-hidden' : 'p-4 sm:p-8 pt-16 lg:pt-8'}`}>
                    {renderContent()}
                </main>
                
                {/* Passkey Registration Prompt */}
                {showPasskeyPrompt && pendingAuthUser && pendingUserProfile && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-gradient-to-br from-slate-900/95 to-black/95 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6 max-w-md w-full">
                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold text-white mb-2">
                                    Welcome, {pendingUserProfile.name || pendingAuthUser.email}!
                                </h3>
                                <p className="text-slate-400 text-sm">
                                    Set up a passkey for faster, more secure sign-ins on this device and others.
                                </p>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="bg-emerald-900/20 border border-emerald-700/30 text-emerald-300 p-3 rounded-lg text-sm">
                                    <strong>Account:</strong> {pendingAuthUser.email}<br/>
                                    <strong>Provider:</strong> {pendingAuthUser.providerData[0]?.providerId || 'phone'}
                                </div>
                                
                                <button
                                    onClick={() => {
                                        setShowPasskeyPrompt(false);
                                        setShowPasskeyRegistration(true);
                                    }}
                                    className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-medium"
                                >
                                    Set up passkey
                                </button>
                                
                                <button
                                    onClick={handlePasskeySkip}
                                    className="w-full px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                                >
                                    Skip for now
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Passkey Registration UI */}
                {showPasskeyRegistration && pendingAuthUser && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-gradient-to-br from-slate-900/95 to-black/95 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6 max-w-md w-full">
                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold text-white mb-2">Register Passkey</h3>
                                <p className="text-slate-400 text-sm">
                                    Follow your device's prompts to create a secure passkey.
                                </p>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="bg-emerald-900/20 border border-emerald-700/30 text-emerald-300 p-3 rounded-lg text-sm">
                                    <strong>Account:</strong> {pendingAuthUser.email}<br/>
                                    <strong>Provider:</strong> {pendingAuthUser.providerData[0]?.providerId || 'phone'}
                                </div>
                                
                                <button
                                    onClick={async () => {
                                        try {
                                            // Import the passkey functions dynamically
                                            const { startRegistration } = await import('@simplewebauthn/browser');
                                            const functionsBase = (import.meta as any).env?.VITE_FUNCTIONS_BASE_URL || '/api';
                                            
                                            // Start passkey registration
                                            const uid = pendingAuthUser.uid;
                                            const userEmail = pendingAuthUser.email || '';
                                            const userProvider = pendingAuthUser.providerData[0]?.providerId || 'unknown';
                                            
                                            const begin = await fetch(`${functionsBase}/webauthn/register/begin`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ uid })
                                            }).then(r => r.json());
                                            
                                            const attResp = await startRegistration(begin);
                                            
                                            const finish = await fetch(`${functionsBase}/webauthn/register/finish`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ 
                                                    uid, 
                                                    response: attResp,
                                                    userEmail,
                                                    userProvider
                                                })
                                            }).then(r => r.json());
                                            
                                            if (finish?.verified) {
                                                // Passkey registered successfully
                                                setShowPasskeyRegistration(false);
                                                handlePasskeyComplete(false);
                                            } else {
                                                throw new Error('Passkey registration failed');
                                            }
                                        } catch (error) {
                                            console.error('Passkey registration error:', error);
                                            alert('Passkey registration failed. Please try again or skip for now.');
                                        }
                                    }}
                                    className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-medium"
                                >
                                    Start Registration
                                </button>
                                
                                <button
                                    onClick={() => {
                                        setShowPasskeyRegistration(false);
                                        handlePasskeyComplete(false);
                                    }}
                                    className="w-full px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Passkey Verification Prompt */}
                {showPasskeyVerification && pendingAuthUser && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-gradient-to-br from-slate-900/95 to-black/95 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6 max-w-md w-full">
                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold text-white mb-2">
                                    Two-Factor Authentication Required
                                </h3>
                                <p className="text-slate-400 text-sm">
                                    Please verify your identity using your passkey.
                                </p>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="bg-emerald-900/20 border border-emerald-700/30 text-emerald-300 p-3 rounded-lg text-sm">
                                    <strong>Account:</strong> {pendingAuthUser.email}<br/>
                                    <strong>Provider:</strong> {pendingAuthUser.providerData[0]?.providerId || 'phone'}
                                </div>
                                
                                <button
                                    onClick={async () => {
                                        try {
                                            // Import the passkey functions dynamically
                                            const { startAuthentication } = await import('@simplewebauthn/browser');
                                            const functionsBase = (import.meta as any).env?.VITE_FUNCTIONS_BASE_URL || '/api';
                                            
                                            // Start passkey authentication
                                            const uid = pendingAuthUser.uid;
                                            const userEmail = pendingAuthUser.email || '';
                                            const userProvider = pendingAuthUser.providerData[0]?.providerId || 'unknown';
                                            
                                            const begin = await fetch(`${functionsBase}/webauthn/login/begin`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ uid })
                                            }).then(r => r.json());
                                            
                                            const attResp = await startAuthentication(begin);
                                            
                                            const finish = await fetch(`${functionsBase}/webauthn/login/finish`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ 
                                                    uid, 
                                                    response: attResp,
                                                    userEmail,
                                                    userProvider
                                                })
                                            }).then(r => r.json());
                                            
                                            if (finish?.verified) {
                                                // Passkey verified successfully
                                                setShowPasskeyVerification(false);
                                                handlePasskeyVerificationSuccess();
                                            } else {
                                                throw new Error('Passkey verification failed');
                                            }
                                        } catch (error) {
                                            console.error('Passkey verification error:', error);
                                            alert('Passkey verification failed. Please try again.');
                                        }
                                    }}
                                    className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-medium"
                                >
                                    Verify Passkey
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Fallback Notification */}
                {showFallbackNotification && (
                    <div className="fixed top-20 right-4 z-50 bg-amber-900/90 border border-amber-700/50 text-amber-100 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm max-w-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium">Using fallback matching due to high API usage</span>
                        </div>
                        <p className="text-xs text-amber-200 mt-1">Matches are still accurate but may be less personalized.</p>
                    </div>
                )}
                
                {/* ChatModal removed; chat will be rendered inline in Messages */}
                
            </div>
        </CacheProvider>
    );
};

export default App;