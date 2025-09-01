import React, { useState, useEffect } from 'react';
import { User, Role, VerificationStatus } from '../types';
import { UserIcon, BriefcaseIcon, LightbulbIcon, CheckCircleIcon, RocketIcon, ShieldIcon, PhoneIcon } from './icons';
import { verificationService, PhoneVerificationResult } from '../services/verificationService';

type OnboardingData = Omit<User, 'id' | 'avatarUrl' | 'email' | 'connections' | 'pendingConnections'>;

interface OnboardingProps {
    onOnboardingComplete: (user: OnboardingData) => void;
    userProfile: User | null;
    loading?: boolean;
    error?: string | null;
}

const Onboarding: React.FC<OnboardingProps> = ({ onOnboardingComplete, userProfile, loading = false, error = null }) => {
    const [step, setStep] = useState(1);
    const [showVerification, setShowVerification] = useState(false);
    const [tempUserData, setTempUserData] = useState<OnboardingData | null>(null);
    const [verificationStep, setVerificationStep] = useState<'recaptcha' | 'phone' | 'complete'>('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [verificationId, setVerificationId] = useState('');
    const [phoneVerificationLoading, setPhoneVerificationLoading] = useState(false);
    const [phoneVerificationError, setPhoneVerificationError] = useState<string | null>(null);
    const [formData, setFormData] = useState(() => {
        const defaults = {
            name: '',
            role: Role.Founder as Role,
            location: '',
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
        };
        try {
            const raw = localStorage.getItem('onboarding_form');
            if (raw) return { ...defaults, ...JSON.parse(raw) };
        } catch {}
        return defaults;
    });

    const [recaptchaSolved, setRecaptchaSolved] = useState(false);
    const [finalRecaptchaSolved, setFinalRecaptchaSolved] = useState(false);

    // Prefill only once or when the form is empty to avoid overwriting user input
    useEffect(() => {
        const isFormEmpty = !formData.name && !formData.location && !formData.skills && !formData.interests && !formData.experience && !formData.lookingFor;
        if (userProfile && isFormEmpty) {
            setFormData({
                name: userProfile.name,
                role: userProfile.role,
                location: userProfile.location,
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

    // Initialize visible reCAPTCHA when entering phone step so it's shown in the same card
    useEffect(() => {
        if (step === 5 && verificationStep === 'phone') {
            try {
                verificationService.ensureVisibleRecaptcha('human-recaptcha', () => setRecaptchaSolved(true), () => setRecaptchaSolved(false));
            } catch (e) {
                console.error('Failed to initialize visible reCAPTCHA', e);
            }
        }
        return () => {
            try { verificationService.clearRecaptcha('human-recaptcha'); } catch {}
        };
    }, [step, verificationStep]);

    useEffect(() => {
        if (step === 5 && verificationStep === 'complete') {
            try {
                verificationService.ensureVisibleRecaptcha('final-recaptcha', () => setFinalRecaptchaSolved(true), () => setFinalRecaptchaSolved(false));
            } catch (e) {
                console.error('Failed to initialize final step reCAPTCHA', e);
            }
        }
        return () => {
            try { verificationService.clearRecaptcha('final-recaptcha'); } catch {}
        };
    }, [step, verificationStep]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    // Persist drafts to localStorage so state survives remounts
    useEffect(() => {
        try { localStorage.setItem('onboarding_form', JSON.stringify(formData)); } catch {}
    }, [formData]);
    useEffect(() => {
        try { localStorage.setItem('onboarding_step', String(step)); } catch {}
    }, [step]);

    const isNextDisabled = false;

    const handleSubmit = async () => {
        const baseProfile = {
            name: formData.name,
            role: formData.role,
            location: formData.location,
            interests: formData.interests.split(',').map(s => s.trim()).filter(s => s),
            skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
            lookingFor: formData.lookingFor,
        };

        let profileData: OnboardingData;

        if (formData.role === Role.Investor) {
            profileData = {
                ...baseProfile,
                experience: formData.experience,
                investorProfile: {
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
                },
                createdAt: new Date(),
                lastActive: new Date(),
                isSuspended: false,
                isVerified: false,
                verification: { method: 'recaptcha', status: VerificationStatus.Pending }
            };
        } else {
            profileData = {
                ...baseProfile,
                experience: formData.experience,
                createdAt: new Date(),
                lastActive: new Date(),
                isSuspended: false,
                isVerified: false,
                verification: { method: 'recaptcha', status: VerificationStatus.Pending }
            };
        }

        // Store profile data and show verification
        setTempUserData(profileData);
        setShowVerification(true);
    };

    // Remove standalone recaptcha handler since both are now in the same card
    // const handleRecaptchaVerification = async () => {};

    const handlePhoneVerification = async () => {
        if (!phoneNumber.trim()) {
            setPhoneVerificationError('Please enter a phone number');
            return;
        }

        setPhoneVerificationLoading(true);
        setPhoneVerificationError(null);

        try {
            const result = await verificationService.sendPhoneVerification(phoneNumber, 'phone-recaptcha');
            if (result.success && result.verificationId) {
                setVerificationId(result.verificationId);
                setVerificationStep('complete');
            } else {
                setPhoneVerificationError(result.error || 'Failed to send verification code');
            }
        } catch (error) {
            setPhoneVerificationError('Failed to send verification code');
        } finally {
            setPhoneVerificationLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!verificationCode.trim()) {
            setPhoneVerificationError('Please enter the verification code');
            return;
        }

        setPhoneVerificationLoading(true);
        setPhoneVerificationError(null);

        try {
            const result = await verificationService.verifyPhoneCode(verificationId, verificationCode);
            if (result.success) {
                // Both reCAPTCHA and phone verification passed
                if (tempUserData) {
                    tempUserData.isVerified = true;
                    tempUserData.verification = { 
                        method: 'phone', 
                        status: VerificationStatus.Verified, 
                        verifiedAt: new Date(),
                        phoneNumber: phoneNumber
                    };
                    onOnboardingComplete(tempUserData);
                }
            } else {
                setPhoneVerificationError(result.error || 'Invalid verification code');
            }
        } catch (error) {
            setPhoneVerificationError('Failed to verify code');
        } finally {
            setPhoneVerificationLoading(false);
        }
    };

    const handleSkipPhoneVerification = () => {
        // User can skip phone verification, account will be marked as pending
        if (tempUserData) {
            tempUserData.isVerified = false;
            tempUserData.verification = { 
                method: 'recaptcha', 
                status: VerificationStatus.Pending 
            };
            onOnboardingComplete(tempUserData);
        }
    };

    const steps = [
    { title: 'Basic Info', description: 'Tell us about yourself', icon: <UserIcon className="w-5 h-5" /> },
    { title: 'Experience', description: 'Share your background', icon: <BriefcaseIcon className="w-5 h-5" /> },
    { title: 'Preferences', description: 'What are you looking for?', icon: <LightbulbIcon className="w-5 h-5" /> },
    { title: 'Review', description: 'Review your profile', icon: <CheckCircleIcon className="w-5 h-5" /> }
    ];

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                {/* Progress */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-slate-400">Step {step} of 4</span>
                        <span className="text-sm text-slate-400">{Math.round((step / 4) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div 
                            className="bg-gradient-to-r from-slate-500 to-slate-400 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${(step / 4) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Step Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-3">
                        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center mr-3">
                            {steps[step - 1].icon}
                        </div>
                        <h1 className="text-2xl font-bold text-white">{steps[step - 1].title}</h1>
                    </div>
                    <p className="text-slate-400">{steps[step - 1].description}</p>
                </div>

                {/* Form Content */}
                <div className="space-y-4">
                    {step === 1 && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    value={formData.name} 
                                    onChange={handleChange} 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all" 
                                    placeholder="Enter your full name" 
                                    required 
                                            {Object.values(Role).map(role => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                <select 
                                    name="role" 
                                    value={formData.role} 
                                    onChange={handleChange} 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all" 
                                    required
                                >
                                    {Object.values(Role).map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                                <input 
                                    type="text" 
                                    name="location" 
                                    value={formData.location} 
                                    onChange={handleChange} 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all" 
                                    placeholder="City, Country" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Skills</label>
                                <input 
                                    type="text" 
                                    name="skills" 
                                    value={formData.skills} 
                                    onChange={handleChange} 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all" 
                                    placeholder="e.g., React, Product Management, Sales" 
                                    required 
                                />
                            </div>
                        </>
                                                {Object.values(Role).map(role => <option key={role} value={role}>{role}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                                            <input 
                                                type="text" 
                                                name="location" 
                                                value={formData.location} 
                                                onChange={handleChange} 
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all" 
                                                placeholder="City, Country" 
                                                required 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Skills</label>
                                            <input 
                                                type="text" 
                                                name="skills" 
                                                value={formData.skills} 
                                                onChange={handleChange} 
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all" 
                                                placeholder="e.g., React, Product Management, Sales" 
                                                required 
                                            />
                                        </div>
                                    </>
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Skills</label>
                                <input 
                                    type="text" 
                                    name="skills" 
                                    value={formData.skills} 
                                    onChange={handleChange} 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all" 
                                    placeholder="e.g., React, Product Management, Sales" 
                                    required 
                                />
                            </div>
                        </>
                    )}
                    {step === 2 && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Experience</label>
                                <textarea 
                                    name="experience" 
                                    rows={3} 
                                    value={formData.experience} 
                                    onChange={handleChange} 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all resize-none" 
                                    placeholder="Describe your professional experience..." 
                                    required
                                ></textarea>
                            </div>
                        </>
                    )}
                    {/* Only render each step once, no duplicates */}

                    {step === 3 && formData.role === Role.Investor && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Min Budget ($)</label>
                                    <input 
                                        type="number" 
                                        name="minBudget" 
                                        value={formData.minBudget} 
                                        onChange={handleChange} 
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all" 
                                        placeholder="25000" 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Max Budget ($)</label>
                                    <input 
                                        type="number" 
                                        name="maxBudget" 
                                        value={formData.maxBudget} 
                                        onChange={handleChange} 
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all" 
                                        placeholder="100000" 
                                        required 
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Min Equity (%)</label>
                                    <input 
                                        type="number" 
                                        name="minEquity" 
                                        value={formData.minEquity} 
                                        onChange={handleChange} 
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all" 
                                        placeholder="5" 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Max Equity (%)</label>
                                    <input 
                                        type="number" 
                                        name="maxEquity" 
                                        value={formData.maxEquity} 
                                        onChange={handleChange} 
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all" 
                                        placeholder="15" 
                                        required 
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {step === 3 && formData.role !== Role.Investor && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Interests</label>
                                <input 
                                    type="text" 
                                    name="interests" 
                                    value={formData.interests} 
                                    onChange={handleChange} 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all" 
                                    placeholder="e.g., AI, FinTech, Sustainable Tech" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Looking for in a co-founder</label>
                                <textarea 
                                    name="lookingFor" 
                                    rows={3} 
                                    value={formData.lookingFor} 
                                    onChange={handleChange} 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all resize-none" 
                                    placeholder="Describe your ideal co-founder..." 
                                    required
                                ></textarea>
                            </div>
                        </>
                    )}

                    {step === 4 && (
                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Profile Summary</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Name:</span>
                                    <span className="text-white">{formData.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Role:</span>
                                    <span className="text-white">{formData.role}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Location:</span>
                                    <span className="text-white">{formData.location}</span>
                                </div>
                                {formData.role === Role.Investor ? (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Domains:</span>
                                            <span className="text-white">{formData.interestedDomains}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Budget:</span>
                                            <span className="text-white">${formData.minBudget} - ${formData.maxBudget}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Skills:</span>
                                            <span className="text-white">{formData.skills}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Interests:</span>
                                            <span className="text-white">{formData.interests}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Account Verification</h3>
                            
                            {verificationStep === 'phone' && (
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 mx-auto bg-slate-700 rounded-full flex items-center justify-center">
                                        <PhoneIcon className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-medium text-white mb-2">Verify You're Human & Your Phone (Optional)</h4>
                                        <p className="text-slate-400 text-sm leading-relaxed">
                                            Enter your phone number and complete the reCAPTCHA below.
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="Enter phone number (e.g., +1234567890)"
                                            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                        />

                                        {/* Human visible reCAPTCHA inside the same card */}
                                        <div id="human-recaptcha" className="flex justify-center"></div>

                                        {/* Phone reCAPTCHA container (invisible) */}
                                        <div id="phone-recaptcha" className="hidden" />
                                        
                                        {/* Rate limit warning */}
                                        {!verificationService.canAttemptVerification() && (
                                            <div className="p-3 bg-amber-900/30 border border-amber-700/30 rounded-lg">
                                                <p className="text-amber-300 text-sm">
                                                    ⏰ Rate limit reached. Please wait {Math.ceil(verificationService.getTimeUntilNextAttempt() / 60000)} minute{Math.ceil(verificationService.getTimeUntilNextAttempt() / 60000) > 1 ? 's' : ''} before trying again.
                                                </p>
                                            </div>
                                        )}

                                        {!recaptchaSolved && (
                                            <p className="text-slate-400 text-xs text-center">Complete the reCAPTCHA to enable sending the code.</p>
                                        )}
                                        
                                        <button
                                            onClick={handlePhoneVerification}
                                            disabled={phoneVerificationLoading || !verificationService.canAttemptVerification() || !recaptchaSolved}
                                            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {phoneVerificationLoading ? 'Sending...' : 'Send Verification Code'}
                                        </button>
                                        
                                        <button
                                            onClick={handleSkipPhoneVerification}
                                            className="w-full px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-xl transition-all duration-300 font-medium"
                                        >
                                            Skip Phone Verification
                                        </button>
                                    </div>
                                    
                                    {phoneVerificationError && (
                                        <div className="p-3 bg-red-900/30 border border-red-700/30 rounded-lg">
                                            <p className="text-red-300 text-sm">{phoneVerificationError}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {verificationStep === 'complete' && (
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 mx-auto bg-green-600 rounded-full flex items-center justify-center">
                                        <CheckCircleIcon className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-medium text-white mb-2">Enter Verification Code</h4>
                                        <p className="text-slate-400 text-sm leading-relaxed">
                                            We've sent a 6-digit code to {verificationService.formatPhoneNumber(phoneNumber)}
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            placeholder="Enter 6-digit code"
                                            maxLength={6}
                                            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-center text-lg tracking-widest"
                                        />

                                        {/* Visible reCAPTCHA shown below code input */}
                                        <div id="final-recaptcha" className="flex justify-center"></div>
                                        {!finalRecaptchaSolved && (
                                            <p className="text-slate-400 text-xs text-center">Complete the reCAPTCHA to enable verification.</p>
                                        )}
                                        
                                        <button
                                            onClick={handleVerifyCode}
                                            disabled={phoneVerificationLoading || !finalRecaptchaSolved}
                                            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl transition-all duration-300 font-medium disabled:opacity-50"
                                        >
                                            {phoneVerificationLoading ? 'Verifying...' : 'Verify & Complete'}
                                        </button>
                                        
                                        <button
                                            onClick={handleSkipPhoneVerification}
                                            className="w-full px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-xl transition-all duration-300 font-medium"
                                        >
                                            Skip & Complete
                                        </button>
                                    </div>
                                    
                                    {phoneVerificationError && (
                                        <div className="text-red-400 text-sm">{phoneVerificationError}</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex justify-between mt-8">
                    <button 
                        onClick={prevStep} 
                        disabled={step === 1} 
                        className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Back
                    </button>
                    
                    {step < 5 ? (
                        <button 
                            onClick={nextStep} 
                            className={`px-6 py-2 text-white rounded-lg transition-colors ${isNextDisabled ? 'bg-slate-600/60 cursor-not-allowed' : 'bg-slate-600 hover:bg-slate-500'}`}
                            disabled={isNextDisabled}
                        >
                            Next
                        </button>
                    ) : (
                        <button 
                            onClick={handleSubmit} 
                            disabled={loading} 
                            className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                </svg>
                            ) : (
                                <RocketIcon className="w-4 h-4" />
                            )}
                            Verify & Complete
                        </button>
                    )}
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-900/30 border border-red-700/30 text-red-300 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Onboarding;