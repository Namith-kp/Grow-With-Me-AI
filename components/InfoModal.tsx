import React from 'react';
import { XIcon, CheckCircleIcon, AlertTriangleIcon } from './icons';

interface InfoModalProps {
    title: string;
    message: string;
    onClose: () => void;
    type?: 'success' | 'error';
}

const InfoModal: React.FC<InfoModalProps> = ({ title, message, onClose, type = 'success' }) => {
    const Icon = type === 'success' ? CheckCircleIcon : AlertTriangleIcon;
    const iconColor = type === 'success' ? 'text-green-500' : 'text-red-500';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-sm w-full mx-auto p-8 relative animate-fade-in-scale text-center">
                <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors">
                    <XIcon className="w-6 h-6" />
                </button>
                <Icon className={`w-16 h-16 mx-auto mb-4 ${iconColor}`} />
                <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
                <p className="text-neutral-300 mb-6">{message}</p>
                <button
                    onClick={onClose}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-8 rounded-lg transition-colors w-full"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default InfoModal;
