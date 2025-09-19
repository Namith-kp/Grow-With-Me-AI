import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IdeaValidationResult, SimilarIdea } from '../services/ideaSimilarityService';
import { AlertTriangleIcon, XIcon, PencilIcon, CheckIcon, LightbulbIcon, TrashIcon } from './icons';

interface IdeaSimilarityModalProps {
    isOpen: boolean;
    onClose: () => void;
    validationResult: IdeaValidationResult;
    onProceed: () => void;
    onEdit: () => void;
    onCancel: () => void;
    newIdeaTitle: string;
}

const IdeaSimilarityModal: React.FC<IdeaSimilarityModalProps> = ({
    isOpen,
    onClose,
    validationResult,
    onProceed,
    onEdit,
    onCancel,
    newIdeaTitle
}) => {
    if (!isOpen) return null;

    const { isValid, warnings, duplicates, suggestions } = validationResult || {};

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900/95 to-black/95 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-2xl"
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-slate-900/90 to-black/90 backdrop-blur-sm border-b border-slate-700/30 p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${!isValid ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
                                    <AlertTriangleIcon className={`w-6 h-6 ${!isValid ? 'text-red-400' : 'text-yellow-400'}`} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        {!isValid ? 'Similar Ideas Detected' : 'Idea Similarity Check'}
                                    </h2>
                                    <p className="text-sm text-slate-400">
                                        Review similar ideas before posting "{newIdeaTitle}"
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50"
                            >
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Warnings Section */}
                        {warnings.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <AlertTriangleIcon className="w-8 h-8 text-yellow-400" />
                                    Warnings
                                </h3>
                                <div className="space-y-2">
                                    {warnings.map((warning, index) => (
                                        <div key={index} className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                            <p className="text-yellow-200 text-sm">{warning}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Similar Ideas Section */}
                        {duplicates.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white">
                                    Similar Ideas Found ({duplicates.length})
                                </h3>
                                <div className="grid gap-4">
                                    {duplicates.map((similar, index) => (
                                        <SimilarIdeaCard key={similar.idea.id} similar={similar} index={index} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Suggestions Section */}
                        {suggestions.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <LightbulbIcon className="w-5 h-5 text-blue-400" />
                                    Suggestions to Make Your Idea Unique
                                </h3>
                                <div className="space-y-2">
                                    {suggestions.map((suggestion, index) => (
                                        <div key={index} className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                            <p className="text-blue-200 text-sm">{suggestion}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-700/30">
                            {!isValid ? (
                                <>
                                    <button
                                        onClick={onEdit}
                                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                                    >
                                        <PencilIcon className="w-5 h-5" />
                                        Edit Idea
                                    </button>
                                    <button
                                        onClick={onCancel}
                                        className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={onEdit}
                                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                                    >
                                        <PencilIcon className="w-5 h-5" />
                                        Edit Idea
                                    </button>
                                    <button
                                        onClick={onProceed}
                                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                                    >
                                        Post Anyway
                                    </button>
                                    <button
                                        onClick={onCancel}
                                        className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

interface SimilarIdeaCardProps {
    similar: SimilarIdea;
    index: number;
}

const SimilarIdeaCard: React.FC<SimilarIdeaCardProps> = ({ similar, index }) => {
    const { idea, similarityScore, similarityReasons } = similar;
    
    const getSimilarityColor = (score: number) => {
        if (score >= 0.85) return 'text-red-400 bg-red-500/20 border-red-500/30';
        if (score >= 0.7) return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    };

    const getSimilarityLabel = (score: number) => {
        if (score >= 0.85) return 'Very High';
        if (score >= 0.7) return 'High';
        return 'Medium';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 bg-slate-800/50 border border-slate-700/30 rounded-xl"
        >
            <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                    <h4 className="font-semibold text-white text-lg">{idea.title}</h4>
                    <p className="text-slate-300 text-sm mt-1">by {idea.founderName}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSimilarityColor(similarityScore)}`}>
                    {getSimilarityLabel(similarityScore)} ({Math.round(similarityScore * 100)}%)
                </div>
            </div>
            
            <p className="text-slate-400 text-sm mb-3 line-clamp-2">{idea.description}</p>
            
            {similarityReasons.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-300">Similarity reasons:</p>
                    <div className="flex flex-wrap gap-2">
                        {similarityReasons.map((reason, idx) => (
                            <span key={idx} className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-full">
                                {reason}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="flex flex-wrap gap-2 mt-3">
                {idea.requiredSkills.slice(0, 3).map(skill => (
                    <span key={skill} className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs rounded-full border border-blue-700/30">
                        {skill}
                    </span>
                ))}
                {idea.requiredSkills.length > 3 && (
                    <span className="px-2 py-1 bg-slate-700/50 text-slate-400 text-xs rounded-full">
                        +{idea.requiredSkills.length - 3} more
                    </span>
                )}
            </div>
        </motion.div>
    );
};

export default IdeaSimilarityModal;
