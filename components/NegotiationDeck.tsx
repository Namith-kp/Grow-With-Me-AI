import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { User, Offer, Negotiation } from '../types';
import { CheckCircleIcon, XCircleIcon, CurrencyDollarIcon, BriefcaseIcon } from './icons';

interface NegotiationDeckProps {
    negotiation: Negotiation;
    currentUser: User;
    onClose: () => void;
    onOfferMade: (offer: Offer) => void;
    onStatusChange: (status: 'accepted' | 'declined') => void;
}

const NegotiationDeck: React.FC<NegotiationDeckProps> = ({
    negotiation,
    currentUser,
    onClose,
    onOfferMade,
    onStatusChange,
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

    const { startupName, founderName, investorName, initialInvestment, initialEquity } = {
        startupName: negotiation.ideaTitle,
        founderName: 'Founder', // In a real app, you'd fetch this from the founderId
        investorName: negotiation.investorName,
        initialInvestment: negotiation.offers[0]?.investment || 0,
        initialEquity: negotiation.offers[0]?.equity || 0,
    };

    const [offers, setOffers] = useState<Offer[]>(negotiation.offers || []);
    const [counterInvestment, setCounterInvestment] = useState('');
    const [counterEquity, setCounterEquity] = useState('');
    const [status, setStatus] = useState<'ongoing' | 'accepted' | 'declined'>(
        negotiation.status === 'active' || negotiation.status === 'pending' ? 'ongoing' : negotiation.status
    );
    const unsubscribeRef = useRef<() => void>();

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
        // If there are no offers, and the current user is the founder, initialize with their first offer.
        if (offers.length === 0 && currentUser.id === negotiation.founderId) {
            const founderInitialOffer: Offer = {
                investment: 500000, // Placeholder, should come from idea
                equity: 10, // Placeholder, should come from idea
                by: 'founder',
                timestamp: new Date(),
            };
            onOfferMade(founderInitialOffer);
            setOffers([founderInitialOffer]);
        }
    }, [offers.length, currentUser.id, negotiation.founderId, onOfferMade]);

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

    const OfferCard: React.FC<{ offer: Offer, isLast: boolean }> = ({ offer, isLast }) => (
        <div className={`p-4 rounded-lg ${isLast ? 'bg-purple-900/50 border border-purple-700' : 'bg-neutral-800'}`}>
            <div className="flex justify-between items-center">
                <span className="font-bold text-lg text-white">
                    {offer.by === 'founder' ? `${negotiation.founderName}'s Offer` : `${negotiation.investorName}'s Offer`}
                </span>
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
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 mt-4">
            <div className="bg-neutral-900 text-white p-6 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] flex flex-col">
                <div className="flex justify-between items-center border-b border-neutral-700 pb-4 mb-4">
                    <div>
                        <h1 className="text-2xl font-bold">Negotiation for {negotiation.ideaTitle}</h1>
                        <p className="text-sm text-neutral-400">Between Founder & {negotiation.investorName} (Investor)</p>
                    </div>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white text-3xl">&times;</button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    {offers.length > 0 ? (
                         <div className="space-y-2">
                            {offers.slice().reverse().map((offer, index) => (
                                <OfferCard key={index} offer={offer} isLast={index === 0} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-neutral-800 rounded-lg">
                            <p className="font-semibold">Waiting for the first offer...</p>
                            <p className="text-sm text-neutral-400 mt-1">
                                {currentUserRole === 'founder' ? 'You can make the opening offer below.' : `Waiting for ${negotiation.founderName} to make an offer.`}
                            </p>
                        </div>
                    )}
                </div>

                {status === 'ongoing' && (
                    <div className="mt-4 pt-4 border-t border-neutral-700">
                        {isMyTurn ? (
                            <div>
                                <h3 className="text-lg font-semibold text-center mb-3">Your Turn to Counter</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="counterInvestment" className="block text-sm font-medium text-neutral-300 mb-1">Investment ($)</label>
                                        <input
                                            id="counterInvestment"
                                            type="number"
                                            value={counterInvestment}
                                            onChange={(e) => setCounterInvestment(e.target.value)}
                                            placeholder="e.g., 550000"
                                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="counterEquity" className="block text-sm font-medium text-neutral-300 mb-1">Equity (%)</label>
                                        <input
                                            id="counterEquity"
                                            type="number"
                                            value={counterEquity}
                                            onChange={(e) => setCounterEquity(e.target.value)}
                                            placeholder="e.g., 12"
                                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                </div>
                                <button onClick={handleMakeOffer} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors">
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
                            <div className="text-center p-4 bg-neutral-800 rounded-lg">
                                <p className="font-semibold">Waiting for {currentOffer?.by === 'founder' ? negotiation.investorName : 'the Founder'} to respond...</p>
                                <p className="text-sm text-neutral-400 mt-1">You will be notified of their response.</p>
                            </div>
                        )}
                    </div>
                )}

                {status !== 'ongoing' && (
                    <div className={`mt-4 p-4 rounded-lg text-center ${status === 'accepted' ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
                        {status === 'accepted' ? (
                            <>
                                <CheckCircleIcon className="w-10 h-10 mx-auto text-green-400 mb-2" />
                                <h3 className="text-xl font-bold text-green-300">Deal Accepted!</h3>
                                <p className="text-neutral-300">
                                    ${currentOffer?.investment.toLocaleString()} for {currentOffer?.equity}% equity.
                                </p>
                            </>
                        ) : (
                            <>
                                <XCircleIcon className="w-10 h-10 mx-auto text-red-400 mb-2" />
                                <h3 className="text-xl font-bold text-red-300">Negotiation {negotiation.status}</h3>
                                <p className="text-neutral-300">This negotiation has been terminated.</p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NegotiationDeck;