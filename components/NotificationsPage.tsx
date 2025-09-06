import React, { useState, useEffect } from 'react';
import { Notification, NotificationType, User, View, ConnectionRequest } from '../types';
import { firestoreService } from '../services/firestoreService';
import { UserPlusIcon, MessageSquareIcon, TrendingUpIcon, CheckIcon, ArrowLeftIcon, XIcon, UserIcon } from './icons';

interface NotificationsPageProps {
    currentUser: User;
    onNavigateToView: (view: View, data?: any) => void;
    onNavigateToProfile?: (user: User) => void;
    onBack: () => void;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({
    currentUser,
    onNavigateToView,
    onNavigateToProfile,
    onBack
}) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [processingRequest, setProcessingRequest] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<'all' | 'requests' | 'messages' | 'negotiations' | 'joinRequests'>('all');

    // Reset error state when component mounts or user changes
    useEffect(() => {
        setError(null);
        setLoading(true);
        setActiveSection('all');
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser) return;

        console.log('🔍 Setting up notification listeners for user:', currentUser.id);
        setLoading(true);
        setError(null);

        let unsubscribeNotifications: (() => void) | null = null;
        let unsubscribeUnreadCount: (() => void) | null = null;

        try {
            // Set up real-time listeners for all notifications (including read ones for history)
            unsubscribeNotifications = firestoreService.getAllNotificationsRealtime(
                currentUser.id,
                (updatedNotifications) => {
                    console.log('📨 Received notifications from Firestore:', updatedNotifications);
                    console.log('📊 Notifications count:', updatedNotifications.length);
                    console.log('🔍 First notification sample:', updatedNotifications[0]);
                    
                    try {
                        // Validate and sanitize notification data to prevent crashes
                        const validNotifications = updatedNotifications.filter(notification => {
                            // Ensure required fields exist
                            if (!notification || !notification.id || !notification.timestamp) {
                                console.warn('❌ Invalid notification data:', notification);
                                return false;
                            }
                            
                            // Ensure timestamp is a valid Date object
                            if (!(notification.timestamp instanceof Date)) {
                                try {
                                    notification.timestamp = new Date(notification.timestamp);
                                } catch (e) {
                                    console.warn('❌ Invalid timestamp for notification:', notification.id, notification.timestamp);
                                    return false;
                                }
                            }
                            
                            // Ensure createdAt is a valid Date object
                            if (notification.createdAt && !(notification.createdAt instanceof Date)) {
                                try {
                                    notification.createdAt = new Date(notification.createdAt);
                                } catch (e) {
                                    // Don't filter out, just fix the date
                                    notification.createdAt = new Date();
                                }
                            }
                            
                            // Ensure respondedAt is a valid Date object if it exists
                            if (notification.data?.respondedAt && !(notification.data.respondedAt instanceof Date)) {
                                try {
                                    notification.data.respondedAt = new Date(notification.data.respondedAt);
                                } catch (e) {
                                    // Don't filter out, just fix the date
                                    notification.data.respondedAt = new Date();
                                }
                            }
                            
                            return true;
                        });
                        
                        console.log('✅ Valid notifications after filtering:', validNotifications);
                        console.log('📊 Valid count:', validNotifications.length);
                        
                        setNotifications(validNotifications);
                        setLoading(false);
                        setError(null);
                    } catch (error) {
                        console.error('❌ Error processing notifications:', error);
                        setLoading(false);
                        setError('Failed to load notifications. Please try again.');
                        // Set empty array to prevent crashes
                        setNotifications([]);
                    }
                }
            );

            unsubscribeUnreadCount = firestoreService.getUnreadNotificationCountRealtime(
                currentUser.id,
                (count) => {
                    console.log('🔢 Received unread count:', count);
                    try {
                        setUnreadCount(count || 0);
                    } catch (error) {
                        setUnreadCount(0);
                    }
                }
            );

            // Only set a timeout if no notifications are received within 30 seconds
            const loadingTimeout = setTimeout(() => {
                if (loading && notifications.length === 0) {
                    console.warn('⏰ No notifications received within 30 seconds, but keeping listeners active');
                    // Don't set error, just keep loading state
                    
                    // Check if this might be a new user with no notifications
                    console.log('🔍 This might be a new user with no notifications yet');
                }
            }, 30000); // 30 second timeout, but don't force error

            return () => {
                clearTimeout(loadingTimeout);
                try {
                    if (unsubscribeNotifications) {
                        console.log('🔍 Cleaning up notifications listener');
                        unsubscribeNotifications();
                    }
                    if (unsubscribeUnreadCount) {
                        console.log('🔍 Cleaning up unread count listener');
                        unsubscribeUnreadCount();
                    }
                } catch (error) {
                    console.error('❌ Error during cleanup:', error);
                }
            };
        } catch (error) {
            console.error('❌ Error setting up notification listeners:', error);
            setError('Failed to connect to notifications. Please refresh the page.');
            setLoading(false);
        }
    }, [currentUser]);

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read
        await firestoreService.markNotificationAsRead(notification.id);

        // Navigate based on notification type
        switch (notification.type) {
            case NotificationType.MESSAGE:
                if (notification.data?.senderId) {
                    const sender = await firestoreService.getUserProfile(notification.data.senderId);
                    if (sender) {
                        onNavigateToView(View.MESSAGES, { selectedUser: sender });
                    }
                }
                break;
            case NotificationType.NEGOTIATION_UPDATE:
            case NotificationType.NEW_NEGOTIATION:
                if (notification.data?.negotiationId) {
                    onNavigateToView(View.NEGOTIATIONS, { negotiationId: notification.data.negotiationId });
                }
                break;
        }
    };

    const handleConnectionRequest = async (notification: Notification, action: 'accept' | 'decline') => {
        if (!notification.data?.connectionRequestId) {
            setError('Invalid notification data. Please refresh the page.');
            return;
        }
        
        setProcessingRequest(notification.id);
        try {
            const status = action === 'accept' ? 'approved' : 'rejected';
            
            await firestoreService.updateConnectionRequest(notification.data.connectionRequestId, status);
            
            // Update the notification data to include the response status
            const updatedNotification = {
                ...notification,
                data: {
                    ...notification.data,
                    responseStatus: status,
                    respondedAt: new Date()
                }
            };
            
            // Update the notification in Firestore
            await firestoreService.updateNotificationData(notification.id, {
                responseStatus: status,
                respondedAt: new Date()
            });
            
            // Update the local state to show the response
            setNotifications(prev => prev.map(n => 
                n.id === notification.id ? updatedNotification : n
            ));
            
            // Mark notification as read
            await firestoreService.markNotificationAsRead(notification.id);
        } catch (error) {
            setError(`Failed to ${action} connection request. Please try again.`);
            
            // Retry mechanism - wait a bit and try again
            setTimeout(async () => {
                try {
                    const status = action === 'accept' ? 'approved' : 'rejected';
                    await firestoreService.updateConnectionRequest(notification.data.connectionRequestId, status);
                    
                    // Update the notification data to include the response status
                    const updatedNotification = {
                        ...notification,
                        data: {
                            ...notification.data,
                            responseStatus: status,
                            respondedAt: new Date()
                        }
                    };
                    
                    // Update the notification in Firestore
                    await firestoreService.updateNotificationData(notification.id, {
                        responseStatus: status,
                        respondedAt: new Date()
                    });
                    
                    // Update the local state to show the response
                    setNotifications(prev => prev.map(n => 
                        n.id === notification.id ? updatedNotification : n
                    ));
                    
                    // Mark notification as read
                    await firestoreService.markNotificationAsRead(notification.id);
                    setError(null);
                } catch (retryError) {
                    setError(`Failed to ${action} connection request after retry. Please contact support.`);
                }
            }, 2000); // Wait 2 seconds before retry
        } finally {
            setProcessingRequest(null);
        }
    };

    const handleMarkAllAsRead = async () => {
        await firestoreService.markAllNotificationsAsRead(currentUser.id);
    };

    const handleJoinRequestAction = async (joinRequestId: string, action: 'approved' | 'rejected') => {
        console.log('handleJoinRequestAction called:', { joinRequestId, action });
        // Find the notification first to get its ID
        const notification = notifications.find(n => n.data?.joinRequestId === joinRequestId);
        if (!notification) {
            console.error('Notification not found for joinRequestId:', joinRequestId);
            setError('Notification not found. Please refresh and try again.');
            return;
        }
        
        setProcessingRequest(notification.id);
        try {
            await firestoreService.updateJoinRequest(joinRequestId, action);
            console.log('Join request updated successfully');
            // Mark the notification as read
            await firestoreService.markNotificationAsRead(notification.id);
            console.log('Notification marked as read');
        } catch (error) {
            console.error('Failed to update join request:', error);
            setError('Failed to update join request. Please try again.');
        } finally {
            setProcessingRequest(null);
        }
    };

    const handleViewProfile = async (userId: string) => {
        try {
            const userProfile = await firestoreService.getUserProfile(userId);
            if (userProfile) {
                if (onNavigateToProfile) {
                    onNavigateToProfile(userProfile);
                } else {
                    onNavigateToView(View.PROFILE, { selectedUser: userProfile });
                }
            } else {
                setError('User profile not found.');
            }
        } catch (error) {
            console.error('Failed to load user profile:', error);
            setError('Failed to load user profile. Please try again.');
        }
    };

    const getNotificationIcon = (type: NotificationType) => {
        switch (type) {
            case NotificationType.CONNECTION_REQUEST:
                return <UserPlusIcon className="w-6 h-6 text-blue-500" />;
            case NotificationType.MESSAGE:
                return <MessageSquareIcon className="w-6 h-6 text-green-500" />;
            case NotificationType.NEGOTIATION_UPDATE:
            case NotificationType.NEW_NEGOTIATION:
                return <TrendingUpIcon className="w-6 h-6 text-purple-500" />;
            case NotificationType.JOIN_REQUEST:
            case NotificationType.JOIN_REQUEST_RESPONSE:
                return <UserPlusIcon className="w-6 h-6 text-orange-500" />;
            default:
                return <div className="w-6 h-6 bg-gray-500 rounded-full" />;
        }
    };

    const getFilteredNotifications = () => {
        switch (activeSection) {
            case 'requests':
                return notifications.filter(n => n.type === NotificationType.CONNECTION_REQUEST);
            case 'messages':
                return notifications.filter(n => n.type === NotificationType.MESSAGE);
            case 'negotiations':
                return notifications.filter(n => n.type === NotificationType.NEGOTIATION_UPDATE || n.type === NotificationType.NEW_NEGOTIATION);
            case 'joinRequests':
                return notifications.filter(n => n.type === NotificationType.JOIN_REQUEST || n.type === NotificationType.JOIN_REQUEST_RESPONSE);
            default:
                return notifications;
        }
    };

    const getSectionCount = (section: 'all' | 'requests' | 'messages' | 'negotiations' | 'joinRequests') => {
        switch (section) {
            case 'requests':
                return notifications.filter(n => n.type === NotificationType.CONNECTION_REQUEST).length;
            case 'messages':
                return notifications.filter(n => n.type === NotificationType.MESSAGE).length;
            case 'negotiations':
                return notifications.filter(n => n.type === NotificationType.NEGOTIATION_UPDATE || n.type === NotificationType.NEW_NEGOTIATION).length;
            case 'joinRequests':
                return notifications.filter(n => n.type === NotificationType.JOIN_REQUEST || n.type === NotificationType.JOIN_REQUEST_RESPONSE).length;
            default:
                return notifications.length;
        }
    };

    const formatTimeAgo = (timestamp: Date) => {
        try {
            // Validate the timestamp
            if (!timestamp || !(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
                return 'Invalid time';
            }
            
            const now = new Date();
            const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
            
            if (diffInSeconds < 60) return 'Just now';
            if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
            if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
            if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
            if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
            return `${Math.floor(diffInSeconds / 31536000)}y ago`;
        } catch (error) {
            return 'Invalid time';
        }
    };

    const formatDetailedTimestamp = (timestamp: Date) => {
        try {
            // Validate the timestamp
            if (!timestamp || !(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
                return 'Invalid time';
            }
            
            const now = new Date();
            const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
            
            if (diffInSeconds < 86400) {
                // For today, show time
                return timestamp.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                });
            } else if (diffInSeconds < 604800) {
                // For this week, show day and time
                return timestamp.toLocaleDateString('en-US', { 
                    weekday: 'short',
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                });
            } else {
                // For older, show date
                return timestamp.toLocaleDateString('en-US', { 
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
            }
        } catch (error) {
            return 'Invalid time';
        }
    };

    const renderNotificationContent = (notification: Notification) => {
        try {
            if (notification.type === NotificationType.CONNECTION_REQUEST) {
                return (
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                                <h3 className={`text-base font-semibold ${
                                    notification.isRead ? 'text-white/80' : 'text-white'
                                }`}>
                                    {notification.title || 'Connection Request'}
                                </h3>
                                <span className="text-xs text-white/50 ml-3 flex-shrink-0">
                                    {notification.timestamp && (notification.isRead 
                                        ? formatDetailedTimestamp(notification.timestamp)
                                        : formatTimeAgo(notification.timestamp)
                                    )}
                                </span>
                            </div>
                            <p className={`text-sm mb-2 ${
                                notification.isRead ? 'text-white/60' : 'text-white/80'
                            }`}>
                                {notification.message || 'You have a new connection request'}
                            </p>
                            
                            {/* Connection Request Actions */}
                            {notification.data?.responseStatus ? (
                                // Show response status if already responded to
                                <div className="space-y-1">
                                    <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                        notification.data.responseStatus === 'approved' 
                                            ? 'bg-green-600/20 text-green-400 border border-green-500/30' 
                                            : 'bg-red-600/20 text-red-400 border border-red-500/30'
                                    }`}>
                                        {notification.data.responseStatus === 'approved' ? (
                                            <>
                                                <CheckIcon className="w-3 h-3 mr-1" />
                                                <span>Accepted</span>
                                            </>
                                        ) : (
                                            <>
                                                <XIcon className="w-3 h-3 mr-1" />
                                                <span>Declined</span>
                                            </>
                                        )}
                                    </div>
                                    {notification.data.respondedAt && (
                                        <p className="text-xs text-white/40">
                                            {(() => {
                                                try {
                                                    const respondedAt = notification.data.respondedAt instanceof Date 
                                                        ? notification.data.respondedAt 
                                                        : new Date(notification.data.respondedAt);
                                                    
                                                    if (isNaN(respondedAt.getTime())) {
                                                        return 'Responded recently';
                                                    }
                                                    
                                                    return `Responded ${formatTimeAgo(respondedAt)}`;
                                                } catch (error) {
                                                    return 'Responded recently';
                                                }
                                            })()}
                                        </p>
                                    )}
                                </div>
                            ) : notification.data?.connectionRequestId ? (
                                // Show action buttons if not yet responded to
                                <div className="space-y-2">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleConnectionRequest(notification, 'accept');
                                            }}
                                            disabled={processingRequest === notification.id}
                                            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-green-700 text-white rounded-md transition-colors flex items-center space-x-1.5 disabled:opacity-50 text-sm"
                                        >
                                            <CheckIcon className="w-3 h-3" />
                                            <span>Accept</span>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleConnectionRequest(notification, 'decline');
                                            }}
                                            disabled={processingRequest === notification.id}
                                            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-red-700 text-white rounded-md transition-colors flex items-center space-x-1.5 disabled:opacity-50 text-sm"
                                        >
                                            <XIcon className="w-3 h-3" />
                                            <span>Decline</span>
                                        </button>
                                    </div>
                                    {notification.data?.senderId && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewProfile(notification.data.senderId);
                                            }}
                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors flex items-center space-x-1.5 text-sm"
                                        >
                                            <UserIcon className="w-3 h-3" />
                                            <span>View Profile</span>
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <p className="text-xs text-yellow-400">
                                        ⚠️ This notification is missing connection request data. It may be from an older version.
                                    </p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Mark as read and remove from list
                                            firestoreService.markNotificationAsRead(notification.id);
                                            setNotifications(prev => prev.filter(n => n.id !== notification.id));
                                        }}
                                        className="px-2 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-xs"
                                    >
                                        Remove Invalid Notification
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            }

            // Join Request Notifications
            if (notification.type === NotificationType.JOIN_REQUEST || notification.type === NotificationType.JOIN_REQUEST_RESPONSE) {
                console.log('Rendering join request notification:', {
                    type: notification.type,
                    data: notification.data,
                    joinRequestId: notification.data?.joinRequestId,
                    currentUserId: currentUser.id,
                    notificationUserId: notification.userId
                });
                return (
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                                <h3 className={`text-base font-semibold ${
                                    notification.isRead ? 'text-white/80' : 'text-white'
                                }`}>
                                    {notification.title || 'Join Request'}
                                </h3>
                                <span className="text-xs text-white/50 ml-3 flex-shrink-0">
                                    {notification.timestamp && (notification.isRead 
                                        ? formatDetailedTimestamp(notification.timestamp)
                                        : formatTimeAgo(notification.timestamp)
                                    )}
                                </span>
                            </div>
                            <p className={`text-sm mb-2 ${
                                notification.isRead ? 'text-white/60' : 'text-white/80'
                            }`}>
                                {notification.message || 'You have a new join request'}
                            </p>
                            
                            {/* Join Request Actions */}
                            {notification.type === NotificationType.JOIN_REQUEST_RESPONSE ? (
                                // Show response status for both developers and founders
                                <div className="space-y-1">
                                    <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                        notification.data?.responseStatus === 'approved' 
                                            ? 'bg-green-600/20 text-green-400 border border-green-500/30' 
                                            : 'bg-red-600/20 text-red-400 border border-red-500/30'
                                    }`}>
                                        {notification.data?.responseStatus === 'approved' ? (
                                            <>
                                                <CheckIcon className="w-3 h-3 mr-1" />
                                                <span>Approved</span>
                                            </>
                                        ) : (
                                            <>
                                                <XIcon className="w-3 h-3 mr-1" />
                                                <span>Declined</span>
                                            </>
                                        )}
                                    </div>
                                    {notification.data?.respondedAt && (
                                        <p className="text-xs text-white/50">
                                            Responded on {formatDetailedTimestamp(notification.data.respondedAt)}
                                        </p>
                                    )}
                                    <p className="text-xs text-white/60">
                                        Idea: {notification.data?.ideaTitle || 'Unknown Idea'}
                                    </p>
                                    <p className="text-xs text-white/60">
                                        {notification.data?.developerName ? `Developer: ${notification.data.developerName}` : ''}
                                    </p>
                                    {notification.data?.founderId && currentUser.id === notification.data.developerId && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewProfile(notification.data.founderId);
                                            }}
                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors flex items-center space-x-1.5 text-sm mt-2"
                                        >
                                            <UserIcon className="w-3 h-3" />
                                            <span>View Founder Profile</span>
                                        </button>
                                    )}
                                    {notification.data?.developerId && currentUser.id === notification.data.founderId && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewProfile(notification.data.developerId);
                                            }}
                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors flex items-center space-x-1.5 text-sm mt-2"
                                        >
                                            <UserIcon className="w-3 h-3" />
                                            <span>View Profile</span>
                                        </button>
                                    )}
                                </div>
                            ) : (
                                // Show action buttons for founders (only for pending JOIN_REQUEST notifications)
                                notification.data?.responseStatus ? (
                                    // Show response status for already responded notifications
                                    <div className="space-y-2">
                                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            notification.data?.responseStatus === 'approved' 
                                                ? 'bg-green-600/20 text-green-400 border border-green-500/30' 
                                                : 'bg-red-600/20 text-red-400 border border-red-500/30'
                                        }`}>
                                            {notification.data?.responseStatus === 'approved' ? (
                                                <>
                                                    <CheckIcon className="w-3 h-3 mr-1" />
                                                    <span>Approved</span>
                                                </>
                                            ) : (
                                                <>
                                                    <XIcon className="w-3 h-3 mr-1" />
                                                    <span>Declined</span>
                                                </>
                                            )}
                                        </div>
                                        {notification.data?.respondedAt && (
                                            <p className="text-xs text-white/50">
                                                Responded on {formatDetailedTimestamp(notification.data.respondedAt)}
                                            </p>
                                        )}
                                        <p className="text-xs text-white/60">
                                            Idea: {notification.data?.ideaTitle || 'Unknown Idea'}
                                        </p>
                                        <p className="text-xs text-white/60">
                                            {notification.data?.developerName ? `Developer: ${notification.data.developerName}` : ''}
                                        </p>
                                        {notification.data?.developerId && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewProfile(notification.data.developerId);
                                                }}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors flex items-center space-x-1.5 text-sm mt-2"
                                            >
                                                <UserIcon className="w-3 h-3" />
                                                <span>View Profile</span>
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    // Show action buttons for pending notifications
                                    <div className="space-y-2">
                                        <div className="space-y-1">
                                            <p className="text-xs text-white/60">
                                                Idea: {notification.data?.ideaTitle || 'Unknown Idea'}
                                            </p>
                                            <p className="text-xs text-white/60">
                                                From: {notification.data?.developerName || 'Unknown Developer'}
                                            </p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    console.log('Approve button clicked', { 
                                                        joinRequestId: notification.data?.joinRequestId,
                                                        notificationId: notification.id,
                                                        notificationData: notification.data
                                                    });
                                                    if (notification.data?.joinRequestId) {
                                                        handleJoinRequestAction(notification.data.joinRequestId, 'approved');
                                                    } else {
                                                        console.error('No joinRequestId found in notification data');
                                                    }
                                                }}
                                                disabled={processingRequest === notification.id}
                                                className="px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-green-700 text-white rounded-md transition-colors flex items-center space-x-1.5 disabled:opacity-50 text-sm"
                                            >
                                                <CheckIcon className="w-3 h-3" />
                                                <span>Approve</span>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    console.log('Decline button clicked', { 
                                                        joinRequestId: notification.data?.joinRequestId,
                                                        notificationId: notification.id,
                                                        notificationData: notification.data
                                                    });
                                                    if (notification.data?.joinRequestId) {
                                                        handleJoinRequestAction(notification.data.joinRequestId, 'rejected');
                                                    } else {
                                                        console.error('No joinRequestId found in notification data');
                                                    }
                                                }}
                                                disabled={processingRequest === notification.id}
                                                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-red-700 text-white rounded-md transition-colors flex items-center space-x-1.5 disabled:opacity-50 text-sm"
                                            >
                                                <XIcon className="w-3 h-3" />
                                                <span>Decline</span>
                                            </button>
                                        </div>
                                        {notification.data?.developerId && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewProfile(notification.data.developerId);
                                                }}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors flex items-center space-x-1.5 text-sm"
                                            >
                                                <UserIcon className="w-3 h-3" />
                                                <span>View Profile</span>
                                            </button>
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                );
            }

            // Default notification rendering
            return (
                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                            <h3 className={`text-base font-semibold ${
                                notification.isRead ? 'text-white/80' : 'text-white'
                            }`}>
                                {notification.title || 'Notification'}
                            </h3>
                            <span className="text-xs text-white/50 ml-3 flex-shrink-0">
                                {notification.timestamp && (notification.isRead 
                                    ? formatDetailedTimestamp(notification.timestamp)
                                    : formatTimeAgo(notification.timestamp)
                                )}
                            </span>
                        </div>
                        <p className={`text-sm ${
                            notification.isRead ? 'text-white/60' : 'text-white/80'
                        }`}>
                            {notification.message || 'You have a new notification'}
                        </p>
                    </div>
                </div>
            );
        } catch (error) {
            return (
                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                        <div className="w-5 h-5 bg-gray-500 rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                            <h3 className="text-base font-semibold text-red-400">
                                Error Displaying Notification
                            </h3>
                            <span className="text-xs text-white/50 ml-3 flex-shrink-0">
                                Error
                            </span>
                        </div>
                        <p className="text-sm text-red-300">
                            This notification could not be displayed properly. Please refresh the page.
                        </p>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setNotifications(prev => prev.filter(n => n.id !== notification.id));
                            }}
                            className="mt-1 px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs"
                        >
                            Remove Error Notification
                        </button>
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="w-full h-full bg-gradient-to-br from-slate-950 via-black to-slate-950 overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-sm border-b border-slate-800/50 sticky top-16 lg:top-1 z-20">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                            <button
                                onClick={onBack}
                                className="p-2 sm:p-2.5 rounded-lg hover:bg-slate-800/50 transition-colors"
                            >
                                <ArrowLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </button>
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Notifications</h1>
                                {unreadCount > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="px-3 sm:px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center space-x-1.5 sm:space-x-2"
                            >
                                <CheckIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline text-sm">Mark All as Read</span>
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Section Tabs */}
                <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-5">
                    <div className="flex gap-2 sm:gap-3 justify-center sm:justify-start overflow-x-auto scrollbar-hide pb-2">
                        {[
                            { key: 'all', label: 'All' },
                            { key: 'requests', label: 'Requests' },
                            { key: 'messages', label: 'Messages' },
                            { key: 'negotiations', label: 'Negotiations' },
                            { key: 'joinRequests', label: 'Join Requests' }
                        ].map((section) => (
                            <button
                                key={section.key}
                                onClick={() => setActiveSection(section.key as any)}
                                className={`flex items-center justify-center space-x-1 sm:space-x-1.5 lg:space-x-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border flex-shrink-0 ${
                                    activeSection === section.key
                                        ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
                                        : 'bg-slate-800/80 text-white/90 border-slate-600/50 hover:bg-slate-700/80 hover:text-white hover:border-slate-500/50'
                                }`}
                            >
                                <span className="text-xs sm:text-sm">{section.label}</span>
                                <span className={`text-xs px-1 sm:px-1.5 lg:px-2 py-0.5 rounded-full ${
                                    activeSection === section.key
                                        ? 'bg-white/20 text-white'
                                        : 'bg-white/10 text-white/70'
                                }`}>
                                    {getSectionCount(section.key as any)}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
                {loading ? (
                    <div className="flex items-center justify-center h-64 sm:h-80">
                        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-white"></div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 sm:h-80 text-center px-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                            <MessageSquareIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white/50" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Error: {error}</h3>
                        <p className="text-white/60 text-sm sm:text-base max-w-md">
                            {error === 'Failed to connect to notifications. Please refresh the page.' ? (
                                'Could not establish connection to notifications. Please check your internet connection or try refreshing the page.'
                            ) : (
                                'Failed to load notifications. Please try again.'
                            )}
                        </p>
                        <button
                            onClick={() => {
                                setError(null);
                                setLoading(true);
                            }}
                            className="mt-4 sm:mt-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                        >
                            Retry
                        </button>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 sm:h-80 text-center px-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                            <MessageSquareIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white/50" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">No notifications yet</h3>
                        <p className="text-white/60 text-sm sm:text-base max-w-md">
                            {loading ? 
                                'Loading your notifications...' : 
                                'We\'ll notify you when you receive connection requests, messages, or negotiation updates. You can also try sending a connection request to someone to test the system.'
                            }
                        </p>
                        {!loading && (
                            <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-white/40">
                                💡 Tip: Try connecting with another user to see notifications in action
                            </div>
                        )}
                        {!loading && (
                            <button
                                onClick={async () => {
                                    console.log('🧪 Testing Firestore connection...');
                                    try {
                                        // Try to create a test notification to verify write access
                                        const testNotification = await firestoreService.createNotification({
                                            userId: currentUser.id,
                                            type: NotificationType.CONNECTION_REQUEST,
                                            title: 'Test Notification',
                                            message: 'This is a test notification to verify the system is working',
                                            data: {
                                                senderId: 'test-sender',
                                                senderName: 'Test User',
                                                connectionRequestId: 'test-' + Date.now()
                                            },
                                            isRead: false,
                                            timestamp: new Date()
                                        });
                                        console.log('✅ Test notification created successfully:', testNotification);
                                        
                                        // Delete it immediately to keep the list clean
                                        setTimeout(async () => {
                                            try {
                                                await firestoreService.markNotificationAsRead(testNotification);
                                                console.log('🧹 Test notification cleaned up');
                                            } catch (cleanupError) {
                                                console.warn('⚠️ Could not clean up test notification:', cleanupError);
                                            }
                                        }, 2000);
                                        
                                    } catch (error) {
                                        console.error('❌ Failed to create test notification:', error);
                                        setError('Firestore test failed: ' + error.message);
                                    }
                                }}
                                className="mt-4 sm:mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm"
                            >
                                🧪 Test Notifications System
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
                        {/* Section Header */}
                        <div className="px-2 mb-4 sm:mb-6">
                                <h2 className="text-base sm:text-lg font-semibold text-white">
                                {activeSection === 'all' && ''}
                                {activeSection === 'requests' && ''}
                                {activeSection === 'messages' && ''}
                                {activeSection === 'negotiations' && ''}
                                {activeSection === 'joinRequests' && ''}
                            </h2>
                            <p className="text-xs sm:text-sm text-white/60 mt-1">
                                {(() => {
                                    const filteredCount = getFilteredNotifications().length;
                                    if (filteredCount === 0) {
                                        return 'No notifications in this section';
                                    }
                                    return `${filteredCount} notification${filteredCount === 1 ? '' : 's'}`;
                                })()}
                            </p>
                        </div>

                        {/* Current/Recent Notifications */}
                        {getFilteredNotifications().filter(n => !n.isRead).length > 0 && (
                            <div className="mb-4 sm:mb-6">
                                <h3 className="text-sm sm:text-base font-semibold text-white/90 mb-3 sm:mb-4 px-2">Recent</h3>
                                <div className="space-y-3 sm:space-y-4">
                                    {getFilteredNotifications()
                                        .filter(n => !n.isRead)
                                        .map((notification) => {
                                            try {
                                                return (
                                                    <div
                                                        key={notification.id}
                                                        onClick={() => {
                                                            // Only handle clicks for non-connection request notifications
                                                            if (notification.type !== NotificationType.CONNECTION_REQUEST) {
                                                                handleNotificationClick(notification);
                                                            }
                                                        }}
                                                        className={`p-3 sm:p-4 rounded-lg transition-all duration-200 ${
                                                            notification.type === NotificationType.CONNECTION_REQUEST 
                                                                ? '' // No cursor pointer for connection requests
                                                                : 'cursor-pointer'
                                                        } ${
                                                            notification.isRead 
                                                                ? 'bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/30' 
                                                                : 'bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30'
                                                        }`}
                                                    >
                                                        {renderNotificationContent(notification)}
                                                    </div>
                                                );
                                            } catch (error) {
                                                return null; // Skip this notification if it causes an error
                                            }
                                        })}
                                </div>
                            </div>
                        )}

                        {/* Historical Notifications */}
                        {getFilteredNotifications().filter(n => n.isRead).length > 0 && (
                            <div>
                                <h3 className="text-sm sm:text-base font-semibold text-white/80 mb-3 sm:mb-4 px-2">History</h3>
                                <div className="space-y-3 sm:space-y-4">
                                    {getFilteredNotifications()
                                        .filter(n => n.isRead)
                                        .map((notification) => {
                                            try {
                                                return (
                                                    <div
                                                        key={notification.id}
                                                        onClick={() => {
                                                            // Only handle clicks for non-connection request notifications
                                                            if (notification.type !== NotificationType.CONNECTION_REQUEST) {
                                                                handleNotificationClick(notification);
                                                            }
                                                        }}
                                                        className={`p-3 sm:p-4 rounded-lg transition-all duration-200 ${
                                                            notification.type === NotificationType.CONNECTION_REQUEST 
                                                                ? '' // No cursor pointer for connection requests
                                                                : 'cursor-pointer'
                                                        } ${
                                                            notification.isRead 
                                                                ? 'bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/30' 
                                                                : 'bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30'
                                                        }`}
                                                    >
                                                        {renderNotificationContent(notification)}
                                                    </div>
                                                );
                                            } catch (error) {
                                                return null; // Skip this notification if it causes an error
                                            }
                                        })}
                                </div>
                            </div>
                        )}

                        {/* Empty Section Message */}
                        {getFilteredNotifications().length === 0 && !loading && (
                            <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-center px-4">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                                    {activeSection === 'requests' && <UserPlusIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />}
                                    {activeSection === 'messages' && <MessageSquareIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />}
                                    {activeSection === 'negotiations' && <TrendingUpIcon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />}
                                    {activeSection === 'joinRequests' && <UserPlusIcon className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />}
                                    {activeSection === 'all' && <MessageSquareIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white/50" />}
                                </div>
                                <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                                    {activeSection === 'requests' && 'No Connection Requests'}
                                    {activeSection === 'messages' && 'No Messages'}
                                    {activeSection === 'negotiations' && 'No Negotiations'}
                                    {activeSection === 'joinRequests' && 'No Join Requests'}
                                    {activeSection === 'all' && 'No Notifications'}
                                </h3>
                                <p className="text-white/60 text-xs sm:text-sm max-w-md">
                                    {activeSection === 'requests' && 'You haven\'t received any connection requests yet.'}
                                    {activeSection === 'messages' && 'You haven\'t received any messages yet.'}
                                    {activeSection === 'negotiations' && 'You haven\'t received any negotiation updates yet.'}
                                    {activeSection === 'joinRequests' && 'You haven\'t received any join requests yet.'}
                                    {activeSection === 'all' && 'You haven\'t received any notifications yet.'}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
