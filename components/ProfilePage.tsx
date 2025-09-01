import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { UserIcon, BriefcaseIcon, MapPinIcon, StarIcon, CalendarIcon, EditIcon, SaveIcon, XIcon, PhoneIcon } from './icons';
import { firestoreService } from '../services/firestoreService';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfilePageProps {
    user: User;
    onBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onBack }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Add null checks and default values
    const safeUser = {
        ...user,
        name: user?.name || 'Unknown User',
        location: user?.location || 'Unknown Location',
        skills: user?.skills || [],
        interests: user?.interests || [],
        experience: user?.experience || '',
        lookingFor: user?.lookingFor || '',
        connections: user?.connections || [],
        createdAt: user?.createdAt ? (user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt)) : new Date(),
        lastActive: user?.lastActive ? (user.lastActive instanceof Date ? user.lastActive : new Date(user.lastActive)) : new Date(),
        avatarUrl: user?.avatarUrl || `https://api.dicebear.com/8.x/bottts/svg?seed=${user?.name || 'user'}`,
        investorProfile: user?.investorProfile || {
            interestedDomains: [],
            investmentExperience: '',
            budget: { min: 0, max: 0 },
            expectedEquity: { min: 0, max: 0 }
        }
    };

    // Helper function to safely format dates
    const formatDate = (date: any): string => {
        try {
            if (date instanceof Date) {
                return date.toLocaleDateString();
            } else if (date && typeof date.toDate === 'function') {
                // Firestore Timestamp
                return date.toDate().toLocaleDateString();
            } else if (date) {
                // Try to convert to Date
                return new Date(date).toLocaleDateString();
            }
            return 'Unknown';
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Unknown';
        }
    };

    // Helper function to safely convert to Date
    const safeDateConversion = (date: any): Date => {
        try {
            if (date instanceof Date) {
                return date;
            } else if (date && typeof date.toDate === 'function') {
                // Firestore Timestamp
                return date.toDate();
            } else if (date) {
                // Try to convert to Date
                const converted = new Date(date);
                if (isNaN(converted.getTime())) {
                    return new Date(); // Return current date if invalid
                }
                return converted;
            }
            return new Date();
        } catch (error) {
            console.error('Error converting date:', error);
            return new Date();
        }
    };

    const [formData, setFormData] = useState({
        name: safeUser.name,
        location: safeUser.location,
        skills: safeUser.skills.join(', '),
        interests: safeUser.interests.join(', '),
        experience: safeUser.experience,
        lookingFor: safeUser.lookingFor,
        // Investor specific fields
        interestedDomains: safeUser.investorProfile?.interestedDomains.join(', ') || '',
        investmentExperience: safeUser.investorProfile?.investmentExperience || '',
        minBudget: safeUser.investorProfile?.budget.min.toString() || '0',
        maxBudget: safeUser.investorProfile?.budget.max.toString() || '0',
        minEquity: safeUser.investorProfile?.expectedEquity.min.toString() || '0',
        maxEquity: safeUser.investorProfile?.expectedEquity.max.toString() || '0',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Validate required fields
            if (!formData.name.trim()) {
                throw new Error('Name is required');
            }
            
            if (!formData.location.trim()) {
                throw new Error('Location is required');
            }

            const updatedProfile = {
                ...safeUser,
                name: formData.name.trim(),
                location: formData.location.trim(),
                skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
                interests: formData.interests.split(',').map(s => s.trim()).filter(s => s),
                experience: formData.experience.trim(),
                lookingFor: formData.lookingFor.trim(),
                lastActive: new Date(), // This should be fine as it's a new Date()
                createdAt: safeDateConversion(safeUser.createdAt), // Use safe conversion
                ...(safeUser.role === Role.Investor && {
                    investorProfile: {
                        interestedDomains: formData.interestedDomains.split(',').map(s => s.trim()).filter(s => s),
                        investmentExperience: formData.investmentExperience.trim(),
                        budget: {
                            min: parseInt(formData.minBudget, 10) || 0,
                            max: parseInt(formData.maxBudget, 10) || 0,
                        },
                        expectedEquity: {
                            min: parseInt(formData.minEquity, 10) || 0,
                            max: parseInt(formData.maxEquity, 10) || 0,
                        },
                    }
                })
            };

            console.log('Updating profile for user:', safeUser.id);
            console.log('Updated profile data:', updatedProfile);
            
            await firestoreService.updateUserProfile(safeUser.id, updatedProfile);
            console.log('Profile updated successfully');
            
            // Update the local user object to reflect changes
            Object.assign(safeUser, updatedProfile);
            
            setIsEditing(false);
        } catch (err) {
            console.error('Profile update error:', err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Failed to update profile. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: safeUser.name,
            location: safeUser.location,
            skills: safeUser.skills.join(', '),
            interests: safeUser.interests.join(', '),
            experience: safeUser.experience,
            lookingFor: safeUser.lookingFor,
            interestedDomains: safeUser.investorProfile?.interestedDomains.join(', ') || '',
            investmentExperience: safeUser.investorProfile?.investmentExperience || '',
            minBudget: safeUser.investorProfile?.budget.min.toString() || '0',
            maxBudget: safeUser.investorProfile?.budget.max.toString() || '0',
            minEquity: safeUser.investorProfile?.expectedEquity.min.toString() || '0',
            maxEquity: safeUser.investorProfile?.expectedEquity.max.toString() || '0',
        });
        setIsEditing(false);
        setError(null);
    };

    // Add error boundary
    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 flex items-center justify-center p-4">
                <motion.div 
                    className="bg-gradient-to-br from-slate-900/95 to-black/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 text-center shadow-2xl shadow-black/50"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                >
                    <h1 className="text-2xl font-bold text-white mb-4">Profile Not Found</h1>
                    <p className="text-slate-400 mb-6">Unable to load user profile.</p>
                    <button
                        onClick={onBack}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                    >
                        Go Back
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="w-full h-full max-h-full bg-gradient-to-br from-slate-950 to-black overflow-hidden flex">
            {/* Main Profile Content */}
            <div className="flex-1 min-h-0 overflow-y-auto pt-16 pb-16 lg:pt-0 lg:pb-0">
                <div className="h-full">
                    {/* Header */}
                    <motion.div 
                        className="flex items-center justify-between p-6 lg:p-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <button
                            onClick={onBack}
                            className="flex items-center gap-3 text-slate-400 hover:text-white transition-all duration-300 group"
                        >
                            <div className="p-2 rounded-lg bg-slate-800/50 group-hover:bg-slate-700/50 transition-colors duration-300">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </div>
                            <span className="font-medium">Back</span>
                        </button>
                        
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                            >
                                <EditIcon className="w-5 h-5" />
                                Edit Profile
                            </button>
                        ) : (
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                                >
                                    <XIcon className="w-5 h-5" />
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                        </svg>
                                    ) : (
                                        <SaveIcon className="w-5 h-5" />
                                    )}
                                    Save Changes
                                </button>
                            </div>
                        )}
                    </motion.div>

                    {/* Profile Content */}
                    <div className="px-6 lg:px-8 pb-6 lg:pb-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                            {/* Left Column - Avatar & Basic Info */}
                            <motion.div 
                                className="lg:col-span-1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                            >
                                <div className="bg-gradient-to-br from-slate-900/95 to-black/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 lg:p-8 shadow-2xl shadow-black/50">
                                    <div className="text-center mb-6 lg:mb-8">
                                        <div className="relative w-24 h-24 lg:w-32 lg:h-32 mx-auto mb-4 lg:mb-6">
                                            <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-blue-500 p-1">
                                                <img
                                                    src={safeUser.avatarUrl}
                                                    alt={safeUser.name}
                                                    className="w-full h-full object-cover rounded-full border-4 border-slate-900"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = `https://api.dicebear.com/8.x/bottts/svg?seed=${safeUser.name}`;
                                                    }}
                                                />
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full border-4 border-slate-900 flex items-center justify-center">
                                                <div className="w-3 h-3 lg:w-4 lg:h-4 bg-white rounded-full"></div>
                                            </div>
                                        </div>
                                        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-3">{safeUser.name}</h1>
                                        <div className="flex items-center justify-center gap-2 text-slate-400 mb-4">
                                            <BriefcaseIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                                            <span className="font-medium text-sm lg:text-base">{safeUser.role}</span>
                                        </div>
                                        <div className="flex items-center justify-center gap-2 text-slate-400 mb-4">
                                            <MapPinIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                                            <span className="font-medium text-sm lg:text-base">{safeUser.location}</span>
                                        </div>
                                        
                                        {/* Verification Status Badge */}
                                        <div className="flex items-center justify-center mb-4">
                                            {safeUser.isVerified ? (
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-600/20 to-emerald-700/20 border border-emerald-500/30 rounded-full">
                                                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                                                    <span className="text-emerald-300 text-xs font-medium">
                                                        {safeUser.verification?.method === 'phone' ? 'Phone Verified' : 'Verified Account'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-600/20 to-amber-700/20 border border-amber-500/30 rounded-full">
                                                    <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                                                    <span className="text-amber-300 text-xs font-medium">
                                                        {safeUser.verification?.method === 'phone' ? 'Phone Verification Pending' : 'Verification Pending'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Show phone number if verified */}
                                        {safeUser.isVerified && safeUser.verification?.phoneNumber && (
                                            <div className="flex items-center justify-center gap-2 text-slate-400 mb-4">
                                                <PhoneIcon className="w-4 h-4" />
                                                <span className="text-sm font-medium">
                                                    {safeUser.verification.phoneNumber}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3 lg:space-y-4">
                                        <div className="flex items-center gap-3 text-slate-400 p-3 rounded-xl bg-slate-800/50">
                                            <CalendarIcon className="w-4 h-4 lg:w-5 lg:h-5 text-purple-400" />
                                            <span className="text-xs lg:text-sm font-medium">Member since {formatDate(safeUser.createdAt)}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-400 p-3 rounded-xl bg-slate-800/50">
                                            <StarIcon className="w-4 h-4 lg:w-5 lg:h-5 text-amber-400" />
                                            <span className="text-xs lg:text-sm font-medium">{safeUser.connections.length} connections</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Right Column - Detailed Info */}
                            <motion.div 
                                className="lg:col-span-2 space-y-4 lg:space-y-6"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                {/* Skills */}
                                <div className="bg-gradient-to-br from-slate-900/95 to-black/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 lg:p-8 shadow-2xl shadow-black/50">
                                    <h2 className="text-xl lg:text-2xl font-bold text-white mb-4 lg:mb-6 flex items-center gap-3">
                                        <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                        </div>
                                        Skills
                                    </h2>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="skills"
                                            value={formData.skills}
                                            onChange={handleChange}
                                            className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl p-3 lg:p-4 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 placeholder-slate-400 text-sm lg:text-base"
                                            placeholder="e.g., React, Node.js, Python, UI/UX"
                                        />
                                    ) : (
                                        <div className="flex flex-wrap gap-2 lg:gap-3">
                                            {safeUser.skills.length > 0 ? (
                                                safeUser.skills.map((skill, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-3 py-1 lg:px-4 lg:py-2 bg-gradient-to-r from-slate-700 to-slate-800 text-slate-300 rounded-lg lg:rounded-xl text-xs lg:text-sm font-medium border border-slate-600/50"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-slate-400 italic text-sm lg:text-base">No skills listed</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Interests */}
                                <div className="bg-gradient-to-br from-slate-900/95 to-black/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 lg:p-8 shadow-2xl shadow-black/50">
                                    <h2 className="text-xl lg:text-2xl font-bold text-white mb-4 lg:mb-6 flex items-center gap-3">
                                        <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                        Interests
                                    </h2>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="interests"
                                            value={formData.interests}
                                            onChange={handleChange}
                                            className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl p-3 lg:p-4 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 placeholder-slate-400 text-sm lg:text-base"
                                            placeholder="e.g., AI, FinTech, Sustainable Tech"
                                        />
                                    ) : (
                                        <div className="flex flex-wrap gap-2 lg:gap-3">
                                            {safeUser.interests.length > 0 ? (
                                                safeUser.interests.map((interest, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-3 py-1 lg:px-4 lg:py-2 bg-gradient-to-r from-purple-600/20 to-purple-700/20 text-purple-300 rounded-lg lg:rounded-xl text-xs lg:text-sm font-medium border border-purple-500/30"
                                                    >
                                                        {interest}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-slate-400 italic text-sm lg:text-base">No interests listed</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Experience */}
                                <div className="bg-gradient-to-br from-slate-900/95 to-black/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 lg:p-8 shadow-2xl shadow-black/50">
                                    <h2 className="text-xl lg:text-2xl font-bold text-white mb-4 lg:mb-6 flex items-center gap-3">
                                        <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                                            </svg>
                                        </div>
                                        Experience
                                    </h2>
                                    {isEditing ? (
                                        <textarea
                                            name="experience"
                                            value={formData.experience}
                                            onChange={handleChange}
                                            rows={4}
                                            className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl p-3 lg:p-4 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 resize-none placeholder-slate-400 text-sm lg:text-base"
                                            placeholder="Describe your professional experience..."
                                        />
                                    ) : (
                                        <p className="text-slate-300 leading-relaxed text-sm lg:text-base">
                                            {safeUser.experience || 'No experience information provided.'}
                                        </p>
                                    )}
                                </div>

                                {/* Looking For */}
                                <div className="bg-gradient-to-br from-slate-900/95 to-black/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 lg:p-8 shadow-2xl shadow-black/50">
                                    <h2 className="text-xl lg:text-2xl font-bold text-white mb-4 lg:mb-6 flex items-center gap-3">
                                        <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        Looking For
                                    </h2>
                                    {isEditing ? (
                                        <textarea
                                            name="lookingFor"
                                            value={formData.lookingFor}
                                            onChange={handleChange}
                                            rows={3}
                                            className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl p-3 lg:p-4 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 resize-none placeholder-slate-400 text-sm lg:text-base"
                                            placeholder="Describe what you're looking for in a co-founder..."
                                        />
                                    ) : (
                                        <p className="text-slate-300 leading-relaxed text-sm lg:text-base">
                                            {safeUser.lookingFor || 'No preferences specified.'}
                                        </p>
                                    )}
                                </div>

                                {/* Investor-specific sections */}
                                {safeUser.role === Role.Investor && safeUser.investorProfile && (
                                    <>
                                        <div className="bg-gradient-to-br from-slate-900/95 to-black/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 lg:p-8 shadow-2xl shadow-black/50">
                                            <h2 className="text-xl lg:text-2xl font-bold text-white mb-4 lg:mb-6 flex items-center gap-3">
                                                <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                                    <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                </div>
                                                Investment Domains
                                            </h2>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="interestedDomains"
                                                    value={formData.interestedDomains}
                                                    onChange={handleChange}
                                                    className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl p-3 lg:p-4 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 placeholder-slate-400 text-sm lg:text-base"
                                                    placeholder="e.g., SaaS, FinTech, HealthTech"
                                                />
                                            ) : (
                                                <div className="flex flex-wrap gap-2 lg:gap-3">
                                                    {safeUser.investorProfile.interestedDomains.length > 0 ? (
                                                        safeUser.investorProfile.interestedDomains.map((domain, index) => (
                                                            <span
                                                                key={index}
                                                                className="px-3 py-1 lg:px-4 lg:py-2 bg-gradient-to-r from-blue-600/20 to-blue-700/20 text-blue-300 rounded-lg lg:rounded-xl text-xs lg:text-sm font-medium border border-blue-500/30"
                                                            >
                                                                {domain}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-slate-400 italic text-sm lg:text-base">No investment domains listed</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-gradient-to-br from-slate-900/95 to-black/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 lg:p-8 shadow-2xl shadow-black/50">
                                            <h2 className="text-xl lg:text-2xl font-bold text-white mb-4 lg:mb-6 flex items-center gap-3">
                                                <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                                    <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                Investment Experience
                                            </h2>
                                            {isEditing ? (
                                                <textarea
                                                    name="investmentExperience"
                                                    value={formData.investmentExperience}
                                                    onChange={handleChange}
                                                    rows={3}
                                                    className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl p-3 lg:p-4 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 resize-none placeholder-slate-400 text-sm lg:text-base"
                                                    placeholder="Describe your investment experience..."
                                                />
                                            ) : (
                                                <p className="text-slate-300 leading-relaxed text-sm lg:text-base">
                                                    {safeUser.investorProfile.investmentExperience || 'No investment experience provided.'}
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                                            <div className="bg-gradient-to-br from-slate-900/95 to-black/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 lg:p-8 shadow-2xl shadow-black/50">
                                                <h2 className="text-xl lg:text-2xl font-bold text-white mb-4 lg:mb-6 flex items-center gap-3">
                                                    <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                                                        <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                        </svg>
                                                    </div>
                                                    Investment Budget
                                                </h2>
                                                {isEditing ? (
                                                    <div className="space-y-3 lg:space-y-4">
                                                        <input
                                                            type="number"
                                                            name="minBudget"
                                                            value={formData.minBudget}
                                                            onChange={handleChange}
                                                            className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl p-3 lg:p-4 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 placeholder-slate-400 text-sm lg:text-base"
                                                            placeholder="Min budget"
                                                        />
                                                        <input
                                                            type="number"
                                                            name="maxBudget"
                                                            value={formData.maxBudget}
                                                            onChange={handleChange}
                                                            className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl p-3 lg:p-4 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 placeholder-slate-400 text-sm lg:text-base"
                                                            placeholder="Max budget"
                                                        />
                                                    </div>
                                                ) : (
                                                    <p className="text-slate-300 text-base lg:text-lg font-medium">
                                                        ${safeUser.investorProfile.budget.min.toLocaleString()} - ${safeUser.investorProfile.budget.max.toLocaleString()}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="bg-gradient-to-br from-slate-900/95 to-black/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 lg:p-8 shadow-2xl shadow-black/50">
                                                <h2 className="text-xl lg:text-2xl font-bold text-white mb-4 lg:mb-6 flex items-center gap-3">
                                                    <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-r from-rose-500 to-rose-600 rounded-lg flex items-center justify-center">
                                                        <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                                        </svg>
                                                    </div>
                                                    Expected Equity
                                                </h2>
                                                {isEditing ? (
                                                    <div className="space-y-3 lg:space-y-4">
                                                        <input
                                                            type="number"
                                                            name="minEquity"
                                                            value={formData.minEquity}
                                                            onChange={handleChange}
                                                            className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl p-3 lg:p-4 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 placeholder-slate-400 text-sm lg:text-base"
                                                            placeholder="Min equity %"
                                                        />
                                                        <input
                                                            type="number"
                                                            name="maxEquity"
                                                            value={formData.maxEquity}
                                                            onChange={handleChange}
                                                            className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl p-3 lg:p-4 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 placeholder-slate-400 text-sm lg:text-base"
                                                            placeholder="Max equity %"
                                                        />
                                                    </div>
                                                ) : (
                                                    <p className="text-slate-300 text-base lg:text-lg font-medium">
                                                        {safeUser.investorProfile.expectedEquity.min}% - {safeUser.investorProfile.expectedEquity.max}%
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div 
                                    className="mt-6 lg:mt-8 p-4 lg:p-6 bg-gradient-to-r from-red-900/30 to-red-800/30 border border-red-700/30 text-red-300 rounded-2xl lg:rounded-3xl text-center backdrop-blur-xl"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
