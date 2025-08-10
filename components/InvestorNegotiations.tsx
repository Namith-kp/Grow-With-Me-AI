import React, { useState, useEffect } from 'react';
import { User, Negotiation, Role } from '../types';
import { firestoreService } from '../services/firestoreService';
import NegotiationDeck from './NegotiationDeck';

interface InvestorNegotiationsProps {
    user: User;
}

const InvestorNegotiations: React.FC<InvestorNegotiationsProps> = ({ user }) => {
    const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeNegotiation, setActiveNegotiation] = useState<Negotiation | null>(null);

    useEffect(() => {
        if (user.role !== Role.Investor && user.role !== 'investor') {
            setIsLoading(false);
            return;
        }
        const unsubscribe = firestoreService.getNegotiationsForInvestor(user.id, (data) => {
            setNegotiations(data);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user.id, user.role]);

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

    const activeNegotiations = negotiations
        .filter(n => ['active', 'accepted', 'declined'].includes(n.status))
        .sort((a, b) => {
            const order = { active: 0, accepted: 1, declined: 2 };
            return (order[a.status] ?? 3) - (order[b.status] ?? 3);
        });

    return (
        <div className="space-y-8 mt-9">
            <div>
                <h2 className="text-2xl font-bold text-white mb-4">Active & Past Deals</h2>
                {activeNegotiations.length > 0 ? (
                    <div className="space-y-4">
                        {activeNegotiations.map(neg => (
                            <div key={neg.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <p className="font-semibold text-white">
                                        Deal for <span className="font-bold text-blue-400">{neg.ideaTitle}</span> with <span className="font-bold text-purple-400">{neg.founderName}</span>
                                    </p>
                                    <span className={`mt-2 inline-block text-xs font-semibold px-2 py-1 rounded-full ${
                                        neg.status === 'active' ? 'bg-yellow-900/50 text-yellow-300' :
                                        neg.status === 'accepted' ? 'bg-green-900/50 text-green-300' :
                                        'bg-red-900/50 text-red-300'
                                    }`}>
                                        {neg.status.charAt(0).toUpperCase() + neg.status.slice(1)}
                                    </span>
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

export default InvestorNegotiations;
