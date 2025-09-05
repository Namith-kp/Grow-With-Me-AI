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
        <div className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-sm border border-slate-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex items-center justify-between transition-all duration-300 hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10">
            <div className="flex items-center gap-3 sm:gap-4">
                <img src={request.fromUserAvatar} alt={request.fromUserName} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-slate-700/50" />
                <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">{request.fromUserName}</h3>
                    <p className="text-xs sm:text-sm text-slate-400">{request.fromUserRole}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
                <button 
                    onClick={() => onUpdateRequest(request.id, 'approved')}
                    className="p-2 sm:p-3 rounded-full bg-green-600/20 hover:bg-green-600/40 text-green-400 transition-all duration-300 border border-green-600/30 hover:border-green-500/50"
                    aria-label={`Approve ${request.fromUserName}`}
                >
                    <CheckIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button 
                    onClick={() => onUpdateRequest(request.id, 'rejected')}
                    className="p-2 sm:p-3 rounded-full bg-red-600/20 hover:bg-red-600/40 text-red-400 transition-all duration-300 border border-red-600/30 hover:border-red-500/50"
                    aria-label={`Reject ${request.fromUserName}`}
                >
                    <XIcon className="w-5 h-5 sm:w-6 sm:h-6" />
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
        <div className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-sm border border-slate-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex items-center justify-between transition-all duration-300 hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10">
            <div className="flex items-center gap-3 sm:gap-4">
                 {/* Placeholder for recipient info */}
                <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">Request to {request.fromUserName}...</h3>
                    <p className={`text-xs sm:text-sm font-semibold ${
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
                    className="flex items-center gap-2 bg-gradient-to-r from-slate-800/50 to-slate-700/50 hover:from-slate-700/50 hover:to-slate-600/50 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl transition-all duration-300 border border-slate-700/30 hover:border-slate-600/50 text-xs sm:text-sm"
                    aria-label={`Withdraw request to ${request.fromUserName}`}
                >
                    <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5" />
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
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-sm border border-slate-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4">Connection Requests</h1>
                
                <div className="border-b border-slate-700/30 flex space-x-4">
                    <button onClick={() => setActiveTab('incoming')} className={`py-2 px-4 text-sm font-medium transition-all duration-300 relative ${activeTab === 'incoming' ? 'text-white border-b-2 border-slate-300' : 'text-slate-400 hover:text-white'}`}>
                        Incoming
                        {pendingIncoming.length > 0 && (
                            <span className="absolute top-1 right-0 -mt-1 -mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                {pendingIncoming.length}
                            </span>
                        )}
                    </button>
                    <button onClick={() => setActiveTab('sent')} className={`py-2 px-4 text-sm font-medium transition-all duration-300 ${activeTab === 'sent' ? 'text-white border-b-2 border-slate-300' : 'text-slate-400 hover:text-white'}`}>
                        Sent
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 pb-20 sm:pb-6">
                {activeTab === 'incoming' && (
                    <>
                        {pendingIncoming.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                {pendingIncoming.map(req => (
                                    <IncomingRequestCard key={req.id} request={req} onUpdateRequest={handleUpdateRequest} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 sm:py-16 px-4 sm:px-6 bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-sm border border-slate-800/50 rounded-xl sm:rounded-2xl">
                                <h3 className="text-lg sm:text-xl font-semibold mt-4 text-white">No Pending Incoming Requests</h3>
                                <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-md mx-auto">
                                    You have no new connection requests right now.
                                </p>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'sent' && (
                     <>
                        {sentRequests.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                {sentRequests.map(req => (
                                    <SentRequestCard key={req.id} request={req} onWithdrawRequest={handleWithdrawRequest} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 sm:py-16 px-4 sm:px-6 bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-sm border border-slate-800/50 rounded-xl sm:rounded-2xl">
                                <h3 className="text-lg sm:text-xl font-semibold mt-4 text-white">No Sent Requests</h3>
                                <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-md mx-auto">
                                    You haven't sent any connection requests yet.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default RequestsBoard;
