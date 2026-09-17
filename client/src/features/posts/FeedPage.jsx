import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../../lib/api';
import PostCard from './PostCard';
import CreatePostModal from './CreatePostModal';
import { Button } from '../../components/ui/button';
import { toast } from '../../components/ui/toast';
import {
  Plus,
  Search,
  Filter,
  Flame,
  User,
  LogOut,
  Sparkles,
  Kanban,
  RotateCw
} from 'lucide-react';

export default function FeedPage() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch posts query
  const {
    data,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['posts', statusFilter, categoryFilter, sortBy, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (sortBy) params.append('sort', sortBy);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await api.get(`/posts?${params.toString()}`);
      return res.data;
    },
  });

  // Optimistic vote mutation
  const voteMutation = useMutation({
    mutationFn: async (postId) => {
      const res = await api.post(`/posts/${postId}/vote`);
      return res.data;
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });

      const queryKey = ['posts', statusFilter, categoryFilter, sortBy, searchQuery];
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return old;
        const currentUserId = user?._id || user?.id;

        return {
          ...old,
          posts: old.posts.map((p) => {
            if (p._id !== postId) return p;

            const isVoted = currentUserId && p.voters?.includes(currentUserId);
            const newVoters = isVoted
              ? p.voters.filter((id) => id !== currentUserId)
              : [...(p.voters || []), currentUserId];
            const newCount = isVoted ? Math.max(0, p.voteCount - 1) : p.voteCount + 1;

            return {
              ...p,
              voters: newVoters,
              voteCount: newCount,
            };
          }),
        };
      });

      return { previousData, queryKey };
    },
    onError: (err, _postId, context) => {
      if (context?.previousData && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      const msg = err.response?.data?.error?.message || 'Please sign in to upvote feature requests';
      toast.error(msg);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const posts = data?.posts || [];

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-900 flex flex-col font-sans">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              C
            </div>
            <span className="font-bold text-zinc-900 tracking-tight text-lg">Combot</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/roadmap"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
            >
              <Kanban className="h-3.5 w-3.5 text-zinc-600" />
              <span>Public Roadmap</span>
            </Link>

            <Button
              onClick={() => setIsModalOpen(true)}
              size="sm"
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium shadow-sm"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Submit Request
            </Button>

            {user && (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-700">
                  <User className="h-3.5 w-3.5 text-zinc-500" />
                  <span>{user.name}</span>
                  <span className="uppercase text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-700 font-semibold">
                    {user.role}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
                >
                  <LogOut className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-6">
        {/* Title & Status Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900">Feature Requests</h1>
            <p className="text-xs text-zinc-500">Submit suggestions and upvote ideas you want shipped</p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-zinc-200/60 rounded-lg border border-zinc-200 text-xs overflow-x-auto">
            {[
              { id: 'all', label: 'All Requests' },
              { id: 'under_review', label: 'Under Review' },
              { id: 'planned', label: 'Planned' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'shipped', label: 'Shipped' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feature requests..."
              className="w-full bg-white border border-zinc-200 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:border-zinc-900 shadow-sm"
            >
              <option value="all">All Categories</option>
              <option value="feature">Features</option>
              <option value="bug">Bugs</option>
              <option value="integration">Integrations</option>
              <option value="ux">UX / Design</option>
              <option value="other">Other</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:border-zinc-900 shadow-sm font-medium"
            >
              <option value="trending">🔥 Trending</option>
              <option value="top">⭐ Top Voted</option>
              <option value="newest">🆕 Newest First</option>
            </select>
          </div>
        </div>

        {/* Feed List */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <RotateCw className="h-6 w-6 animate-spin mx-auto text-zinc-400" />
            <p className="text-xs text-zinc-500">Loading requests...</p>
          </div>
        ) : isError ? (
          <div className="py-12 text-center bg-rose-50 border border-rose-200 rounded-xl p-6">
            <p className="text-sm font-semibold text-rose-700">Failed to load posts</p>
            <Button size="sm" onClick={() => refetch()} className="mt-3 bg-rose-600 hover:bg-rose-700 text-white">
              Retry
            </Button>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center bg-white border border-zinc-200/90 rounded-2xl p-8 space-y-3 shadow-sm">
            <Sparkles className="h-8 w-8 text-zinc-400 mx-auto" />
            <h3 className="text-base font-bold text-zinc-900">No requests found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Be the first to submit an idea or try changing your filters!
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              size="sm"
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Submit Request
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                currentUserId={user?._id || user?.id}
                onVoteToggle={(id) => voteMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal Dialog */}
      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['posts'] });
        }}
      />
    </div>
  );
}
