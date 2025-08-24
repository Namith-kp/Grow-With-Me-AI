import React from 'react';
import { XIcon, CheckCircleIcon, AlertTriangleIcon } from './icons';
import { motion, AnimatePresence } from 'framer-motion';

interface InfoModalProps {
    title: string;
    message: string;
    onClose: () => void;
    type?: 'success' | 'error';
}

const InfoModal: React.FC<InfoModalProps> = ({ title, message, onClose, type = 'success' }) => {
    const Icon = type === 'success' ? CheckCircleIcon : AlertTriangleIcon;
    const iconColor = type === 'success' ? 'text-emerald-400' : 'text-red-400';
    const buttonColor = type === 'success' 
        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500' 
        : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500';

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
                    className="bg-gradient-to-br from-slate-900/95 to-black/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl max-w-sm w-full mx-auto p-6 sm:p-8 relative shadow-2xl shadow-black/50 text-center"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                >
                    <button 
                        onClick={onClose} 
                        aria-label="Close" 
                        className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all duration-200 hover:scale-110"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                    
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, duration: 0.3, type: "spring", stiffness: 200 }}
                    >
                        <Icon className={`w-16 h-16 mx-auto mb-6 ${iconColor}`} />
                    </motion.div>
                    
                    <motion.h2 
                        className="text-2xl font-bold text-white mb-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                    >
                        {title}
                    </motion.h2>
                    
                    <motion.p 
                        className="text-slate-300 mb-8 text-sm leading-relaxed"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.3 }}
                    >
                        {message}
                    </motion.p>
                    
                    <motion.button
                        onClick={onClose}
                        className={`${buttonColor} text-white font-medium py-3 px-8 rounded-xl transition-all duration-200 hover:shadow-lg transform hover:scale-105 w-full`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.3 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Close
                    </motion.button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default InfoModal;
