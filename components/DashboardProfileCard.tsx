import React from 'react';
import { User, Role } from '../types';
import { XIcon, MessageSquareIcon, UserPlusIcon, CheckIcon } from './icons';
import { getSafeAvatarUrl, getUserInitials } from '../utils/avatar';

interface DashboardProfileCardProps {
  user: User;
  onClose: () => void;
  isOwnProfile: boolean;
  onMessage: (user: User) => void;
  onConnect: (user: User) => void;
  currentUserId: string;
  isConnected: boolean;
  isPending: boolean;
}

const DashboardProfileCard: React.FC<DashboardProfileCardProps> = ({
  user,
  onClose,
  isOwnProfile,
  onMessage,
  onConnect,
  currentUserId,
  isConnected,
  isPending
}) => {
  const getRoleColor = (role: Role) => {
    switch (role) {
      case Role.Founder:
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case Role.Investor:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case Role.Developer:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case Role.Designer:
        return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
      case Role.Marketer:
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
        >
          <XIcon className="w-5 h-5" />
        </button>

        {/* Profile content */}
        <div className="p-6 sm:p-8">
          {/* Header section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-purple-500 to-emerald-500 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg overflow-hidden">
                {(() => {
                  const safeUrl = getSafeAvatarUrl(user);
                  if (safeUrl) {
                    return (
                      <img
                        src={safeUrl}
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    );
                  }
                  return getUserInitials(user.name);
                })()}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              </div>
            </div>

            {/* User info */}
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {user.name}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(user.role)}`}>
                  {user.role}
                </span>
                {user.location && (
                  <span className="text-slate-400 text-sm">
                    📍 {user.location}
                  </span>
                )}
              </div>
              {user.experience && (
                <p className="text-slate-300 text-sm">
                  {user.experience}
                </p>
              )}
            </div>
          </div>

          {/* Bio section */}
          {user.bio && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">About</h3>
              <p className="text-slate-300 leading-relaxed">
                {user.bio}
              </p>
            </div>
          )}

          {/* Skills section */}
          {user.skills && user.skills.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-sm border border-slate-600/50"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Interests section */}
          {user.interests && user.interests.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {user.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm border border-emerald-500/30"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Looking for section */}
          {user.lookingFor && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">Looking For</h3>
              <p className="text-slate-300 leading-relaxed">
                {user.lookingFor}
              </p>
            </div>
          )}

          {/* Investor profile section */}
          {user.role === Role.Investor && user.investorProfile && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">Investment Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {user.investorProfile.investmentRange && (
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <h4 className="text-sm font-medium text-slate-400 mb-1">Investment Range</h4>
                    <p className="text-white font-semibold">{user.investorProfile.investmentRange}</p>
                  </div>
                )}
                {user.investorProfile.sectors && user.investorProfile.sectors.length > 0 && (
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <h4 className="text-sm font-medium text-slate-400 mb-1">Sectors</h4>
                    <p className="text-white font-semibold">{user.investorProfile.sectors.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!isOwnProfile && (
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-700/50">
              {isConnected ? (
                <button
                  onClick={() => onMessage(user)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  <MessageSquareIcon className="w-5 h-5" />
                  Message
                </button>
              ) : isPending ? (
                <button
                  disabled
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-600 text-slate-400 font-medium rounded-xl cursor-not-allowed"
                >
                  <CheckIcon className="w-5 h-5" />
                  Request Sent
                </button>
              ) : (
                <button
                  onClick={() => onConnect(user)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  <UserPlusIcon className="w-5 h-5" />
                  Connect
                </button>
              )}
              
              <button
                onClick={() => onMessage(user)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white font-medium rounded-xl border border-slate-600/50 transition-all duration-200"
              >
                <MessageSquareIcon className="w-5 h-5" />
                Message
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardProfileCard;
