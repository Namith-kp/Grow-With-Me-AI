import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { UserIcon, BriefcaseIcon, LightbulbIcon, CheckCircleIcon, RocketIcon } from './icons';

type OnboardingData = Omit<User, 'id' | 'avatarUrl' | 'email' | 'connections' | 'pendingConnections'>;

interface OnboardingProps {
    onOnboardingComplete: (user: OnboardingData) => void;
    userProfile: User | null;
}

const Onboarding: React.FC<OnboardingProps> = ({ onOnboardingComplete, userProfile }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        role: Role.Founder,
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
    });

    useEffect(() => {
        if (userProfile) {
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };


    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const handleSubmit = () => {
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
        { title: 'Your Role', icon: <UserIcon className="w-6 h-6" /> },
        { title: 'About You', icon: <BriefcaseIcon className="w-6 h-6" /> },
        { title: 'Your Vision', icon: <LightbulbIcon className="w-6 h-6" /> },
        { title: 'Confirmation', icon: <CheckCircleIcon className="w-6 h-6" /> }
    ];

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-8 bg-neutral-900 rounded-2xl shadow-2xl shadow-purple-900/10 border border-neutral-800">
            <div className="mb-8">
                <ol className="flex items-center w-full">
                    {steps.map((s, index) => (
                        <li key={index} className={`flex w-full items-center ${index + 1 < steps.length ? "after:content-[''] after:w-full after:h-1 after:border-b after:border-neutral-700 after:inline-block" : ""} ${index < step ? 'text-purple-500' : 'text-neutral-500'}`}>
                            <span className={`flex items-center justify-center w-10 h-10 rounded-full lg:h-12 lg:w-12 shrink-0 ${index < step ? 'bg-purple-900/50' : 'bg-neutral-800'}`}>
                                {s.icon}
                            </span>
                        </li>
                    ))}
                </ol>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-2">{steps[step - 1].title}</h2>
            <p className="text-neutral-400 mb-8">Let's build your profile to find the best matches.</p>

            <div className="space-y-6">
                {step === 1 && (
                    <>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-neutral-300 mb-2">Full Name</label>
                            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="e.g., Ada Lovelace" required />
                        </div>
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-neutral-300 mb-2">What is your primary role?</label>
                            <select name="role" id="role" value={formData.role} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500" required>
                                {Object.values(Role).map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-neutral-300 mb-2">Location</label>
                            <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="e.g., London, UK" required />
                        </div>
                    </>
                )}
                {step === 2 && formData.role === Role.Investor && (
                    <>
                        <div>
                            <label htmlFor="interestedDomains" className="block text-sm font-medium text-neutral-300 mb-2">Domains of Interest (comma-separated)</label>
                            <input type="text" name="interestedDomains" id="interestedDomains" value={formData.interestedDomains} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white" placeholder="e.g., SaaS, Deep Tech, HealthTech" required />
                        </div>
                        <div>
                            <label htmlFor="investmentExperience" className="block text-sm font-medium text-neutral-300 mb-2">Investment Experience</label>
                            <textarea name="investmentExperience" id="investmentExperience" rows={4} value={formData.investmentExperience} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white" placeholder="Describe your past investments and what you look for in a startup." required></textarea>
                        </div>
                    </>
                )}

                {step === 3 && formData.role === Role.Investor && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="minBudget" className="block text-sm font-medium text-neutral-300 mb-2">Investment Budget (Min)</label>
                                <input type="number" name="minBudget" id="minBudget" value={formData.minBudget} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white" placeholder="e.g., 25000" required />
                            </div>
                            <div>
                                <label htmlFor="maxBudget" className="block text-sm font-medium text-neutral-300 mb-2">Investment Budget (Max)</label>
                                <input type="number" name="maxBudget" id="maxBudget" value={formData.maxBudget} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white" placeholder="e.g., 100000" required />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="minEquity" className="block text-sm font-medium text-neutral-300 mb-2">Expected Equity (Min %)</label>
                                <input type="number" name="minEquity" id="minEquity" value={formData.minEquity} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white" placeholder="e.g., 5" required />
                            </div>
                            <div>
                                <label htmlFor="maxEquity" className="block text-sm font-medium text-neutral-300 mb-2">Expected Equity (Max %)</label>
                                <input type="number" name="maxEquity" id="maxEquity" value={formData.maxEquity} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white" placeholder="e.g., 15" required />
                            </div>
                        </div>
                    </>
                )}

                {step === 2 && formData.role !== Role.Investor && (
                    <>
                        <div>
                            <label htmlFor="skills" className="block text-sm font-medium text-neutral-300 mb-2">Your Top Skills (comma-separated)</label>
                            <input type="text" name="skills" id="skills" value={formData.skills} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="e.g., React, Node.js, Product Management" required />
                        </div>
                        <div>
                            <label htmlFor="experience" className="block text-sm font-medium text-neutral-300 mb-2">Your Experience</label>
                            <textarea name="experience" id="experience" rows={4} value={formData.experience} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="Describe your professional background and key achievements." required></textarea>
                        </div>
                    </>
                )}
                {step === 3 && formData.role !== Role.Investor && (
                     <>
                        <div>
                            <label htmlFor="interests" className="block text-sm font-medium text-neutral-300 mb-2">Your Interests (comma-separated)</label>
                            <input type="text" name="interests" id="interests" value={formData.interests} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="e.g., AI, FinTech, Sustainable Tech" required />
                        </div>
                        <div>
                            <label htmlFor="lookingFor" className="block text-sm font-medium text-neutral-300 mb-2">What are you looking for in a co-founder?</label>
                            <textarea name="lookingFor" id="lookingFor" rows={4} value={formData.lookingFor} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="Describe your ideal partner's skills, role, and mindset." required></textarea>
                        </div>
                    </>
                )}
                 {step === 4 && (
                    <div className="bg-neutral-800/50 p-6 rounded-lg border border-neutral-700">
                        <h3 className="text-xl font-bold text-white mb-4">Review Your Profile</h3>
                        <p><strong>Name:</strong> {formData.name}</p>
                        <p><strong>Role:</strong> {formData.role}</p>
                        <p><strong>Location:</strong> {formData.location}</p>
                        {formData.role === Role.Investor ? (
                            <>
                                <p><strong>Domains:</strong> {formData.interestedDomains}</p>
                                <p><strong>Budget:</strong> ${formData.minBudget} - ${formData.maxBudget}</p>
                                <p><strong>Equity:</strong> {formData.minEquity}% - {formData.maxEquity}%</p>
                            </>
                        ) : (
                            <>
                                <p><strong>Skills:</strong> {formData.skills}</p>
                                <p><strong>Interests:</strong> {formData.interests}</p>
                            </>
                        )}
                        <p className="mt-4">Ready to find your match?</p>
                    </div>
                )}
            </div>

            <div className="mt-8 flex justify-between">
                <button onClick={prevStep} disabled={step === 1} className="bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Back
                </button>
                {step < 4 ? (
                    <button onClick={nextStep} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        Next
                    </button>
                ) : (
                    <button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                        <RocketIcon className="w-5 h-5" />
                        Finish & Find Matches
                    </button>
                )}
            </div>
        </div>
    );
};

export default Onboarding;