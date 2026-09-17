import { useState } from 'react';
import { ThumbsUp, MessageSquare, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';
import CommentSection from '../comments/CommentSection';

const STATUS_CONFIG = {
  under_review: { title: 'Under Review', color: 'bg-slate-400', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' },
  planned:      { title: 'Planned',      color: 'bg-blue-500',  badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_progress:  { title: 'In Progress',  color: 'bg-amber-500', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  shipped:      { title: 'Shipped',      color: 'bg-emerald-500', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export default function KanbanColumn({ statusKey, posts = [], onVoteToggle, onStatusChange, currentUserId, isAdmin }) {
  const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG.under_review;
  const [expandedPostId, setExpandedPostId] = useState(null);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const toggleComments = (postId) => {
    setExpandedPostId(expandedPostId === postId ? null : postId);
  };

  return (
    <div className="flex flex-col bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 min-h-[500px] shadow-sm">
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${config.color}`} />
          <h2 className="text-sm font-bold text-zinc-900">{config.title}</h2>
        </div>
        <span className="px-2 py-0.5 text-xs font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-full">
          {posts.length}
        </span>
      </div>

      {/* Cards List */}
      <div className="flex-1 space-y-3">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 border border-dashed border-zinc-200 rounded-xl p-4 text-center">
            <p className="text-xs text-zinc-400 font-medium">No requests in this stage</p>
          </div>
        ) : (
          posts.map((post) => {
            const isVoted = currentUserId && post.voters?.includes(currentUserId);
            const isCommentsOpen = expandedPostId === post._id;

            return (
              <div
                key={post._id}
                className="bg-white border border-zinc-200/90 rounded-xl p-4 shadow-sm hover:border-zinc-300 transition-all space-y-3"
              >
                <div className="flex items-start gap-3">
                  {/* Upvote Button */}
                  <button
                    onClick={() => onVoteToggle && onVoteToggle(post._id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-semibold min-w-10 transition-all ${
                      isVoted
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    <ThumbsUp className="h-3.5 w-3.5 mb-0.5" />
                    <span>{post.voteCount ?? 0}</span>
                  </button>

                  {/* Card Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1 text-[11px] text-zinc-500">
                      <span className="capitalize font-medium text-zinc-700">{post.category}</span>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>

                    <h3 className="text-sm font-bold text-zinc-900 leading-snug line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                      {post.description}
                    </p>
                  </div>
                </div>

                {/* Footer Controls & Discussion toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs">
                  <button
                    onClick={() => toggleComments(post._id)}
                    className="text-zinc-500 hover:text-zinc-900 flex items-center gap-1 font-medium transition-colors text-[11px]"
                  >
                    <MessageSquare className="h-3 w-3" />
                    <span>Discussion</span>
                    {isCommentsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>

                  {/* Admin inline status control */}
                  {isAdmin ? (
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert className="h-3 w-3 text-amber-600" />
                      <select
                        value={post.status}
                        onChange={(e) => onStatusChange && onStatusChange(post._id, e.target.value)}
                        className="text-[11px] font-semibold bg-zinc-100 border border-zinc-200 rounded px-1.5 py-0.5 text-zinc-800 hover:bg-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                      >
                        <option value="under_review">Under Review</option>
                        <option value="planned">Planned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="shipped">Shipped</option>
                      </select>
                    </div>
                  ) : null}
                </div>

                {/* Expanded Discussion */}
                {isCommentsOpen && (
                  <div className="pt-2">
                    <CommentSection postId={post._id} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
