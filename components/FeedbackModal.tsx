
import React, { useState } from 'react';
import { User } from '../types';
import { XIcon, StarIcon } from './icons';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedbackModalProps {
    user: User;
    onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ user, onClose }) => {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log({
            ratedUser: user.name,
            rating: rating,
            feedback: feedback
        });
        setSubmitted(true);
        setTimeout(() => {
            onClose();
        }, 1500);
    };

    return (
        <AnimatePresence>
            <motion.div 
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                <motion.div 
                    className="bg-gradient-to-br from-slate-900/95 to-black/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl max-w-md w-full mx-auto p-6 sm:p-8 relative shadow-2xl shadow-black/50"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                >
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all duration-200 hover:scale-110"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                    
                    <AnimatePresence mode="wait">
                        {submitted ? (
                            <motion.div 
                                className="text-center"
                                key="submitted"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.1, duration: 0.3, type: "spring", stiffness: 200 }}
                                    className="w-16 h-16 bg-emerald-500/20 rounded-full mx-auto mb-4 flex items-center justify-center"
                                >
                                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                                        <div className="w-4 h-4 bg-white rounded-full"></div>
                                    </div>
                                </motion.div>
                                <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
                                <p className="text-slate-300 text-sm">Your feedback helps improve our matching algorithm.</p>
                            </motion.div>
                        ) : (
                            <motion.form 
                                onSubmit={handleSubmit} 
                                className="space-y-6"
                                key="form"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                <h2 className="text-2xl font-bold text-center text-white">Feedback for {user.name}</h2>
                                
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-slate-300 text-center">How would you rate this match?</label>
                                    <div className="flex justify-center gap-2">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <motion.button
                                                key={star}
                                                type="button"
                                                className={`p-2 rounded-lg transition-all duration-200 ${rating >= star ? 'text-amber-400 bg-amber-500/10' : 'text-slate-600 hover:text-slate-400'}`}
                                                onClick={() => setRating(star)}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <StarIcon className="w-8 h-8" />
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label htmlFor="feedback" className="block text-sm font-medium text-slate-300">Additional comments (optional)</label>
                                    <textarea
                                        id="feedback"
                                        name="feedback"
                                        rows={4}
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all backdrop-blur-sm resize-none"
                                        placeholder="What did you think about this match suggestion?"
                                    />
                                </div>

                                <motion.button 
                                    type="submit" 
                                    disabled={rating === 0} 
                                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-medium py-3 rounded-xl transition-all duration-200 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed disabled:opacity-50 transform hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25"
                                    whileHover={{ scale: rating > 0 ? 1.02 : 1 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Submit Feedback
                                </motion.button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FeedbackModal;
