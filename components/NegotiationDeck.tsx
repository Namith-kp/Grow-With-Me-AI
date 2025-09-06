import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { User, Offer, Negotiation } from '../types';
import { CheckCircleIcon, XCircleIcon, CurrencyDollarIcon, BriefcaseIcon, ArrowLeftIcon } from './icons';

interface NegotiationDeckProps {
    negotiation: Negotiation;
    currentUser: User;
    onClose: () => void;
    onOfferMade: (offer: Offer) => void;
    onStatusChange: (status: 'accepted' | 'declined') => void;
    onBackToNegotiationList?: () => void;
    isMobile?: boolean;
}

const NegotiationDeck: React.FC<NegotiationDeckProps> = ({
    negotiation,
    currentUser,
    onClose,
    onOfferMade,
    onStatusChange,
    onBackToNegotiationList,
    isMobile = false,
}) => {
    if (!negotiation) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                <div className="bg-neutral-900 text-white p-6 rounded-2xl shadow-2xl max-w-2xl w-full">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
                    <p className="text-center mt-4">Loading Negotiation...</p>
                </div>
            </div>
        );
    }

    const { startupName, investorName, initialInvestment, initialEquity } = {
        startupName: negotiation.ideaTitle,
        investorName: negotiation.investorName,
        initialInvestment: negotiation.ideaInvestmentDetails?.targetInvestment || negotiation.offers[0]?.investment || 0,
        initialEquity: negotiation.ideaInvestmentDetails?.equityOffered || negotiation.offers[0]?.equity || 0,
    };

    const [offers, setOffers] = useState<Offer[]>(negotiation.offers || []);
    const [counterInvestment, setCounterInvestment] = useState('');
    const [counterEquity, setCounterEquity] = useState('');
    const [status, setStatus] = useState<'ongoing' | 'accepted' | 'declined'>(
        negotiation.status === 'active' || negotiation.status === 'pending' ? 'ongoing' : negotiation.status
    );
    const [founderName, setFounderName] = useState(negotiation.founderName || 'Founder');
    const unsubscribeRef = useRef<() => void>();

    useEffect(() => {
        // Fetch founder name from idea if not available in negotiation
        if (!negotiation.founderName && negotiation.ideaId) {
            const ideaRef = db.collection('ideas').doc(negotiation.ideaId);
            ideaRef.get().then(doc => {
                if (doc.exists) {
                    const ideaData = doc.data();
                    if (ideaData?.founderName) {
                        setFounderName(ideaData.founderName);
                    }
                }
            }).catch(error => {
                console.error('Error fetching founder name from idea:', error);
            });
        }
    }, [negotiation.founderName, negotiation.ideaId]);

    useEffect(() => {
        // Subscribe to real-time updates for this negotiation
        const negotiationRef = db.collection('negotiations').doc(negotiation.id);
        unsubscribeRef.current = negotiationRef.onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                setOffers(data.offers ? data.offers.map((offer: any) => ({
                    ...offer,
                    timestamp: offer.timestamp?.toDate ? offer.timestamp.toDate() : offer.timestamp,
                })) : []);
                // Update status in real time
                if (data.status === 'accepted' || data.status === 'closed') {
                    setStatus('accepted');
                } else if (data.status === 'rejected' || data.status === 'declined') {
                    setStatus('declined');
                } else if (data.status === 'pending' || data.status === 'active') {
                    setStatus('ongoing');
                }
            }
        });
        return () => {
            if (unsubscribeRef.current) unsubscribeRef.current();
        };
    }, [negotiation.id]);

    useEffect(() => {
        // If there are no offers, automatically create the founder's initial offer from their idea investment details
        if (offers.length === 0 && negotiation.ideaInvestmentDetails) {
            const founderInitialOffer: Offer = {
                investment: negotiation.ideaInvestmentDetails.targetInvestment,
                equity: negotiation.ideaInvestmentDetails.equityOffered,
                by: 'founder',
                timestamp: negotiation.timestamp, // Use negotiation creation time
            };
            onOfferMade(founderInitialOffer);
            setOffers([founderInitialOffer]);
        }
    }, [offers.length, negotiation.ideaInvestmentDetails, negotiation.timestamp, onOfferMade]);

    const currentOffer = offers[offers.length - 1];
    const currentUserRole = currentUser.id === negotiation.founderId ? 'founder' : 'investor';
    const isMyTurn = !currentOffer || currentOffer.by !== currentUserRole;

    const handleMakeOffer = () => {
        const newInvestment = Number(counterInvestment);
        const newEquity = Number(counterEquity);

        if (newInvestment > 0 && newEquity > 0 && newEquity < 100) {
            const newOffer: Offer = {
                investment: newInvestment,
                equity: newEquity,
                by: currentUserRole,
                timestamp: new Date(),
            };
            onOfferMade(newOffer);
            setOffers([...offers, newOffer]);
            setCounterInvestment('');
            setCounterEquity('');
        }
    };

    const handleAccept = () => {
        setStatus('accepted');
        onStatusChange('accepted');
    };

    const handleDecline = () => {
        setStatus('declined');
        onStatusChange('declined');
    };

    const OfferCard: React.FC<{ offer: Offer, isLast: boolean, isFirst: boolean }> = ({ offer, isLast, isFirst }) => {
        const isFounderInitialOffer = offer.by === 'founder' && isFirst && negotiation.ideaInvestmentDetails;
        
        return (
            <div className={`p-4 rounded-xl ${
                isLast ? 'bg-purple-900/30 border border-purple-700/30 shadow-lg shadow-purple-500/20' : 
                isFounderInitialOffer ? 'bg-blue-900/30 border border-blue-700/30 shadow-lg shadow-blue-500/20' :
                'bg-slate-800/20 border border-slate-700/20'
            }`}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-white">
                            {offer.by === 'founder' 
                                ? `${founderName}${negotiation.founderUsername ? ` (@${negotiation.founderUsername})` : ''}'s Offer` 
                                : `${investorName}${negotiation.investorUsername ? ` (@${negotiation.investorUsername})` : ''}'s Offer`
                            }
                        </span>
                        {isFounderInitialOffer && (
                            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                                Initial Demand
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-neutral-400">{new Date(offer.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="mt-2 flex gap-6 text-white">
                    <div className="flex items-center gap-2">
                        <CurrencyDollarIcon className="w-5 h-5 text-green-400" />
                        <span>${offer.investment.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <BriefcaseIcon className="w-5 h-5 text-blue-400" />
                        <span>{offer.equity}% Equity</span>
                    </div>
                </div>
                {isFounderInitialOffer && (
                    <p className="text-xs text-blue-300 mt-2">
                        This is the founder's original investment demand from their idea.
                    </p>
                )}
            </div>
        );
    };

    return (
        <div className="w-full h-full bg-gradient-to-br from-slate-950 to-black flex flex-col">
            <div className="flex-shrink-0 p-4 sm:p-6 border-b border-slate-800/30">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {isMobile && onBackToNegotiationList && (
                            <button 
                                onClick={onBackToNegotiationList}
                                className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                            >
                                <ArrowLeftIcon className="w-5 h-5 text-slate-400" />
                            </button>
                        )}
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-white">Negotiation for {negotiation.ideaTitle}</h1>
                            <p className="text-sm text-slate-400">
                                Between {founderName} {negotiation.founderUsername && `(@${negotiation.founderUsername})`} & {investorName} {negotiation.investorUsername && `(@${negotiation.investorUsername})`} (Investor)
                            </p>
                        </div>
                    </div>
                    {!isMobile && (
                        <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
                    )}
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
                <div className="space-y-4">
                    {offers.length > 0 ? (
                         <div className="space-y-2">
                            {offers.map((offer, index) => (
                                <OfferCard key={index} offer={offer} isLast={index === offers.length - 1} isFirst={index === 0} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-slate-800/20 border border-slate-700/20 rounded-xl">
                            <p className="font-semibold text-white">Loading negotiation offers...</p>
                            <p className="text-sm text-slate-400 mt-1">
                                The founder's initial investment demand will be displayed here.
                            </p>
                        </div>
                    )}

                {status === 'ongoing' && (
                    <div className="mt-6 pt-4 border-t border-slate-700/30">
                        {isMyTurn ? (
                            <div>
                                <h3 className="text-lg font-semibold text-center mb-4 text-white">Your Turn to Counter</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="counterInvestment" className="block text-sm font-medium text-slate-300 mb-1">Investment ($)</label>
                                        <input
                                            id="counterInvestment"
                                            type="number"
                                            value={counterInvestment}
                                            onChange={(e) => setCounterInvestment(e.target.value)}
                                            placeholder="e.g., 550000"
                                            className="w-full bg-slate-800/50 border border-slate-700/30 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all backdrop-blur-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="counterEquity" className="block text-sm font-medium text-slate-300 mb-1">Equity (%)</label>
                                        <input
                                            id="counterEquity"
                                            type="number"
                                            value={counterEquity}
                                            onChange={(e) => setCounterEquity(e.target.value)}
                                            placeholder="e.g., 12"
                                            className="w-full bg-slate-800/50 border border-slate-700/30 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all backdrop-blur-sm"
                                        />
                                    </div>
                                </div>
                                <button onClick={handleMakeOffer} className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-500/25">
                                    Make Offer
                                </button>
                                {offers.length > 0 && (
                                    <div className="mt-4 flex justify-center gap-4">
                                        <button onClick={handleAccept} className="text-sm text-green-400 hover:text-green-300">Accept Current Offer</button>
                                        <button onClick={handleDecline} className="text-sm text-red-400 hover:text-red-300">Decline & End</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center p-4 bg-slate-800/20 border border-slate-700/20 rounded-xl">
                                <p className="font-semibold text-white">Waiting for {currentOffer?.by === 'founder' ? negotiation.investorName : 'the Founder'} to respond...</p>
                                <p className="text-sm text-slate-400 mt-1">You will be notified of their response.</p>
                            </div>
                        )}
                    </div>
                )}

                {status !== 'ongoing' && (
                    <div className={`mt-6 p-6 rounded-xl text-center border ${status === 'accepted' ? 'bg-green-900/30 border-green-700/30' : 'bg-red-900/30 border-red-700/30'}`}>
                        {status === 'accepted' ? (
                            <>
                                <CheckCircleIcon className="w-12 h-12 mx-auto text-green-400 mb-3" />
                                <h3 className="text-xl font-bold text-green-300 mb-2">Deal Accepted!</h3>
                                <p className="text-slate-300">
                                    ${currentOffer?.investment.toLocaleString()} for {currentOffer?.equity}% equity.
                                </p>
                            </>
                        ) : (
                            <>
                                <XCircleIcon className="w-12 h-12 mx-auto text-red-400 mb-3" />
                                <h3 className="text-xl font-bold text-red-300 mb-2">Negotiation {negotiation.status}</h3>
                                <p className="text-slate-300">This negotiation has been terminated.</p>
                            </>
                        )}
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};

export default NegotiationDeck;