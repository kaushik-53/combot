import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Columns, LayoutDashboard, LogOut, User as UserIcon, Shield, Layers } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import KanbanColumn from './KanbanColumn';

export default function RoadmapPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState('');

  // Fetch all posts for roadmap
  const { data: postsData, isLoading, error } = useQuery({
    queryKey: ['posts', 'roadmap', selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      const res = await api.get(`/posts?${params.toString()}`);
      return res.data;
    },
  });

  const posts = postsData?.posts || [];

  // Toggle vote mutation
  const voteMutation = useMutation({
    mutationFn: async (postId) => {
      const res = await api.post(`/posts/${postId}/vote`);
      return res.data;
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const previousData = queryClient.getQueryData(['posts', 'roadmap', selectedCategory]);

      if (previousData && user) {
        queryClient.setQueryData(['posts', 'roadmap', selectedCategory], (old) => {
          if (!old) return old;
          return {
            ...old,
            posts: old.posts.map((p) => {
              if (p._id !== postId) return p;
              const hasVoted = p.voters?.includes(user._id);
              const newVoters = hasVoted
                ? p.voters.filter((id) => id !== user._id)
                : [...(p.voters || []), user._id];
              return {
                ...p,
                voters: newVoters,
                voteCount: hasVoted ? p.voteCount - 1 : p.voteCount + 1,
              };
            }),
          };
        });
      }
      return { previousData };
    },
    onError: (err, postId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['posts', 'roadmap', selectedCategory], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  // Admin update status mutation
  const statusMutation = useMutation({
    mutationFn: async ({ postId, status }) => {
      const res = await api.patch(`/posts/${postId}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const handleVoteToggle = (postId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    voteMutation.mutate(postId);
  };

  const handleStatusChange = (postId, newStatus) => {
    statusMutation.mutate({ postId, status: newStatus });
  };

  // Group posts into status columns
  const columns = {
    under_review: posts.filter((p) => p.status === 'under_review'),
    planned:      posts.filter((p) => p.status === 'planned'),
    in_progress:  posts.filter((p) => p.status === 'in_progress'),
    shipped:      posts.filter((p) => p.status === 'shipped'),
  };

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-900 font-sans antialiased">
      {/* Header Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg text-zinc-900 tracking-tight">
            <div className="h-8 w-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
              C
            </div>
            <span>Combot</span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/feed"
              className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Feedback Feed</span>
            </Link>

            <Link
              to="/roadmap"
              className="px-3 py-1.5 text-xs font-semibold text-zinc-900 bg-zinc-100 rounded-lg flex items-center gap-1.5"
            >
              <Columns className="h-3.5 w-3.5 text-zinc-900" />
              <span>Roadmap</span>
            </Link>

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 bg-zinc-100 px-2.5 py-1 rounded-full border border-zinc-200">
                  {user.role === 'admin' ? (
                    <Shield className="h-3.5 w-3.5 text-amber-600" />
                  ) : (
                    <UserIcon className="h-3.5 w-3.5 text-zinc-500" />
                  )}
                  <span>{user.name}</span>
                  {user.role === 'admin' && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                      ADMIN
                    </span>
                  )}
                </div>

                <button
                  onClick={logout}
                  className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-zinc-100 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-colors shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Roadmap Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
              <Layers className="h-4 w-4 text-zinc-700" />
              <span>Public Product Roadmap</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              What we're working on
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 mt-1">
              Follow feature request progress from initial community feedback to full release.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs font-semibold bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-sm"
            >
              <option value="">All Categories</option>
              <option value="feature">Features</option>
              <option value="bug">Bugs</option>
              <option value="integration">Integrations</option>
              <option value="performance">Performance</option>
            </select>
          </div>
        </div>

        {/* Loading / Error States */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-900 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium">
            Failed to load roadmap data. Please try refreshing.
          </div>
        ) : (
          /* 4-Column Kanban Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KanbanColumn
              statusKey="under_review"
              posts={columns.under_review}
              onVoteToggle={handleVoteToggle}
              onStatusChange={handleStatusChange}
              currentUserId={user?._id}
              isAdmin={user?.role === 'admin'}
            />
            <KanbanColumn
              statusKey="planned"
              posts={columns.planned}
              onVoteToggle={handleVoteToggle}
              onStatusChange={handleStatusChange}
              currentUserId={user?._id}
              isAdmin={user?.role === 'admin'}
            />
            <KanbanColumn
              statusKey="in_progress"
              posts={columns.in_progress}
              onVoteToggle={handleVoteToggle}
              onStatusChange={handleStatusChange}
              currentUserId={user?._id}
              isAdmin={user?.role === 'admin'}
            />
            <KanbanColumn
              statusKey="shipped"
              posts={columns.shipped}
              onVoteToggle={handleVoteToggle}
              onStatusChange={handleStatusChange}
              currentUserId={user?._id}
              isAdmin={user?.role === 'admin'}
            />
          </div>
        )}
      </main>
    </div>
  );
}
