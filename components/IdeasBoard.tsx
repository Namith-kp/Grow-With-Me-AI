import React, { useState, useEffect } from 'react';
import { Idea, Role, User, IdeaJoinRequest, Comment, Negotiation } from '../types';
import { firestoreService } from '../services/firestoreService';
import { PlusIcon, LightbulbIcon, UsersIcon, CodeIcon, CheckIcon, HeartIcon, ChatBubbleLeftRightIcon, TrashIcon, PencilIcon } from './icons';
import JoinRequests from './JoinRequests';
import TeamManagementModal from './TeamManagementModal';
import NegotiationDeck from './NegotiationDeck';
import IdeaDetailModal from './IdeaDetailModal';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';

// Custom hook for responsive animation timing
const useResponsiveAnimation = () => {
    const [isLargeScreen, setIsLargeScreen] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => {
            setIsLargeScreen(window.innerWidth >= 1024);
        };
        
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);
    
    return {
        enterDuration: isLargeScreen ? 0.5 : 0.2,
        exitDuration: isLargeScreen ? 0.5: 0.15,
    };
};

interface IdeaPostFormProps {
    user: User;
    onIdeaPosted: () => void;
    editingIdea?: Idea | null;
    onCancelEdit: () => void;
}

const IdeaPostForm: React.FC<IdeaPostFormProps> = ({ user, onIdeaPosted, editingIdea, onCancelEdit }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState('');
    const [targetInvestment, setTargetInvestment] = useState('');
    const [equityOffered, setEquityOffered] = useState('');
    const [visibility, setVisibility] = useState<'public' | 'private'>('public');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (editingIdea) {
            setTitle(editingIdea.title);
            setDescription(editingIdea.description);
            setRequiredSkills(editingIdea.requiredSkills);
            setTargetInvestment(editingIdea.investmentDetails?.targetInvestment.toString() || '');
            setEquityOffered(editingIdea.investmentDetails?.equityOffered.toString() || '');
            setVisibility(editingIdea.visibility || 'public');
        }
    }, [editingIdea]);

    const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && skillInput.trim()) {
            e.preventDefault();
            if (!requiredSkills.includes(skillInput.trim())) {
                setRequiredSkills([...requiredSkills, skillInput.trim()]);
            }
            setSkillInput('');
        }
    };

    const removeSkill = (skillToRemove: string) => {
        setRequiredSkills(requiredSkills.filter(skill => skill !== skillToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description || requiredSkills.length === 0) {
            setError('Please fill out all fields and add at least one required skill.');
            return;
        }
        setError(null);
        setIsSubmitting(true);

        if (editingIdea) {
            const updatedData: Partial<Idea> = {
                title,
                description,
                requiredSkills,
                visibility,
                investmentDetails: {
                    targetInvestment: parseInt(targetInvestment, 10) || 0,
                    equityOffered: parseInt(equityOffered, 10) || 0,
                }
            };
            try {
                await firestoreService.updateIdea(editingIdea.id, updatedData);
                onIdeaPosted(); // This will refetch and close the form
            } catch (err) {
                setError('Failed to update idea. Please try again.');
                console.error(err);
            } finally {
                setIsSubmitting(false);
            }
        } else {
            const newIdea: Omit<Idea, 'id'> = {
                founderId: user.id,
                founderName: user.name,
                founderAvatar: user.avatarUrl,
                title,
                description,
                requiredSkills,
                status: 'recruiting',
                visibility,
                team: [user.id],
                likes: [],
                comments: [],
                investmentDetails: {
                    targetInvestment: parseInt(targetInvestment, 10) || 0,
                    equityOffered: parseInt(equityOffered, 10) || 0,
                }
            };

            try {
                await firestoreService.postIdea(newIdea);
                setTitle('');
                setDescription('');
                setRequiredSkills([]);
                setSkillInput('');
                setTargetInvestment('');
                setEquityOffered('');
                onIdeaPosted();
            } catch (err) {
                setError('Failed to post idea. Please try again.');
                console.error(err);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-sm p-6 rounded-2xl border border-slate-800/50 shadow-2xl shadow-slate-500/10 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <LightbulbIcon className="w-6 h-6 text-amber-400" />
                {editingIdea ? 'Edit Your Startup Idea' : 'Post a New Startup Idea'}
            </h2>
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">Idea Title</label>
                <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., AI-Powered Personal Chef"
                    className="w-full bg-slate-800/50 border border-slate-700/30 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all backdrop-blur-sm"
                />
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">Detailed Description</label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your vision, the problem it solves, and your target audience."
                    rows={4}
                    className="w-full bg-slate-800/50 border border-slate-700/30 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all backdrop-blur-sm"
                />
            </div>
            <div>
                <label htmlFor="skills" className="block text-sm font-medium text-slate-300 mb-1">Required Skills</label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {requiredSkills.map(skill => (
                        <div key={skill} className="flex items-center gap-1 bg-purple-900/30 text-purple-300 px-2 py-1 rounded-full text-sm border border-purple-700/30">
                            {skill}
                            <button type="button" onClick={() => removeSkill(skill)} className="text-purple-300 hover:text-white">
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
                <input
                    id="skills"
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    placeholder="e.g., React, Python, Marketing... (Press Enter to add)"
                    className="w-full bg-slate-800/50 border border-slate-700/30 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all backdrop-blur-sm"
                />
            </div>
            
            {/* Visibility Selection */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Idea Visibility</label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="visibility"
                            value="public"
                            checked={visibility === 'public'}
                            onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
                            className="w-4 h-4 text-purple-600 bg-slate-800 border-slate-600 focus:ring-purple-500 focus:ring-2"
                        />
                        <div>
                            <div className="text-white font-medium">🌍 Public</div>
                            <div className="text-xs text-slate-400">Visible to everyone on the platform</div>
                        </div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="visibility"
                            value="private"
                            checked={visibility === 'private'}
                            onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
                            className="w-4 h-4 text-purple-600 bg-slate-800 border-slate-600 focus:ring-purple-500 focus:ring-2"
                        />
                        <div>
                            <div className="text-white font-medium">🔒 Private</div>
                            <div className="text-xs text-slate-400">Only visible to your connections</div>
                        </div>
                    </label>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="targetInvestment" className="block text-sm font-medium text-slate-300 mb-1">Target Investment ($)</label>
                    <input
                        id="targetInvestment"
                        type="number"
                        value={targetInvestment}
                        onChange={(e) => setTargetInvestment(e.target.value)}
                        placeholder="e.g., 50000"
                        className="w-full bg-slate-800/50 border border-slate-700/30 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all backdrop-blur-sm"
                    />
                </div>
                <div>
                    <label htmlFor="equityOffered" className="block text-sm font-medium text-slate-300 mb-1">Equity Offered (%)</label>
                    <input
                        id="equityOffered"
                        type="number"
                        value={equityOffered}
                        onChange={(e) => setEquityOffered(e.target.value)}
                        placeholder="e.g., 10"
                        className="w-full bg-slate-800/50 border border-slate-700/30 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all backdrop-blur-sm"
                    />
                </div>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-4">
                {editingIdea && (
                    <button type="button" onClick={onCancelEdit} className="w-full flex items-center justify-center gap-2 bg-slate-700/50 hover:bg-slate-600/50 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 border border-slate-600/30">
                        Cancel
                    </button>
                )}
                <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25 disabled:from-slate-600 disabled:to-slate-700 disabled:opacity-50">
                    <PlusIcon className="w-5 h-5" />
                    {isSubmitting ? (editingIdea ? 'Saving...' : 'Posting...') : (editingIdea ? 'Save Changes' : 'Post Idea')}
                </button>
            </div>
        </form>
    );
};

interface IdeaCardProps {
    idea: Idea;
    user: User;
    onJoinRequest: (idea: Idea) => void;
    hasPendingRequest: boolean;
    onManageTeam: (idea: Idea) => void;
    joinRequests: IdeaJoinRequest[];
    onLike: (ideaId: string) => void;
    onComment: (ideaId: string, commentText: string) => void;
    onDeleteComment: (ideaId: string, comment: Comment) => void;
    onEdit: (idea: Idea) => void;
    onStartNegotiation: (idea: Idea) => void;
    negotiationStatuses?: Record<string, string>;
    investorCounts?: Record<string, number>;
    onNavigateToNegotiation?: (negotiationId: string) => void;
}

const IdeaCard: React.FC<IdeaCardProps> = ({ idea, user, onJoinRequest, hasPendingRequest, onManageTeam, joinRequests, onLike, onComment, onDeleteComment, onEdit, onStartNegotiation, negotiationStatuses, investorCounts, onNavigateToNegotiation }) => {
    const isFounder = idea.founderId === user.id;
    const canJoin = user.role === Role.Developer && !idea.team.includes(user.id);
    const hasJoined = idea.team.includes(user.id);
    const isRequestApproved = joinRequests.some(
        (r) => r.ideaId === idea.id && r.developerId === user.id && r.status === 'approved'
    );
    const [commentText, setCommentText] = useState('');
    const [showComments, setShowComments] = useState(false);
    const [showNegotiation, setShowNegotiation] = useState(false);
    const [negotiation, setNegotiation] = useState(null);
    const [negotiationLoading, setNegotiationLoading] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const { enterDuration, exitDuration } = useResponsiveAnimation();

    const userHasLiked = idea.likes?.includes(user.id);

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (commentText.trim()) {
            onComment(idea.id, commentText);
            setCommentText('');
        }
    };

    // Investor: Navigate to negotiation tab
    const handleOpenNegotiation = async () => {
        setNegotiationLoading(true);
        try {
            // Try to find or create negotiation for this idea and investor
            let negotiationData = null;
            // Try to get negotiation from Firestore
            const negotiations = await new Promise<Negotiation[]>(resolve => {
                firestoreService.getNegotiationsForInvestor(user.id, resolve);
            });
            negotiationData = negotiations.find((n) => n.ideaId === idea.id);
            if (!negotiationData) {
                // Create negotiation if not exists
                await firestoreService.createNegotiationRequest(idea, user);
                // Refetch
                const negotiations2 = await new Promise<Negotiation[]>(resolve => {
                    firestoreService.getNegotiationsForInvestor(user.id, resolve);
                });
                negotiationData = negotiations2.find((n) => n.ideaId === idea.id);
            }
            
            // Navigate to negotiations tab with the specific negotiation
            if (onNavigateToNegotiation && negotiationData) {
                onNavigateToNegotiation(negotiationData.id);
            }
        } catch (err) {
            alert('Failed to open negotiation.');
        } finally {
            setNegotiationLoading(false);
        }
    };

    // Remove extra bottom padding, will move action icons above Manage Team button for founders
    return (
        <div 
            className="relative group block p-2 h-full w-full"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Aceternity UI Hover Background Effect - Smooth sliding without blinking */}
            <AnimatePresence mode="wait">
                {isHovered && (
                    <motion.span
                        className="absolute inset-0 h-full w-full bg-slate-800/[0.8] block rounded-3xl"
                        layoutId="ideaHoverBackground"
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: 1,
                            transition: { 
                                duration: enterDuration,
                                ease: "easeOut"
                            },
                        }}
                        exit={{
                            opacity: 0,
                            transition: { 
                                duration: 0.05,
                                ease: "linear"
                            },
                        }}
                        style={{
                            willChange: 'opacity, transform',
                            transformOrigin: 'center',
                        }}
                        layout
                    />
                )}
            </AnimatePresence>

            {/* Card content */}
            <div className="relative z-20 bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-500/10 h-full flex flex-col">
                {/* Top row: avatar, name, tag, actions */}
                <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2 sm:mb-4">
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                        <img src={idea.founderAvatar} alt={idea.founderName} className="w-9 h-9 sm:w-12 sm:h-12 rounded-full border-2 border-slate-700 shrink-0 shadow-lg" />
                        <div className="min-w-0">
                            <h3 className="text-base sm:text-xl font-bold text-white break-words">{idea.title}</h3>
                            <div className="flex items-center gap-1">
                                <span className="text-xs sm:text-sm text-slate-400 truncate">{idea.founderName}</span>
                                <span className={cn(
                                    "ml-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold",
                                    "bg-purple-900/30 text-purple-300 border border-purple-700/30"
                                )}>Founder</span>
                                {/* Visibility Badge */}
                                <span className={cn(
                                    "ml-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold",
                                    idea.visibility === 'public' 
                                        ? "bg-green-900/30 text-green-300 border border-green-700/30"
                                        : "bg-orange-900/30 text-orange-300 border border-orange-700/30"
                                )}>
                                    {idea.visibility === 'public' ? '🌍 Public' : '🔒 Private'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description and details */}
                <div className="flex flex-col gap-1 sm:gap-2 flex-grow">
                    <p className="text-slate-300 text-xs sm:text-sm mb-1 sm:mb-2 line-clamp-2 sm:line-clamp-4">{idea.description}</p>
                    {(user.role === Role.Investor || isFounder) && idea.investmentDetails && (
                        <div className="hidden sm:block mb-2 p-3 bg-purple-900/20 border border-purple-800/30 rounded-xl text-xs">
                            <h4 className="font-bold text-purple-300 mb-2">Investment Details</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-slate-400 text-xs">Target Investment:</p>
                                    <p className="font-semibold text-white text-sm">${idea.investmentDetails.targetInvestment.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-xs">Equity Offered:</p>
                                    <p className="font-semibold text-white text-sm">{idea.investmentDetails.equityOffered}%</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {!(user.role === Role.Investor || user.role === 'investor') && (
                        <div className="hidden sm:block">
                            <h4 className="font-semibold text-white mb-2 flex items-center gap-1 text-xs">
                                <CodeIcon className="w-4 h-4 text-emerald-400"/> Required Skills:
                            </h4>
                            <div className="flex flex-wrap gap-1">
                                {idea.requiredSkills.map(skill => (
                                    <span key={skill} className={cn(
                                        "bg-blue-900/30 text-blue-300 text-[10px] font-medium px-2 py-1 rounded-full border border-blue-700/30"
                                    )}>{skill}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* Show investor count only for non-founders on desktop, for founders it's in the bottom row */}
                    {!isFounder && investorCounts && investorCounts[idea.id] > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                            <UsersIcon className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-300 text-xs font-semibold">{investorCounts[idea.id]} investor{investorCounts[idea.id] > 1 ? 's' : ''} invested</span>
                        </div>
                    )}
                </div>

                {/* Mobile actions row: custom for founder (beside Manage Team), default for others */}
                {isFounder ? null : (
                    <div className="sm:hidden">
                        <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-slate-900/80 rounded-xl px-2 py-1 shadow-lg z-10">
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={e => { e.stopPropagation(); onLike(idea.id); }}
                                    title={userHasLiked ? 'Unlike' : 'Like'}
                                    className={`transition-colors ${userHasLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                                >
                                    <HeartIcon className="w-5 h-5" fill={userHasLiked ? 'currentColor' : 'none'} />
                                </button>
                                <span className="text-xs text-slate-400 min-w-[16px] text-center">{idea.likes?.length || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={e => { e.stopPropagation(); setShowComments(!showComments); }}
                                    title="Toggle comments"
                                    className="text-slate-400 hover:text-blue-500 transition-colors"
                                >
                                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                </button>
                                <span className="text-xs text-slate-400 min-w-[16px] text-center">{idea.comments?.length || 0}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bottom row: join/request/status, manage team, negotiation, etc. */}
                <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-slate-700/30">
                    <div className="flex flex-wrap justify-between items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
                            {isFounder ? (
                                <span className="text-xs sm:text-sm font-semibold text-purple-400">Your Idea</span>
                            ) : hasJoined || isRequestApproved ? (
                                <span className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-emerald-400">
                                    <CheckIcon className="w-5 h-5" />
                                    Joined
                                </span>
                            ) : hasPendingRequest ? (
                                <span className="text-xs sm:text-sm font-semibold text-amber-400">Request Sent</span>
                            ) : canJoin ? (
                                <span className="flex items-center gap-2">
                                    <button
                                        onClick={e => { e.stopPropagation(); onJoinRequest(idea); }}
                                        className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold py-1 px-2 sm:py-2 sm:px-4 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/25 text-xs sm:text-sm"
                                    >
                                        Send Join Request
                                    </button>
                                    {/* Action icons beside join button on large screens */}
                                    <span className="hidden sm:inline-flex items-center gap-2 ml-2">
                                        <button
                                            onClick={e => { e.stopPropagation(); onLike(idea.id); }}
                                            title={userHasLiked ? 'Unlike' : 'Like'}
                                            className={`transition-colors ${userHasLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                                        >
                                            <HeartIcon className="w-5 h-5 sm:w-6 sm:h-6" fill={userHasLiked ? 'currentColor' : 'none'} />
                                        </button>
                                        <span className="text-xs sm:text-sm text-slate-400 min-w-[16px] text-center">{idea.likes?.length || 0}</span>
                                        <button
                                            onClick={e => { e.stopPropagation(); setShowComments(!showComments); }}
                                            title="Toggle comments"
                                            className="text-slate-400 hover:text-blue-500 transition-colors"
                                        >
                                            <ChatBubbleLeftRightIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </button>
                                        <span className="text-xs sm:text-sm text-slate-400 min-w-[16px] text-center">{idea.comments?.length || 0}</span>
                                    </span>
                                </span>
                            ) : null}
                            {user.role === Role.Investor && !isFounder && negotiationStatuses && (
                                <span className="flex items-center gap-2">
                                    {negotiationStatuses[idea.id] && (
                                        <span className={cn(
                                            "text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded-full",
                                            negotiationStatuses[idea.id] === 'accepted' ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-700/30' :
                                            negotiationStatuses[idea.id] === 'declined' ? 'bg-red-900/30 text-red-300 border border-red-700/30' :
                                            negotiationStatuses[idea.id] === 'active' ? 'bg-amber-900/30 text-amber-300 border border-amber-700/30' :
                                            'bg-slate-800 text-slate-400'
                                        )}>
                                            {negotiationStatuses[idea.id].charAt(0).toUpperCase() + negotiationStatuses[idea.id].slice(1)}
                                        </span>
                                    )}
                                    <button
                                        onClick={e => { e.stopPropagation(); handleOpenNegotiation(); }}
                                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-1 px-2 sm:py-1 sm:px-3 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 text-xs sm:text-xs whitespace-nowrap leading-none"
                                        disabled={negotiationLoading}
                                    >
                                        {negotiationLoading ? 'Loading...' : 'Open Negotiation'}
                                    </button>
                                    {/* Action icons beside negotiate button on large screens */}
                                    <span className="hidden sm:inline-flex items-center gap-2 ml-2">
                                        <button
                                            onClick={e => { e.stopPropagation(); onLike(idea.id); }}
                                            title={userHasLiked ? 'Unlike' : 'Like'}
                                            className={`transition-colors ${userHasLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                                        >
                                            <HeartIcon className="w-5 h-5 sm:w-6 sm:h-6" fill={userHasLiked ? 'currentColor' : 'none'} />
                                        </button>
                                        <span className="text-xs sm:text-sm text-slate-400 min-w-[16px] text-center">{idea.likes?.length || 0}</span>
                                        <button
                                            onClick={e => { e.stopPropagation(); setShowComments(!showComments); }}
                                            title="Toggle comments"
                                            className="text-slate-400 hover:text-blue-500 transition-colors"
                                        >
                                            <ChatBubbleLeftRightIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </button>
                                        <span className="text-xs sm:text-sm text-slate-400 min-w-[16px] text-center">{idea.comments?.length || 0}</span>
                                    </span>
                                </span>
                            )}
                        </div>
                        {/* Founder: Investor count above, then Manage Team and action icons on mobile */}
                        {isFounder ? (
                            <div className="w-full sm:w-auto mt-1 sm:mt-0 flex flex-col gap-1">
                                {investorCounts && investorCounts[idea.id] > 0 && (
                                    <div className="flex items-center gap-1 mb-1">
                                        <UsersIcon className="w-4 h-4 text-emerald-400" />
                                        <span className="text-emerald-300 text-xs font-semibold">{investorCounts[idea.id]} investor{investorCounts[idea.id] > 1 ? 's' : ''} invested</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                        onClick={e => { e.stopPropagation(); onManageTeam(idea); }}
                                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-1 px-3 sm:py-2 sm:px-4 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 text-xs sm:text-sm whitespace-nowrap min-w-[90px] max-w-[120px]"
                                    >
                                        Manage Team
                                    </button>
                                    <div className="flex items-center gap-1 bg-slate-800/50 rounded-xl px-2 py-1 shadow-lg z-10">
                                        <button
                                            onClick={e => { e.stopPropagation(); onLike(idea.id); }}
                                            title={userHasLiked ? 'Unlike' : 'Like'}
                                            className={`transition-colors ${userHasLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                                        >
                                            <HeartIcon className="w-5 h-5" fill={userHasLiked ? 'currentColor' : 'none'} />
                                        </button>
                                        <span className="text-xs text-slate-400 min-w-[16px] text-center">{idea.likes?.length || 0}</span>
                                        <button
                                            onClick={e => { e.stopPropagation(); setShowComments(!showComments); }}
                                            title="Toggle comments"
                                            className="text-slate-400 hover:text-blue-500 transition-colors"
                                        >
                                            <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                        </button>
                                        <span className="text-xs text-slate-400 min-w-[16px] text-center">{idea.comments?.length || 0}</span>
                                        <button
                                            onClick={e => { e.stopPropagation(); onEdit(idea); }}
                                            title="Edit idea"
                                            className="text-slate-400 hover:text-purple-400"
                                        >
                                            <PencilIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Comments and negotiation deck (unchanged) */}
                {showComments && (
                    <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-slate-700/30">
                        <h5 className="font-bold text-white mb-2 text-xs sm:text-base">Comments</h5>
                        <div className="space-y-2 sm:space-y-3 max-h-32 sm:max-h-48 overflow-y-auto pr-2">
                            {idea.comments && idea.comments.length > 0 ? (
                                idea.comments.map((comment) => (
                                    <div key={comment.id} className="flex items-start gap-2 group">
                                        <img src={comment.userAvatar} alt={comment.userName} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full" />
                                        <div className="bg-slate-800/50 rounded-lg p-2 text-xs sm:text-sm w-full border border-slate-700/30">
                                            <div className="flex justify-between items-start">
                                                <p className="font-semibold text-white truncate">{comment.userName}</p>
                                                {isFounder && (
                                                    <button onClick={() => onDeleteComment(idea.id, comment)} title="Delete comment" className="text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-slate-300 break-words">{comment.text}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-400 text-xs sm:text-sm">No comments yet.</p>
                            )}
                        </div>
                        <form onSubmit={handleCommentSubmit} className="mt-2 sm:mt-3 flex gap-2">
                            <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Add a comment..."
                                className="flex-grow bg-slate-800/50 border border-slate-700/30 rounded-lg py-1 px-2 sm:py-1.5 sm:px-3 text-white text-xs sm:text-sm focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all backdrop-blur-sm"
                            />
                            <button type="submit" className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold py-1 px-2 sm:py-1.5 sm:px-4 rounded-lg text-xs sm:text-sm transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25">
                                Post
                            </button>
                        </form>
                    </div>
                )}
                {showNegotiation && negotiation && (
                    <NegotiationDeck
                        negotiation={negotiation}
                        currentUser={user}
                        onClose={() => setShowNegotiation(false)}
                        onOfferMade={async (offer) => {
                            await firestoreService.addOfferToNegotiation(negotiation.id, offer);
                            // Refetch negotiation
                            const negotiations = await new Promise(resolve => {
                                firestoreService.getNegotiationsForInvestor(user.id, resolve);
                            });
                            const updated = (negotiations as Negotiation[]).find((n) => n.ideaId === idea.id);
                            setNegotiation(updated);
                        }}
                        onStatusChange={async (status) => {
                            await firestoreService.updateNegotiationStatus(negotiation.id, status);
                            // Refetch negotiation
                            const negotiations = await new Promise(resolve => {
                                firestoreService.getNegotiationsForInvestor(user.id, resolve);
                            });
                            const updated = (negotiations as Negotiation[]).find((n) => n.ideaId === idea.id);
                            setNegotiation(updated);
                        }}
                    />
                )}
            </div>
        </div>
    );
};


interface IdeasBoardProps {
    user: User;
    onNavigateToNegotiation?: (negotiationId: string) => void;
}

const IdeasBoard: React.FC<IdeasBoardProps> = ({ user, onNavigateToNegotiation }) => {
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const ideasCache = React.useRef<{ ideas: Idea[], lastDoc: any, hasMore: boolean, visibilityFilter: 'all' | 'public' } | null>(null);
    const [lastIdeaDoc, setLastIdeaDoc] = useState<any>(null);
    const [hasMoreIdeas, setHasMoreIdeas] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
    const [activeTab, setActiveTab] = useState<'ideas' | 'requests' | 'myIdeas'>('ideas');
    const [joinRequests, setJoinRequests] = useState<IdeaJoinRequest[]>([]);
    const [negotiationStatuses, setNegotiationStatuses] = useState<Record<string, string>>({});
    const [investorCounts, setInvestorCounts] = useState<Record<string, number>>({});
    const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public'>('all');
    const [myIdeas, setMyIdeas] = useState<Idea[]>([]);
    const [managingTeamFor, setManagingTeamFor] = useState<Idea | null>(null);
    const [negotiatingIdea, setNegotiatingIdea] = useState<Idea | null>(null);

    const fetchAllData = async () => {
        // Use cache if available and filter hasn't changed
        if (ideasCache.current && ideasCache.current.visibilityFilter === visibilityFilter) {
            setIdeas(ideasCache.current.ideas);
            setLastIdeaDoc(ideasCache.current.lastDoc);
            setHasMoreIdeas(ideasCache.current.hasMore);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            let fetchedIdeas: Idea[];
            let lastDoc: any;
            let hasMore: boolean;

            if (visibilityFilter === 'public') {
                // Only fetch public ideas
                const { ideas, lastDoc: last, hasMore: more } = await firestoreService.getIdeasPaginated(undefined, 20);
                fetchedIdeas = ideas.filter(idea => idea.visibility === 'public');
                lastDoc = last;
                hasMore = more;
            } else {
                // Fetch all visible ideas (public + private from connections)
                const { ideas, lastDoc: last, hasMore: more } = await firestoreService.getIdeasPaginated(undefined, 20, user.id);
                fetchedIdeas = ideas;
                lastDoc = last;
                hasMore = more;
            }

            setIdeas(fetchedIdeas);
            setLastIdeaDoc(lastDoc);
            setHasMoreIdeas(hasMore);
            ideasCache.current = { ideas: fetchedIdeas, lastDoc, hasMore, visibilityFilter };
        } catch (err) {
            setError('Could not load data. Please try again later.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'ideas') {
            fetchAllData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, activeTab, visibilityFilter]);

    // Reset cache when visibility filter changes
    useEffect(() => {
        ideasCache.current = null;
        if (activeTab === 'ideas') {
            fetchAllData();
        }
    }, [visibilityFilter]);

    // Fetch user's own ideas when myIdeas tab is active
    const fetchMyIdeas = async () => {
        setIsLoading(true);
        try {
            console.log('🔍 Fetching ideas for user:', user.id);
            // Get all ideas by the current user (both public and private)
            const userIdeas = await firestoreService.getOwnIdeasByFounder(user.id);
            console.log('📋 Found user ideas:', userIdeas);
            setMyIdeas(userIdeas);
        } catch (err) {
            setError('Could not load your ideas. Please try again later.');
            console.error('❌ Error fetching user ideas:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Function to refresh myIdeas (used when ideas are updated)
    const refreshMyIdeas = () => {
        fetchMyIdeas();
    };

    useEffect(() => {
        if (activeTab === 'myIdeas') {
            console.log('🔄 myIdeas tab activated, fetching ideas...');
            fetchMyIdeas();
        }
    }, [activeTab, user.id]);
    const loadMoreIdeas = async () => {
        if (!lastIdeaDoc || !hasMoreIdeas) return;
        setIsLoading(true);
        try {
            let moreIdeas: Idea[];
            let lastDoc: any;
            let hasMore: boolean;

            if (visibilityFilter === 'public') {
                // Only fetch public ideas
                const { ideas, lastDoc: last, hasMore: more } = await firestoreService.getIdeasPaginated(lastIdeaDoc, 20);
                moreIdeas = ideas.filter(idea => idea.visibility === 'public');
                lastDoc = last;
                hasMore = more;
            } else {
                // Fetch all visible ideas (public + private from connections)
                const { ideas, lastDoc: last, hasMore: more } = await firestoreService.getIdeasPaginated(lastIdeaDoc, 20, user.id);
                moreIdeas = ideas;
                lastDoc = last;
                hasMore = more;
            }

            setIdeas(prev => {
                const updated = [...prev, ...moreIdeas];
                ideasCache.current = { ideas: updated, lastDoc, hasMore, visibilityFilter };
                return updated;
            });
            setLastIdeaDoc(lastDoc);
            setHasMoreIdeas(hasMore);
        } catch (err) {
            setError('Could not load more ideas.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user.role === Role.Investor || user.role === 'investor') {
            return firestoreService.getNegotiationsForInvestor(user.id, (negotiations) => {
                const statusMap: Record<string, string> = {};
                negotiations.forEach(n => {
                    statusMap[n.ideaId] = n.status;
                });
                setNegotiationStatuses(statusMap);
            });
        }
    }, [user.id, user.role]);

    useEffect(() => {
        firestoreService.getAcceptedInvestorCountForIdeas().then(setInvestorCounts);
    }, []);

    const handleIdeaPosted = () => {
        setShowForm(false);
        setEditingIdea(null);
        ideasCache.current = null; // Invalidate cache
        fetchAllData();
        // Also refresh myIdeas if we're on that tab
        if (activeTab === 'myIdeas') {
            fetchMyIdeas();
        }
    };

    const handleEditIdea = (idea: Idea) => {
        setEditingIdea(idea);
        setShowForm(true);
    };

    const handleCancelEdit = () => {
        setEditingIdea(null);
        setShowForm(false);
    };

    const handleJoinRequest = async (idea: Idea) => {
        try {
            await firestoreService.createJoinRequest(idea, user);
            // Optimistically update UI
            setJoinRequests(prev => [...prev, {
                id: 'temp-id',
                ideaId: idea.id,
                ideaTitle: idea.title,
                developerId: user.id,
                developerName: user.name,
                developerAvatar: user.avatarUrl,
                founderId: idea.founderId,
                status: 'pending',
                timestamp: new Date(),
            }]);
        } catch (err) {
            console.error('Failed to send join request:', err);
            alert('Failed to send join request. Please try again.');
        }
    };
    
    const handleRequestsUpdated = () => {
        ideasCache.current = null; // Invalidate cache
        fetchAllData();
        // Also refresh myIdeas if we're on that tab
        if (activeTab === 'myIdeas') {
            fetchMyIdeas();
        }
    };

    const handleLike = async (ideaId: string) => {
        try {
            await firestoreService.toggleLikeIdea(ideaId, user.id);
            // Optimistically update UI or refetch
            setIdeas(prevIdeas => prevIdeas.map(idea => {
                if (idea.id === ideaId) {
                    const userHasLiked = idea.likes?.includes(user.id);
                    const likes = idea.likes || [];
                    return {
                        ...idea,
                        likes: userHasLiked
                            ? likes.filter(id => id !== user.id)
                            : [...likes, user.id]
                    };
                }
                return idea;
            }));
            // Also update myIdeas if we're on that tab
            if (activeTab === 'myIdeas') {
                setMyIdeas(prevMyIdeas => prevMyIdeas.map(idea => {
                    if (idea.id === ideaId) {
                        const userHasLiked = idea.likes?.includes(user.id);
                        const likes = idea.likes || [];
                        return {
                            ...idea,
                            likes: userHasLiked
                                ? likes.filter(id => id !== user.id)
                                : [...likes, user.id]
                        };
                    }
                    return idea;
                }));
            }
        } catch (error) {
            console.error("Failed to like idea:", error);
        }
    };

    const handleComment = async (ideaId: string, text: string) => {
        try {
            const comment = {
                userId: user.id,
                userName: user.name,
                userAvatar: user.avatarUrl,
                text,
                timestamp: new Date(),
            };
            await firestoreService.addCommentToIdea(ideaId, comment);
            ideasCache.current = null; // Invalidate cache
            fetchAllData();
            // Also refresh myIdeas if we're on that tab
            if (activeTab === 'myIdeas') {
                fetchMyIdeas();
            }
        } catch (error) {
            console.error("Failed to add comment:", error);
        }
    };

    const handleDeleteComment = async (ideaId: string, comment: Comment) => {
        if (window.confirm("Are you sure you want to delete this comment?")) {
            try {
                await firestoreService.deleteCommentFromIdea(ideaId, comment);
                ideasCache.current = null; // Invalidate cache
                fetchAllData();
                // Also refresh myIdeas if we're on that tab
                if (activeTab === 'myIdeas') {
                    fetchMyIdeas();
                }
            } catch (error) {
                console.error("Failed to delete comment:", error);
            }
        }
    };

    const pendingRequestsForDeveloper: string[] = [];
    const pendingRequestsForFounder: IdeaJoinRequest[] = [];

    return (
        <div className="space-y-8 mt-9">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-white">Idea Marketplace</h1>
                {user.role === Role.Founder && !showForm && (
                    <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold py-2 px-5 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25">
                        <PlusIcon className="w-5 h-5" />
                        Post New Idea
                    </button>
                )}
            </div>

            {/* Show IdeaPostForm in a modal overlay when editing */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-gradient-to-br from-slate-900 to-black rounded-2xl shadow-2xl p-0 w-full max-w-lg mx-2 relative border border-slate-800/50">
                        <button
                            className="absolute top-3 right-3 text-slate-400 hover:text-white text-2xl font-bold z-10 transition-colors"
                            onClick={handleCancelEdit}
                            aria-label="Close edit form"
                        >
                            &times;
                        </button>
                        <IdeaPostForm user={user} onIdeaPosted={handleIdeaPosted} editingIdea={editingIdea} onCancelEdit={handleCancelEdit} />
                    </div>
                </div>
            )}

            {user.role === Role.Founder && (
                <div className="border-b border-slate-700/30 flex space-x-4">
                    <button
                        onClick={() => setActiveTab('ideas')}
                        className={`py-2 px-4 text-sm font-medium transition-colors ${activeTab === 'ideas' ? 'text-white border-b-2 border-purple-500' : 'text-slate-400 hover:text-white'}`}
                    >
                        Browse Ideas
                    </button>
                    <button
                        onClick={() => setActiveTab('myIdeas')}
                        className={`py-2 px-4 text-sm font-medium transition-colors ${activeTab === 'myIdeas' ? 'text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'}`}
                    >
                        My Ideas
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`py-2 px-4 text-sm font-medium transition-colors ${activeTab === 'requests' ? 'text-white border-b-2 border-emerald-500' : 'text-slate-400 hover:text-white'}`}
                    >
                        Join Requests
                    </button>
                </div>
            )}

            {activeTab === 'ideas' && (
                <>
                    {/* Visibility Filter */}
                    <div className="flex items-center justify-between bg-gradient-to-br from-slate-900/50 to-black/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-white">Filter Ideas:</span>
                            <div className="flex bg-slate-800/50 rounded-lg p-1">
                                <button
                                    onClick={() => setVisibilityFilter('all')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                                        visibilityFilter === 'all'
                                            ? 'bg-purple-600 text-white shadow-lg'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                    }`}
                                >
                                    🌍 All Visible
                                </button>
                                <button
                                    onClick={() => setVisibilityFilter('public')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                                        visibilityFilter === 'public'
                                            ? 'bg-green-600 text-white shadow-lg'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                    }`}
                                >
                                    🔓 Public Only
                                </button>
                            </div>
                        </div>
                        <div className="text-xs text-slate-400">
                            {visibilityFilter === 'all' ? 'Showing ideas you can see' : 'Showing public ideas only'}
                        </div>
                    </div>

                    {isLoading && (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
                        </div>
                    )}
                    {error && <p className="text-center text-red-400">{error}</p>}
                    {!isLoading && !error && (
                        <>
                            {ideas.length === 0 && (
                                <div className="text-center py-16 px-6 bg-gradient-to-br from-slate-900/50 to-black/50 border-2 border-dashed border-slate-700/30 rounded-2xl backdrop-blur-sm">
                                    <LightbulbIcon className="w-12 h-12 mx-auto text-slate-600" />
                                    <h3 className="text-xl font-semibold mt-4 text-white">No Ideas Yet</h3>
                                    <p className="text-slate-400 mt-2 max-w-md mx-auto">
                                        {user.role === Role.Founder
                                            ? 'Be the first to share your vision! Post a startup idea to attract talented developers.'
                                            : 'No ideas have been posted yet. Check back soon to find exciting projects to join.'}
                                    </p>
                                </div>
                            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ideas.map(idea => (
                    <div
                        key={idea.id}
                        className="cursor-pointer group"
                        tabIndex={0}
                        role="button"
                        aria-label={`View details for ${idea.title}`}
                        onClick={e => {
                            // Only open modal if click is not on a button or interactive element
                            const tag = (e.target as HTMLElement).tagName.toLowerCase();
                            if (tag !== 'button' && tag !== 'svg' && tag !== 'path' && tag !== 'input' && tag !== 'textarea' && tag !== 'a') {
                                setSelectedIdea(idea);
                                setDetailOpen(true);
                            }
                        }}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setSelectedIdea(idea); setDetailOpen(true); } }}
                    >
                        <IdeaCard
                            idea={idea}
                            user={user}
                            onJoinRequest={handleJoinRequest}
                            hasPendingRequest={pendingRequestsForDeveloper.includes(idea.id)}
                            onManageTeam={setManagingTeamFor}
                            joinRequests={joinRequests}
                            onLike={handleLike}
                            onComment={handleComment}
                            onDeleteComment={handleDeleteComment}
                            onEdit={handleEditIdea}
                            onStartNegotiation={setNegotiatingIdea}
                            negotiationStatuses={negotiationStatuses}
                            investorCounts={investorCounts}
                            onNavigateToNegotiation={onNavigateToNegotiation}
                        />
                    </div>
                ))}
                {selectedIdea && (
                    <React.Suspense fallback={null}>
                        <IdeaDetailModal
                            idea={selectedIdea}
                            open={detailOpen}
                            onClose={() => { setDetailOpen(false); setTimeout(() => setSelectedIdea(null), 200); }}
                        />
                    </React.Suspense>
                )}
            </div>
            {hasMoreIdeas && (
                <div className="flex justify-center mt-6">
                    <button onClick={loadMoreIdeas} className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25" disabled={isLoading}>
                        {isLoading ? 'Loading...' : 'Load More Ideas'}
                    </button>
                </div>
            )}
                            {managingTeamFor && (
                                <TeamManagementModal
                                    idea={managingTeamFor}
                                    onClose={() => setManagingTeamFor(null)}
                                    onTeamUpdated={() => {
                                        setManagingTeamFor(null);
                                        ideasCache.current = null; // Invalidate cache
                                        fetchAllData();
                                        // Also refresh myIdeas if we're on that tab
                                        if (activeTab === 'myIdeas') {
                                            fetchMyIdeas();
                                        }
                                    }}
                                />
                            )}
                             {negotiatingIdea && (user.role === Role.Investor || user.id === negotiatingIdea.founderId) && (
                                <NegotiationDeck
                                    startupName={negotiatingIdea.title}
                                    founderName={negotiatingIdea.founderName}
                                    investorName={user.role === Role.Investor ? user.name : 'Investor'} // This might need a better default
                                    currentUser={user}
                                    onClose={() => setNegotiatingIdea(null)}
                                    initialInvestment={negotiatingIdea.investmentDetails?.targetInvestment}
                                    initialEquity={negotiatingIdea.investmentDetails?.equityOffered}
                                />
                            )}
                        </>
                    )}
                </>
            )}

            {/* Founder: My Ideas tab section */}
            {user.role === Role.Founder && activeTab === 'myIdeas' && (
                <>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">My Ideas</h2>
                    </div>

                    {isLoading && (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    )}
                    {error && <p className="text-center text-red-400">{error}</p>}
                    {!isLoading && !error && (
                        <>
                            {myIdeas.length === 0 && (
                                <div className="text-center py-16 px-6 bg-gradient-to-br from-slate-900/50 to-black/50 border-2 border-dashed border-slate-700/30 rounded-2xl backdrop-blur-sm">
                                    <LightbulbIcon className="w-12 h-12 mx-auto text-slate-600" />
                                    <h3 className="text-xl font-semibold mt-4 text-white">No Ideas Yet</h3>
                                    <p className="text-slate-400 mt-2 max-w-md mx-auto">
                                        You haven't posted any ideas yet. Share your startup vision to attract talented developers and investors.
                                    </p>
                                    <button 
                                        onClick={() => setShowForm(true)} 
                                        className="mt-4 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 mx-auto"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                        Post Your First Idea
                                    </button>
                                </div>
                            )}
                            {myIdeas.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {myIdeas.map(idea => (
                                        <div
                                            key={idea.id}
                                            className="cursor-pointer group"
                                            tabIndex={0}
                                            role="button"
                                            aria-label={`View details for ${idea.title}`}
                                            onClick={e => {
                                                // Only open modal if click is not on a button or interactive element
                                                const tag = (e.target as HTMLElement).tagName.toLowerCase();
                                                if (tag !== 'button' && tag !== 'svg' && tag !== 'path' && tag !== 'input' && tag !== 'textarea' && tag !== 'a') {
                                                    setSelectedIdea(idea);
                                                    setDetailOpen(true);
                                                }
                                            }}
                                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setSelectedIdea(idea); setDetailOpen(true); } }}
                                        >
                                            <IdeaCard
                                                idea={idea}
                                                user={user}
                                                onJoinRequest={handleJoinRequest}
                                                hasPendingRequest={pendingRequestsForDeveloper.includes(idea.id)}
                                                onManageTeam={setManagingTeamFor}
                                                joinRequests={joinRequests}
                                                onLike={handleLike}
                                                onComment={handleComment}
                                                onDeleteComment={handleDeleteComment}
                                                onEdit={handleEditIdea}
                                                onStartNegotiation={setNegotiatingIdea}
                                                negotiationStatuses={negotiationStatuses}
                                                investorCounts={investorCounts}
                                                onNavigateToNegotiation={onNavigateToNegotiation}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {/* Founder: Join Requests tab section */}
            {user.role === Role.Founder && activeTab === 'requests' && (
                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-white mb-4">Approve Developer Join Requests</h2>
                    <JoinRequests
                        user={user}
                        joinRequests={joinRequests}
                        onRequestsUpdated={handleRequestsUpdated}
                    />
                </div>
            )}

            {/* Requests tab removed for founders */}
        </div>
    );
};


export default IdeasBoard;
