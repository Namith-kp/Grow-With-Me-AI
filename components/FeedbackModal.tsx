
import React, { useState } from 'react';
import { User } from '../types';
import { XIcon, StarIcon } from './icons';

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
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full mx-auto p-8 relative animate-fade-in-scale">
                <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors">
                    <XIcon className="w-6 h-6" />
                </button>
                
                {submitted ? (
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-white">Thank You!</h3>
                        <p className="text-neutral-300 mt-2">Your feedback helps improve our matching algorithm.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <h2 className="text-2xl font-bold text-center text-white">Feedback for {user.name}</h2>
                        
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2 text-center">How would you rate this match?</label>
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <StarIcon
                                        key={star}
                                        className={`w-8 h-8 cursor-pointer transition-colors ${rating >= star ? 'text-yellow-400' : 'text-neutral-600'}`}
                                        onClick={() => setRating(star)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="feedback" className="block text-sm font-medium text-neutral-300 mb-2">Additional comments (optional)</label>
                            <textarea
                                id="feedback"
                                name="feedback"
                                rows={4}
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                placeholder="What did you think about this match suggestion?"
                            />
                        </div>

                        <button type="submit" disabled={rating === 0} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            Submit Feedback
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default FeedbackModal;
