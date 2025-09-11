import React, { useEffect, useState, useRef } from 'react';
import { Idea, Role, Comment, User } from '../types';
import { XIcon, UsersIcon, CodeIcon, HeartIcon, ChatBubbleLeftRightIcon, TrashIcon, SendIcon } from './icons';
import { getSafeAvatarUrl, getUserInitials, isGoogleAvatarUrl } from '../utils/avatar';
import { filterAbusiveText } from '../utils/abuse';
import { firestoreService } from '../services/firestoreService';

interface IdeaDetailModalProps {
  idea: Idea;
  open: boolean;
  onClose: () => void;
  currentUser: User; // User type
  showComments?: boolean;
  onLike?: (ideaId: string) => void;
  onShowComments?: () => void;
  onAddComment?: (ideaId: string, text: string) => void;
  onDeleteComment?: (ideaId: string, comment: Comment) => void;
}

const IdeaDetailModal: React.FC<IdeaDetailModalProps> = ({ idea, open, onClose, currentUser, showComments = false, onLike, onShowComments, onAddComment, onDeleteComment }) => {
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState<Comment[]>(idea.comments || []);
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const [likesCount, setLikesCount] = useState<number>(idea.likes?.length || 0);
  const [commentsCount, setCommentsCount] = useState<number>(idea.comments?.length || 0);

  const formatRelativeTime = (createdAt: any): string => {
    if (!createdAt) return '';
    let ms = 0;
    if (createdAt?.seconds) {
      ms = createdAt.seconds * 1000;
    } else if (typeof createdAt?.toDate === 'function') {
      ms = createdAt.toDate().getTime();
    } else if (createdAt instanceof Date) {
      ms = createdAt.getTime();
    } else if (typeof createdAt === 'number') {
      ms = createdAt;
    } else {
      try { ms = new Date(createdAt).getTime(); } catch { ms = Date.now(); }
    }
    const diff = Math.max(0, Date.now() - ms);
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    const month = 30 * day;
    const year = 365 * day;

    if (diff < minute) return '1m';
    if (diff < hour) return `${Math.floor(diff / minute)}m`;
    if (diff < day) return `${Math.floor(diff / hour)}h`;
    if (diff < week) return `${Math.floor(diff / day)}d`;
    if (diff < month) return `${Math.floor(diff / week)}w`;
    if (diff < year) return `${Math.floor(diff / month)}mo`;
    return `${Math.floor(diff / year)}y`;
  };
  useEffect(() => {
    setLocalComments(idea.comments || []);
    const unsubscribe = firestoreService.subscribeToIdeaComments(idea.id, (comments) => {
      // Sort by createdAt if available; otherwise by id creation time fallback (latest first)
      const sorted = [...comments].sort((a: any, b: any) => {
        const ta = (a.createdAt && (a.createdAt.seconds || a.createdAt.getTime?.())) || 0;
        const tb = (b.createdAt && (b.createdAt.seconds || b.createdAt.getTime?.())) || 0;
        return tb - ta; // Reverse order: latest first
      });
      setLocalComments(sorted);
      setCommentsCount(sorted.length);
    });
    return () => {
      unsubscribe && unsubscribe();
    };
  }, [idea.id]);

  useEffect(() => {
    setLikesCount(idea.likes?.length || 0);
    const unsub = firestoreService.subscribeToIdeaMeta(idea.id, (updated) => {
      setLikesCount(updated.likes?.length || 0);
      setCommentsCount(updated.comments?.length || 0);
    });
    return () => { unsub && unsub(); };
  }, [idea.id]);

  // Auto-scroll to top when comments section opens (latest comments are now at top)
  useEffect(() => {
    if (showComments && commentsContainerRef.current) {
      commentsContainerRef.current.scrollTop = 0;
    }
  }, [showComments, localComments]);
  if (!open || !idea) return null;

  const isFounder = idea.founderId === currentUser.id;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !onAddComment) return;
    const sanitized = filterAbusiveText(commentText.trim());
    if (!sanitized) return;
    // Optimistic UI update
    const optimistic: Comment = {
      id: 'temp_' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name || currentUser.username || 'User',
      userAvatar: getSafeAvatarUrl(currentUser) || '',
      text: sanitized,
      createdAt: new Date() as any
    };
    setLocalComments(prev => [...prev, optimistic]);
    setCommentText('');
    // Fire real update
    onAddComment(idea.id, sanitized);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className={`bg-neutral-900 rounded-2xl border border-neutral-800 w-full ${showComments ? 'max-w-5xl' : 'max-w-lg'} mx-2 relative animate-fadeInUp overflow-hidden`}>
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-white" title="Close" aria-label="Close">
          <XIcon className="w-6 h-6" />
        </button>
        <div className={`grid ${showComments ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Left: Idea content */}
          <div className={`p-6 border-b ${showComments ? 'md:border-b-0 md:border-r' : ''} border-neutral-800`}>
            <div className="flex items-center gap-4 mb-4">
            {(() => {
              // Always use the stored founderAvatar from the idea for consistency across all users
              const avatarSource = idea.founderAvatar;
              // Create a user-like object with the stored avatar and customAvatar flag
              const userObj = idea.founderCustomAvatar ? {
                photoURL: avatarSource,
                customAvatar: true
              } : {
                avatarUrl: avatarSource,
                customAvatar: false
              };
              const safeUrl = getSafeAvatarUrl(userObj);

              if (safeUrl) {
                return (
                  <img src={safeUrl} alt={idea.founderName} className="w-14 h-14 rounded-full border-2 border-neutral-700" />
                );
              } else {
                return (
                  <div className="w-14 h-14 rounded-full border-2 border-neutral-700 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-lg font-bold">
                    {getUserInitials(idea.founderName)}
                  </div>
                );
              }
            })()}
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{idea.title}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-400">by {idea.founderName}</span>
                  <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-900/60 text-purple-300">Founder</span>
                </div>
              </div>
            </div>
            <p className="text-neutral-300 mb-4 whitespace-pre-line break-words overflow-wrap-anywhere">{idea.description}</p>
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
              <button
                onClick={(e) => { e.stopPropagation(); onLike && onLike(idea.id); }}
                title={"Like"}
                className="flex items-center gap-1.5 text-neutral-400 hover:text-red-500 transition-colors"
              >
                <HeartIcon className="w-5 h-5" />
                <span>{likesCount}</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onShowComments && onShowComments(); }}
                title={showComments ? 'Comments' : 'Show comments'}
                className="flex items-center gap-1.5 text-neutral-400 hover:text-blue-500 transition-colors"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                <span>{commentsCount}</span>
              </button>
              <div className="flex items-center gap-1.5 text-green-400">
                <UsersIcon className="w-5 h-5" />
                <span>{idea.team.length} team</span>
              </div>
            </div>
          </div>

          {/* Right: Comments */}
          {showComments && (
          <div className="flex flex-col h-full max-h-[70vh]">
            <div ref={commentsContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {localComments && localComments.length > 0 ? (
                localComments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3 group">
                    {comment.userAvatar && !isGoogleAvatarUrl(comment.userAvatar) ? (
                      <img src={comment.userAvatar} alt={comment.userName} className="w-8 h-8 rounded-full border border-neutral-700/50" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-[10px] font-bold border border-neutral-700/50">
                        {getUserInitials(comment.userName)}
                      </div>
                    )}
                    <div className="flex-1 bg-neutral-800/40 border border-neutral-700/50 rounded-lg p-2.5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-white font-medium text-xs truncate mr-2">{comment.userName}</p>
                          <span className="text-[10px] text-neutral-500 whitespace-nowrap">{formatRelativeTime((comment as any).createdAt)}</span>
                        </div>
                        {isFounder && onDeleteComment && !String(comment.id).startsWith('temp_') && (
                          <button onClick={() => onDeleteComment(idea.id, comment)} title="Delete comment" className="text-neutral-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-neutral-300 text-xs whitespace-pre-wrap break-words mt-1">{comment.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-neutral-400 text-sm">No comments yet. Be the first to say something!</p>
              )}
            </div>
            <form onSubmit={handleSubmit} className="p-3 border-t border-neutral-800/70 flex items-center gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-neutral-900/60 border border-neutral-700/50 rounded-lg py-2 px-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
              <button type="submit" className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-medium py-2 px-3 rounded-lg">
                <SendIcon className="w-4 h-4" />
                Post
              </button>
            </form>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IdeaDetailModal;
