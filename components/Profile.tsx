import React, { useState, useEffect } from 'react';
import { User, Role, View } from '../types';
import { UserIcon, EditIcon, SaveIcon, XIcon, CameraIcon } from './icons';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import ProfileCard from './ProfileCard';

interface ProfileProps {
    userProfile: User | null;
    onUpdateProfile: (updatedProfile: Partial<User>) => Promise<void>;
    onBack: () => void;
    loading?: boolean;
    error?: string | null;
}

const Profile: React.FC<ProfileProps> = ({ 
    userProfile, 
    onUpdateProfile, 
    onBack, 
    loading = false, 
    error = null 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        role: Role.Founder,
        location: '',
        dateOfBirth: '',
        gender: '',
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

    useEffect(() => {
        if (userProfile) {
            setFormData({
                name: userProfile.name,
                role: userProfile.role,
                location: userProfile.location,
                dateOfBirth: userProfile.dateOfBirth || '',
                gender: userProfile.gender || '',
                interests: userProfile.interests.join(', '),
                skills: userProfile.skills.join(', '),
                experience: (userProfile as any).experience || '',
                lookingFor: userProfile.lookingFor,
                interestedDomains: userProfile.investorProfile?.interestedDomains.join(', ') || '',
                investmentExperience: userProfile.investorProfile?.investmentExperience || '',
                minBudget: userProfile.investorProfile?.budget.min.toString() || '',
                maxBudget: userProfile.investorProfile?.budget.max.toString() || '',
                minEquity: userProfile.investorProfile?.expectedEquity.min.toString() || '',
                maxEquity: userProfile.investorProfile?.expectedEquity.max.toString() || '',
            });
        }
    }, [userProfile]);

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
            interests: formData.interests.split(',').map(s => s.trim()).filter(s => s),
            skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
            lookingFor: formData.lookingFor,
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
            await onUpdateProfile(updatedProfile);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const handleCancel = () => {
        if (userProfile) {
            setFormData({
                name: userProfile.name,
                role: userProfile.role,
                location: userProfile.location,
                dateOfBirth: userProfile.dateOfBirth || '',
                gender: userProfile.gender || '',
                interests: userProfile.interests.join(', '),
                skills: userProfile.skills.join(', '),
                experience: (userProfile as any).experience || '',
                lookingFor: userProfile.lookingFor,
                interestedDomains: userProfile.investorProfile?.interestedDomains.join(', ') || '',
                investmentExperience: userProfile.investorProfile?.investmentExperience || '',
                minBudget: userProfile.investorProfile?.budget.min.toString() || '',
                maxBudget: userProfile.investorProfile?.budget.max.toString() || '',
                minEquity: userProfile.investorProfile?.expectedEquity.min.toString() || '',
                maxEquity: userProfile.investorProfile?.expectedEquity.max.toString() || '',
            });
        }
        setIsEditing(false);
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
        <div className="w-full h-full bg-gradient-to-br from-slate-950 via-black to-slate-950">
            {/* Background gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-black to-slate-950" />
            
            {/* Content */}
            <div className="relative z-10 h-full flex flex-col pt-16 lg:pt-0">
                {/* Header */}
                <div className="flex-shrink-0 bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-sm border-b border-slate-800/50">
                    <div className="w-full px-3 sm:px-4 py-4 sm:py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg flex items-center justify-center border border-slate-700/50">
                                    <UserIcon className="w-4 h-4 sm:w-6 sm:h-6 text-slate-400" />
                                </div>
                                <h1 className="text-xl sm:text-2xl font-bold text-white">My Profile</h1>
                            </div>
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                {!isEditing ? (
                                    <motion.button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-slate-700/50 to-slate-600/50 hover:from-slate-600/50 hover:to-slate-500/50 text-white rounded-lg transition-all duration-300 border border-slate-600/50 hover:border-slate-500/50 text-sm sm:text-base"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <EditIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                        <span className="hidden sm:inline">Edit Profile</span>
                                        <span className="sm:hidden">Edit</span>
                                    </motion.button>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        <motion.button
                                            onClick={handleCancel}
                                            className="px-3 sm:px-4 py-2 bg-gradient-to-r from-slate-700/50 to-slate-600/50 hover:from-slate-600/50 hover:to-slate-500/50 text-white rounded-lg transition-all duration-300 border border-slate-600/50 hover:border-slate-500/50 text-sm sm:text-base whitespace-nowrap"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <span className="hidden sm:inline">Cancel</span>
                                            <span className="sm:hidden">Cancel</span>
                                        </motion.button>
                                        <motion.button
                                            onClick={handleSave}
                                            disabled={loading}
                                            className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-600/80 to-emerald-500/80 hover:from-emerald-500/80 hover:to-emerald-400/80 text-white rounded-lg transition-all duration-300 border border-emerald-600/50 hover:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
                                            whileHover={{ scale: loading ? 1 : 1.02 }}
                                            whileTap={{ scale: loading ? 1 : 0.98 }}
                                        >
                                            <SaveIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                            <span className="hidden sm:inline">{loading ? 'Saving...' : 'Save Changes'}</span>
                                            <span className="sm:hidden">{loading ? 'Saving' : 'Save'}</span>
                                        </motion.button>
                                    </div>
                                )}
                                <motion.button
                                    onClick={onBack}
                                    className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800/50"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <XIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Content */}
                <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 lg:p-6">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
                        {/* Profile Picture Section */}
                        <div className="xl:col-span-1 order-1 xl:order-1">
                            <div className="flex justify-center xl:justify-start">
                                <ProfileCard 
                                    userProfile={userProfile} 
                                    isEditing={isEditing} 
                                    onEditClick={() => setIsEditing(true)} 
                                    onCancel={handleCancel} 
                                    onSave={handleSave} 
                                    loading={loading} 
                                    onBack={onBack}
                                />
                            </div>
                        </div>

                        {/* Profile Details Section */}
                        <div className="xl:col-span-2 order-2 xl:order-2">
                            <div className="space-y-6 sm:space-y-8 lg:space-y-10">
                                {/* Basic Information */}
                                <motion.div 
                                    className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-sm border border-slate-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                >
                                    <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center">
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg flex items-center justify-center border border-slate-700/50 mr-2 sm:mr-3">
                                            <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                                        </div>
                                        Basic Information
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-2">Full Name</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 sm:p-3 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 placeholder-slate-500 text-sm sm:text-base"
                                                />
                                            ) : (
                                                <p className="text-white bg-slate-800/30 border border-slate-700/30 rounded-lg p-2 sm:p-3 text-sm sm:text-base">{userProfile.name}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-2">Role</label>
                                            {isEditing ? (
                                                <select
                                                    name="role"
                                                    value={formData.role}
                                                    onChange={handleChange}
                                                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 sm:p-3 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 text-sm sm:text-base"
                                                >
                                                    {Object.values(Role).map(role => (
                                                        <option key={role} value={role}>{role}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <p className="text-white bg-slate-800/30 border border-slate-700/30 rounded-lg p-2 sm:p-3 text-sm sm:text-base">{userProfile.role}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-2">Location</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="location"
                                                    value={formData.location}
                                                    onChange={handleChange}
                                                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 sm:p-3 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 placeholder-slate-500 text-sm sm:text-base"
                                                />
                                            ) : (
                                                <p className="text-white bg-slate-800/30 border border-slate-700/30 rounded-lg p-2 sm:p-3 text-sm sm:text-base">{userProfile.location}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-2">Date of Birth</label>
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    name="dateOfBirth"
                                                    value={formData.dateOfBirth}
                                                    onChange={handleChange}
                                                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 sm:p-3 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 text-sm sm:text-base"
                                                />
                                            ) : (
                                                <p className="text-white bg-slate-800/30 border border-slate-700/30 rounded-lg p-2 sm:p-3 text-sm sm:text-base">{userProfile.dateOfBirth || 'Not specified'}</p>
                                            )}
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-2">Gender</label>
                                            {isEditing ? (
                                                <select
                                                    name="gender"
                                                    value={formData.gender}
                                                    onChange={handleChange}
                                                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 sm:p-3 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 text-sm sm:text-base"
                                                >
                                                    <option value="">Select Gender</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            ) : (
                                                <p className="text-white bg-slate-800/30 border border-slate-700/30 rounded-lg p-2 sm:p-3 text-sm sm:text-base">{userProfile.gender || 'Not specified'}</p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Skills & Experience */}
                                <motion.div 
                                    className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-sm border border-slate-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                >
                                    <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center">
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg flex items-center justify-center border border-slate-700/50 mr-2 sm:mr-3">
                                            <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                                        </div>
                                        Skills & Experience
                                    </h3>
                                    <div className="space-y-3 sm:space-y-4">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-2">Skills</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="skills"
                                                    value={formData.skills}
                                                    onChange={handleChange}
                                                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 sm:p-3 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 placeholder-slate-500 text-sm sm:text-base"
                                                    placeholder="e.g., React, Product Management, Sales"
                                                />
                                            ) : (
                                                <div className="flex flex-wrap gap-1 sm:gap-2 bg-slate-800/30 border border-slate-700/30 rounded-lg p-2 sm:p-3">
                                                    {userProfile.skills.length > 0 ? (
                                                        userProfile.skills.map((skill, index) => (
                                                            <span key={index} className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm border border-slate-600/50">
                                                                {skill}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-slate-500 text-sm sm:text-base">No skills specified</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-2">Experience</label>
                                            {isEditing ? (
                                                <textarea
                                                    name="experience"
                                                    rows={3}
                                                    value={formData.experience}
                                                    onChange={handleChange}
                                                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 sm:p-3 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 resize-none placeholder-slate-500 text-sm sm:text-base"
                                                    placeholder="Describe your professional experience..."
                                                />
                                            ) : (
                                                <p className="text-white bg-slate-800/30 border border-slate-700/30 rounded-lg p-2 sm:p-3 text-sm sm:text-base">{(userProfile as any).experience || 'Not specified'}</p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Interests & Preferences */}
                                <motion.div 
                                    className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-sm border border-slate-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.3 }}
                                >
                                    <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center">
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg flex items-center justify-center border border-slate-700/50 mr-2 sm:mr-3">
                                            <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                                        </div>
                                        Interests & Preferences
                                    </h3>
                                    <div className="space-y-3 sm:space-y-4">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-2">Interests</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="interests"
                                                    value={formData.interests}
                                                    onChange={handleChange}
                                                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 sm:p-3 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 placeholder-slate-500 text-sm sm:text-base"
                                                    placeholder="e.g., AI, FinTech, Sustainable Tech"
                                                />
                                            ) : (
                                                <div className="flex flex-wrap gap-1 sm:gap-2 bg-slate-800/30 border border-slate-700/30 rounded-lg p-2 sm:p-3">
                                                    {userProfile.interests.length > 0 ? (
                                                        userProfile.interests.map((interest, index) => (
                                                            <span key={index} className="bg-gradient-to-r from-emerald-700/50 to-emerald-600/50 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm border border-emerald-600/50">
                                                                {interest}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-slate-500 text-sm sm:text-base">No interests specified</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-2">Looking For</label>
                                            {isEditing ? (
                                                <textarea
                                                    name="lookingFor"
                                                    rows={3}
                                                    value={formData.lookingFor}
                                                    onChange={handleChange}
                                                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 sm:p-3 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 resize-none placeholder-slate-500 text-sm sm:text-base"
                                                    placeholder="Describe what you're looking for..."
                                                />
                                            ) : (
                                                <p className="text-white bg-slate-800/30 border border-slate-700/30 rounded-lg p-2 sm:p-3 text-sm sm:text-base">{userProfile.lookingFor}</p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Investor Specific Information */}
                                {userProfile.role === Role.Investor && userProfile.investorProfile && (
                                    <motion.div 
                                        className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-sm border border-slate-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.4 }}
                                    >
                                        <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center">
                                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg flex items-center justify-center border border-slate-700/50 mr-2 sm:mr-3">
                                                <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                                            </div>
                                            Investment Profile
                                        </h3>
                                        <div className="space-y-3 sm:space-y-4">
                                            <div>
                                                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-2">Investment Domains</label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="interestedDomains"
                                                        value={formData.interestedDomains}
                                                        onChange={handleChange}
                                                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 sm:p-3 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 placeholder-slate-500 text-sm sm:text-base"
                                                        placeholder="e.g., SaaS, FinTech, HealthTech"
                                                    />
                                                ) : (
                                                    <div className="flex flex-wrap gap-1 sm:gap-2 bg-slate-800/30 border border-slate-700/30 rounded-lg p-2 sm:p-3">
                                                        {userProfile.investorProfile.interestedDomains.map((domain, index) => (
                                                            <span key={index} className="bg-gradient-to-r from-purple-700/50 to-purple-600/50 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm border border-purple-600/50">
                                                                {domain}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-2">Investment Experience</label>
                                                {isEditing ? (
                                                    <textarea
                                                        name="investmentExperience"
                                                        rows={3}
                                                        value={formData.investmentExperience}
                                                        onChange={handleChange}
                                                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 sm:p-3 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 resize-none placeholder-slate-500 text-sm sm:text-base"
                                                        placeholder="Describe your investment experience..."
                                                    />
                                                ) : (
                                                    <p className="text-white bg-slate-800/30 border border-slate-700/30 rounded-lg p-2 sm:p-3 text-sm sm:text-base">{userProfile.investorProfile.investmentExperience}</p>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-2">Budget Range</label>
                                                    {isEditing ? (
                                                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                                            <input
                                                                type="number"
                                                                name="minBudget"
                                                                value={formData.minBudget}
                                                                onChange={handleChange}
                                                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 sm:p-3 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 placeholder-slate-500 text-sm sm:text-base"
                                                                placeholder="Min"
                                                            />
                                                            <input
                                                                type="number"
                                                                name="maxBudget"
                                                                value={formData.maxBudget}
                                                                onChange={handleChange}
                                                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 sm:p-3 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 placeholder-slate-500 text-sm sm:text-base"
                                                                placeholder="Max"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <p className="text-white bg-slate-800/30 border border-slate-700/30 rounded-lg p-2 sm:p-3 text-sm sm:text-base">${userProfile.investorProfile.budget.min.toLocaleString()} - ${userProfile.investorProfile.budget.max.toLocaleString()}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-2">Equity Range</label>
                                                    {isEditing ? (
                                                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                                            <input
                                                                type="number"
                                                                name="minEquity"
                                                                value={formData.minEquity}
                                                                onChange={handleChange}
                                                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 sm:p-3 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 placeholder-slate-500 text-sm sm:text-base"
                                                                placeholder="Min %"
                                                            />
                                                            <input
                                                                type="number"
                                                                name="maxEquity"
                                                                value={formData.maxEquity}
                                                                onChange={handleChange}
                                                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 sm:p-3 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-300 placeholder-slate-500 text-sm sm:text-base"
                                                                placeholder="Max %"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <p className="text-white bg-slate-800/30 border border-slate-700/30 rounded-lg p-2 sm:p-3 text-sm sm:text-base">{userProfile.investorProfile.expectedEquity.min}% - {userProfile.investorProfile.expectedEquity.max}%</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
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
                </div>
            </div>
        </div>
    );
};

export default Profile;
