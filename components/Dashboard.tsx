import React, { useState, useEffect } from 'react';
import { User, EnrichedMatch, Role } from '../types';
import { ZapIcon, SettingsIcon, UserIcon, MessageSquareIcon, StarIcon, SearchIcon, UserPlusIcon, CheckCheckIcon } from './icons';
import AnalyticsDashboard from './AnalyticsDashboard';
import ProfileCard from './ProfileCard';
import FeedbackModal from './FeedbackModal';
import { firestoreService } from '../services/firestoreService';
import { db } from '../firebase';
import NegotiationDeck from './NegotiationDeck';
import { ConnectionsModal } from './ConnectionsModal';
import InfoModal from './InfoModal';
import FounderNegotiations from './FounderNegotiations';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';

// Custom hook for responsive animation timing
const useResponsiveAnimation = () => {
    const [isLargeScreen, setIsLargeScreen] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => {
            setIsLargeScreen(window.innerWidth >= 1024);
        };
        
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);
    
    return {
        enterDuration: isLargeScreen ? 0.5 : 0.2,
        exitDuration: isLargeScreen ? 0.5: 0.15,
    };
};

interface DashboardProps {
    user: User;
    matches: EnrichedMatch[];
    isLoading: boolean;
    error: string | null;
    onFindMatches: () => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    hasActiveSearch: boolean;
    onMessage: (user: User) => void;
    onRequestsUpdated: () => void;
}

const SkeletonLoader: React.FC = () => (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-4 rounded-2xl animate-pulse border border-slate-700/50 w-full">
        <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="w-20 h-20 rounded-full bg-slate-700 mx-auto sm:mx-0" />
            <div className="flex-1 space-y-3">
                <div className="h-5 bg-slate-700 rounded-full w-3/4" />
                <div className="h-4 bg-slate-700 rounded-full w-1/2" />
                <div className="h-3 bg-slate-700 rounded-full w-2/3" />
                <div className="flex gap-2">
                    <div className="flex-1 h-10 bg-slate-700 rounded-lg" />
                    <div className="flex-1 h-10 bg-slate-700 rounded-lg" />
                </div>
            </div>
        </div>
    </div>
);

const MatchCard: React.FC<{
    match: EnrichedMatch;
    onMessage: (user: User) => void;
    onConnect: (user: User) => void;
    onFeedback: (user: User) => void;
    onViewProfile: (user: User) => void;
    isConnected: boolean;
    isPending: boolean;
    index: number;
    hoveredIndex: number | null;
    setHoveredIndex: (index: number | null) => void;
}> = ({ match, onMessage, onConnect, onFeedback, onViewProfile, isConnected, isPending, index, hoveredIndex, setHoveredIndex }) => {
    const matchedUser = match.user;
    const scoreColor = match.compatibilityScore > 80 ? 'text-emerald-400' : match.compatibilityScore > 60 ? 'text-amber-400' : 'text-orange-400';
    const { enterDuration, exitDuration } = useResponsiveAnimation();

    return (
        <div 
            className="relative group block p-2 h-full w-full"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
        >
            {/* Aceternity UI Hover Background Effect - Smooth sliding without blinking */}
            <AnimatePresence mode="wait">
                {hoveredIndex === index && (
                    <motion.span
                        className="absolute inset-0 h-full w-full bg-slate-800/[0.8] block rounded-3xl"
                        layoutId="hoverBackground"
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: 1,
                            transition: { 
                                duration: enterDuration,
                                ease: "easeOut"
                            },
                        }}
                        exit={{
                            opacity: 0,
                            transition: { 
                                duration: 0.05,
                                ease: "linear"
                            },
                        }}
                        style={{
                            willChange: 'opacity, transform',
                            transformOrigin: 'center',
                        }}
                        layout
                    />
                )}
            </AnimatePresence>

            {/* Card content */}
            <div 
                className="relative z-20 bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10 h-full"
                onClick={() => onViewProfile(matchedUser)}
            >
                {/* Mobile layout */}
                <div className="sm:hidden space-y-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <img 
                                src={matchedUser.avatarUrl} 
                                alt={matchedUser.name} 
                                className="w-12 h-12 rounded-full border-2 border-slate-700 shadow-lg" 
                            />
                            <div>
                                <h3 className="text-sm font-semibold text-white">{matchedUser.name}</h3>
                                <span className={cn(
                                    "text-xs font-medium px-2 py-1 rounded-full",
                                    matchedUser.role === Role.Developer ? 'bg-blue-900/30 text-blue-300 border border-blue-700/30' : 
                                    matchedUser.role === Role.Founder ? 'bg-purple-900/30 text-purple-300 border border-purple-700/30' : 
                                    'bg-emerald-900/30 text-emerald-300 border border-emerald-700/30'
                                )}>
                                    {matchedUser.role}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onFeedback(matchedUser); }} 
                                className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors"
                            >
                                <StarIcon className="w-3.5 h-3.5"/>
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onMessage(matchedUser); }} 
                                className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-white transition-colors"
                            >
                                <MessageSquareIcon className="w-3.5 h-3.5"/>
                            </button>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-800/50 rounded-full h-2">
                                <div 
                                    className="bg-gradient-to-r from-slate-600 to-slate-500 h-2 rounded-full transition-all duration-500" 
                                    style={{ width: `${match.compatibilityScore}%` }}
                                />
                            </div>
                            <span className={cn("text-xs font-bold", scoreColor)}>{match.compatibilityScore}%</span>
                        </div>
                        
                        {isConnected ? (
                            <button disabled className="w-full py-2 px-3 bg-emerald-600/20 text-emerald-300 border border-emerald-600/30 rounded-lg text-xs font-medium cursor-not-allowed">
                                <CheckCheckIcon className="w-3.5 h-3.5 inline mr-1"/> Connected
                            </button>
                        ) : isPending ? (
                            <button disabled className="w-full py-2 px-3 bg-amber-600/20 text-amber-300 border border-amber-600/30 rounded-lg text-xs font-medium cursor-not-allowed">
                                <CheckCheckIcon className="w-3.5 h-3.5 inline mr-1"/> Pending
                            </button>
                        ) : (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onConnect(matchedUser); }} 
                                className="w-full py-2 px-3 bg-gradient-to-r from-slate-600 to-slate-500 hover:from-slate-500 hover:to-slate-400 text-white rounded-lg text-xs font-medium transition-all duration-200 hover:shadow-lg hover:shadow-slate-500/25"
                            >
                                <UserPlusIcon className="w-3.5 h-3.5 inline mr-1"/> Connect
                            </button>
                        )}
                    </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden sm:block space-y-4">
                    <div className="flex items-start space-x-4">
                        <img 
                            src={matchedUser.avatarUrl} 
                            alt={matchedUser.name} 
                            className="w-20 h-20 rounded-full border-2 border-slate-700 shadow-lg" 
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-white">{matchedUser.name}</h3>
                                <span className={cn(
                                    "text-sm font-medium px-3 py-1 rounded-full",
                                    matchedUser.role === Role.Developer ? 'bg-blue-900/30 text-blue-300 border border-blue-700/30' : 
                                    matchedUser.role === Role.Founder ? 'bg-purple-900/30 text-purple-300 border border-purple-700/30' : 
                                    'bg-emerald-900/30 text-emerald-300 border border-emerald-700/30'
                                )}>
                                    {matchedUser.role}
                                </span>
                            </div>
                            <p className="text-slate-400 text-sm">{matchedUser.location}</p>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-800/50 rounded-full h-3">
                                <div 
                                    className="bg-gradient-to-r from-slate-600 to-slate-500 h-3 rounded-full transition-all duration-500" 
                                    style={{ width: `${match.compatibilityScore}%` }}
                                />
                            </div>
                            <span className={cn("text-lg font-bold", scoreColor)}>{match.compatibilityScore}%</span>
                        </div>
                        
                        <p className="text-slate-300 text-sm italic border-l-2 border-slate-600 pl-4">"{match.justification}"</p>
                        
                        <div className="flex gap-2 pt-2">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onFeedback(matchedUser); }} 
                                className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors"
                            >
                                <StarIcon className="w-4 h-4"/>
                            </button>
                            {isConnected ? (
                                <button disabled className="flex-1 py-2 px-4 bg-emerald-600/20 text-emerald-300 border border-emerald-600/30 rounded-lg text-sm font-medium cursor-not-allowed">
                                    <CheckCheckIcon className="w-4 h-4 inline mr-2"/> Connected
                                </button>
                            ) : isPending ? (
                                <button disabled className="flex-1 py-2 px-4 bg-amber-600/20 text-amber-300 border border-amber-600/30 rounded-lg text-sm font-medium cursor-not-allowed">
                                    <CheckCheckIcon className="w-4 h-4 inline mr-2"/> Pending
                                </button>
                            ) : (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onConnect(matchedUser); }} 
                                    className="flex-1 py-2 px-4 bg-gradient-to-r from-slate-600 to-slate-500 hover:from-slate-500 hover:to-slate-400 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-slate-500/25"
                                >
                                    <UserPlusIcon className="w-4 h-4 inline mr-2"/> Connect
                                </button>
                            )}
                            <button 
                                onClick={(e) => { e.stopPropagation(); onMessage(matchedUser); }} 
                                className="py-2 px-4 bg-slate-800/50 hover:bg-slate-700/50 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                <MessageSquareIcon className="w-4 h-4 inline mr-2"/> Message
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({
    user,
    matches,
    isLoading,
    error,
    onFindMatches,
    searchQuery,
    setSearchQuery,
    hasActiveSearch,
    onMessage,
    onRequestsUpdated,
}) => {
    const [viewingProfile, setViewingProfile] = useState<User | null>(null);
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [feedbackUser, setFeedbackUser] = useState<User | null>(null);
    const [connectionsModalOpen, setConnectionsModalOpen] = useState(false);
    const [connectionIds, setConnectionIds] = useState<string[]>([]);
    const [infoModal, setInfoModal] = useState<{ title: string; message: string; type: 'success' | 'error' } | null>(null);
    const [activeTab, setActiveTab] = useState<'matches'>('matches');
    const [totalInvested, setTotalInvested] = useState<number>(0);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [enrichedMatches, setEnrichedMatches] = useState<EnrichedMatch[]>(matches);

    // Optimized hover handler with debouncing for large screens
    const handleHoverChange = React.useCallback((index: number | null) => {
        setHoveredIndex(index);
    }, []);

    // Update enrichedMatches when matches prop changes
    useEffect(() => {
        setEnrichedMatches(matches);
    }, [matches]);

    // Real-time connection status listeners
    useEffect(() => {
        if (!user || matches.length === 0) return;

        const unsubscribers: (() => void)[] = [];

        // Set up real-time listeners for each match
        matches.forEach(match => {
            console.log(`Dashboard: Setting up real-time listener for match ${match.user.name}`);
            const unsubscribe = firestoreService.getConnectionStatusRealtime(
                user.id, 
                match.user.id, 
                (status) => {
                    console.log(`Dashboard: Real-time status update for ${match.user.name}:`, status);
                    setEnrichedMatches(prev => 
                        prev.map(m => 
                            m.user.id === match.user.id 
                                ? { ...m, isConnected: status.isConnected, isPending: status.isPending }
                                : m
                        )
                    );
                }
            );
            unsubscribers.push(unsubscribe);
        });

        // Also listen to current user's connections changes for real-time updates
        const currentUserRef = db.collection('users').doc(user.id);
        const unsubCurrentUser = currentUserRef.onSnapshot(snapshot => {
            const userData = snapshot.data();
            if (userData && userData.connections) {
                // Update matches based on new connections
                setEnrichedMatches(prev => 
                    prev.map(match => ({
                        ...match,
                        isConnected: userData.connections.includes(match.user.id),
                        isPending: false // If connected, not pending
                    }))
                );
            }
        });

        unsubscribers.push(unsubCurrentUser);

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [user, matches]);

    React.useEffect(() => {
        async function fetchTotalInvested() {
            if (user.role === Role.Founder) {
                const total = await firestoreService.getTotalInvestedAmountForIdeas(user.id);
                setTotalInvested(total);
            }
        }
        fetchTotalInvested();
    }, [user.id, user.role]);

    const handleConnect = async (connectUser: User) => {
        if (!user) return;
        try {
            await firestoreService.createConnectionRequest(user, connectUser.id);
            setInfoModal({
                title: 'Request Sent',
                message: `Your connection request has been sent to ${connectUser.name}.`,
                type: 'success',
            });
            setViewingProfile(null);
            onRequestsUpdated();
            
            // Optimistically update the match status to show pending
            setEnrichedMatches(prev => 
                prev.map(match => 
                    match.user.id === connectUser.id 
                        ? { ...match, isConnected: false, isPending: true }
                        : match
                )
            );
        } catch (error) {
            console.error("Failed to send connection request:", error);
            setInfoModal({
                title: 'Request Failed',
                message: `Could not send connection request. You may have already sent one to this user.`,
                type: 'error',
            });
        }
    };

    const handleViewConnections = (ids: string[]) => {
        setConnectionIds(ids);
        setConnectionsModalOpen(true);
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-black to-slate-950 font-sans">
            {/* Enhanced background with subtle patterns */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-black to-slate-950" />
                <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:80px_80px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
                {/* Header section */}
                <motion.div 
                    className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-2">
                            Your Dashboard
                        </h1>
                        <p className="text-slate-400 text-sm sm:text-base">
                            Discover and connect with amazing people
                        </p>
                    </div>
                    <button
                        onClick={onFindMatches}
                        disabled={isLoading}
                        className="flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-medium py-3 px-6 rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-105"
                    >
                        <ZapIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        {isLoading ? 'Finding...' : hasActiveSearch ? 'Refresh Matches' : 'Find Matches'}
                    </button>
                </motion.div>

                {/* Search section */}
                <motion.div 
                    className="mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                        <input
                            type="text"
                            placeholder="Search matches by keyword, skill, or location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-4 pl-14 pr-4 text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all backdrop-blur-sm relative z-0"
                        />
                    </div>
                </motion.div>

                {/* Tab navigation */}
                <motion.div 
                    className="mb-8 border-b border-slate-700/30"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <button 
                        onClick={() => setActiveTab('matches')} 
                        className={cn(
                            "py-3 px-6 text-sm font-medium transition-all duration-200 border-b-2",
                            activeTab === 'matches' 
                                ? 'text-emerald-400 border-emerald-500' 
                                : 'text-slate-400 hover:text-white border-transparent hover:border-slate-600'
                        )}
                    > 
                        Matches
                    </button>
                </motion.div>

                {/* Matches grid with Aceternity UI hover effect */}
                {activeTab === 'matches' && (
                    <motion.div 
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, idx) => <SkeletonLoader key={idx} />)
                        ) : enrichedMatches.length > 0 ? (
                            enrichedMatches.map((match, idx) => (
                                <motion.div
                                    key={match.user.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.1 * idx }}
                                >
                                    <MatchCard
                                        match={match}
                                        onMessage={onMessage}
                                        onConnect={handleConnect}
                                        onFeedback={(user) => { setFeedbackUser(user); setFeedbackModalOpen(true); }}
                                        onViewProfile={setViewingProfile}
                                        isConnected={match.isConnected}
                                        isPending={match.isPending}
                                        index={idx}
                                        hoveredIndex={hoveredIndex}
                                        setHoveredIndex={handleHoverChange}
                                    />
                                </motion.div>
                            ))
                        ) : (
                            <motion.div 
                                className="text-slate-400 col-span-full text-center py-16"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.6 }}
                            >
                                <div className="max-w-md mx-auto">
                                    <div className="w-16 h-16 bg-slate-800/50 rounded-full mx-auto mb-4 flex items-center justify-center">
                                        <SearchIcon className="w-8 h-8 text-slate-600" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-300 mb-2">No matches found</h3>
                                    <p className="text-sm text-slate-500">Try refreshing or adjusting your search criteria to discover new connections.</p>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* Analytics tab */}
                {activeTab === 'analytics' && user.role === Role.Founder && (
                    <AnalyticsDashboard
                        data={{
                            userEngagement: { dailyActiveUsers: 0, monthlyActiveUsers: 0, averageSessionDuration: 0 },
                            matchSuccess: { totalMatchesMade: 0, successfulConnections: 0, successRate: 0 },
                            platformPerformance: { dau_data: [], match_rate_data: [] }
                        }}
                        totalIdeas={0}
                        totalNegotiations={0}
                        totalDealsAccepted={0}
                        totalInvested={totalInvested}
                    />
                )}
            </div>

            {/* Modals */}
            {feedbackModalOpen && feedbackUser && (
                <FeedbackModal
                    user={feedbackUser}
                    onClose={() => setFeedbackModalOpen(false)}
                />
            )}
            {connectionsModalOpen && (
                <ConnectionsModal
                    userIds={connectionIds}
                    onClose={() => setConnectionsModalOpen(false)}
                    onSelectUser={(selectedUser) => {
                        setConnectionsModalOpen(false);
                        setViewingProfile(selectedUser);
                    }}
                />
            )}
            {infoModal && (
                <InfoModal
                    title={infoModal.title}
                    message={infoModal.message}
                    type={infoModal.type}
                    onClose={() => setInfoModal(null)}
                />
            )}
            {viewingProfile && (
                <ProfileCard
                    user={viewingProfile}
                    onClose={() => setViewingProfile(null)}
                    isOwnProfile={false}
                    onMessage={onMessage}
                    onConnect={handleConnect}
                    currentUserId={user.id}
                    isConnected={enrichedMatches.find(m => m.user.id === viewingProfile.id)?.isConnected || false}
                    isPending={enrichedMatches.find(m => m.user.id === viewingProfile.id)?.isPending || false}
                />
            )}
        </div>
    );
};

export default Dashboard;