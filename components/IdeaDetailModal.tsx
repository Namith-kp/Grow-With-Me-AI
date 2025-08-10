import React from 'react';
import { Idea, Role } from '../types';
import { XIcon, UsersIcon, CodeIcon, HeartIcon, ChatBubbleLeftRightIcon } from './icons';

interface IdeaDetailModalProps {
  idea: Idea;
  open: boolean;
  onClose: () => void;
}

const IdeaDetailModal: React.FC<IdeaDetailModalProps> = ({ idea, open, onClose }) => {
  if (!open || !idea) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 w-full max-w-lg mx-2 p-6 relative animate-fadeInUp">
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-white" title="Close" aria-label="Close">
          <XIcon className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-4 mb-4">
          <img src={idea.founderAvatar} alt={idea.founderName} className="w-14 h-14 rounded-full border-2 border-neutral-700" />
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{idea.title}</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-400">by {idea.founderName}</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-900/60 text-purple-300">Founder</span>
            </div>
          </div>
        </div>
        <p className="text-neutral-300 mb-4 whitespace-pre-line">{idea.description}</p>
        {idea.investmentDetails && (
          <div className="mb-4 p-3 bg-purple-900/30 border border-purple-800 rounded-lg text-sm">
            <h4 className="font-bold text-purple-300 mb-2">Investment Opportunity</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-neutral-400">Asking:</p>
                <p className="font-semibold text-white">${idea.investmentDetails.targetInvestment.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-neutral-400">Equity:</p>
                <p className="font-semibold text-white">{idea.investmentDetails.equityOffered}%</p>
              </div>
            </div>
          </div>
        )}
        <div className="mb-4">
          <h4 className="font-semibold text-white mb-2 flex items-center gap-2"><CodeIcon className="w-5 h-5 text-purple-400"/> Required Skills:</h4>
          <div className="flex flex-wrap gap-2">
            {idea.requiredSkills.map(skill => (
              <span key={skill} className="bg-blue-900/50 text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">{skill}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-1.5 text-neutral-400">
            <HeartIcon className="w-5 h-5" />
            <span>{idea.likes?.length || 0}</span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-400">
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            <span>{idea.comments?.length || 0}</span>
          </div>
          <div className="flex items-center gap-1.5 text-green-400">
            <UsersIcon className="w-5 h-5" />
            <span>{idea.team.length} team</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdeaDetailModal;
