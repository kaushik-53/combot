import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../../components/ui/button';
import api from '../../lib/api';
import {
  ThumbsUp,
  Kanban,
  ArrowRight,
  User,
  LogOut,
  Search,
  Shield,
  Zap,
  LayoutDashboard,
  Plus,
  Sparkles
} from 'lucide-react';

const STATUS_BADGES = {
  under_review: { label: 'UNDER REVIEW', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  planned:      { label: 'PLANNED',      className: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_progress:  { label: 'IN PROGRESS',  className: 'bg-amber-50 text-amber-700 border-amber-200' },
  shipped:      { label: 'SHIPPED',      className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export default function LandingPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'roadmap'

  // Fetch real posts for preview
  const { data: postsData, isLoading } = useQuery({
    queryKey: ['posts', 'preview'],
    queryFn: async () => {
      const res = await api.get('/posts?sort=trending');
      return res.data;
    },
  });

  const posts = postsData?.posts || [];

  const scrollToPreview = (tab) => {
    setActiveTab(tab);
    setTimeout(() => {
      const el = document.getElementById('preview-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // Group posts for roadmap preview
  const columns = {
    under_review: posts.filter((p) => p.status === 'under_review'),
    planned:      posts.filter((p) => p.status === 'planned'),
    in_progress:  posts.filter((p) => p.status === 'in_progress'),
    shipped:      posts.filter((p) => p.status === 'shipped'),
  };

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-900 flex flex-col font-sans selection:bg-zinc-200 selection:text-zinc-900">
      {/* ── Light Clean Header ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200/80 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              C
            </div>
            <span className="font-bold text-zinc-900 tracking-tight text-lg">Combot</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-600 font-medium">
            <Link to="/feed" className="hover:text-zinc-900 transition-colors flex items-center gap-1.5 text-zinc-800 font-semibold">
              <LayoutDashboard className="h-3.5 w-3.5 text-zinc-700" />
              Dashboard
            </Link>
            <Link to="/feed" className="hover:text-zinc-900 transition-colors">
              Feedback
            </Link>
            <Link to="/roadmap" className="hover:text-zinc-900 transition-colors flex items-center gap-1.5">
              <Kanban className="h-3.5 w-3.5 text-zinc-500" />
              Roadmap
            </Link>
            <a href="#features" className="hover:text-zinc-900 transition-colors">Features</a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-700">
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
                  className="border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1.5" />
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 font-medium">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium shadow-sm">
                    Get Started <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero Section (Light) ── */}
        <section className="pt-20 pb-14 px-6 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200/80 text-xs text-zinc-600 shadow-sm font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Customer Feedback & Public Roadmap Portal
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 leading-tight">
              Collect feedback. <br className="hidden sm:block" />
              Build what users actually want.
            </h1>

            <p className="text-base sm:text-lg text-zinc-600 max-w-xl mx-auto leading-relaxed">
              A clean, minimal portal for feature requests, atomic upvoting, and a real-time public roadmap.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/feed">
                <Button size="lg" className="w-full sm:w-auto h-11 px-6 bg-zinc-900 hover:bg-zinc-800 text-white font-medium shadow-sm flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Go to Dashboard
                </Button>
              </Link>
              <Link to="/feed">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-11 px-6 border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 font-medium shadow-sm">
                  Explore Feedback
                </Button>
              </Link>
              <Link to="/roadmap">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-11 px-6 border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 font-medium shadow-sm">
                  <Kanban className="h-4 w-4 mr-2 text-zinc-500" />
                  View Public Roadmap
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Interactive Feed / Roadmap Preview ── */}
        <section id="preview-section" className="py-10 px-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-200/80 pb-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">Live Feedback Portal</h2>
                <p className="text-xs text-zinc-500">Live preview of user requests and public pipeline</p>
              </div>

              <div className="flex items-center gap-1 p-1 bg-zinc-200/60 rounded-lg border border-zinc-200 text-xs">
                <button
                  onClick={() => setActiveTab('feed')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                    activeTab === 'feed'
                      ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Requests
                </button>
                <button
                  onClick={() => setActiveTab('roadmap')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                    activeTab === 'roadmap'
                      ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Roadmap
                </button>
              </div>
            </div>

            {/* FEED TAB */}
            {activeTab === 'feed' && (
              <div className="space-y-3">
                {isLoading ? (
                  <div className="py-12 text-center text-xs text-zinc-400">Loading feedback...</div>
                ) : posts.length === 0 ? (
                  <div className="py-12 text-center bg-white border border-zinc-200/90 rounded-2xl p-6 space-y-3 shadow-sm">
                    <Sparkles className="h-6 w-6 text-zinc-400 mx-auto" />
                    <h3 className="text-sm font-bold text-zinc-900">No feature requests yet</h3>
                    <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                      Be the first to submit a feature suggestion!
                    </p>
                    <Link to="/feed">
                      <Button size="sm" className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium">
                        <Plus className="h-4 w-4 mr-1.5" /> Submit First Request
                      </Button>
                    </Link>
                  </div>
                ) : (
                  posts.slice(0, 4).map((post) => {
                    const statusInfo = STATUS_BADGES[post.status] || STATUS_BADGES.under_review;
                    const isVoted = user && post.voters?.includes(user._id);

                    return (
                      <div
                        key={post._id}
                        className="p-4 rounded-xl bg-white border border-zinc-200/90 shadow-sm flex items-start gap-4 hover:border-zinc-300 transition-all cursor-pointer"
                        onClick={() => navigate('/feed')}
                      >
                        <div
                          className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-semibold min-w-12 transition-all ${
                            isVoted
                              ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                          }`}
                        >
                          <ThumbsUp className="h-3.5 w-3.5 mb-0.5" />
                          <span>{post.voteCount ?? 0}</span>
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${statusInfo.className}`}>
                              {statusInfo.label}
                            </span>
                            <span className="text-xs text-zinc-400">• Posted by {post.author?.name || 'Anonymous'}</span>
                          </div>
                          <h3 className="text-sm font-bold text-zinc-900">{post.title}</h3>
                          <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">
                            {post.description}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ROADMAP TAB */}
            {activeTab === 'roadmap' && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                {/* Under Review */}
                <div className="p-3 rounded-xl bg-zinc-100/70 border border-zinc-200/80 space-y-2">
                  <div className="font-semibold text-zinc-600 pb-1 border-b border-zinc-200 flex justify-between">
                    <span>Under Review</span>
                    <span>({columns.under_review.length})</span>
                  </div>
                  {columns.under_review.slice(0, 2).map((p) => (
                    <div key={p._id} className="p-2.5 rounded-lg bg-white border border-zinc-200 text-zinc-900 font-medium shadow-sm">
                      {p.title}
                      <div className="text-[10px] text-zinc-500 mt-1 font-normal">{p.voteCount} votes</div>
                    </div>
                  ))}
                  {columns.under_review.length === 0 && (
                    <div className="text-[11px] text-zinc-400 py-2 text-center">Empty</div>
                  )}
                </div>

                {/* Planned */}
                <div className="p-3 rounded-xl bg-zinc-100/70 border border-zinc-200/80 space-y-2">
                  <div className="font-semibold text-blue-700 pb-1 border-b border-zinc-200 flex justify-between">
                    <span>Planned</span>
                    <span>({columns.planned.length})</span>
                  </div>
                  {columns.planned.slice(0, 2).map((p) => (
                    <div key={p._id} className="p-2.5 rounded-lg bg-white border border-zinc-200 text-zinc-900 font-medium shadow-sm">
                      {p.title}
                      <div className="text-[10px] text-zinc-500 mt-1 font-normal">{p.voteCount} votes</div>
                    </div>
                  ))}
                  {columns.planned.length === 0 && (
                    <div className="text-[11px] text-zinc-400 py-2 text-center">Empty</div>
                  )}
                </div>

                {/* In Progress */}
                <div className="p-3 rounded-xl bg-zinc-100/70 border border-zinc-200/80 space-y-2">
                  <div className="font-semibold text-amber-700 pb-1 border-b border-zinc-200 flex justify-between">
                    <span>In Progress</span>
                    <span>({columns.in_progress.length})</span>
                  </div>
                  {columns.in_progress.slice(0, 2).map((p) => (
                    <div key={p._id} className="p-2.5 rounded-lg bg-white border border-zinc-200 text-zinc-900 font-medium shadow-sm">
                      {p.title}
                      <div className="text-[10px] text-zinc-500 mt-1 font-normal">{p.voteCount} votes</div>
                    </div>
                  ))}
                  {columns.in_progress.length === 0 && (
                    <div className="text-[11px] text-zinc-400 py-2 text-center">Empty</div>
                  )}
                </div>

                {/* Shipped */}
                <div className="p-3 rounded-xl bg-zinc-100/70 border border-zinc-200/80 space-y-2">
                  <div className="font-semibold text-emerald-700 pb-1 border-b border-zinc-200 flex justify-between">
                    <span>Shipped</span>
                    <span>({columns.shipped.length})</span>
                  </div>
                  {columns.shipped.slice(0, 2).map((p) => (
                    <div key={p._id} className="p-2.5 rounded-lg bg-white border border-zinc-200 text-zinc-900 font-medium shadow-sm">
                      {p.title}
                      <div className="text-[10px] text-zinc-500 mt-1 font-normal">{p.voteCount} votes</div>
                    </div>
                  ))}
                  {columns.shipped.length === 0 && (
                    <div className="text-[11px] text-zinc-400 py-2 text-center">Empty</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Features Grid (Light) ── */}
        <section id="features" className="py-14 px-6 bg-zinc-100/50 border-t border-zinc-200">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-zinc-900">Clean Core Architecture</h2>
              <p className="text-xs text-zinc-500">Strict concurrency, JWT rotation, and single-flight state sync</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-5 rounded-xl bg-white border border-zinc-200/80 shadow-sm space-y-2">
                <div className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-zinc-600" /> Atomic Voting
                </div>
                <p className="text-zinc-600 leading-relaxed">
                  MongoDB <code className="text-zinc-800 font-semibold">$addToSet</code> & <code className="text-zinc-800 font-semibold">$inc</code> operators prevent race conditions and duplicate votes.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white border border-zinc-200/80 shadow-sm space-y-2">
                <div className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4 text-zinc-600" /> Token Rotation
                </div>
                <p className="text-zinc-600 leading-relaxed">
                  Automatic refresh token rotation with family revocation on stolen token replay detection.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white border border-zinc-200/80 shadow-sm space-y-2">
                <div className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-zinc-600" /> Single-Flight Refresh
                </div>
                <p className="text-zinc-600 leading-relaxed">
                  Axios interceptor batches concurrent 401s into a single active refresh promise.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-14 px-6 text-center border-t border-zinc-200 bg-white">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl font-extrabold text-zinc-900">Get Started with Combot</h2>
            <p className="text-xs text-zinc-500">
              Submit feedback, upvote features, and follow the product roadmap.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              {user ? (
                <Link to="/feed">
                  <Button className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium shadow-sm">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/signup">
                    <Button className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-5 shadow-sm">
                      Create Account
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline" className="border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 px-5">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-200 py-6 px-6 text-xs text-zinc-500 bg-zinc-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-800">Combot</span>
            <span>© 2026</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 font-medium text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Operational
          </div>
        </div>
      </footer>
    </div>
  );
}
