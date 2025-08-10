import React, { useState } from 'react';
import { User, EnrichedMatch, Role } from '../types';
import { ZapIcon, SettingsIcon, UserIcon, MessageSquareIcon, StarIcon, SearchIcon, UserPlusIcon, CheckCheckIcon } from './icons';
import ProfileCard from './ProfileCard';
import FeedbackModal from './FeedbackModal';
import { firestoreService } from '../services/firestoreService';
import NegotiationDeck from './NegotiationDeck';
import { ConnectionsModal } from './ConnectionsModal';
import InfoModal from './InfoModal';
import FounderNegotiations from './FounderNegotiations';

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
    <div className="bg-neutral-900 p-2 sm:p-4 rounded-lg animate-pulse border border-neutral-800 w-full">
        {/* Mobile layout: top row and score bar at bottom */}
        <div className="sm:hidden flex flex-col justify-between w-full min-h-0 py-0.5">
            <div className="flex items-start justify-between w-full">
                {/* Left: avatar, name, tag */}
                <div className="flex items-center gap-1">
                    <div className="w-9 h-9 rounded-full bg-neutral-700" />
                    <div className="flex flex-col items-start justify-center">
                        <div className="h-3 w-16 bg-neutral-700 rounded mb-0.5" />
                        <div className="h-2 w-10 bg-blue-900/50 rounded-full" />
                    </div>
                </div>
                {/* Right: three action icons */}
                <div className="flex items-center gap-0.5">
                    <div className="w-5 h-5 rounded-full bg-neutral-800" />
                    <div className="w-5 h-5 rounded-full bg-neutral-800" />
                    <div className="w-5 h-5 rounded-full bg-neutral-800" />
                </div>
            </div>
            {/* Bottom: match score bar */}
            <div className="flex items-center gap-1 w-full mt-1">
                <div className="flex-1 bg-neutral-800 rounded-full h-1.5">
                    <div className="bg-purple-700 h-1.5 rounded-full w-1/2" />
                </div>
                <div className="h-3 w-8 bg-neutral-700 rounded" />
            </div>
        </div>
        {/* Tablet/desktop: original skeleton */}
        <div className="hidden sm:flex flex-row animate-pulse">
            <div className="rounded-full bg-neutral-700 h-24 w-24 sm:mr-4 mb-3 sm:mb-0"></div>
            <div className="flex-1">
                <div className="h-6 bg-neutral-700 rounded-full mb-2"></div>
                <div className="h-4 bg-neutral-600 rounded-full mb-4"></div>
                <div className="flex gap-2">
                    <div className="flex-1 h-10 bg-neutral-700 rounded-lg"></div>
                    <div className="flex-1 h-10 bg-neutral-700 rounded-lg"></div>
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
}> = ({ match, onMessage, onConnect, onFeedback, onViewProfile, isConnected, isPending }) => {
    const matchedUser = match.user;
    const scoreColor = match.compatibilityScore > 80 ? 'text-green-400' : match.compatibilityScore > 60 ? 'text-yellow-400' : 'text-orange-400';

    return (
        <div 
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-2 sm:p-6 transition-all duration-300 hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-900/20 transform hover:-translate-y-1 cursor-pointer w-full sm:max-w-full custom1366:max-w-[320px] custom1366:overflow-hidden custom1366:break-words"
            onClick={() => onViewProfile(matchedUser)}
        >
            {/* Mobile: avatar, name, score, connect only; sm+: full card */}
            <div className="sm:hidden w-full min-h-0 py-0.5 flex flex-col justify-between">
                <div className="flex items-start justify-between w-full">
                    {/* Left: avatar, name, tag */}
                    <div className="flex items-center gap-1">
                        <img src={matchedUser.avatarUrl} alt={matchedUser.name} className="w-9 h-9 rounded-full border border-neutral-700" />
                        <div className="flex flex-col items-start justify-center">
                            <h3 className="text-xs font-bold text-white leading-tight mb-0.5">{matchedUser.name}</h3>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${matchedUser.role === Role.Developer ? 'bg-blue-900/50 text-blue-300' : matchedUser.role === Role.Founder ? 'bg-purple-900/50 text-purple-300' : 'bg-green-900/50 text-green-300'}`}>{matchedUser.role}</span>
                        </div>
                    </div>
                    {/* Right: star, message, connect */}
                    <div className="flex items-center gap-0.5">
                        <button onClick={(e) => { e.stopPropagation(); onFeedback(matchedUser); }} aria-label="Give Feedback" className="p-0.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors custom1366:hidden" title="Feedback"><StarIcon className="w-3 h-3"/></button>
                        <button onClick={(e) => { e.stopPropagation(); onMessage(matchedUser); }} className="p-0.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white transition-colors" title="Message"><MessageSquareIcon className="w-3 h-3"/></button>
                        {isConnected ? (
                            <button disabled className="flex items-center gap-0.5 bg-green-600 text-white font-semibold py-0.5 px-1.5 rounded-lg cursor-not-allowed text-[10px]" title="Connected">
                                <CheckCheckIcon className="w-3 h-3"/>
                            </button>
                        ) : isPending ? (
                            <button disabled className="flex items-center gap-0.5 bg-yellow-600 text-white font-semibold py-0.5 px-1.5 rounded-lg cursor-not-allowed text-[10px]" title="Pending">
                                <CheckCheckIcon className="w-3 h-3"/>
                            </button>
                        ) : (
                            <button onClick={(e) => { e.stopPropagation(); onConnect(matchedUser); }} className="flex items-center gap-0.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-0.5 px-1.5 rounded-lg transition-colors text-[10px]" title="Connect">
                                <UserPlusIcon className="w-3 h-3"/>
                            </button>
                        )}
                    </div>
                </div>
                {/* Bottom: match score bar */}
                <div className="flex items-center gap-1 w-full mt-1">
                    <div className="flex-1 bg-neutral-800 rounded-full h-1.5">
                        <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${match.compatibilityScore}%` }}></div>
                    </div>
                    <span className={`font-bold text-xs ${scoreColor}`}>{match.compatibilityScore}%</span>
                </div>
            </div>
            {/* Desktop/tablet: full card */}
            <div className="hidden sm:flex flex-col sm:flex-row items-start space-x-0 sm:space-x-6">
                <img src={matchedUser.avatarUrl} alt={matchedUser.name} className="w-24 h-24 rounded-full mx-auto sm:mx-0 mb-3 sm:mb-0 border-2 border-neutral-700" />
                <div className="flex-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-4">
                        <h3 className="text-xl font-bold text-white">{matchedUser.name}</h3>
                         <span className={`text-sm font-semibold px-3 py-1 rounded-full ${matchedUser.role === Role.Developer ? 'bg-blue-900/50 text-blue-300' : matchedUser.role === Role.Founder ? 'bg-purple-900/50 text-purple-300' : 'bg-green-900/50 text-green-300'}`}>{matchedUser.role}</span>
                    </div>
                     <p className="text-neutral-400 mt-1">{matchedUser.location}</p>
                    <div className="mt-3 flex items-center justify-center sm:justify-start gap-2">
                        <div className="w-full bg-neutral-800 rounded-full h-2.5">
                            <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${match.compatibilityScore}%` }}></div>
                        </div>
                        <span className={`font-bold text-lg ${scoreColor}`}>{match.compatibilityScore}%</span>
                    </div>
                </div>
            </div>
            <div className="hidden sm:block">
                <p className="text-neutral-300 mt-4 text-sm italic border-l-2 border-purple-500 pl-4">"{match.justification}"</p>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={(e) => { e.stopPropagation(); onFeedback(matchedUser); }} aria-label="Give Feedback" className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors custom1366:hidden"><StarIcon className="w-5 h-5"/></button>
                    {isConnected ? (
                        <button disabled className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg cursor-not-allowed">
                            <CheckCheckIcon className="w-5 h-5"/> Connected
                        </button>
                    ) : isPending ? (
                        <button disabled className="flex items-center gap-2 bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg cursor-not-allowed">
                            <CheckCheckIcon className="w-5 h-5"/> Pending
                        </button>
                    ) : (
                        <button onClick={(e) => { e.stopPropagation(); onConnect(matchedUser); }} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                            <UserPlusIcon className="w-5 h-5"/> Connect
                        </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); onMessage(matchedUser); }} className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        <MessageSquareIcon className="w-5 h-5"/> Message
                    </button>
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
            onRequestsUpdated(); // Refresh the requests list
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
        <div className="p-4 sm:p-6 md:p-8 bg-neutral-950 min-h-screen text-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-3xl font-bold text-white">Your Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onFindMatches}
                            disabled={isLoading}
                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-purple-800 disabled:cursor-not-allowed"
                        >
                            <ZapIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                            {isLoading ? 'Finding...' : hasActiveSearch ? 'Refresh Matches' : 'Find Matches'}
                        </button>
                    </div>
                </div>

                <div className="mb-8">
                    <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search matches by keyword, skill, or location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-3 pl-12 pr-4 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Removed negotiations tab, now in sidebar */}
                <div className="mb-8 border-b border-neutral-800 flex space-x-4">
                    <button onClick={() => setActiveTab('matches')} className={`py-2 px-4 text-sm font-medium transition-colors ${activeTab === 'matches' ? 'text-white border-b-2 border-purple-500' : 'text-neutral-400 hover:text-white'}`}> 
                        Matches
                    </button>
                </div>

                {activeTab === 'matches' && (
                    <>
                        {viewingProfile ? (
                            <ProfileCard
                                user={viewingProfile}
                                onClose={() => setViewingProfile(null)}
                                onConnect={handleConnect}
                                onMessage={onMessage}
                                isOwnProfile={false}
                                onViewConnections={handleViewConnections}
                                isConnected={user.connections.includes(viewingProfile.id)}
                                isPending={user.pendingConnections?.includes(viewingProfile.id)}
                            />
                        ) : (
                            <div>
                                {isLoading && !hasActiveSearch ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 justify-center custom1366:grid-cols-2 custom1366:gap-3">
                                        {[...Array(6)].map((_, i) => <SkeletonLoader key={i} />)}
                                    </div>
                                ) : error ? (
                                    <div className="text-center py-12 text-red-400 bg-red-900/20 rounded-lg">
                                        <p className="text-xl font-semibold">Error loading matches</p>
                                        <p>{error}</p>
                                    </div>
                                ) : hasActiveSearch ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 justify-center">
                                        {matches.map((match) => (
                                            <MatchCard
                                                key={match.user.id}
                                                match={match}
                                                onMessage={onMessage}
                                                onConnect={handleConnect}
                                                onFeedback={(user) => {
                                                    setFeedbackUser(user);
                                                    setFeedbackModalOpen(true);
                                                }}
                                                onViewProfile={(user) => setViewingProfile(user)}
                                                isConnected={user.connections.includes(match.user.id)}
                                                isPending={user.pendingConnections?.includes(match.user.id)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 bg-neutral-900 border-2 border-dashed border-neutral-800 rounded-lg">
                                        <h2 className="text-2xl font-bold text-white">Welcome, {user.name}!</h2>
                                        <p className="text-neutral-400 mt-2">Click "Find Matches" to discover your ideal co-founder or team member.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Negotiations section moved to sidebar view */}
            </div>

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
        </div>
    );
};

export default Dashboard;