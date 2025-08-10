import React, { useState } from 'react';
import { ConnectionRequest } from '../types';
import { firestoreService } from '../services/firestoreService';
import { CheckIcon, XIcon, ClockIcon } from './icons';

interface RequestsBoardProps {
    incomingRequests: ConnectionRequest[];
    sentRequests: ConnectionRequest[];
    onRequestsUpdated: () => void;
}

const IncomingRequestCard: React.FC<{ request: ConnectionRequest; onUpdateRequest: (id: string, status: 'approved' | 'rejected') => void; }> = ({ request, onUpdateRequest }) => {
    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <img src={request.fromUserAvatar} alt={request.fromUserName} className="w-16 h-16 rounded-full border-2 border-neutral-700" />
                <div>
                    <h3 className="text-lg font-bold text-white">{request.fromUserName}</h3>
                    <p className="text-sm text-neutral-400">{request.fromUserRole}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => onUpdateRequest(request.id, 'approved')}
                    className="p-3 rounded-full bg-green-600/20 hover:bg-green-600/40 text-green-400 transition-colors"
                    aria-label={`Approve ${request.fromUserName}`}
                >
                    <CheckIcon className="w-6 h-6" />
                </button>
                <button 
                    onClick={() => onUpdateRequest(request.id, 'rejected')}
                    className="p-3 rounded-full bg-red-600/20 hover:bg-red-600/40 text-red-400 transition-colors"
                    aria-label={`Reject ${request.fromUserName}`}
                >
                    <XIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

const SentRequestCard: React.FC<{ request: ConnectionRequest; onWithdrawRequest: (id: string) => void; }> = ({ request, onWithdrawRequest }) => {
    // We need to get the user this request was sent TO. The request object has `toUserId`.
    // For now, we can't display the recipient's details without another fetch.
    // This is a limitation to address. For now, we'll just show the status.
    // A better implementation would involve fetching the 'toUser' details.
    
    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                 {/* Placeholder for recipient info */}
                <div>
                    <h3 className="text-lg font-bold text-white">Request to {request.fromUserName}...</h3>
                    <p className={`text-sm font-semibold ${
                        request.status === 'pending' ? 'text-yellow-400' :
                        request.status === 'approved' ? 'text-green-400' :
                        'text-red-400'
                    }`}>
                        Status: {request.status}
                    </p>
                </div>
            </div>
            {request.status === 'pending' && (
                <button 
                    onClick={() => onWithdrawRequest(request.id)}
                    className="flex items-center gap-2 bg-neutral-700 hover:bg-neutral-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    aria-label={`Withdraw request to ${request.fromUserName}`}
                >
                    <ClockIcon className="w-5 h-5" />
                    Withdraw
                </button>
            )}
        </div>
    );
};


const RequestsBoard: React.FC<RequestsBoardProps> = ({ incomingRequests, sentRequests }) => {
    const [activeTab, setActiveTab] = useState<'incoming' | 'sent'>('incoming');
    
    const handleUpdateRequest = async (requestId: string, status: 'approved' | 'rejected') => {
        try {
            await firestoreService.updateConnectionRequest(requestId, status);
            // No need to call onRequestsUpdated, real-time listener will handle it
        } catch (error) {
            console.error(`Failed to ${status} request:`, error);
            alert(`Could not ${status} the request. Please try again.`);
        }
    };

    const handleWithdrawRequest = async (requestId: string) => {
        if (window.confirm('Are you sure you want to withdraw this connection request?')) {
            try {
                await firestoreService.withdrawConnectionRequest(requestId);
                // No need to call onRequestsUpdated, real-time listener will handle it
            } catch (error) {
                console.error('Failed to withdraw request:', error);
                alert('Could not withdraw the request. Please try again.');
            }
        }
    };

    const pendingIncoming = incomingRequests.filter(r => r.status === 'pending');

    return (
        <div className="space-y-8 mt-9">
            <h1 className="text-3xl font-bold text-white">Connection Requests</h1>
            
            <div className="border-b border-neutral-800 flex space-x-4">
                <button onClick={() => setActiveTab('incoming')} className={`py-2 px-4 text-sm font-medium transition-colors relative ${activeTab === 'incoming' ? 'text-white border-b-2 border-purple-500' : 'text-neutral-400 hover:text-white'}`}>
                    Incoming
                    {pendingIncoming.length > 0 && (
                        <span className="absolute top-1 right-0 -mt-1 -mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                            {pendingIncoming.length}
                        </span>
                    )}
                </button>
                <button onClick={() => setActiveTab('sent')} className={`py-2 px-4 text-sm font-medium transition-colors ${activeTab === 'sent' ? 'text-white border-b-2 border-purple-500' : 'text-neutral-400 hover:text-white'}`}>
                    Sent
                </button>
            </div>

            {activeTab === 'incoming' && (
                <>
                    {pendingIncoming.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {pendingIncoming.map(req => (
                                <IncomingRequestCard key={req.id} request={req} onUpdateRequest={handleUpdateRequest} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 px-6 bg-neutral-900 border-2 border-dashed border-neutral-700 rounded-2xl">
                            <h3 className="text-xl font-semibold mt-4 text-white">No Pending Incoming Requests</h3>
                            <p className="text-neutral-400 mt-2 max-w-md mx-auto">
                                You have no new connection requests right now.
                            </p>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'sent' && (
                 <>
                    {sentRequests.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {sentRequests.map(req => (
                                <SentRequestCard key={req.id} request={req} onWithdrawRequest={handleWithdrawRequest} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 px-6 bg-neutral-900 border-2 border-dashed border-neutral-700 rounded-2xl">
                            <h3 className="text-xl font-semibold mt-4 text-white">No Sent Requests</h3>
                            <p className="text-neutral-400 mt-2 max-w-md mx-auto">
                                You haven't sent any connection requests yet.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default RequestsBoard;
