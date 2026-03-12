'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import Navbar from '@/components/nav/Navbar';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { fadeInUp, staggerContainer, scaleIn } from '@/lib/animations/motion-config';
import {
    User, MapPin, Calendar, Star, ShieldCheck, Package, Loader2, Trophy, Crown,
    Zap, Heart, Briefcase, Users, UserPlus, Award, TrendingUp, Activity,
    CheckCircle2, AlertTriangle, Eye, MessageCircle, Clock, Sparkles,
    ChevronRight, ExternalLink, Shield, Target, Gem, Flame, Pencil
} from 'lucide-react';
import Link from 'next/link';

// ═══════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════
interface FullProfileData {
    user: {
        id: string; firstName: string; lastName: string; avatar?: string;
        bio?: string; verified: boolean; city?: string; interests: string[];
        level: number; points: number; fairnessScore: number;
        subscriptionTier: string; responseTime: number; createdAt: string;
        levelInfo: { level: number; title: string; minPoints: number; maxPoints: number; progress: number };
    };
    reputation: {
        trustScore: number; status: string; color: string;
        components: { transaction: number; review: number; verification: number; activity: number; response: number } | null;
        negativeFactors: { reports: number; disputes: number; cancellations: number; spam: number } | null;
    };
    subscription: { tier: string; monthlyPrice: number; features: string[]; isActive: boolean; renewalDate: string | null };
    achievements: { id: string; key: string; title: string; description: string; icon: string; category: string; rarity: string; unlockedAt: string }[];
    connections: {
        all: ConnectionItem[]; closeFriends: ConnectionItem[]; businessFriends: ConnectionItem[];
        followers: ConnectionItem[]; following: ConnectionItem[]; trustedPartners: ConnectionItem[];
    };
    stats: { listings: number; completedTransactions: number; reviewsReceived: number; followersCount: number; followingCount: number; totalConnections: number };
    recentActivity: { id: string; activity: string; points: number; description: string; createdAt: string }[];
    allLevels: { level: number; title: string; minPoints: number; maxPoints: number }[];
    allSubscriptionTiers: Record<string, { price: number; features: string[] }>;
}

interface ConnectionItem {
    id: string; type: string;
    user: { id: string; firstName: string; lastName: string; avatar?: string; verified: boolean; level: number; subscriptionTier?: string };
    createdAt: string;
}

// ═══════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════
const LEVEL_COLORS: Record<number, string> = {
    1: '#94a3b8', 2: '#60a5fa', 3: '#34d399', 4: '#a78bfa', 5: '#f472b6', 6: '#fbbf24'
};
const LEVEL_GRADIENTS: Record<number, string> = {
    1: 'linear-gradient(135deg, #475569, #94a3b8)',
    2: 'linear-gradient(135deg, #2563eb, #60a5fa)',
    3: 'linear-gradient(135deg, #059669, #34d399)',
    4: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
    5: 'linear-gradient(135deg, #db2777, #f472b6)',
    6: 'linear-gradient(135deg, #d97706, #fbbf24)',
};
const TIER_CONFIG: Record<string, { color: string; gradient: string; icon: typeof Crown; glow: string }> = {
    FREE: { color: '#94a3b8', gradient: 'linear-gradient(135deg, #334155, #64748b)', icon: User, glow: 'none' },
    PRO: { color: '#60a5fa', gradient: 'linear-gradient(135deg, #1d4ed8, #60a5fa)', icon: Zap, glow: '0 0 30px rgba(96,165,250,0.3)' },
    BUSINESS: { color: '#a78bfa', gradient: 'linear-gradient(135deg, #6d28d9, #a78bfa)', icon: Briefcase, glow: '0 0 30px rgba(167,139,250,0.3)' },
    ENTERPRISE: { color: '#fbbf24', gradient: 'linear-gradient(135deg, #b45309, #fbbf24)', icon: Crown, glow: '0 0 40px rgba(251,191,36,0.4)' },
};
const CONNECTION_TABS = [
    { key: 'all', label: 'All', icon: Users },
    { key: 'closeFriends', label: 'Close Friends', icon: Heart },
    { key: 'businessFriends', label: 'Business', icon: Briefcase },
    { key: 'trustedPartners', label: 'Trusted', icon: Shield },
    { key: 'followers', label: 'Followers', icon: UserPlus },
];

// ═══════════════════════════════════════════
//  ANIMATED PROGRESS BAR
// ═══════════════════════════════════════════
function AnimatedProgress({ value, color, height = 8, delay = 0 }: { value: number; color: string; height?: number; delay?: number }) {
    return (
        <div style={{ width: '100%', height, borderRadius: height, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 1.2, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ height: '100%', borderRadius: height, background: `linear-gradient(90deg, ${color}, ${color}88)`, position: 'relative' }}
            >
                <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: height * 1.5, height: height * 1.5, borderRadius: '50%', background: color, boxShadow: `0 0 12px ${color}`, }} />
            </motion.div>
        </div>
    );
}

// ═══════════════════════════════════════════
//  TRUST SCORE GAUGE
// ═══════════════════════════════════════════
function TrustGauge({ score, color, status }: { score: number; color: string; status: string }) {
    const radius = 70;
    const circumference = Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <svg width="180" height="110" viewBox="0 0 180 110">
                <path d="M 10 100 A 70 70 0 0 1 170 100" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" strokeLinecap="round" />
                <motion.path
                    d="M 10 100 A 70 70 0 0 1 170 100"
                    fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                    style={{ filter: `drop-shadow(0 0 8px ${color})` }}
                />
                <text x="90" y="80" textAnchor="middle" fill="#fff" fontSize="28" fontWeight="700">{Math.round(score)}</text>
                <text x="90" y="100" textAnchor="middle" fill={color} fontSize="11" fontWeight="600">{status}</text>
            </svg>
        </div>
    );
}

// ═══════════════════════════════════════════
//  GLASS CARD WRAPPER
// ═══════════════════════════════════════════
function GlassCard({ children, glow, style, ...props }: { children: React.ReactNode; glow?: string; style?: React.CSSProperties;[key: string]: unknown }) {
    return (
        <motion.div variants={fadeInUp} style={{
            background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 20, padding: '24px', boxShadow: glow || '0 8px 32px rgba(0,0,0,0.2)',
            position: 'relative', overflow: 'hidden', ...style,
        }} {...props}>
            {children}
        </motion.div>
    );
}

// ═══════════════════════════════════════════
//  SECTION HEADER
// ═══════════════════════════════════════════
function SectionHeader({ icon: Icon, title, subtitle }: { icon: typeof Trophy; title: string; subtitle?: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} style={{ color: '#a78bfa' }} />
            </div>
            <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{title}</h3>
                {subtitle && <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{subtitle}</p>}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════
//  CONNECTION CARD
// ═══════════════════════════════════════════
function ConnectionCard({ connection }: { connection: ConnectionItem }) {
    const u = connection.user;
    const levelColor = LEVEL_COLORS[u.level] || '#94a3b8';
    return (
        <Link href={`/profile/${u.id}`} style={{ textDecoration: 'none' }}>
            <motion.div whileHover={{ y: -4, scale: 1.02 }} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16,
                padding: 16, display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.3s',
            }}>
                <div style={{
                    width: 44, height: 44, borderRadius: '50%', background: LEVEL_GRADIENTS[u.level] || LEVEL_GRADIENTS[1],
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                    border: `2px solid ${levelColor}33`, flexShrink: 0,
                }}>
                    {u.avatar ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                        <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 700 }}>{u.firstName[0]}{u.lastName[0]}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}>{u.firstName} {u.lastName}</span>
                        {u.verified && <ShieldCheck size={13} style={{ color: '#34d399' }} />}
                    </div>
                    <span style={{ color: levelColor, fontSize: '0.7rem', fontWeight: 600 }}>Level {u.level}</span>
                </div>
            </motion.div>
        </Link>
    );
}

// ═══════════════════════════════════════════
//  MAIN PROFILE PAGE
// ═══════════════════════════════════════════
export default function ProfilePage() {
    const params = useParams();
    const { user: currentUser } = useAuthStore();
    const [profile, setProfile] = useState<FullProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [connectionTab, setConnectionTab] = useState('all');
    const userId = params.id as string;
    const isOwnProfile = currentUser?.id === userId;

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await apiClient.get<FullProfileData>(`/engagement/profile/${userId}/full`);
                setProfile(res);
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            } finally {
                setLoading(false);
            }
        };
        if (userId) fetchProfile();
    }, [userId]);

    if (loading) return (
        <><Navbar /><div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={40} style={{ color: '#a78bfa', animation: 'spin 1s linear infinite' }} /></div></>
    );

    if (!profile) return (
        <><Navbar /><div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <User size={64} style={{ opacity: 0.3, marginBottom: 16 }} /><h2>User not found</h2><Link href="/" style={{ color: '#a78bfa', marginTop: 8 }}>Go home</Link></div></>
    );

    const { user: profileUser, reputation, subscription, achievements, connections, stats, recentActivity, allLevels } = profile;
    const levelColor = LEVEL_COLORS[profileUser.level] || '#94a3b8';
    const tierConfig = TIER_CONFIG[subscription.tier] || TIER_CONFIG.FREE;
    const TierIcon = tierConfig.icon;
    const memberSince = new Date(profileUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const isPremium = subscription.tier !== 'FREE';

    const mainTabs = [
        { key: 'overview', label: 'Overview', icon: Eye },
        { key: 'reputation', label: 'Reputation', icon: Trophy },
        { key: 'connections', label: 'Connections', icon: Users },
        { key: 'activity', label: 'Activity', icon: Activity },
    ];

    const currentConnections = connectionTab === 'all' ? connections.all :
        (connections as any)[connectionTab] || [];

    return (
        <>
            <Navbar />
            <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0f 0%, #0f0f1e 30%, #1a1a2e 60%, #16213e 100%)', paddingTop: 100, paddingBottom: 80 }}>

                {/* ═══ PREMIUM GLOW BACKGROUND ═══ */}
                {isPremium && <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, ${tierConfig.color}08 0%, transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />}

                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 1 }}>

                    {/* ═══════════════════════════════════════
                         HERO HEADER
                    ═══════════════════════════════════════ */}
                    <motion.div variants={staggerContainer} initial="hidden" animate="visible" style={{ marginBottom: 40 }}>

                        {/* Avatar + Core Info */}
                        <motion.div variants={fadeInUp} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 32 }}>

                            {/* Avatar with Level Ring */}
                            <div style={{ position: 'relative', marginBottom: 20 }}>
                                <div style={{
                                    width: 130, height: 130, borderRadius: '50%',
                                    background: LEVEL_GRADIENTS[profileUser.level], padding: 4,
                                    boxShadow: isPremium ? tierConfig.glow : `0 0 30px ${levelColor}33`,
                                }}>
                                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {profileUser.avatar ? <img src={profileUser.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                                            <span style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700 }}>{profileUser.firstName[0]}{profileUser.lastName[0]}</span>}
                                    </div>
                                </div>

                                {/* Level Badge */}
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}
                                    style={{ position: 'absolute', bottom: -4, right: -4, background: LEVEL_GRADIENTS[profileUser.level], borderRadius: 20, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 4, border: '2px solid #0a0a0f', boxShadow: `0 0 12px ${levelColor}44` }}>
                                    <Trophy size={12} style={{ color: '#fff' }} />
                                    <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 800 }}>LVL {profileUser.levelInfo.level}</span>
                                </motion.div>

                                {/* Premium Badge */}
                                {isPremium && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7, type: 'spring' }}
                                        style={{ position: 'absolute', top: -4, right: -4, background: tierConfig.gradient, borderRadius: 20, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 3, border: '2px solid #0a0a0f', boxShadow: tierConfig.glow }}>
                                        <TierIcon size={11} style={{ color: '#fff' }} />
                                        <span style={{ color: '#fff', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase' }}>{subscription.tier}</span>
                                    </motion.div>
                                )}
                            </div>

                            {/* Name + Verified + Edit */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                                    {profileUser.firstName} {profileUser.lastName}
                                </h1>
                                {profileUser.verified && <ShieldCheck size={22} style={{ color: '#34d399' }} />}
                            </div>

                            {/* Edit Profile Button (own profile only) */}
                            {isOwnProfile && (
                                <Link href="/settings" style={{ textDecoration: 'none' }}>
                                    <motion.button
                                        whileHover={{ scale: 1.04 }}
                                        whileTap={{ scale: 0.96 }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px',
                                            borderRadius: 12, border: '1px solid rgba(139,92,246,0.25)',
                                            background: 'rgba(139,92,246,0.1)', backdropFilter: 'blur(10px)',
                                            color: '#a78bfa', fontSize: '0.82rem', fontWeight: 600,
                                            cursor: 'pointer', transition: 'all 0.2s', marginBottom: 8,
                                        }}
                                    >
                                        <Pencil size={14} />
                                        Edit Profile
                                    </motion.button>
                                </Link>
                            )}

                            {/* Level Title */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                <Sparkles size={14} style={{ color: levelColor }} />
                                <span style={{ color: levelColor, fontWeight: 700, fontSize: '0.85rem' }}>{profileUser.levelInfo.title}</span>
                                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>•</span>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{profileUser.points.toLocaleString()} pts</span>
                            </div>

                            {/* Location & Member Since */}
                            <div style={{ display: 'flex', gap: 16, color: 'rgba(255,255,255,0.45)', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12, fontSize: '0.85rem' }}>
                                {profileUser.city && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={13} /> {profileUser.city}</span>}
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={13} /> Since {memberSince}</span>
                            </div>

                            {/* Bio */}
                            {profileUser.bio && <p style={{ color: 'rgba(255,255,255,0.55)', maxWidth: 550, fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 16 }}>{profileUser.bio}</p>}

                            {/* Interests */}
                            {profileUser.interests?.length > 0 && (
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 }}>
                                    {profileUser.interests.map(i => (
                                        <span key={i} style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(167,139,250,0.1)', color: '#a78bfa', fontSize: '0.75rem', border: '1px solid rgba(167,139,250,0.15)' }}>{i}</span>
                                    ))}
                                </div>
                            )}

                            {/* Quick Stats Bar */}
                            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
                                {[
                                    { label: 'Listings', value: stats.listings, icon: Package },
                                    { label: 'Transactions', value: stats.completedTransactions, icon: CheckCircle2 },
                                    { label: 'Reviews', value: stats.reviewsReceived, icon: Star },
                                    { label: 'Followers', value: stats.followersCount, icon: Users },
                                    { label: 'Trust', value: `${Math.round(reputation.trustScore)}%`, icon: Shield },
                                ].map(s => (
                                    <div key={s.label} style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                            <s.icon size={14} style={{ color: levelColor }} />
                                            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>{s.value}</p>
                                        </div>
                                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', margin: 0, fontWeight: 500 }}>{s.label}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Level Progress Bar */}
                        <motion.div variants={fadeInUp} style={{ maxWidth: 500, margin: '0 auto', marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                                <span>Level {profileUser.levelInfo.level}</span>
                                <span>{profileUser.levelInfo.progress}%</span>
                                <span>Level {Math.min(profileUser.levelInfo.level + 1, 6)}</span>
                            </div>
                            <AnimatedProgress value={profileUser.levelInfo.progress} color={levelColor} height={6} />
                        </motion.div>
                    </motion.div>

                    {/* ═══════════════════════════════════════
                         TAB NAVIGATION
                    ═══════════════════════════════════════ */}
                    <div style={{ display: 'flex', gap: 4, marginBottom: 32, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        {mainTabs.map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '12px 20px', border: 'none', background: 'transparent',
                                color: activeTab === tab.key ? '#a78bfa' : 'rgba(255,255,255,0.4)', fontWeight: activeTab === tab.key ? 700 : 400,
                                fontSize: '0.85rem', cursor: 'pointer', borderBottom: activeTab === tab.key ? '2px solid #a78bfa' : '2px solid transparent',
                                transition: 'all 0.2s', whiteSpace: 'nowrap',
                            }}>
                                <tab.icon size={15} />{tab.label}
                            </button>
                        ))}
                    </div>

                    {/* ═══════════════════════════════════════
                         OVERVIEW TAB
                    ═══════════════════════════════════════ */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div key="overview" variants={staggerContainer} initial="hidden" animate="visible" exit={{ opacity: 0 }}
                                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 20 }}>

                                {/* Trust Score Card */}
                                <GlassCard>
                                    <SectionHeader icon={Shield} title="Fair Trust Score" subtitle="Trustworthiness rating" />
                                    <TrustGauge score={reputation.trustScore} color={reputation.color} status={reputation.status} />
                                    {reputation.components && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                                            {[
                                                { label: 'Transactions', value: reputation.components.transaction, icon: TrendingUp },
                                                { label: 'Reviews', value: reputation.components.review, icon: Star },
                                                { label: 'Verification', value: reputation.components.verification, icon: ShieldCheck },
                                                { label: 'Activity', value: reputation.components.activity, icon: Activity },
                                                { label: 'Response', value: reputation.components.response, icon: Clock },
                                            ].map((c, i) => (
                                                <div key={c.label}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.75rem' }}>
                                                        <span style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 4 }}><c.icon size={11} />{c.label}</span>
                                                        <span style={{ color: '#fff', fontWeight: 600 }}>{Math.round(c.value)}</span>
                                                    </div>
                                                    <AnimatedProgress value={c.value} color={reputation.color} height={4} delay={0.1 * i} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </GlassCard>

                                {/* Subscription Card */}
                                <GlassCard glow={isPremium ? tierConfig.glow : undefined} style={isPremium ? { border: `1px solid ${tierConfig.color}33` } : {}}>
                                    <SectionHeader icon={TierIcon} title="Subscription" subtitle={isPremium ? 'Premium member' : 'Free plan'} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                        <div style={{ width: 56, height: 56, borderRadius: 16, background: tierConfig.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: tierConfig.glow }}>
                                            <TierIcon size={28} style={{ color: '#fff' }} />
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: tierConfig.color }}>{subscription.tier}</h4>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                                                {subscription.monthlyPrice > 0 ? `$${subscription.monthlyPrice}/month` : 'Free forever'}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {subscription.features.map((f, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                                                <CheckCircle2 size={13} style={{ color: tierConfig.color, flexShrink: 0 }} />{f}
                                            </div>
                                        ))}
                                    </div>
                                    {subscription.renewalDate && (
                                        <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                                            Renews {new Date(subscription.renewalDate).toLocaleDateString()}
                                        </div>
                                    )}
                                </GlassCard>

                                {/* Level Progress Card */}
                                <GlassCard style={{ gridColumn: 'span 1' }}>
                                    <SectionHeader icon={Flame} title="Level Journey" subtitle="Your progression path" />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {allLevels.map((lvl, i) => {
                                            const isActive = profileUser.level === lvl.level;
                                            const isPast = profileUser.level > lvl.level;
                                            const lc = LEVEL_COLORS[lvl.level];
                                            return (
                                                <div key={lvl.level} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: isPast ? 0.5 : 1 }}>
                                                    <div style={{
                                                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                                        background: isActive ? LEVEL_GRADIENTS[lvl.level] : isPast ? `${lc}33` : 'rgba(255,255,255,0.05)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        border: isActive ? `2px solid ${lc}` : 'none',
                                                        boxShadow: isActive ? `0 0 12px ${lc}44` : 'none',
                                                    }}>
                                                        {isPast ? <CheckCircle2 size={14} style={{ color: lc }} /> :
                                                            <span style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: '0.7rem', fontWeight: 700 }}>{lvl.level}</span>}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: isActive ? 700 : 400, fontSize: '0.82rem' }}>{lvl.title}</span>
                                                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>{lvl.minPoints.toLocaleString()} pts</span>
                                                        </div>
                                                        {isActive && <AnimatedProgress value={profileUser.levelInfo.progress} color={lc} height={4} delay={0.3} />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </GlassCard>

                                {/* Achievements Card */}
                                <GlassCard>
                                    <SectionHeader icon={Award} title="Achievements" subtitle={`${achievements.length} unlocked`} />
                                    {achievements.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: 24, color: 'rgba(255,255,255,0.3)' }}>
                                            <Award size={36} style={{ marginBottom: 8, opacity: 0.3 }} /><p style={{ fontSize: '0.85rem' }}>No achievements yet</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
                                            {achievements.slice(0, 8).map(a => {
                                                const rarityColors: Record<string, string> = { common: '#94a3b8', rare: '#60a5fa', epic: '#a78bfa', legendary: '#fbbf24' };
                                                return (
                                                    <motion.div key={a.id} whileHover={{ scale: 1.05 }} style={{
                                                        padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: `1px solid ${rarityColors[a.rarity] || '#94a3b8'}22`,
                                                        textAlign: 'center', cursor: 'pointer',
                                                    }}>
                                                        <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{a.icon}</div>
                                                        <div style={{ fontSize: '0.68rem', color: '#fff', fontWeight: 600 }}>{a.title}</div>
                                                        <div style={{ fontSize: '0.6rem', color: rarityColors[a.rarity], fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>{a.rarity}</div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </GlassCard>
                            </motion.div>
                        )}

                        {/* ═══ REPUTATION TAB ═══ */}
                        {activeTab === 'reputation' && (
                            <motion.div key="reputation" variants={staggerContainer} initial="hidden" animate="visible" exit={{ opacity: 0 }}
                                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 20 }}>
                                <GlassCard style={{ gridColumn: '1 / -1' }}>
                                    <SectionHeader icon={Target} title="Trust Score Breakdown" />
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            <TrustGauge score={reputation.trustScore} color={reputation.color} status={reputation.status} />
                                        </div>
                                        {reputation.components && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                                {[
                                                    { label: 'Transactions', value: reputation.components.transaction, color: '#34d399' },
                                                    { label: 'Reviews', value: reputation.components.review, color: '#fbbf24' },
                                                    { label: 'Verification', value: reputation.components.verification, color: '#60a5fa' },
                                                    { label: 'Activity', value: reputation.components.activity, color: '#a78bfa' },
                                                    { label: 'Response', value: reputation.components.response, color: '#f472b6' },
                                                ].map((c, i) => (
                                                    <div key={c.label}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.78rem' }}>
                                                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>{c.label}</span>
                                                            <span style={{ color: c.color, fontWeight: 700 }}>{Math.round(c.value)}/100</span>
                                                        </div>
                                                        <AnimatedProgress value={c.value} color={c.color} height={6} delay={0.1 * i} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </GlassCard>
                                {reputation.negativeFactors && (
                                    <GlassCard>
                                        <SectionHeader icon={AlertTriangle} title="Risk Factors" />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                            {[
                                                { label: 'Reports', value: reputation.negativeFactors.reports, color: '#f97316' },
                                                { label: 'Disputes', value: reputation.negativeFactors.disputes, color: '#ef4444' },
                                                { label: 'Cancellations', value: reputation.negativeFactors.cancellations, color: '#fbbf24' },
                                                { label: 'Spam', value: reputation.negativeFactors.spam, color: '#f472b6' },
                                            ].map(f => (
                                                <div key={f.label} style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: f.value > 0 ? f.color : 'rgba(255,255,255,0.2)' }}>{f.value}</div>
                                                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{f.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </GlassCard>
                                )}
                                <GlassCard>
                                    <SectionHeader icon={Gem} title="Level Benefits" />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {['Profile badges', 'Better listing visibility', 'Trust indicators', 'Access to premium features', 'Early access to new features'].map((b, i) => {
                                            const unlocked = profileUser.level >= (i + 1);
                                            return (
                                                <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: unlocked ? 1 : 0.35, fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)' }}>
                                                    {unlocked ? <CheckCircle2 size={14} style={{ color: '#34d399' }} /> : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)' }} />}
                                                    {b}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </GlassCard>
                            </motion.div>
                        )}

                        {/* ═══ CONNECTIONS TAB ═══ */}
                        {activeTab === 'connections' && (
                            <motion.div key="connections" variants={staggerContainer} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
                                <div style={{ display: 'flex', gap: 4, marginBottom: 20, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                    {CONNECTION_TABS.map(tab => (
                                        <button key={tab.key} onClick={() => setConnectionTab(tab.key)} style={{
                                            display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 20,
                                            border: connectionTab === tab.key ? '1px solid rgba(167,139,250,0.3)' : '1px solid rgba(255,255,255,0.06)',
                                            background: connectionTab === tab.key ? 'rgba(167,139,250,0.1)' : 'transparent',
                                            color: connectionTab === tab.key ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                                            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                                        }}>
                                            <tab.icon size={13} />{tab.label}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: 12 }}>
                                    {currentConnections.length === 0 ? (
                                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>
                                            <Users size={40} style={{ marginBottom: 8, opacity: 0.3 }} /><p>No connections yet</p>
                                        </div>
                                    ) : currentConnections.map((c: ConnectionItem) => <ConnectionCard key={c.id} connection={c} />)}
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ ACTIVITY TAB ═══ */}
                        {activeTab === 'activity' && (
                            <motion.div key="activity" variants={staggerContainer} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
                                <GlassCard>
                                    <SectionHeader icon={Zap} title="Recent Activity" subtitle="Points earned from activities" />
                                    {recentActivity.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.3)' }}>
                                            <Activity size={36} style={{ marginBottom: 8, opacity: 0.3 }} /><p>No activity recorded yet</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {recentActivity.map((a, i) => (
                                                <motion.div key={a.id} variants={fadeInUp} custom={i} style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px',
                                                    borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(167,139,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Zap size={14} style={{ color: '#a78bfa' }} />
                                                        </div>
                                                        <div>
                                                            <div style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600 }}>{a.description}</div>
                                                            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem' }}>{new Date(a.createdAt).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                    <span style={{ color: '#34d399', fontWeight: 800, fontSize: '0.85rem' }}>+{a.points}</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </GlassCard>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <style jsx global>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </>
    );
}
