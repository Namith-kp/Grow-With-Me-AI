import React, { useState, useEffect } from 'react';
import { User, Idea, Role, Negotiation } from '../types';
import { firestoreService } from '../services/firestoreService';
import NegotiationDeck from './NegotiationDeck';
import { LightbulbIcon, UsersIcon, CheckIcon, XIcon } from './icons';

interface FounderNegotiationsProps {
    user: User;
}

const FounderNegotiations: React.FC<FounderNegotiationsProps> = ({ user }) => {
    const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeNegotiation, setActiveNegotiation] = useState<Negotiation | null>(null);
    const [newInvestorOffers, setNewInvestorOffers] = useState<Negotiation[]>([]);

    useEffect(() => {
        if (user.role !== Role.Founder) {
            setIsLoading(false);
            return;
        }

        const unsubscribe = firestoreService.getNegotiationsForFounder(user.id, (data) => {
            setNegotiations(data);
            setIsLoading(false);

            // Find all negotiations where the last offer is by the investor and status is active
            const offersNeedingAttention = data.filter(n => {
                if (n.status !== 'active') return false;
                if (!n.offers || n.offers.length === 0) return false;
                const lastOffer = n.offers[n.offers.length - 1];
                return lastOffer.by === 'investor';
            });
            setNewInvestorOffers(offersNeedingAttention);
        });

        return () => unsubscribe();
    }, [user.id, user.role]);

    const handleUpdateRequest = async (negotiationId: string, status: 'active' | 'rejected') => {
        try {
            await firestoreService.updateNegotiationStatus(negotiationId, status);
            if (status === 'active') {
                const negotiationToOpen = negotiations.find(n => n.id === negotiationId);
                if (negotiationToOpen) setActiveNegotiation(negotiationToOpen);
            }
        } catch (err) {
            console.error(`Failed to ${status} negotiation:`, err);
            alert(`Failed to ${status} negotiation. Please try again.`);
        }
    };

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

    const pendingNegotiations = negotiations.filter(n => n.status === 'pending');
    const activeNegotiations = negotiations
        .filter(n => ['active', 'accepted', 'declined'].includes(n.status))
        .sort((a, b) => {
            const order = { active: 0, accepted: 1, declined: 2 };
            return (order[a.status] ?? 3) - (order[b.status] ?? 3);
        });

    return (
        <div className="space-y-8 mt-9">
            {newInvestorOffers.length > 0 && newInvestorOffers.map(offer => (
                <div key={offer.id} className="bg-blue-900/80 border border-blue-500 text-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
                    <div>
                        <span className="font-bold">New offer received!</span> {offer.investorName} made a new offer for <span className="font-semibold">{offer.ideaTitle}</span>.<br />
                        <span className="text-xs text-blue-300">Open the deal below to continue the negotiation.</span>
                    </div>
                    <button
                        className="ml-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                        onClick={() => setActiveNegotiation(offer)}
                    >
                        View Offer
                    </button>
                </div>
            ))}
            <div>
                <h2 className="text-2xl font-bold text-white mb-4">Pending Requests</h2>
                {pendingNegotiations.length > 0 ? (
                    <div className="space-y-4">
                        {pendingNegotiations.map(neg => (
                            <div key={neg.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <p className="font-semibold text-white">
                                        <span className="font-bold text-purple-400">{neg.investorName}</span> wants to negotiate a deal for <span className="font-bold text-blue-400">{neg.ideaTitle}</span>.
                                    </p>
                                    <p className="text-xs text-neutral-500 mt-1">Received on {new Date(neg.timestamp).toLocaleDateString()}</p>
                                </div>
                                <div className="flex gap-3 flex-shrink-0">
                                    <button onClick={() => handleUpdateRequest(neg.id, 'active')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><CheckIcon className="w-5 h-5" /> Accept</button>
                                    <button onClick={() => handleUpdateRequest(neg.id, 'rejected')} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><XIcon className="w-5 h-5" /> Decline</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-neutral-400">No new negotiation requests.</p>
                )}
            </div>

            <div>
                <h2 className="text-2xl font-bold text-white mb-4">Active & Past Deals</h2>
                {activeNegotiations.length > 0 ? (
                    <div className="space-y-4">
                        {activeNegotiations.map(neg => (
                             <div key={neg.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <p className="font-semibold text-white">
                                        Deal for <span className="font-bold text-blue-400">{neg.ideaTitle}</span> with <span className="font-bold text-purple-400">{neg.investorName}</span>
                                    </p>
                                    <span className={`mt-2 inline-block text-xs font-semibold px-2 py-1 rounded-full ${
                                        neg.status === 'active' ? 'bg-yellow-900/50 text-yellow-300' :
                                        neg.status === 'accepted' ? 'bg-green-900/50 text-green-300' :
                                        'bg-red-900/50 text-red-300'
                                    }`}>{neg.status.charAt(0).toUpperCase() + neg.status.slice(1)}</span>
                                </div>
                                <button onClick={() => setActiveNegotiation(neg)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                                    View Deal
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                     <p className="text-neutral-400">No active or completed negotiations.</p>
                )}
            </div>

            {activeNegotiation && (
                <NegotiationDeck
                    negotiation={activeNegotiation}
                    currentUser={user}
                    onClose={() => setActiveNegotiation(null)}
                    onOfferMade={async (offer) => {
                        await firestoreService.addOfferToNegotiation(activeNegotiation.id, offer);
                        // Optimistically update the UI or refetch
                        setActiveNegotiation(prev => prev ? { ...prev, offers: [...prev.offers, offer], status: 'active' } : null);
                    }}
                    onStatusChange={async (status) => {
                        await firestoreService.updateNegotiationStatus(activeNegotiation.id, status);
                        setActiveNegotiation(prev => prev ? { ...prev, status } : null);
                    }}
                />
            )}
        </div>
    );
};

export default FounderNegotiations;
