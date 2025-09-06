import React, { useState, useEffect, useRef } from 'react';
import { User, Role } from '../types';
import { UserIcon, BriefcaseIcon, LightbulbIcon, CheckCircleIcon, RocketIcon } from './icons';
import { firestoreService } from '../services/firestoreService';
import { getAllCountries, getStatesByCountry, getCitiesByState, Country, State } from '../data/locations-comprehensive';
import SearchableDropdown from './SearchableDropdown';

type OnboardingData = Omit<User, 'id' | 'avatarUrl' | 'email' | 'connections' | 'pendingConnections'>;

interface OnboardingProps {
    onOnboardingComplete: (user: OnboardingData) => void;
    userProfile: User | null;
    loading?: boolean;
    error?: string | null;
}

const Onboarding: React.FC<OnboardingProps> = ({ onOnboardingComplete, userProfile, loading = false, error = null }) => {
    const storageKey = userProfile ? `onboarding:${userProfile.id}` : 'onboarding:anonymous';
    const storageStepKey = `${storageKey}:step`;
    const [initialized, setInitialized] = useState(false);
    const [usernameValidation, setUsernameValidation] = useState<{ isValid: boolean; error?: string } | null>(null);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    
    const [locationValidation, setLocationValidation] = useState<{ isValid: boolean; error?: string } | null>(null);
    const [isCheckingLocation, setIsCheckingLocation] = useState(false);
    
    const [phoneValidation, setPhoneValidation] = useState<{ isValid: boolean; error?: string } | null>(null);
    const [isCheckingPhone, setIsCheckingPhone] = useState(false);
    
    const [selectedCountryCode, setSelectedCountryCode] = useState<string>('+1');
    const [isCountryCodeOpen, setIsCountryCodeOpen] = useState(false);
    
    // Country codes for phone dropdown
    const countryCodes = [
        { code: '+1', name: 'United States', country: 'US', flag: 'US' },
        { code: '+91', name: 'India', country: 'IN', flag: 'IN' },
        { code: '+44', name: 'United Kingdom', country: 'GB', flag: 'GB' },
        { code: '+61', name: 'Australia', country: 'AU', flag: 'AU' },
        { code: '+49', name: 'Germany', country: 'DE', flag: 'DE' },
        { code: '+33', name: 'France', country: 'FR', flag: 'FR' },
        { code: '+39', name: 'Italy', country: 'IT', flag: 'IT' },
        { code: '+34', name: 'Spain', country: 'ES', flag: 'ES' },
        { code: '+31', name: 'Netherlands', country: 'NL', flag: 'NL' },
        { code: '+86', name: 'China', country: 'CN', flag: 'CN' },
        { code: '+81', name: 'Japan', country: 'JP', flag: 'JP' },
        { code: '+82', name: 'South Korea', country: 'KR', flag: 'KR' },
        { code: '+55', name: 'Brazil', country: 'BR', flag: 'BR' },
        { code: '+54', name: 'Argentina', country: 'AR', flag: 'AR' },
        { code: '+27', name: 'South Africa', country: 'ZA', flag: 'ZA' },
        { code: '+234', name: 'Nigeria', country: 'NG', flag: 'NG' },
        { code: '+971', name: 'UAE', country: 'AE', flag: 'AE' },
        { code: '+966', name: 'Saudi Arabia', country: 'SA', flag: 'SA' },
        { code: '+52', name: 'Mexico', country: 'MX', flag: 'MX' },
        { code: '+64', name: 'New Zealand', country: 'NZ', flag: 'NZ' },
    ];
    
    // Location dropdown states
    const [selectedCountry, setSelectedCountry] = useState<string>('');
    const [selectedState, setSelectedState] = useState<string>('');
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [availableStates, setAvailableStates] = useState<State[]>([]);
    const [availableCities, setAvailableCities] = useState<string[]>([]);
    const [step, setStep] = useState(() => {
        const saved = typeof window !== 'undefined' ? window.localStorage.getItem(storageStepKey) : null;
        const parsed = saved ? parseInt(saved, 10) : NaN;
        return Number.isFinite(parsed) && parsed >= 1 && parsed <= 5 ? parsed : 1;
    });
    const [formData, setFormData] = useState(() => {
        try {
            const saved = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    name: parsed.name || '',
                    username: parsed.username || '',
                    role: parsed.role || Role.Founder,
                    location: parsed.location || '',
                    country: parsed.country || '',
                    state: parsed.state || '',
                    city: parsed.city || '',
                    dateOfBirth: parsed.dateOfBirth || '',
                    gender: parsed.gender || '',
                    phone: parsed.phone || '',
                    interests: parsed.interests || '',
                    skills: parsed.skills || '',
                    experience: parsed.experience || '',
                    lookingFor: parsed.lookingFor || '',
                    interestedDomains: parsed.interestedDomains || '',
                    investmentExperience: parsed.investmentExperience || '',
                    minBudget: parsed.minBudget || '',
                    maxBudget: parsed.maxBudget || '',
                    minEquity: parsed.minEquity || '',
                    maxEquity: parsed.maxEquity || '',
                };
            }
        } catch (e) {
            // ignore and use defaults
        }
        return {
            name: '',
            username: '',
            role: Role.Founder,
            location: '',
            country: '',
            state: '',
            city: '',
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
        };
    });

    useEffect(() => {
        if (userProfile && !initialized) {
            // Only seed from profile if we have not initialized from storage yet
            setFormData(prev => {
                const isPristine = !prev.name && !prev.location && !prev.skills && !prev.interests && !prev.experience && !prev.lookingFor && !prev.phone;
                if (!isPristine) return prev;
                return {
                    name: userProfile.name,
                    username: userProfile.username || '',
                    role: userProfile.role,
                    location: userProfile.location,
                    dateOfBirth: userProfile.dateOfBirth || '',
                    gender: userProfile.gender || '',
                    phone: (userProfile as any).phone || '',
                    interests: (userProfile.interests || []).join(', '),
                    skills: (userProfile.skills || []).join(', '),
                    experience: (userProfile as any).experience || '',
                    lookingFor: userProfile.lookingFor,
                    interestedDomains: userProfile.investorProfile?.interestedDomains?.join(', ') || '',
                    investmentExperience: userProfile.investorProfile?.investmentExperience || '',
                    minBudget: userProfile.investorProfile?.budget?.min != null ? String(userProfile.investorProfile.budget.min) : '',
                    maxBudget: userProfile.investorProfile?.budget?.max != null ? String(userProfile.investorProfile.budget.max) : '',
                    minEquity: userProfile.investorProfile?.expectedEquity?.min != null ? String(userProfile.investorProfile.expectedEquity.min) : '',
                    maxEquity: userProfile.investorProfile?.expectedEquity?.max != null ? String(userProfile.investorProfile.expectedEquity.max) : '',
                };
            });
            setInitialized(true);
        }
    }, [userProfile, initialized]);

    // Persist form and step to storage to prevent resets across modal open/close or re-mounts
    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(storageKey, JSON.stringify(formData));
            }
        } catch (e) {}
    }, [formData, storageKey]);

    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(storageStepKey, String(step));
            }
        } catch (e) {}
    }, [step, storageStepKey]);

    // Trigger username validation if username is already set (e.g., from localStorage)
    useEffect(() => {
        if (formData.username.trim() && !usernameValidation && !isCheckingUsername) {
            // Trigger validation without changing form data
            validateUsername(formData.username);
        }
    }, [formData.username, usernameValidation, isCheckingUsername]);

    // Auto-trigger validation when username changes
    useEffect(() => {
        if (formData.username.trim() && !isCheckingUsername) {
            // Clear previous validation and trigger new one
            setUsernameValidation(null);
            validateUsername(formData.username);
        }
    }, [formData.username]);

    // Close country code dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (countryCodeDropdownRef.current && !countryCodeDropdownRef.current.contains(event.target as Node)) {
                setIsCountryCodeOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Debounced validation refs
    const validateUsernameDebounced = useRef<NodeJS.Timeout | null>(null);
    const validateLocationDebounced = useRef<NodeJS.Timeout | null>(null);
    const validatePhoneDebounced = useRef<NodeJS.Timeout | null>(null);
    const countryCodeDropdownRef = useRef<HTMLDivElement>(null);
    
    const validateUsername = async (username: string) => {
        // Clear previous timeout
        if (validateUsernameDebounced.current) {
            clearTimeout(validateUsernameDebounced.current);
        }
        
        // If username is empty, clear validation
        if (!username.trim()) {
            setUsernameValidation(null);
            return;
        }
        
        // Set loading state
        setIsCheckingUsername(true);
        
        // Debounce validation
        validateUsernameDebounced.current = setTimeout(async () => {
            try {
                // First validate format
                const formatValidation = firestoreService.validateUsername(username);
                
                if (!formatValidation.isValid) {
                    setUsernameValidation(formatValidation);
                    setIsCheckingUsername(false);
                    return;
                }
                
                // Check availability
                try {
                    const availability = await firestoreService.checkUsernameAvailability(username);
                    setUsernameValidation(availability);
                } catch (dbError) {
                    console.error('Database check failed:', dbError);
                    // If database check fails, show error but don't allow proceeding
                    setUsernameValidation({ 
                        isValid: false, 
                        error: 'Unable to verify username availability. Please try again.' 
                    });
                }
            } catch (error) {
                console.error('Error validating username:', error);
                setUsernameValidation({ isValid: false, error: 'Error checking username availability' });
            } finally {
                setIsCheckingUsername(false);
            }
        }, 500);
    };

    const validateLocation = async (location: string) => {
        // Clear previous timeout
        if (validateLocationDebounced.current) {
            clearTimeout(validateLocationDebounced.current);
        }
        
        // If location is empty, clear validation
        if (!location.trim()) {
            setLocationValidation(null);
            return;
        }
        
        // Set loading state
        setIsCheckingLocation(true);
        
        // Debounce validation
        validateLocationDebounced.current = setTimeout(async () => {
            try {
                // Validate location format
                const validation = firestoreService.validateLocation(location);
                setLocationValidation(validation);
            } catch (error) {
                console.error('Error validating location:', error);
                setLocationValidation({ isValid: false, error: 'Error validating location' });
            } finally {
                setIsCheckingLocation(false);
            }
        }, 300);
    };

    const validatePhone = async (phoneNumber: string, countryCode: string) => {
        // Clear previous timeout
        if (validatePhoneDebounced.current) {
            clearTimeout(validatePhoneDebounced.current);
        }
        
        // If phone number is empty, clear validation
        if (!phoneNumber.trim()) {
            setPhoneValidation(null);
            return;
        }
        
        // Set loading state
        setIsCheckingPhone(true);
        
        // Debounce validation
        validatePhoneDebounced.current = setTimeout(async () => {
            try {
                // First validate format
                const formatValidation = firestoreService.validatePhoneNumber(phoneNumber, countryCode);
                if (!formatValidation.isValid) {
                    setPhoneValidation(formatValidation);
                    setIsCheckingPhone(false);
                    return;
                }

                // Then check availability in database
                const availabilityCheck = await firestoreService.checkPhoneNumberAvailability(formatValidation.formatted || phoneNumber);
                if (!availabilityCheck.available) {
                    setPhoneValidation({ isValid: false, error: availabilityCheck.error });
                } else {
                    setPhoneValidation({ isValid: true });
                }
            } catch (error) {
                console.error('Error validating phone number:', error);
                setPhoneValidation({ isValid: false, error: 'Error validating phone number' });
            } finally {
                setIsCheckingPhone(false);
            }
        }, 500);
    };
    
    const handleUsernameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newUsername = e.target.value;
        setFormData(prev => ({ ...prev, username: newUsername }));
        
        // Clear validation state when user starts typing
        if (newUsername !== formData.username) {
            setUsernameValidation(null);
        }
        
        // Trigger validation after a short delay to allow state update
        setTimeout(() => {
            validateUsername(newUsername);
        }, 100);
    };

    const handleLocationChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newLocation = e.target.value;
        setFormData(prev => ({ ...prev, location: newLocation }));
        
        // Clear validation state when user starts typing
        if (newLocation !== formData.location) {
            setLocationValidation(null);
        }
        
        // Trigger validation after a short delay to allow state update
        setTimeout(() => {
            validateLocation(newLocation);
        }, 100);
    };

    // Location dropdown handlers
    const handleCountryChange = (countryCode: string) => {
        setSelectedCountry(countryCode);
        setSelectedState('');
        setSelectedCity('');
        
        // Auto-set country code for phone number
        const countryCodeForPhone = firestoreService.getCountryCode(countryCode);
        setSelectedCountryCode(countryCodeForPhone);
        
        const currentPhone = formData.phone || '';
        
        // If phone number doesn't have a country code, add it
        if (currentPhone && !currentPhone.startsWith('+')) {
            setFormData(prev => ({ 
                ...prev, 
                country: countryCode,
                state: '',
                city: '',
                location: countryCode ? firestoreService.formatLocationString(countryCode, '', '') : '',
                phone: countryCodeForPhone + currentPhone.replace(/[^\d]/g, '')
            }));
        } else {
            setFormData(prev => ({ 
                ...prev, 
                country: countryCode,
                state: '',
                city: '',
                location: countryCode ? firestoreService.formatLocationString(countryCode, '', '') : ''
            }));
        }
        
        // Update available states
        const states = getStatesByCountry(countryCode);
        setAvailableStates(states);
        setAvailableCities([]);
        
        // Clear location validation
        setLocationValidation(null);
        
        // Validate phone number with new country code
        if (formData.phone) {
            setTimeout(() => {
                validatePhone(formData.phone, countryCode);
            }, 100);
        }
    };

    const handleStateChange = (stateCode: string) => {
        setSelectedState(stateCode);
        setSelectedCity('');
        
        // Update form data
        setFormData(prev => ({ 
            ...prev, 
            state: stateCode,
            city: '',
            location: selectedCountry ? firestoreService.formatLocationString(selectedCountry, stateCode, '') : ''
        }));
        
        // Update available cities
        const cities = getCitiesByState(selectedCountry, stateCode);
        setAvailableCities(cities);
        
        // Clear location validation
        setLocationValidation(null);
    };

    const handleCityChange = (city: string) => {
        setSelectedCity(city);
        
        // Update form data
        setFormData(prev => ({ 
            ...prev, 
            city: city,
            location: selectedCountry ? firestoreService.formatLocationString(selectedCountry, selectedState, city) : ''
        }));
        
        // Validate the complete location
        setTimeout(() => {
            const validation = firestoreService.validateLocationFields(selectedCountry, selectedState, city);
            setLocationValidation(validation);
        }, 100);
    };

    const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPhone = e.target.value;
        setFormData(prev => ({ ...prev, phone: newPhone }));
        
        // Clear validation state when user starts typing
        if (newPhone !== formData.phone) {
            setPhoneValidation(null);
        }
        
        // Trigger validation after a short delay to allow state update
        setTimeout(() => {
            validatePhone(newPhone, selectedCountry);
        }, 100);
    };

    const handleCountryCodeChange = (newCountryCode: string) => {
        setSelectedCountryCode(newCountryCode);
        setIsCountryCodeOpen(false);
        
        // Update phone number with new country code if it doesn't already have one
        const currentPhone = formData.phone || '';
        if (currentPhone && !currentPhone.startsWith('+')) {
            setFormData(prev => ({ 
                ...prev, 
                phone: newCountryCode + currentPhone.replace(/[^\d]/g, '')
            }));
        }
        
        // Validate phone number with new country code
        if (formData.phone) {
            setTimeout(() => {
                validatePhone(formData.phone, selectedCountry);
            }, 100);
        }
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    // Helper function to safely check if a field is not empty
    const isFieldNotEmpty = (field: any): boolean => {
        return field && typeof field === 'string' && field.trim() !== '';
    };

    // Validation functions
    const isStep1Valid = () => {
        // Debug logging
        console.log('formData.country:', formData.country, 'type:', typeof formData.country);
        console.log('formData.state:', formData.state, 'type:', typeof formData.state);
        
        const basicFieldsValid = isFieldNotEmpty(formData.name) && 
               isFieldNotEmpty(formData.username) && 
               formData.role !== '' && 
               isFieldNotEmpty(formData.country) && 
               isFieldNotEmpty(formData.state) && 
               formData.dateOfBirth !== '' && 
               formData.gender !== '';
        
        // Check username validation
        let usernameValid = true;
        if (isFieldNotEmpty(formData.username)) {
            const formatValidation = firestoreService.validateUsername(formData.username);
            if (!formatValidation.isValid) {
                usernameValid = false;
            } else {
                if (isCheckingUsername) {
                    usernameValid = true;
                } else if (usernameValidation === null) {
                    usernameValid = true;
                } else if (usernameValidation.isValid === false) {
                    usernameValid = false;
                } else {
                    usernameValid = true;
                }
            }
        }
        
        // Check location validation
        let locationValid = true;
        if (formData.country && formData.state && typeof formData.country === 'string' && typeof formData.state === 'string') {
            const formatValidation = firestoreService.validateLocationFields(formData.country, formData.state, formData.city);
            if (!formatValidation.isValid) {
                locationValid = false;
            } else {
                if (isCheckingLocation) {
                    locationValid = true;
                } else if (locationValidation === null) {
                    locationValid = true;
                } else if (locationValidation.isValid === false) {
                    locationValid = false;
                } else {
                    locationValid = true;
                }
            }
        }
        
        // Check phone validation
        let phoneValid = true;
        if (isFieldNotEmpty(formData.phone)) {
            if (isCheckingPhone) {
                phoneValid = true;
            } else if (phoneValidation === null) {
                phoneValid = true;
            } else if (phoneValidation.isValid === false) {
                phoneValid = false;
            } else {
                phoneValid = true;
            }
        }
        
        return basicFieldsValid && usernameValid && locationValid && phoneValid && !isCheckingUsername && !isCheckingLocation && !isCheckingPhone;
    };

    const isStep2Valid = () => {
        if (formData.role === Role.Investor) {
            return isFieldNotEmpty(formData.interestedDomains) && 
                   isFieldNotEmpty(formData.investmentExperience);
        } else {
            return isFieldNotEmpty(formData.skills) && 
                   isFieldNotEmpty(formData.experience);
        }
    };

    const isStep3Valid = () => {
        if (formData.role === Role.Investor) {
            return formData.minBudget !== '' && 
                   formData.maxBudget !== '' && 
                   formData.minEquity !== '' && 
                   formData.maxEquity !== '';
        } else {
            return isFieldNotEmpty(formData.interests) && 
                   isFieldNotEmpty(formData.lookingFor);
        }
    };

    const canProceedToNextStep = () => {
        switch (step) {
            case 1: return isStep1Valid();
            case 2: return isStep2Valid();
            case 3: return isStep3Valid();
            default: return true;
        }
    };

    const handleSubmit = () => {
        const baseProfile = {
            name: formData.name,
            username: formData.username.trim().toLowerCase(),
            role: formData.role,
            location: formData.location,
            dateOfBirth: formData.dateOfBirth,
            gender: formData.gender,
            phone: formData.phone,
            interests: formData.interests.split(',').map(s => s.trim()).filter(s => s),
            skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
            lookingFor: formData.lookingFor,
        };

        let profileData: OnboardingData;

        if (formData.role === Role.Investor) {
            profileData = {
                ...baseProfile,
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
                }
            };
        } else {
            profileData = {
                ...baseProfile,
                experience: formData.experience,
            };
        }
        onOnboardingComplete(profileData);
    };

    const steps = [
        { title: 'Basic Info', description: 'Tell us about yourself', icon: <UserIcon className="w-5 h-5" /> },
        { title: 'Experience', description: 'Share your background', icon: <BriefcaseIcon className="w-5 h-5" /> },
        { title: 'Preferences', description: 'What are you looking for?', icon: <LightbulbIcon className="w-5 h-5" /> },
        { title: 'Passkey (optional)', description: 'Set up secure passkey sign-in', icon: <CheckCircleIcon className="w-5 h-5" /> },
        { title: 'Review', description: 'Review your profile', icon: <CheckCircleIcon className="w-5 h-5" /> }
    ];

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                {/* Progress */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-slate-400">Step {step} of 5</span>
                        <span className="text-sm text-slate-400">{Math.round((step / 5) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div 
                            className="bg-gradient-to-r from-slate-500 to-slate-400 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${(step / 5) * 100}%` }}
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
                                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name *</label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    value={formData.name} 
                                    onChange={handleChange} 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all" 
                                    placeholder="Enter your full name" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Username *</label>
                                <input 
                                    type="text" 
                                    name="username" 
                                    value={formData.username} 
                                    onChange={handleUsernameChange} 
                                    className={`w-full bg-slate-800 border rounded-lg p-3 text-white focus:ring-2 transition-all ${
                                        !formData.username.trim() ? 'border-slate-700 focus:ring-slate-500 focus:border-slate-500' :
                                        isCheckingUsername ? 'border-yellow-500 focus:ring-yellow-500 focus:border-yellow-500' :
                                        usernameValidation === null ? 'border-slate-700 focus:ring-slate-500 focus:border-slate-500' :
                                        usernameValidation.isValid ? 'border-green-500 focus:ring-green-500 focus:border-green-500' : 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                    }`}
                                    placeholder="Enter your username" 
                                    required 
                                />
                                <p className="text-xs text-slate-400 mt-1">This will be your unique identifier on the platform</p>
                                {formData.username.trim() && (
                                    <div className="text-xs mt-1 space-y-1">
                                        {(() => {
                                            const formatValidation = firestoreService.validateUsername(formData.username);
                                            return formatValidation.isValid ? (
                                                <div className="text-green-400">✓ Username format is valid</div>
                                            ) : (
                                                <div className="text-red-400">{formatValidation.error}</div>
                                            );
                                        })()}
                                        {isCheckingUsername && (
                                            <div className="flex items-center space-x-2 text-slate-400">
                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-slate-400"></div>
                                                <span>Checking availability...</span>
                                            </div>
                                        )}
                                        {usernameValidation && !isCheckingUsername && (
                                            <div className={`${
                                                usernameValidation.isValid ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                                {usernameValidation.isValid ? '✓ Username is available' : usernameValidation.error}
                                                {!usernameValidation.isValid && usernameValidation.error?.includes('already taken') && (
                                                    <div className="mt-2">
                                                        <p className="text-slate-400 text-xs mb-1">Suggested alternatives:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {(() => {
                                                                // Generate more unique suggestions with random numbers
                                                                const baseSuggestions = firestoreService.generateSuggestedUsernames(formData.name, userProfile?.email || 'user@example.com').slice(0, 2);
                                                                const uniqueSuggestions = [
                                                                    ...baseSuggestions,
                                                                    `${formData.name.toLowerCase().replace(/\s+/g, '')}${Math.floor(Math.random() * 1000)}`,
                                                                    `${formData.name.toLowerCase().replace(/\s+/g, '')}${Math.floor(Math.random() * 1000)}`
                                                                ];
                                                                
                                                                return uniqueSuggestions.map((suggestion, index) => (
                                                                    <button
                                                                        key={index}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setFormData(prev => ({ ...prev, username: suggestion }));
                                                                            setUsernameValidation(null);
                                                                            validateUsername(suggestion);
                                                                        }}
                                                                        className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded transition-colors"
                                                                    >
                                                                        {suggestion}
                                                                    </button>
                                                                ));
                                                            })()}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {formData.username.trim() && !isCheckingUsername && usernameValidation === null && (
                                            <div className="text-slate-400">
                                                Username will be checked for availability
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Role *</label>
                                <select 
                                    name="role" 
                                    value={formData.role} 
                                    onChange={handleChange} 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all" 
                                    required
                                >
                                    {Object.values(Role).map(role => <option key={role} value={role}>{role}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Location *</label>
                                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
                                    {/* Country Dropdown */}
                                    <div className="space-y-1 flex-1">
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Country *</label>
                                        <SearchableDropdown
                                            options={getAllCountries().map(country => ({
                                                value: country.code,
                                                label: country.name
                                            }))}
                                            value={selectedCountry}
                                            onChange={handleCountryChange}
                                            placeholder="Select Country"
                                            searchPlaceholder="Search countries..."
                                            emptyMessage="No countries found"
                                            required
                                            allowClear
                                        />
                                    </div>

                                    {/* State Dropdown */}
                                    <div className="space-y-1 flex-1">
                                        <label className="block text-xs font-medium text-slate-400 mb-1">State/Province *</label>
                                        <SearchableDropdown
                                            options={availableStates.map(state => ({
                                                value: state.code,
                                                label: state.name
                                            }))}
                                            value={selectedState}
                                            onChange={handleStateChange}
                                            placeholder="Select State/Province"
                                            searchPlaceholder="Search states..."
                                            emptyMessage="No states found"
                                            disabled={availableStates.length === 0}
                                            required
                                            allowClear
                                        />
                                    </div>

                                    {/* City Dropdown */}
                                    <div className="space-y-1 flex-1">
                                        <label className="block text-xs font-medium text-slate-400 mb-1">City</label>
                                        <SearchableDropdown
                                            options={availableCities.map(city => ({
                                                value: city,
                                                label: city
                                            }))}
                                            value={selectedCity}
                                            onChange={handleCityChange}
                                            placeholder="Select City (Optional)"
                                            searchPlaceholder="Search cities..."
                                            emptyMessage="No cities found"
                                            disabled={availableCities.length === 0}
                                            allowClear
                                            className="border-slate-700/50 focus:ring-slate-500/50 focus:border-slate-500/50"
                                        />
                                    </div>
                                </div>
                                
                                {/* Location Summary */}
                                {formData.location && (
                                    <div className="mt-3 p-2 bg-slate-800/50 rounded-lg">
                                        <p className="text-xs text-slate-400">Selected Location:</p>
                                        <p className="text-sm text-white font-medium">{formData.location}</p>
                                    </div>
                                )}

                                {/* Validation Messages */}
                                {locationValidation && (
                                    <div className={`text-xs mt-2 ${
                                        locationValidation.isValid ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                        {locationValidation.isValid ? '✓ Location selected' : locationValidation.error}
                                    </div>
                                )}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Date of Birth *</label>
                                <input 
                                    type="date" 
                                    name="dateOfBirth" 
                                    value={formData.dateOfBirth} 
                                    onChange={handleChange} 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Gender *</label>
                                <select 
                                    name="gender" 
                                    value={formData.gender} 
                                    onChange={handleChange} 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all" 
                                    required
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Phone (for connections)</label>
                                <div className="flex gap-3">
                                    {/* Country Code Dropdown */}
                                    <div className="w-40 relative" ref={countryCodeDropdownRef}>
                                        <button
                                            type="button"
                                            onClick={() => setIsCountryCodeOpen(!isCountryCodeOpen)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 pr-10 text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all text-sm font-medium cursor-pointer hover:border-slate-600 flex items-center justify-between"
                                        >
                                            <span className="flex items-center gap-2">
                                                <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs font-medium">
                                                    {countryCodes.find(c => c.code === selectedCountryCode)?.flag}
                                                </span>
                                                {selectedCountryCode}
                                            </span>
                                            <svg className={`w-4 h-4 text-slate-400 transition-transform ${isCountryCodeOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        
                                        {/* Dropdown Options */}
                                        {isCountryCodeOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                                {countryCodes.map(country => (
                                                    <button
                                                        key={country.code}
                                                        type="button"
                                                        onClick={() => handleCountryCodeChange(country.code)}
                                                        className="w-full px-4 py-3 text-left text-white hover:bg-slate-700 transition-colors flex items-center gap-3 text-sm"
                                                    >
                                                        <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs font-medium">
                                                            {country.flag}
                                                        </span>
                                                        <span className="font-medium">{country.code}</span>
                                                        <span className="text-slate-400 text-xs">{country.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Phone Number Input */}
                                    <div className="flex-1">
                                        <input 
                                            type="tel" 
                                            name="phone" 
                                            value={formData.phone} 
                                            onChange={handlePhoneChange} 
                                            placeholder={selectedCountryCode === '+91' ? 'XXXXXXXXXX' : 'Enter phone number'}
                                            className={`w-full bg-slate-800 border rounded-lg px-4 py-3 text-white focus:ring-2 transition-all font-medium ${
                                                !formData.phone ? 'border-slate-700 focus:ring-slate-500 focus:border-slate-500' :
                                                phoneValidation === null ? 'border-slate-700 focus:ring-slate-500 focus:border-slate-500' :
                                                phoneValidation.isValid ? 'border-green-500 focus:ring-green-500 focus:border-green-500' : 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                            }`}
                                        />
                                    </div>
                                </div>
                                
                                {/* Phone Validation Messages */}
                                {phoneValidation && (
                                    <div className={`text-xs mt-2 ${
                                        phoneValidation.isValid ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                        {phoneValidation.isValid ? '✓ Phone number is valid' : phoneValidation.error}
                                    </div>
                                )}
                                
                                {isCheckingPhone && (
                                    <div className="text-xs mt-2 text-slate-400">
                                        Checking phone number...
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {step === 2 && formData.role === Role.Investor && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Investment Domains *</label>
                                <input 
                                    type="text" 
                                    name="interestedDomains" 
                                    value={formData.interestedDomains} 
                                    onChange={handleChange} 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all" 
                                    placeholder="e.g., SaaS, FinTech, HealthTech" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Investment Experience *</label>
                                <textarea 
                                    name="investmentExperience" 
                                    rows={3} 
                                    value={formData.investmentExperience} 
                                    onChange={handleChange} 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all resize-none" 
                                    placeholder="Describe your investment experience..." 
                                    required
                                ></textarea>
                            </div>
                        </>
                    )}

                    {step === 2 && formData.role !== Role.Investor && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Skills *</label>
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
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Experience *</label>
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

                    {step === 3 && formData.role === Role.Investor && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Min Budget ($) *</label>
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
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Max Budget ($) *</label>
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
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Min Equity (%) *</label>
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
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Max Equity (%) *</label>
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
                                <label className="block text-sm font-medium text-slate-300 mb-2">Interests *</label>
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
                                <label className="block text-sm font-medium text-slate-300 mb-2">Looking for in a co-founder *</label>
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
                            <h3 className="text-lg font-semibold text-white mb-4">Passkey sign-in (optional)</h3>
                            <p className="text-slate-400 text-sm mb-4">Set up a passkey for faster, more secure sign-ins. You can skip now and add later from settings.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        // dispatch a custom event for App to show registration modal if needed, or inline future implementation
                                        window.dispatchEvent(new CustomEvent('onboarding-passkey-register'));
                                        setStep(5);
                                    }}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
                                >
                                    Set up passkey
                                </button>
                                <button
                                    onClick={() => setStep(5)}
                                    className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
                                >
                                    Skip for now
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 5 && (
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
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Date of Birth:</span>
                                    <span className="text-white">{formData.dateOfBirth}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Gender:</span>
                                    <span className="text-white">{formData.gender}</span>
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
                            disabled={!canProceedToNextStep()}
                            className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {!canProceedToNextStep() ? 'Please fill all required fields' : 'Next'}
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
                            Complete Profile
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