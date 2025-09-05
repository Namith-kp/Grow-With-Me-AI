import React, { useState, useEffect } from 'react';
import { User, Role, View, Idea } from '../types';
import AvatarAdjustModal from './AvatarAdjustModal';
import BannerAdjustModal from './BannerAdjustModal';
import { UserIcon, EditIcon, SaveIcon, XIcon, MapPinIcon, CalendarIcon, BriefcaseIcon, StarIcon, HeartIcon, TargetIcon, DollarSignIcon, TrendingUpIcon, MailIcon, PhoneIcon, GlobeIcon, LinkedinIcon, GithubIcon, TwitterIcon, CameraIcon } from './icons';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { getSafeAvatarUrl, getUserInitials } from '../utils/avatar';
import { firestoreService } from '../services/firestoreService';

interface ProfileProps {
    userProfile: User | null;
    onUpdateProfile: (updatedProfile: Partial<User>) => Promise<void>;
    onBack: () => void;
    loading?: boolean;
    error?: string | null;
    isReadOnly?: boolean;
    currentUser?: User | null;
    onNavigateToIdea?: (ideaId: string) => void;
    onConnect?: (user: User) => Promise<void>;
    onMessage?: (user: User) => void;
}

const Profile: React.FC<ProfileProps> = ({ 
    userProfile, 
    onUpdateProfile, 
    onBack, 
    loading = false, 
    error = null,
    isReadOnly = false,
    currentUser = null,
    onNavigateToIdea,
    onConnect,
    onMessage
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [ideasLoading, setIdeasLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionNotification, setConnectionNotification] = useState<{ type: 'info' | 'success' | 'error'; message: string } | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarRemoved, setAvatarRemoved] = useState(false);
    const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [bannerRemoved, setBannerRemoved] = useState(false);
    const [bannerAdjustOpen, setBannerAdjustOpen] = useState(false);
    const [pendingBanner, setPendingBanner] = useState<string | null>(null);
    const [isBannerExpanded, setIsBannerExpanded] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        role: Role.Founder,
        location: '',
        dateOfBirth: '',
        gender: '',
        phone: '',
        interests: '',
        skills: '',
        experience: '',
        lookingFor: '',
        // Investor specific fields
        interestedDomains: '',
        investmentExperience: '',
        minBudget: '',
        maxBudget: '',
        minEquity: '',
        maxEquity: '',
    });

    // Determine read-only mode: either explicitly or when viewing another user's profile
    const isViewingOther = !!(currentUser && userProfile && userProfile.id !== currentUser.id);
    const readOnly = isReadOnly || isViewingOther;

    useEffect(() => {
        if (userProfile) {
            setFormData({
                name: userProfile.name || '',
                role: userProfile.role || Role.Founder,
                location: userProfile.location || '',
                dateOfBirth: userProfile.dateOfBirth || '',
                gender: userProfile.gender || '',
                phone: (userProfile as any).phone || '',
                interests: (userProfile.interests || []).join(', '),
                skills: (userProfile.skills || []).join(', '),
                experience: (userProfile as any).experience || '',
                lookingFor: userProfile.lookingFor || '',
                interestedDomains: (userProfile.investorProfile?.interestedDomains || []).join(', '),
                investmentExperience: userProfile.investorProfile?.investmentExperience || '',
                minBudget: userProfile.investorProfile?.budget?.min?.toString() || '',
                maxBudget: userProfile.investorProfile?.budget?.max?.toString() || '',
                minEquity: userProfile.investorProfile?.expectedEquity?.min?.toString() || '',
                maxEquity: userProfile.investorProfile?.expectedEquity?.max?.toString() || '',
            });
            // Ignore Gmail-linked avatars by default
            const safe = getSafeAvatarUrl(userProfile) || null;
            console.log('Setting avatar preview:', safe, 'from userProfile:', userProfile);
            setAvatarPreview(safe);
            setBannerPreview((userProfile as any).bannerURL || null);
        }
    }, [userProfile]);

    // Load user's ideas
    useEffect(() => {
        const loadIdeas = async () => {
            if (!userProfile || !readOnly || !userProfile.id) return;
            
            setIdeasLoading(true);
            try {
                let userIdeas: Idea[] = [];
                
                if (userProfile.role === Role.Founder) {
                    userIdeas = await firestoreService.getOwnIdeasByFounder(userProfile.id);
                } else if (userProfile.role === Role.Investor) {
                    userIdeas = await firestoreService.getIdeasInvestedByInvestor(userProfile.id);
                } else if (userProfile.role === Role.Developer) {
                    userIdeas = await firestoreService.getIdeasCollaboratedByDeveloper(userProfile.id);
                }
                
                setIdeas(userIdeas || []);
            } catch (error) {
                console.error('Error loading ideas:', error);
                setIdeas([]);
            } finally {
                setIdeasLoading(false);
            }
        };

        loadIdeas();
    }, [userProfile, readOnly]);

    // Real-time connection status
    useEffect(() => {
        if (!readOnly || !userProfile || !currentUser || !userProfile.id || !currentUser.id || userProfile.id === currentUser.id) {
            setConnectionStatus(null);
            return;
        }

        try {
            const unsubscribe = firestoreService.getConnectionStatusRealtime(
                currentUser.id,
                userProfile.id,
                (status) => {
                    if (status && typeof status === 'object') {
                        const statusString = status.isConnected ? 'connected' : status.isPending ? 'requested' : 'none';
                        setConnectionStatus(statusString);
                        if (statusString === 'connected') {
                            setConnectionNotification({ type: 'success', message: 'Connection request accepted!' });
                        }
                    }
                }
            );

            return () => {
                if (unsubscribe && typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            };
        } catch (error) {
            console.error('Error setting up connection status listener:', error);
        }
    }, [readOnly, userProfile, currentUser]);

    // Cleanup blob URLs on unmount
    useEffect(() => {
        return () => {
            if (avatarPreview && avatarPreview.startsWith('blob:')) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

    // Reset avatar load failure when source changes; respect instant removal flag
    const avatarSrc = (!avatarRemoved ? (avatarPreview || getSafeAvatarUrl(userProfile) || null) : null) as string | null;
    useEffect(() => {
        setAvatarLoadFailed(false);
    }, [avatarSrc]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!userProfile) return;

        const updatedProfile: Partial<User> = {
            name: formData.name,
            role: formData.role,
            location: formData.location,
            dateOfBirth: formData.dateOfBirth,
            gender: formData.gender,
            phone: formData.phone as any,
            interests: formData.interests.split(',').map(s => s.trim()).filter(s => s),
            skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
            lookingFor: formData.lookingFor,
            ...(avatarPreview ? { photoURL: avatarPreview as any } : {}),
            ...(avatarRemoved && !avatarPreview ? { photoURL: null as any } : {}),
            ...((bannerPreview || (bannerRemoved && !bannerPreview)) ? { bannerURL: (bannerRemoved && !bannerPreview) ? null as any : bannerPreview as any } : {}),
        };

        if (formData.role === Role.Investor) {
            updatedProfile.investorProfile = {
                interestedDomains: formData.interestedDomains.split(',').map(s => s.trim()).filter(s => s),
                investmentExperience: formData.investmentExperience,
                budget: {
                    min: parseInt(formData.minBudget, 10) || 0,
                    max: parseInt(formData.maxBudget, 10) || 0,
                },
                expectedEquity: {
                    min: parseInt(formData.minEquity, 10) || 0,
                    max: parseInt(formData.maxEquity, 10) || 0,
                },
            };
        } else {
            (updatedProfile as any).experience = formData.experience;
        }

        try {
            // If avatarPreview exists, persist photoURL to Firestore so it reflects everywhere
            if (avatarPreview && userProfile?.id) {
                try {
                    await firestoreService.updateUserProfile(userProfile.id, { photoURL: avatarPreview } as any);
                } catch (e) {
                    console.warn('Failed to persist photoURL, proceeding with rest of profile update', e);
                }
            } else if (avatarRemoved && userProfile?.id) {
                try {
                    await firestoreService.updateUserProfile(userProfile.id, { photoURL: null } as any);
                } catch (e) {
                    console.warn('Failed to clear photoURL, proceeding with rest of profile update', e);
                }
            }
            if (userProfile?.id) {
                try {
                    await firestoreService.updateUserProfile(userProfile.id, { bannerURL: bannerRemoved && !bannerPreview ? null : bannerPreview } as any);
                } catch (e) {
                    console.warn('Failed to persist bannerURL', e);
                }
            }
            await onUpdateProfile(updatedProfile);
            setIsEditing(false);
            setAvatarRemoved(false);
            setBannerRemoved(false);
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const handleCancel = () => {
        if (userProfile) {
            setFormData({
                name: userProfile.name || '',
                role: userProfile.role || Role.Founder,
                location: userProfile.location || '',
                dateOfBirth: userProfile.dateOfBirth || '',
                gender: userProfile.gender || '',
                interests: (userProfile.interests || []).join(', '),
                skills: (userProfile.skills || []).join(', '),
                experience: (userProfile as any).experience || '',
                lookingFor: userProfile.lookingFor || '',
                interestedDomains: (userProfile.investorProfile?.interestedDomains || []).join(', '),
                investmentExperience: userProfile.investorProfile?.investmentExperience || '',
                minBudget: userProfile.investorProfile?.budget?.min?.toString() || '',
                maxBudget: userProfile.investorProfile?.budget?.max?.toString() || '',
                minEquity: userProfile.investorProfile?.expectedEquity?.min?.toString() || '',
                maxEquity: userProfile.investorProfile?.expectedEquity?.max?.toString() || '',
            });
            
            // Clean up blob URL if it exists
            if (avatarPreview && avatarPreview.startsWith('blob:')) {
                URL.revokeObjectURL(avatarPreview);
            }
            
            // Reset avatar preview to the original user avatar
            const safe = getSafeAvatarUrl(userProfile) || null;
            setAvatarPreview(safe);
        }
        setIsEditing(false);
        setAvatarRemoved(false);
        setBannerRemoved(false);
    };

    // Function to resize image to 1:1 ratio using FileReader (base64)
    const resizeImageToSquare = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            console.log('Starting image resize for file:', file.name, 'Size:', file.size, 'Type:', file.type);

            const reader = new FileReader();
            reader.onerror = (e) => {
                console.error('FileReader error:', e);
                reject(new Error('Failed to read file'));
            };
            reader.onload = () => {
                try {
                    const dataUrl = reader.result as string;
                    if (!dataUrl) {
                        reject(new Error('Empty file data'));
                        return;
                    }
                    const img = new Image();
                    img.onload = () => {
                        try {
                            console.log('Image loaded successfully. Dimensions:', img.width, 'x', img.height);
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            if (!ctx) {
                                reject(new Error('Could not get canvas context'));
                                return;
                            }
                            canvas.width = 300;
                            canvas.height = 300;
                            const size = Math.min(img.width, img.height);
                            const x = (img.width - size) / 2;
                            const y = (img.height - size) / 2;
                            console.log('Cropping parameters - Size:', size, 'X:', x, 'Y:', y);
                            ctx.clearRect(0, 0, 300, 300);
                            ctx.drawImage(img, x, y, size, size, 0, 0, 300, 300);
                            const base64 = canvas.toDataURL('image/jpeg', 0.9);
                            console.log('Image converted to base64 successfully. Length:', base64.length);
                            resolve(base64);
                        } catch (err: any) {
                            console.error('Error during image processing:', err);
                            reject(new Error('Error processing image: ' + (err?.message || 'unknown')));
                        }
                    };
                    img.onerror = (err) => {
                        console.error('Failed to load image from data URL:', err);
                        reject(new Error('Failed to load image'));
                    };
                    img.src = dataUrl;
                } catch (err: any) {
                    console.error('Unexpected error preparing image:', err);
                    reject(new Error('Unexpected error preparing image: ' + (err?.message || 'unknown')));
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const [adjustOpen, setAdjustOpen] = useState(false);
    const [pendingImage, setPendingImage] = useState<string | null>(null);

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            console.log('No file selected');
            return;
        }
        console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('Image size should be less than 10MB');
            return;
        }
        // Read file to data URL and open adjust modal
        const reader = new FileReader();
        reader.onload = () => {
            setPendingImage(reader.result as string);
            setAdjustOpen(true);
        };
        reader.onerror = () => alert('Failed to read image file');
        reader.readAsDataURL(file);
    };

    const handleAdjustConfirm = (base64: string) => {
        setAvatarPreview(base64);
        setAdjustOpen(false);
        setPendingImage(null);
    };
    const handleAdjustClose = () => {
        setAdjustOpen(false);
        setPendingImage(null);
    };

    const handleRemoveAvatar = () => {
        setAvatarPreview(null);
        setAvatarRemoved(true);
    };

    // Banner handlers
    const onBannerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { alert('Please select an image'); return; }
        const reader = new FileReader();
        reader.onload = () => { setPendingBanner(reader.result as string); setBannerAdjustOpen(true); };
        reader.readAsDataURL(file);
    };
    const onBannerConfirm = (base64: string) => { setBannerPreview(base64); setBannerRemoved(false); setPendingBanner(null); setBannerAdjustOpen(false); };
    const onBannerReset = () => { setBannerPreview(null); setBannerRemoved(true); };
    
    // Banner expand/collapse handler
    const handleBannerClick = () => {
        // Only allow expansion on mobile screens (sm breakpoint is 640px)
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
        if (isMobile) {
            setIsBannerExpanded(!isBannerExpanded);
        }
    };

    // Reset banner expansion when screen size changes
    useEffect(() => {
        const handleResize = () => {
            if (typeof window !== 'undefined' && window.innerWidth >= 640) {
                setIsBannerExpanded(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleConnect = async () => {
        if (!userProfile || !onConnect || !currentUser) return;
        
        setIsConnecting(true);
        setConnectionNotification({ type: 'info', message: 'Sending connection request...' });
        
        try {
            await onConnect(userProfile);
            setConnectionNotification({ type: 'success', message: 'Connection request sent successfully!' });
        } catch (error) {
            console.error('Error sending connection request:', error);
            setConnectionNotification({ type: 'error', message: 'Failed to send connection request. Please try again.' });
        } finally {
            setIsConnecting(false);
        }
    };

    const handleMessage = () => {
        if (!userProfile || !onMessage) return;
        onMessage(userProfile);
    };

    const closeNotification = () => {
        setConnectionNotification(null);
    };

    if (!userProfile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-black to-slate-950 flex items-center justify-center p-4">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-lg">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-screen bg-gradient-to-br from-slate-950 via-black to-slate-950 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>
            
            {/* Content */}
            <div className="relative z-10 h-full flex flex-col pt-16 sm:pt-20 lg:pt-0"> 
                {/* Header */}
                <div className="flex-shrink-0 bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl border-b border-slate-800/50 shadow-2xl">
                    <div className="w-full px-3 sm:px-4 py-2 sm:py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center justify-between w-full">
                                {/* Avatar Adjust Modal */}
                                <AvatarAdjustModal
                                    isOpen={adjustOpen}
                                    imageDataUrl={pendingImage}
                                    onClose={handleAdjustClose}
                                    onConfirm={handleAdjustConfirm}
                                />
                                <div></div> {/* Spacer */}
                            </div>
                            <BannerAdjustModal
                                isOpen={bannerAdjustOpen}
                                imageDataUrl={pendingBanner}
                                onClose={() => { setBannerAdjustOpen(false); setPendingBanner(null); }}
                                onConfirm={onBannerConfirm}
                            />
                    </div>
                </div>

                {/* Connection Status Notification */}
                <AnimatePresence>
                    {connectionNotification && (
                        <motion.div
                            initial={{ opacity: 0, y: -50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -50 }}
                            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
                        >
                            <div className={cn(
                                "px-6 py-3 rounded-xl shadow-2xl backdrop-blur-xl border flex items-center space-x-3",
                                connectionNotification.type === 'success' && "bg-emerald-900/80 border-emerald-500/50 text-emerald-100",
                                connectionNotification.type === 'error' && "bg-red-900/80 border-red-500/50 text-red-100",
                                connectionNotification.type === 'info' && "bg-blue-900/80 border-blue-500/50 text-blue-100"
                            )}>
                                <span className="text-sm font-medium">{connectionNotification.message}</span>
                                <button
                                    onClick={closeNotification}
                                    className="text-current hover:opacity-70 transition-opacity"
                                >
                                    <XIcon className="w-4 h-4" />
                                </button>
            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Profile Content */}
                <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 lg:p-4 xl:p-6 mt-2 sm:mt-4">
                {/* Back Arrow - Above banner */}
                <motion.button
                    onClick={onBack}
                    className="absolute top-2 left-2 z-10 text-slate-300 hover:text-white transition-colors p-1.5 sm:p-2 rounded-lg hover:bg-black/50 backdrop-blur-sm"
                    whileHover={{ scale: 1.05, x: -2 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </motion.button>

                {/* Edit Button - Above banner */}
                {!readOnly && (
                    <div className="absolute top-2 right-2 z-10">
                        {!isEditing ? (
                            <motion.button
                                onClick={() => setIsEditing(true)}
                                className="p-2 sm:p-3 bg-gradient-to-r from-slate-700/50 to-slate-600/50 hover:from-slate-600/50 hover:to-slate-500/50 text-white rounded-full transition-all duration-300 border border-slate-600/50 hover:border-slate-500/50 shadow-lg hover:shadow-xl backdrop-blur-sm"
                                whileHover={{ scale: 1.1, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <EditIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </motion.button>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <motion.button
                                    onClick={handleCancel}
                                    className="p-2 sm:p-3 bg-gradient-to-r from-slate-700/50 to-slate-600/50 hover:from-slate-600/50 hover:to-slate-500/50 text-white rounded-full transition-all duration-300 border border-slate-600/50 hover:border-slate-500/50 shadow-lg hover:shadow-xl backdrop-blur-sm"
                                    whileHover={{ scale: 1.1, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <XIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                </motion.button>
                                <motion.button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="p-2 sm:p-3 bg-gradient-to-r from-emerald-600/80 to-emerald-500/80 hover:from-emerald-500/80 hover:to-emerald-400/80 text-white rounded-full transition-all duration-300 border border-emerald-600/50 hover:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl backdrop-blur-sm"
                                    whileHover={{ scale: loading ? 1 : 1.1, y: loading ? 0 : -2 }}
                                    whileTap={{ scale: loading ? 1 : 0.95 }}
                                >
                                    <SaveIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                </motion.button>
                            </div>
                        )}
                    </div>
                )}

                {/* Hero Section */}
                <motion.div 
                        className="relative mb-3 sm:mb-4 lg:mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                        {/* Banner image or gradient - Expandable on mobile */}
                        <motion.div 
                            className={`relative rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-800/50 cursor-pointer sm:cursor-default transition-all duration-300 ${
                                isBannerExpanded ? 'h-48' : 'h-24'
                            } sm:h-44 lg:h-52`}
                            onClick={handleBannerClick}
                            whileHover={{ scale: 1.01 }}
                            transition={{ duration: 0.3 }}
                        >
                            {bannerPreview && !bannerRemoved ? (
                                <img src={bannerPreview} alt="banner" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 to-black/50" />
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.1),transparent_50%)]"></div>
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)]"></div>
                                </>
                            )}
                            
                            {/* Floating Elements removed for cleaner read-only look */}
                            <div className="absolute top-1/2 right-8 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
                            
                            

                            {/* Mobile expand/collapse indicator */}
                            <div className="absolute bottom-2 right-2 bg-black/50 rounded-full p-1.5 sm:hidden">
                                <motion.div
                                    animate={{ rotate: isBannerExpanded ? 180 : 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </motion.div>
                            </div>
                        </motion.div>
                        
                        
                        {/* Profile Content - Avatar left, content right layout */}
                        <div className="px-2 sm:px-3 lg:px-6 xl:px-8 mt-2 sm:mt-3">
                            <div className="flex flex-row items-start space-x-4 sm:space-x-6">
                                {/* Avatar */}
                                <motion.div 
                                    className="relative"
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center border-2 border-slate-600/50 shadow-2xl overflow-hidden">
                                        {avatarSrc && !avatarLoadFailed ? (
                                            <img 
                                                src={avatarSrc}
                                                alt="avatar" 
                                            className="w-full h-full object-cover"
                                                onLoad={() => {
                                                    setAvatarLoadFailed(false);
                                                    console.log('Avatar loaded successfully');
                                                }}
                                                onError={() => {
                                                    setAvatarLoadFailed(true);
                                                    console.warn('Avatar failed to load, falling back to initials');
                                                }}
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center w-full h-full">
                                                <span className="text-white/80 text-xl sm:text-2xl lg:text-3xl font-bold">
                                                    {getUserInitials(userProfile.name)}
                                                </span>
                                    </div>
                                    )}
                                </div>
                                    {!readOnly && isEditing && (
                                        <div className="absolute -bottom-2 -right-2 flex items-center gap-1">
                                            <label className="bg-slate-900/80 border border-slate-700/60 text-slate-200 rounded-full p-2 cursor-pointer shadow-xl hover:shadow-2xl transition-all">
                                                <CameraIcon className="w-4 h-4" />
                                                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                                            </label>
                                            <button onClick={handleRemoveAvatar} className="bg-slate-900/80 border border-slate-700/60 text-slate-200 rounded-full p-2 cursor-pointer shadow-xl hover:shadow-2xl transition-all">
                                                <span className="text-xs">Reset</span>
                                            </button>
                                        </div>
                                    )}
                                    <div className="absolute -inset-2 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-full blur-xl -z-10"></div>
                                </motion.div>

                                {/* Banner controls in edit mode */}
                                {!readOnly && isEditing && (
                                    <div className="absolute top-3 right-3 z-10 flex gap-2">
                                        <label className="px-3 py-1 rounded-md bg-slate-900/70 border border-slate-700/60 text-slate-200 cursor-pointer shadow hover:bg-slate-800/80 text-xs">
                                            Change banner
                                            <input type="file" accept="image/*" className="hidden" onChange={onBannerFile} />
                                        </label>
                                        <button onClick={() => onBannerReset()} className="px-3 py-1 rounded-md bg-slate-900/70 border border-slate-700/60 text-slate-200 shadow hover:bg-slate-800/80 text-xs">Reset</button>
                                    </div>
                                )}

                                {/* Profile Info - Left aligned beside avatar */}
                                <div className="flex-1 text-left space-y-2">
                                    <motion.h2 
                                        className="text-xl sm:text-2xl lg:text-3xl font-bold text-white"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        {userProfile.name}
                                    </motion.h2>
                                    
                                    {/* Role and Location - Left aligned */}
                                    <motion.div 
                                        className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-slate-300"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <div className="flex items-center space-x-1.5">
                                            <BriefcaseIcon className="w-4 h-4" />
                                            <span className="text-sm sm:text-base">{userProfile.role}</span>
                                        </div>
                                        <div className="flex items-center space-x-1.5">
                                            <MapPinIcon className="w-4 h-4" />
                                            <span className="text-sm sm:text-base">{userProfile.location}</span>
                                        </div>
                                    </motion.div>

                                    {/* Contact info: only show to connected users */}
                                    {readOnly && currentUser && userProfile.id !== currentUser.id && (
                                        <>
                                            {/* Show only when connected. Fallback to direct connections array in case status listener lags */}
                                            {(connectionStatus === 'connected' || (userProfile.connections || []).includes(currentUser.id)) && (
                                                <motion.div 
                                                    className="flex flex-col items-start gap-1 mt-2 text-slate-300"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.4 }}
                                                >
                                                    {(userProfile as any).email && (
                                                        <div className="flex items-center gap-2">
                                                            <MailIcon className="w-4 h-4" />
                                                            <span className="text-sm sm:text-base break-all">{(userProfile as any).email}</span>
                                                        </div>
                                                    )}
                                                    {(userProfile as any).phone && (
                                                        <div className="flex items-center gap-2">
                                                            <PhoneIcon className="w-4 h-4" />
                                                            <span className="text-sm sm:text-base">{(userProfile as any).phone}</span>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </>
                                    )}

                                    {/* Signed-in user's own email on banner */}
                                    {!readOnly && (
                                        <motion.div 
                                            className="flex items-center gap-3 mt-2 text-slate-300"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.35 }}
                                        >
                                            <MailIcon className="w-4 h-4" />
                                            <span className="text-sm sm:text-base break-all">{(userProfile as any).email}</span>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>


                    {/* Mobile: Connect & Message Buttons above stats */}
                    <div className="lg:hidden">
                        {/* Connect & Message Buttons */}
                        {readOnly && currentUser && userProfile.id !== currentUser.id && (
                            <motion.div 
                                className="flex flex-row gap-2 sm:gap-3 mb-3 sm:mb-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <motion.button
                                    onClick={handleConnect}
                                    disabled={isConnecting || connectionStatus === 'connected' || connectionStatus === 'requested'}
                                    className={cn(
                                        "flex-1 flex items-center justify-center space-x-2 sm:space-x-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-md text-sm sm:text-base",
                                        connectionStatus === 'connected' 
                                            ? "bg-gradient-to-r from-emerald-700/30 to-emerald-600/30 text-emerald-200 border border-emerald-600/40 cursor-default hover:shadow-emerald-500/10"
                                            : connectionStatus === 'requested'
                                            ? "bg-gradient-to-r from-amber-700/30 to-amber-600/30 text-amber-200 border border-amber-600/40 cursor-default hover:shadow-amber-500/10"
                                            : "bg-gradient-to-r from-emerald-700/30 to-emerald-600/30 text-emerald-200 border border-emerald-600/40 hover:from-emerald-600/30 hover:to-emerald-500/30 hover:shadow-emerald-500/10"
                                    )}
                                    whileHover={{ scale: connectionStatus === 'connected' || connectionStatus === 'requested' ? 1 : 1.02, y: -2 }}
                                    whileTap={{ scale: connectionStatus === 'connected' || connectionStatus === 'requested' ? 1 : 0.98 }}
                                >
                                    {isConnecting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Sending...</span>
                                        </>
                                    ) : connectionStatus === 'connected' ? (
                                        <>
                                            <div className="w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center">
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                            </div>
                                            <span>Connected</span>
                                        </>
                                    ) : connectionStatus === 'requested' ? (
                                        <>
                                            <div className="w-5 h-5 bg-yellow-400 rounded-full animate-pulse"></div>
                                            <span>Request Sent</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                            </div>
                                            <span>Connect</span>
                                        </>
                                    )}
                                </motion.button>
                                
                                <motion.button
                                    onClick={handleMessage}
                                    className="flex-1 flex items-center justify-center space-x-2 sm:space-x-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 border shadow-lg hover:shadow-xl backdrop-blur-md bg-gradient-to-r from-slate-700/30 to-slate-600/30 text-slate-200 border-slate-600/40 hover:border-slate-500/50 text-sm sm:text-base"
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <MailIcon className="w-5 h-5" />
                                    <span>Message</span>
                                </motion.button>
                            </motion.div>
                        )}

                        {/* Stats Section - Mobile */}
                        <div className="mt-6 sm:mt-8 mb-6 sm:mb-8">
                            <motion.div 
                                className={`grid gap-1 sm:gap-3 ${userProfile.role === Role.Investor ? 'grid-cols-1' : 'grid-cols-3'}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                            >
                                <motion.div 
                                    className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl border border-slate-800/50 rounded-lg sm:rounded-xl p-1.5 sm:p-3 text-center hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10 transition-all duration-300"
                                    whileHover={{ scale: 1.02, y: -2 }}
                                >
                                    <div className="w-6 h-6 sm:w-10 sm:h-10 mx-auto bg-gradient-to-br from-emerald-600/20 to-emerald-500/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-1 sm:mb-2">
                                        <StarIcon className="w-3 h-3 sm:w-5 sm:h-5 text-emerald-400" />
                                    </div>
                                    <h4 className="text-xs sm:text-sm font-semibold text-white mb-1">
                                        {userProfile.role === Role.Founder && 'Ideas Posted'}
                                        {userProfile.role === Role.Investor && 'Ideas Invested In'}
                                        {userProfile.role === Role.Developer && 'Ideas Collaborated On'}
                                    </h4>
                                    <p className="text-sm sm:text-xl font-bold text-emerald-400">{ideas.length}</p>
                                </motion.div>
                                
                                {userProfile.role !== Role.Investor && (
                                    <>
                                        <motion.div 
                                            className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl border border-slate-800/50 rounded-lg sm:rounded-xl p-1.5 sm:p-3 text-center hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10 transition-all duration-300"
                                            whileHover={{ scale: 1.02, y: -2 }}
                                        >
                                            <div className="w-6 h-6 sm:w-10 sm:h-10 mx-auto bg-gradient-to-br from-blue-600/20 to-blue-500/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-1 sm:mb-2">
                                                <BriefcaseIcon className="w-3 h-3 sm:w-5 sm:h-5 text-blue-400" />
                                            </div>
                                            <h4 className="text-xs sm:text-sm font-semibold text-white mb-1">Skills & Expertise</h4>
                                            <p className="text-sm sm:text-xl font-bold text-blue-400">{userProfile.skills.length}</p>
                                        </motion.div>
                                        
                                        <motion.div 
                                            className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl border border-slate-800/50 rounded-lg sm:rounded-xl p-1.5 sm:p-3 text-center hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10 transition-all duration-300"
                                            whileHover={{ scale: 1.02, y: -2 }}
                                        >
                                            <div className="w-6 h-6 sm:w-10 sm:h-10 mx-auto bg-gradient-to-br from-purple-600/20 to-purple-500/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-1 sm:mb-2">
                                                <HeartIcon className="w-3 h-3 sm:w-5 sm:h-5 text-purple-400" />
                                            </div>
                                            <h4 className="text-xs sm:text-sm font-semibold text-white mb-1">Areas of Interest</h4>
                                            <p className="text-sm sm:text-xl font-bold text-purple-400">{userProfile.interests.length}</p>
                                        </motion.div>
                                    </>
                                )}
                            </motion.div>
                        </div>
                    </div>


                    {/* Large Screen Layout */}
                    <div className="hidden lg:grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
                        {/* Left Column - Stats */}
                        <div className="space-y-3 sm:space-y-4 lg:space-y-6 mb-6 lg:mb-8">
                            {/* Interactive Stats Section - span two columns on large screens */}
                            <motion.div 
                                className={`grid gap-1 sm:gap-3 lg:gap-4 lg:col-span-2 ${userProfile.role === Role.Investor ? 'grid-cols-1' : 'grid-cols-3'}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                            >
                                <motion.div 
                                    className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl border border-slate-800/50 rounded-lg sm:rounded-xl lg:rounded-2xl p-1.5 sm:p-3 lg:p-4 text-center hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10 transition-all duration-300"
                                    whileHover={{ scale: 1.02, y: -2 }}
                                >
                                    <div className="w-6 h-6 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mx-auto bg-gradient-to-br from-emerald-600/20 to-emerald-500/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-1 sm:mb-2 lg:mb-3">
                                        <StarIcon className="w-3 h-3 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-emerald-400" />
                                    </div>
                                    <h4 className="text-xs sm:text-sm lg:text-base xl:text-lg font-semibold text-white mb-1">
                                        {userProfile.role === Role.Founder && 'Ideas Posted'}
                                        {userProfile.role === Role.Investor && 'Ideas Invested In'}
                                        {userProfile.role === Role.Developer && 'Ideas Collaborated On'}
                                    </h4>
                                    <p className="text-sm sm:text-xl lg:text-2xl font-bold text-emerald-400">{ideas.length}</p>
                                </motion.div>
                                
                                {userProfile.role !== Role.Investor && (
                                    <>
                                        <motion.div 
                                            className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl border border-slate-800/50 rounded-lg sm:rounded-xl lg:rounded-2xl p-1.5 sm:p-3 lg:p-4 text-center hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10 transition-all duration-300"
                                            whileHover={{ scale: 1.02, y: -2 }}
                                        >
                                            <div className="w-6 h-6 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mx-auto bg-gradient-to-br from-blue-600/20 to-blue-500/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-1 sm:mb-2 lg:mb-3">
                                                <BriefcaseIcon className="w-3 h-3 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-400" />
                                            </div>
                                            <h4 className="text-xs sm:text-sm lg:text-base xl:text-lg font-semibold text-white mb-1">Skills & Expertise</h4>
                                            <p className="text-sm sm:text-xl lg:text-2xl font-bold text-blue-400">{userProfile.skills.length}</p>
                                        </motion.div>
                                        
                                        <motion.div 
                                            className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl border border-slate-800/50 rounded-lg sm:rounded-xl lg:rounded-2xl p-1.5 sm:p-3 lg:p-4 text-center hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10 transition-all duration-300"
                                            whileHover={{ scale: 1.02, y: -2 }}
                                        >
                                            <div className="w-6 h-6 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mx-auto bg-gradient-to-br from-purple-600/20 to-purple-500/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-1 sm:mb-2 lg:mb-3">
                                                <HeartIcon className="w-3 h-3 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-400" />
                                            </div>
                                            <h4 className="text-xs sm:text-sm lg:text-base xl:text-lg font-semibold text-white mb-1">Areas of Interest</h4>
                                            <p className="text-sm sm:text-xl lg:text-2xl font-bold text-purple-400">{userProfile.interests.length}</p>
                                        </motion.div>
                                    </>
                                )}
                            </motion.div>
                        </div>

                        {/* Right Column - Connect & Message Buttons */}
                        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                            {/* Connect & Message Buttons */}
                            {readOnly && currentUser && userProfile.id !== currentUser.id && (
                                <motion.div 
                                    className="flex flex-col gap-2 sm:gap-3 lg:gap-4"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <motion.button
                                        onClick={handleConnect}
                                        disabled={isConnecting || connectionStatus === 'connected' || connectionStatus === 'requested'}
                                        className={cn(
                                            "flex-1 flex items-center justify-center space-x-2 sm:space-x-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-md text-sm sm:text-base",
                                            connectionStatus === 'connected' 
                                                ? "bg-gradient-to-r from-emerald-700/30 to-emerald-600/30 text-emerald-200 border border-emerald-600/40 cursor-default hover:shadow-emerald-500/10"
                                                : connectionStatus === 'requested'
                                                ? "bg-gradient-to-r from-amber-700/30 to-amber-600/30 text-amber-200 border border-amber-600/40 cursor-default hover:shadow-amber-500/10"
                                                : "bg-gradient-to-r from-emerald-700/30 to-emerald-600/30 text-emerald-200 border border-emerald-600/40 hover:from-emerald-600/30 hover:to-emerald-500/30 hover:shadow-emerald-500/10"
                                        )}
                                        whileHover={{ scale: connectionStatus === 'connected' || connectionStatus === 'requested' ? 1 : 1.02, y: -2 }}
                                        whileTap={{ scale: connectionStatus === 'connected' || connectionStatus === 'requested' ? 1 : 0.98 }}
                                    >
                                        {isConnecting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Sending...</span>
                                            </>
                                        ) : connectionStatus === 'connected' ? (
                                            <>
                                                <div className="w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                                </div>
                                                <span>Connected</span>
                                            </>
                                        ) : connectionStatus === 'requested' ? (
                                            <>
                                                <div className="w-5 h-5 bg-yellow-400 rounded-full animate-pulse"></div>
                                                <span>Request Sent</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                                </div>
                                                <span>Connect</span>
                                            </>
                                        )}
                                    </motion.button>
                                    
                                    <motion.button
                                        onClick={handleMessage}
                                        className="flex-1 flex items-center justify-center space-x-2 sm:space-x-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 border shadow-lg hover:shadow-xl backdrop-blur-md bg-gradient-to-r from-slate-700/30 to-slate-600/30 text-slate-200 border-slate-600/40 hover:border-slate-500/50 text-sm sm:text-base"
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <MailIcon className="w-5 h-5" />
                                        <span>Message</span>
                                    </motion.button>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
                    {/* Left Column */}
                        <div className="space-y-3 sm:space-y-4 lg:space-y-6">

                        {/* Ideas Section - moved up to fill left column gap in read-only */}
                        {readOnly && (
                        <motion.div 
                                    className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-3 sm:p-4 transition-all duration-300 hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.9 }}
                                >
                                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl flex items-center justify-center border border-slate-700/50 mr-3 sm:mr-4">
                                            <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                        </div>
                                        {userProfile.role === Role.Founder && 'Ideas Posted'}
                                        {userProfile.role === Role.Investor && 'Ideas Invested In'}
                                        {userProfile.role === Role.Developer && 'Ideas Collaborated On'}
                                </h3>

                                        {ideasLoading ? (
                                <div className="flex items-center justify-center py-8">
                                                <div className="w-8 h-8 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin"></div>
                                                <span className="ml-3 text-slate-400">Loading ideas...</span>
                                </div>
                                        ) : ideas.length > 0 ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-1.5 sm:gap-3 lg:gap-4">
                                                {ideas.map((idea, index) => (
                                                    <motion.div
                                            key={idea.id}
                                                        className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 hover:border-slate-600/70 hover:shadow-xl hover:shadow-slate-500/10 transition-all duration-300 cursor-pointer"
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.1 }}
                                                        whileHover={{ scale: 1.02, y: -2 }}
                                                        onClick={() => onNavigateToIdea?.(idea.id)}
                                                    >
                                                        <div className="flex items-start justify-between mb-1 sm:mb-2">
                                                            <h4 className="text-white font-semibold text-xs sm:text-sm lg:text-base line-clamp-2 flex-1 pr-1">
                                                                {idea.title || 'Untitled Idea'}
                                                            </h4>
                                                            <div className="flex items-center space-x-0.5 sm:space-x-1 text-slate-400 text-xs flex-shrink-0">
                                                                <StarIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                                <span>{(idea.likes || []).length || 0}</span>
                                                </div>
                                            </div>
                                                        <p className="text-slate-300 text-xs sm:text-sm line-clamp-2 sm:line-clamp-3 mb-1 sm:mb-2">
                                                            {idea.description || 'No description available'}
                                                        </p>
                                                        <div className="flex flex-wrap gap-0.5 sm:gap-1 mb-1 sm:mb-2">
                                                            {(idea.tags || []).slice(0, 2).map((tag, tagIndex) => (
                                                                <span 
                                                                    key={tagIndex}
                                                                    className="bg-gradient-to-r from-emerald-700/30 to-emerald-600/30 text-emerald-300 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs border border-emerald-600/30"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                            {(idea.tags || []).length > 2 && (
                                                                <span className="text-slate-500 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
                                                                    +{(idea.tags || []).length - 2} more
                                                                </span>
                                                )}
                                            </div>
                                                        <div className="flex items-center justify-between text-xs text-slate-400">
                                                            <span>{idea.createdAt ? new Date(idea.createdAt).toLocaleDateString() : 'No date'}</span>
                                                            <span className="bg-slate-700/50 px-2 py-1 rounded-full">
                                                                {idea.status || 'Unknown'}
                                                            </span>
                    </div>
                </motion.div>
                                    ))}
                                </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <div className="w-16 h-16 mx-auto bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                                                    <StarIcon className="w-8 h-8 text-slate-500" />
                                                </div>
                                                <h4 className="text-slate-400 font-medium mb-2">
                                                    {userProfile.role === Role.Founder && 'No ideas posted yet'}
                                                    {userProfile.role === Role.Investor && 'No investments yet'}
                                                    {userProfile.role === Role.Developer && 'No collaborations yet'}
                                                </h4>
                                                <p className="text-slate-500 text-sm">
                                                    {userProfile.role === Role.Founder && 'This user hasn\'t shared any ideas yet.'}
                                                    {userProfile.role === Role.Investor && 'This user hasn\'t invested in any ideas yet.'}
                                                    {userProfile.role === Role.Developer && 'This user hasn\'t collaborated on any ideas yet.'}
                                                </p>
                                            </div>
                            )}
                        </motion.div>
                        )}

                        {/* Basic Information */}
                        {!readOnly && (
                        <motion.div 
                                    className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-3 sm:p-4 transition-all duration-300 hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.8 }}
                                >
                                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-6 flex items-center">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl flex items-center justify-center border border-slate-700/50 mr-3 sm:mr-4">
                                            <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                                </div>
                                        Basic Information
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                                        <div>
                                            <label className="block text-sm sm:text-base font-medium text-slate-400 mb-2 sm:mb-3">Full Name</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 placeholder-slate-500 text-sm sm:text-base shadow-lg"
                                            />
                                        ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm sm:text-base bg-gradient-to-r from-emerald-700/30 to-emerald-600/30 text-emerald-200 border border-emerald-600/40">
                                                        <UserIcon className="w-4 h-4" />
                                                        {userProfile.name}
                                                    </span>
                                            </div>
                                        )}
                                    </div>
                                        <div>
                                            <label className="block text-sm sm:text-base font-medium text-slate-400 mb-2 sm:mb-3">Role</label>
                                        {isEditing ? (
                                            <select
                                                name="role"
                                                value={formData.role}
                                                onChange={handleChange}
                                                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 text-sm sm:text-base shadow-lg"
                                            >
                                                {Object.values(Role).map(role => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                            </select>
                                        ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm sm:text-base bg-gradient-to-r from-blue-700/30 to-blue-600/30 text-blue-200 border border-blue-600/40">
                                                        <BriefcaseIcon className="w-4 h-4" />
                                                        {userProfile.role}
                                                    </span>
                                            </div>
                                        )}
                                    </div>
                                        <div>
                                            <label className="block text-sm sm:text-base font-medium text-slate-400 mb-2 sm:mb-3">Location</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleChange}
                                                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 placeholder-slate-500 text-sm sm:text-base shadow-lg"
                                            />
                                        ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm sm:text-base bg-gradient-to-r from-slate-700/30 to-slate-600/30 text-slate-200 border border-slate-600/40">
                                                        <MapPinIcon className="w-4 h-4" />
                                                        {userProfile.location || 'Not specified'}
                                                    </span>
                                            </div>
                                        )}
                                    </div>
                                        {isEditing && (
                                            <div>
                                                <label className="block text-sm sm:text-base font-medium text-slate-400 mb-2 sm:mb-3">Date of Birth</label>
                                                <input
                                                    type="date"
                                                    name="dateOfBirth"
                                                    value={formData.dateOfBirth}
                                                    onChange={handleChange}
                                                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 text-sm sm:text-base shadow-lg"
                                                />
                                                </div>
                                            )}
                                        {isEditing && (
                                            <div className="sm:col-span-2">
                                                <label className="block text-sm sm:text-base font-medium text-slate-400 mb-2 sm:mb-3">Gender</label>
                                            <select
                                                name="gender"
                                                value={formData.gender}
                                                onChange={handleChange}
                                                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 text-sm sm:text-base shadow-lg"
                                            >
                                                        <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                            </div>
                                        )}
                                        {isEditing && (
                                            <div className="sm:col-span-2">
                                                <label className="block text-sm sm:text-base font-medium text-slate-400 mb-2 sm:mb-3">Phone (shown to connections)</label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 text-sm sm:text-base shadow-lg"
                                                    placeholder="e.g., +1 555 123 4567"
                                                />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                                )}

                            </div>

                        {/* Skills & Experience and Interests & Preferences - Hidden for Investors */}
                        {userProfile.role !== Role.Investor && (
                            <div className="space-y-4 sm:space-y-6">
                                {/* Skills & Experience */}
                            <motion.div 
                                    className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-3 sm:p-4 transition-all duration-300 hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.9 }}
                                >
                                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-6 flex items-center">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl flex items-center justify-center border border-slate-700/50 mr-3 sm:mr-4">
                                            <BriefcaseIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                                    </div>
                                        Skills & Experience
                                    </h3>
                                    <div className="space-y-4 sm:space-y-6">
                                        <div>
                                            <label className="block text-sm sm:text-base font-medium text-slate-400 mb-3">Skills</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                name="skills"
                                                value={formData.skills}
                                                onChange={handleChange}
                                                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 placeholder-slate-500 text-sm sm:text-base shadow-lg"
                                                placeholder="e.g., React, Product Management, Sales"
                                            />
                                        ) : (
                                                <div className="flex flex-wrap gap-2 sm:gap-3 bg-slate-800/30 border border-slate-700/30 rounded-xl p-3 sm:p-4">
                                                    {(userProfile.skills || []).length > 0 ? (
                                                        (userProfile.skills || []).map((skill, index) => (
                                                            <motion.span 
                                                                key={index} 
                                                                className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 text-white px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base border border-slate-600/50 hover:border-slate-500/50 transition-all duration-300"
                                                                whileHover={{ scale: 1.05, y: -1 }}
                                                                initial={{ opacity: 0, scale: 0.8 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                transition={{ delay: index * 0.1 }}
                                                            >
                                                                {skill}
                                                            </motion.span>
                                                        ))
                                                ) : (
                                                        <span className="text-slate-500 text-sm sm:text-base">No skills specified</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                        <div>
                                            <label className="block text-sm sm:text-base font-medium text-slate-400 mb-3">Experience</label>
                                        {isEditing ? (
                                            <textarea
                                                name="experience"
                                                    rows={4}
                                                value={formData.experience}
                                                onChange={handleChange}
                                                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 sm:p-4 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 resize-none placeholder-slate-500 text-sm sm:text-base shadow-lg"
                                                placeholder="Describe your professional experience..."
                                            />
                                        ) : (
                                                <p className="text-white bg-slate-800/30 border border-slate-700/30 rounded-xl p-3 sm:p-4 text-sm sm:text-base">{(userProfile as any).experience || 'Not specified'}</p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                                {/* Interests & Preferences */}
                            <motion.div 
                                    className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-3 sm:p-4 transition-all duration-300 hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 1.0 }}
                                >
                                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-6 flex items-center">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl flex items-center justify-center border border-slate-700/50 mr-3 sm:mr-4">
                                            <HeartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                                    </div>
                                        Interests & Preferences
                                    </h3>
                                    <div className="space-y-4 sm:space-y-6">
                                        <div>
                                            <label className="block text-sm sm:text-base font-medium text-slate-400 mb-3">Interests</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                name="interests"
                                                value={formData.interests}
                                                onChange={handleChange}
                                                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 placeholder-slate-500 text-sm sm:text-base shadow-lg"
                                                placeholder="e.g., AI, FinTech, Sustainable Tech"
                                            />
                                        ) : (
                                                <div className="flex flex-wrap gap-2 sm:gap-3 bg-slate-800/30 border border-slate-700/30 rounded-xl p-3 sm:p-4">
                                                    {(userProfile.interests || []).length > 0 ? (
                                                        (userProfile.interests || []).map((interest, index) => (
                                                            <motion.span 
                                                                key={index} 
                                                                className="bg-gradient-to-r from-emerald-700/50 to-emerald-600/50 text-white px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base border border-emerald-600/50 hover:border-emerald-500/50 transition-all duration-300"
                                                                whileHover={{ scale: 1.05, y: -1 }}
                                                                initial={{ opacity: 0, scale: 0.8 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                transition={{ delay: index * 0.1 }}
                                                            >
                                                                {interest}
                                                            </motion.span>
                                                        ))
                                                ) : (
                                                        <span className="text-slate-500 text-sm sm:text-base">No interests specified</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                        <div>
                                            <label className="block text-sm sm:text-base font-medium text-slate-400 mb-3">Looking For</label>
                                        {isEditing ? (
                                            <textarea
                                                name="lookingFor"
                                                    rows={4}
                                                value={formData.lookingFor}
                                                onChange={handleChange}
                                                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 sm:p-4 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 resize-none placeholder-slate-500 text-sm sm:text-base shadow-lg"
                                                placeholder="Describe what you're looking for..."
                                            />
                                        ) : (
                                                <p className="text-white bg-slate-800/30 border border-slate-700/30 rounded-xl p-3 sm:p-4 text-sm sm:text-base">{userProfile.lookingFor}</p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                            </div>
                        )}

                        {/* Investor Specific Information */}
                        {userProfile.role === Role.Investor && userProfile.investorProfile && (
                            <motion.div 
                                        className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-3 sm:p-4 transition-all duration-300 hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 1.1 }}
                                    >
                                        <h3 className="text-lg sm:text-xl font-semibold text-white mb-6 flex items-center">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl flex items-center justify-center border border-slate-700/50 mr-3 sm:mr-4">
                                                <DollarSignIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                                    </div>
                                            Investment Profile
                                        </h3>
                                        <div className="space-y-4 sm:space-y-6">
                                            <div>
                                                <label className="block text-sm sm:text-base font-medium text-slate-400 mb-3">Investment Domains</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                name="interestedDomains"
                                                value={formData.interestedDomains}
                                                onChange={handleChange}
                                                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 placeholder-slate-500 text-sm sm:text-base shadow-lg"
                                                placeholder="e.g., SaaS, FinTech, HealthTech"
                                            />
                                        ) : (
                                                    <div className="flex flex-wrap gap-2 sm:gap-3 bg-slate-800/30 border border-slate-700/30 rounded-xl p-3 sm:p-4">
                                                {userProfile.investorProfile.interestedDomains.map((domain, index) => (
                                                            <motion.span 
                                                                key={index} 
                                                                className="bg-gradient-to-r from-purple-700/50 to-purple-600/50 text-white px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base border border-purple-600/50 hover:border-purple-500/50 transition-all duration-300"
                                                                whileHover={{ scale: 1.05, y: -1 }}
                                                                initial={{ opacity: 0, scale: 0.8 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                transition={{ delay: index * 0.1 }}
                                                            >
                                                        {domain}
                                                            </motion.span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                            <div>
                                                <label className="block text-sm sm:text-base font-medium text-slate-400 mb-3">Investment Experience</label>
                                        {isEditing ? (
                                            <textarea
                                                name="investmentExperience"
                                                        rows={4}
                                                value={formData.investmentExperience}
                                                onChange={handleChange}
                                                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 sm:p-4 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 resize-none placeholder-slate-500 text-sm sm:text-base shadow-lg"
                                                placeholder="Describe your investment experience..."
                                            />
                                        ) : (
                                                    <p className="text-white bg-slate-800/30 border border-slate-700/30 rounded-xl p-3 sm:p-4 text-sm sm:text-base">{userProfile.investorProfile.investmentExperience}</p>
                                        )}
                                    </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                                                <div>
                                                    <label className="block text-sm sm:text-base font-medium text-slate-400 mb-3">Budget Range</label>
                                            {isEditing ? (
                                                        <div className="flex flex-col sm:flex-row space-y-1.5 sm:space-y-0 sm:space-x-2">
                                                    <input
                                                        type="number"
                                                        name="minBudget"
                                                        value={formData.minBudget}
                                                        onChange={handleChange}
                                                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 placeholder-slate-500 text-sm sm:text-base shadow-lg"
                                                        placeholder="Min"
                                                    />
                                                    <input
                                                        type="number"
                                                        name="maxBudget"
                                                        value={formData.maxBudget}
                                                        onChange={handleChange}
                                                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 placeholder-slate-500 text-sm sm:text-base shadow-lg"
                                                        placeholder="Max"
                                                    />
                                                </div>
                                            ) : (
                                                        <p className="text-white bg-slate-800/30 border border-slate-700/30 rounded-xl p-3 sm:p-4 text-sm sm:text-base">${userProfile.investorProfile.budget.min.toLocaleString()} - ${userProfile.investorProfile.budget.max.toLocaleString()}</p>
                                            )}
                                        </div>
                                                <div>
                                                    <label className="block text-sm sm:text-base font-medium text-slate-400 mb-3">Equity Range</label>
                                            {isEditing ? (
                                                        <div className="flex flex-col sm:flex-row space-y-1.5 sm:space-y-0 sm:space-x-2">
                                                    <input
                                                        type="number"
                                                        name="minEquity"
                                                        value={formData.minEquity}
                                                        onChange={handleChange}
                                                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 placeholder-slate-500 text-sm sm:text-base shadow-lg"
                                                        placeholder="Min %"
                                                    />
                                                    <input
                                                        type="number"
                                                        name="maxEquity"
                                                        value={formData.maxEquity}
                                                        onChange={handleChange}
                                                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 placeholder-slate-500 text-sm sm:text-base shadow-lg"
                                                        placeholder="Max %"
                                                    />
                                                </div>
                                            ) : (
                                                        <p className="text-white bg-slate-800/30 border border-slate-700/30 rounded-xl p-3 sm:p-4 text-sm sm:text-base">{userProfile.investorProfile.expectedEquity.min}% - {userProfile.investorProfile.expectedEquity.max}%</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Ideas Section - Show based on user role (moved up; removed here) */}
                    </div>

                    {error && (
                        <motion.div 
                            className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-red-900/30 to-red-800/30 border border-red-700/30 text-red-300 rounded-xl sm:rounded-2xl text-center text-sm sm:text-base"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {error}
                        </motion.div>
                    )}

                {/* Floating Action Button removed for cleaner layout */}
                </div>
            </div>
            </div>
        </div>
    );
};

export default Profile;
