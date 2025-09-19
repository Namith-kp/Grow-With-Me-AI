import React, { useState, useEffect } from 'react';
import { User, Negotiation, Role } from '../types';
import { firestoreService } from '../services/firestoreService';
import NegotiationDeck from './NegotiationDeck';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import { LightbulbIcon, UsersIcon, CheckIcon, XIcon, SearchIcon, ArrowLeftIcon } from './icons';

interface NegotiationsBoardProps {
    user: User;
    setIsMobileNegotiationOpen?: (isOpen: boolean) => void;
    selectedNegotiationId?: string | null;
    onNegotiationSelected?: () => void;
}

const NegotiationsBoard: React.FC<NegotiationsBoardProps> = ({ user, setIsMobileNegotiationOpen, selectedNegotiationId, onNegotiationSelected }) => {
    const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeNegotiation, setActiveNegotiation] = useState<Negotiation | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'active' | 'accepted' | 'declined'>('active');
    const [isMobileNegotiationOpenLocal, setIsMobileNegotiationOpenLocal] = useState(false);

    useEffect(() => {
        if (user.role !== Role.Founder && user.role !== Role.Investor && user.role !== 'founder' && user.role !== 'investor') {
            setIsLoading(false);
            return;
        }

        const unsubscribe = user.role === Role.Founder || user.role === 'founder' 
            ? firestoreService.getNegotiationsForFounder(user.id, (data) => {
                setNegotiations(data);
                setIsLoading(false);
            })
            : firestoreService.getNegotiationsForInvestor(user.id, (data) => {
                setNegotiations(data);
                setIsLoading(false);
            });

        return () => unsubscribe();
    }, [user.id, user.role]);

    // Auto-select negotiation when selectedNegotiationId is provided
    useEffect(() => {
        if (selectedNegotiationId && negotiations.length > 0) {
            const negotiation = negotiations.find(n => n.id === selectedNegotiationId);
            if (negotiation) {
                setActiveNegotiation(negotiation);
                setIsMobileNegotiationOpenLocal(true);
                if (setIsMobileNegotiationOpen) {
                    setIsMobileNegotiationOpen(true);
                }
                if (onNegotiationSelected) {
                    onNegotiationSelected();
                }
            }
        }
    }, [selectedNegotiationId, negotiations, setIsMobileNegotiationOpen, onNegotiationSelected]);



    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (error) {
        return <p className="text-center text-red-400">{error}</p>;
    }

    // Filter negotiations based on search term
    const filteredNegotiations = negotiations.filter(neg => {
        const searchLower = searchTerm.toLowerCase();
        const ideaTitle = neg.ideaTitle?.toLowerCase() || '';
        const investorName = neg.investorName?.toLowerCase() || '';
        const founderName = neg.founderName?.toLowerCase() || '';
        
        return ideaTitle.includes(searchLower) || 
               investorName.includes(searchLower) || 
               founderName.includes(searchLower);
    });

    // Helper: get latest activity time (last offer or negotiation timestamp)
    const getLastActivityTime = (n: Negotiation): number => {
        const baseTime = n.timestamp instanceof Date
            ? n.timestamp.getTime()
            : (n.timestamp ? new Date(n.timestamp as any).getTime() : 0);
        const lastOffer = n.offers && n.offers.length > 0 ? n.offers[n.offers.length - 1] : null;
        const offerTime = lastOffer
            ? (lastOffer.timestamp instanceof Date
                ? lastOffer.timestamp.getTime()
                : (lastOffer.timestamp ? new Date(lastOffer.timestamp as any).getTime() : 0))
            : 0;
        return Math.max(baseTime || 0, offerTime || 0);
    };

    // Separate negotiations by status and sort by latest activity desc
    const activeNegotiations = filteredNegotiations
        .filter(n => n.status === 'active')
        .sort((a, b) => getLastActivityTime(b) - getLastActivityTime(a));
    const acceptedNegotiations = filteredNegotiations
        .filter(n => n.status === 'accepted')
        .sort((a, b) => getLastActivityTime(b) - getLastActivityTime(a));
    const declinedNegotiations = filteredNegotiations
        .filter(n => n.status === 'declined')
        .sort((a, b) => getLastActivityTime(b) - getLastActivityTime(a));

    const isFounder = user.role === Role.Founder || user.role === 'founder';

    const handleNegotiationSelect = (negotiation: Negotiation) => {
        setActiveNegotiation(negotiation);
        setIsMobileNegotiationOpenLocal(true);
        if (setIsMobileNegotiationOpen) {
            setIsMobileNegotiationOpen(true);
        }
    };

    const handleBackToNegotiationList = () => {
        setActiveNegotiation(null);
        setIsMobileNegotiationOpenLocal(false);
        if (setIsMobileNegotiationOpen) {
            setIsMobileNegotiationOpen(false);
        }
    };

    return (
        <div className={cn(
            "w-full h-full max-h-full bg-gradient-to-br from-slate-950 to-black overflow-hidden flex",
            isMobileNegotiationOpenLocal ? "pt-0 pb-0" : "pt-16 pb-16 lg:pt-0 lg:pb-0"
        )}>
            {/* Left: Negotiations list */}
            <div className={cn(
                "flex-shrink-0 bg-gradient-to-b from-slate-900/90 to-black/90 backdrop-blur-sm flex flex-col h-full transition-all duration-300 ease-in-out",
                isMobileNegotiationOpenLocal ? "hidden lg:flex lg:w-80 xl:w-96" : "w-full lg:w-80 xl:w-96 lg:border-r lg:border-slate-800/30"
            )}>
                {/* Header */}
                <div className="flex-shrink-0 p-3 sm:p-4 lg:p-6 border-b border-slate-800/30">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Negotiations</h1>
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                        <input
                            type="text"
                            placeholder="Search deals..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700/30 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all backdrop-blur-sm"
                        />
                    </div>
                </div>

                {/* Tabbed interface */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                    {/* Tab Navigation - Matching app design */}
                    <div className="px-3 sm:px-4 lg:px-6 pt-4">
                        <div className="flex space-x-2 bg-gradient-to-r from-slate-900/90 to-black/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-1.5 shadow-2xl shadow-black/50">
                            <button
                                onClick={() => setActiveTab('active')}
                                className={cn(
                                    "flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden min-w-0",
                                    activeTab === 'active'
                                        ? "bg-gradient-to-r from-slate-600 to-slate-500 text-white shadow-lg shadow-slate-500/25 border border-slate-500/30"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800/50 hover:border-slate-600/30 border border-transparent"
                                )}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <span className="relative z-10 truncate">Active</span>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0",
                                        activeTab === 'active'
                                            ? "bg-white/20 text-white"
                                            : "bg-slate-700/50 text-slate-300"
                                    )}>
                                        {activeNegotiations.length}
                                    </span>
                                </div>
                                {activeTab === 'active' && (
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-slate-600/20 to-slate-500/20"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('accepted')}
                                className={cn(
                                    "flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden min-w-0",
                                    activeTab === 'accepted'
                                        ? "bg-gradient-to-r from-slate-600 to-slate-500 text-white shadow-lg shadow-slate-500/25 border border-slate-500/30"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800/50 hover:border-slate-600/30 border border-transparent"
                                )}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <span className="relative z-10 truncate">Accepted</span>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0",
                                        activeTab === 'accepted'
                                            ? "bg-white/20 text-white"
                                            : "bg-slate-700/50 text-slate-300"
                                    )}>
                                        {acceptedNegotiations.length}
                                    </span>
                                </div>
                                {activeTab === 'accepted' && (
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-slate-600/20 to-slate-500/20"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('declined')}
                                className={cn(
                                    "flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden min-w-0",
                                    activeTab === 'declined'
                                        ? "bg-gradient-to-r from-slate-600 to-slate-500 text-white shadow-lg shadow-slate-500/25 border border-slate-500/30"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800/50 hover:border-slate-600/30 border border-transparent"
                                )}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <span className="relative z-10 truncate">Declined</span>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0",
                                        activeTab === 'declined'
                                            ? "bg-white/20 text-white"
                                            : "bg-slate-700/50 text-slate-300"
                                    )}>
                                        {declinedNegotiations.length}
                                    </span>
                                </div>
                                {activeTab === 'declined' && (
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
                        {activeTab === 'active' && (
                            /* Active Tab */
                            <div className="flex-1 min-h-0 flex flex-col">
                                {activeNegotiations.length > 0 ? (
                                    <div className="space-y-2 flex-1 min-h-0 overflow-y-auto">
                                        {activeNegotiations.map(neg => (
                                            <motion.div
                                                key={neg.id}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleNegotiationSelect(neg)}
                                                className={cn(
                                                    "p-2.5 sm:p-3 lg:p-4 flex items-center cursor-pointer rounded-xl transition-all duration-200",
                                                    "hover:bg-slate-800/50 hover:shadow-lg hover:shadow-slate-500/10",
                                                    activeNegotiation?.id === neg.id 
                                                        ? "bg-purple-900/30 border border-purple-700/30 shadow-lg shadow-purple-500/20" 
                                                        : "bg-slate-800/20 border border-slate-700/20"
                                                )}
                                            >
                                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full mr-3 sm:mr-4 bg-gradient-to-br from-slate-700/50 to-slate-800/50 border-2 border-slate-700/50 shadow-lg flex items-center justify-center">
                                                    <LightbulbIcon className="w-6 h-6 sm:w-7 sm:h-7 text-slate-400" />
                                                </div>
                                                <div className="flex-grow overflow-hidden min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="font-bold text-white truncate text-base sm:text-lg">
                                                            {neg.ideaTitle}
                                                        </h3>
                                                        <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 bg-yellow-900/50 text-yellow-300">
                                                            Active
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-400 truncate pr-2">
                                                        {isFounder 
                                                            ? `with ${neg.investorName}${neg.investorUsername ? ` (@${neg.investorUsername})` : ''}`
                                                            : `with ${neg.founderName}${neg.founderUsername ? ` (@${neg.founderUsername})` : ''}`
                                                        }
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center px-6">
                                        <div className="text-center max-w-sm mx-auto">
                                            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-full flex items-center justify-center border border-slate-700/30 shadow-lg">
                                                <LightbulbIcon className="w-10 h-10 text-slate-500" />
                                            </div>
                                            <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white">No Active Deals</h3>
                                            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                                                {isFounder 
                                                    ? "You don't have any active negotiations with investors."
                                                    : "You don't have any active deals with founders."
                                                }
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'accepted' && (
                            /* Accepted Tab */
                            <div className="flex-1 min-h-0 flex flex-col">
                                {acceptedNegotiations.length > 0 ? (
                                    <div className="space-y-2 flex-1 min-h-0 overflow-y-auto">
                                        {acceptedNegotiations.map(neg => (
                                            <motion.div
                                                key={neg.id}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleNegotiationSelect(neg)}
                                                className={cn(
                                                    "p-2.5 sm:p-3 lg:p-4 flex items-center cursor-pointer rounded-xl transition-all duration-200",
                                                    "hover:bg-slate-800/50 hover:shadow-lg hover:shadow-slate-500/10",
                                                    activeNegotiation?.id === neg.id 
                                                        ? "bg-purple-900/30 border border-purple-700/30 shadow-lg shadow-purple-500/20" 
                                                        : "bg-slate-800/20 border border-slate-700/20"
                                                )}
                                            >
                                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full mr-3 sm:mr-4 bg-gradient-to-br from-slate-700/50 to-slate-800/50 border-2 border-slate-700/50 shadow-lg flex items-center justify-center">
                                                    <LightbulbIcon className="w-6 h-6 sm:w-7 sm:h-7 text-slate-400" />
                                                </div>
                                                <div className="flex-grow overflow-hidden min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="font-bold text-white truncate text-base sm:text-lg">
                                                            {neg.ideaTitle}
                                                        </h3>
                                                        <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 bg-green-900/50 text-green-300">
                                                            Accepted
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-400 truncate pr-2">
                                                        {isFounder 
                                                            ? `with ${neg.investorName}${neg.investorUsername ? ` (@${neg.investorUsername})` : ''}`
                                                            : `with ${neg.founderName}${neg.founderUsername ? ` (@${neg.founderUsername})` : ''}`
                                                        }
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center px-6">
                                        <div className="text-center max-w-sm mx-auto">
                                            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-full flex items-center justify-center border border-slate-700/30 shadow-lg">
                                                <LightbulbIcon className="w-10 h-10 text-slate-500" />
                                            </div>
                                            <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white">No Accepted Deals</h3>
                                            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                                                {isFounder 
                                                    ? "You don't have any accepted negotiations with investors."
                                                    : "You don't have any accepted deals with founders."
                                                }
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'declined' && (
                            /* Declined Tab */
                            <div className="flex-1 min-h-0 flex flex-col">
                                {declinedNegotiations.length > 0 ? (
                                    <div className="space-y-2 flex-1 min-h-0 overflow-y-auto">
                                        {declinedNegotiations.map(neg => (
                                            <motion.div
                                                key={neg.id}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleNegotiationSelect(neg)}
                                                className={cn(
                                                    "p-2.5 sm:p-3 lg:p-4 flex items-center cursor-pointer rounded-xl transition-all duration-200",
                                                    "hover:bg-slate-800/50 hover:shadow-lg hover:shadow-slate-500/10",
                                                    activeNegotiation?.id === neg.id 
                                                        ? "bg-purple-900/30 border border-purple-700/30 shadow-lg shadow-purple-500/20" 
                                                        : "bg-slate-800/20 border border-slate-700/20"
                                                )}
                                            >
                                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full mr-3 sm:mr-4 bg-gradient-to-br from-slate-700/50 to-slate-800/50 border-2 border-slate-700/50 shadow-lg flex items-center justify-center">
                                                    <LightbulbIcon className="w-6 h-6 sm:w-7 sm:h-7 text-slate-400" />
                                                </div>
                                                <div className="flex-grow overflow-hidden min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="font-bold text-white truncate text-base sm:text-lg">
                                                            {neg.ideaTitle}
                                                        </h3>
                                                        <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 bg-red-900/50 text-red-300">
                                                            Declined
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-400 truncate pr-2">
                                                        {isFounder 
                                                            ? `with ${neg.investorName}${neg.investorUsername ? ` (@${neg.investorUsername})` : ''}`
                                                            : `with ${neg.founderName}${neg.founderUsername ? ` (@${neg.founderUsername})` : ''}`
                                                        }
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center px-6">
                                        <div className="text-center max-w-sm mx-auto">
                                            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-full flex items-center justify-center border border-slate-700/30 shadow-lg">
                                                <LightbulbIcon className="w-10 h-10 text-slate-500" />
                                            </div>
                                            <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white">No Declined Deals</h3>
                                            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                                                {isFounder 
                                                    ? "You don't have any declined negotiations with investors."
                                                    : "You don't have any declined deals with founders."
                                                }
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Negotiation detail panel */}
            <div className={cn(
                "min-w-0 h-full max-h-full overflow-hidden bg-gradient-to-br from-slate-950 to-black flex justify-center transition-all duration-300 ease-in-out",
                isMobileNegotiationOpenLocal ? "flex-1 w-full" : "flex-1"
            )}>
                <div className="w-full max-w-4xl h-full max-h-full overflow-hidden">
                    {activeNegotiation ? (
                        <NegotiationDeck
                            negotiation={activeNegotiation}
                            currentUser={user}
                            onClose={handleBackToNegotiationList}
                            onOfferMade={async (offer) => {
                                await firestoreService.addOfferToNegotiation(activeNegotiation.id, offer);
                                setActiveNegotiation(prev => prev ? { ...prev, offers: [...prev.offers, offer], status: 'active' } : null);
                            }}
                            onStatusChange={async (status) => {
                                await firestoreService.updateNegotiationStatus(activeNegotiation.id, status);
                                setActiveNegotiation(prev => prev ? { ...prev, status } : null);
                            }}
                            onBackToNegotiationList={handleBackToNegotiationList}
                            isMobile={isMobileNegotiationOpenLocal}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full px-6">
                            <div className="text-center max-w-sm mx-auto">
                                <div className="w-20 h-20 mx-auto mb-6 bg-slate-800/50 rounded-full flex items-center justify-center">
                                    <LightbulbIcon className="w-10 h-10 text-slate-600" />
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Select a deal to view details</h2>
                                <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                                    Choose from your active, accepted, or declined deals to see the full negotiation details
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NegotiationsBoard;
