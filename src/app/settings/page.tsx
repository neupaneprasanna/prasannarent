'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/nav/Navbar';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    User, Camera, Save, Loader2, Trash2, Edit3, MapPin,
    Phone, Mail, FileText, Shield, Bell, Eye, EyeOff,
    Package, DollarSign, Pause, Play, Archive, AlertTriangle,
    ChevronRight, Check, X, Star, Globe, Heart, Clock,
    Settings as SettingsIcon, Lock, Palette, ToggleLeft, ToggleRight,
    Download, HelpCircle, LogOut, ExternalLink, Calendar,
    Image as ImageIcon
} from 'lucide-react';

type SettingsTab = 'profile' | 'listings' | 'notifications' | 'privacy' | 'preferences' | 'account';

interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    bio?: string;
    verified: boolean;
    address?: string;
    city?: string;
    dateOfBirth?: string;
    interests: string[];
    createdAt: string;
}

interface UserListing {
    id: string;
    title: string;
    price: number;
    priceUnit: string;
    category: string;
    status: string;
    views: number;
    rating: number;
    reviewCount: number;
    images: string[];
    media?: { url: string; type: string }[];
    available: boolean;
    createdAt: string;
    location: string;
}

export default function SettingsPage() {
    const router = useRouter();
    const { user, isAuthenticated, setAuth, logout } = useAuthStore();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [myListings, setMyListings] = useState<UserListing[]>([]);
    const [listingsLoading, setListingsLoading] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);

    // Profile form state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');

    // Notification preferences (local for now)
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [pushNotifs, setPushNotifs] = useState(true);
    const [bookingAlerts, setBookingAlerts] = useState(true);

    const [promotionEmails, setPromotionEmails] = useState(false);
    const [weeklyDigest, setWeeklyDigest] = useState(true);

    // Privacy settings
    const [showProfile, setShowProfile] = useState(true);
    const [showListings, setShowListings] = useState(true);
    const [showReviews, setShowReviews] = useState(true);

    // Preferences
    const [currency, setCurrency] = useState('USD');
    const [language, setLanguage] = useState('en');
    const [distanceUnit, setDistanceUnit] = useState('mi');
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

    // Listing edit modal
    const [editingListing, setEditingListing] = useState<UserListing | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editPrice, setEditPrice] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editLocation, setEditLocation] = useState('');

    // Delete confirmation
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrency(localStorage.getItem('currency') || 'USD');
            setLanguage(localStorage.getItem('language') || 'en');
            setDistanceUnit(localStorage.getItem('distanceUnit') || 'mi');
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchProfile();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (activeTab === 'listings' && isAuthenticated) {
            fetchMyListings();
        }
    }, [activeTab, isAuthenticated]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const data = await apiClient.get<{ user: UserProfile }>('/users/me');
            setProfile(data.user);
            setFirstName(data.user.firstName || '');
            setLastName(data.user.lastName || '');
            setPhone(data.user.phone || '');
            setBio(data.user.bio || '');
            setAvatar(data.user.avatar || '');
            setAddress(data.user.address || '');
            setCity(data.user.city || '');
            setSelectedInterests(data.user.interests || []);
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyListings = async () => {
        setListingsLoading(true);
        try {
            const data = await apiClient.get<{ listings: UserListing[] }>('/listings/me');
            setMyListings(data.listings || []);
        } catch (err) {
            console.error('Failed to fetch listings:', err);
        } finally {
            setListingsLoading(false);
        }
    };

    const saveProfile = async () => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const res = await apiClient.patch<{ user: UserProfile }>('/users/me', {
                firstName, lastName, phone, bio, avatar, address, city
            });
            setProfile(res.user);
            setSuccess('Profile updated successfully!');
            // Update the auth store too so Navbar reflects changes
            if (user) {
                setAuth({
                    ...user,
                    firstName: res.user.firstName,
                    lastName: res.user.lastName,
                    avatar: res.user.avatar,
                }, useAuthStore.getState().token || '');
            }
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const savePreferences = async () => {
        setSaving(true);
        try {
            await apiClient.patch('/users/me', { interests: selectedInterests });
            if (typeof window !== 'undefined') {
                localStorage.setItem('currency', currency);
                localStorage.setItem('language', language);
                localStorage.setItem('distanceUnit', distanceUnit);
            }
            setSuccess('Preferences saved successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch {
            setError('Failed to save preferences');
        } finally {
            setSaving(false);
        }
    };

    const saveMockSettings = () => {
        setSaving(true);
        setTimeout(() => {
            setSuccess('Settings updated successfully!');
            setSaving(false);
            setTimeout(() => setSuccess(''), 3000);
        }, 500);
    };

    const handleMockAction = (msg: string) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(''), 3000);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setAvatarUploading(true);
            const file = e.target.files?.[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `public/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatar(publicUrl);
            setSuccess('Avatar uploaded successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            console.error('Avatar upload failed:', err);
            setError('Failed to upload avatar. Please try again.');
            setTimeout(() => setError(''), 3000);
        } finally {
            setAvatarUploading(false);
        }
    };

    const handleEditListing = (listing: UserListing) => {
        setEditingListing(listing);
        setEditTitle(listing.title);
        setEditPrice(listing.price.toString());
        setEditLocation(listing.location);
        setEditDescription('');
    };

    const saveListingEdit = async () => {
        if (!editingListing) return;
        setSaving(true);
        try {
            await apiClient.patch(`/listings/${editingListing.id}`, {
                title: editTitle,
                price: parseFloat(editPrice),
                location: editLocation,
            });
            setSuccess('Listing updated successfully!');
            setEditingListing(null);
            fetchMyListings();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update listing');
        } finally {
            setSaving(false);
        }
    };

    const toggleListingStatus = async (listingId: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
            await apiClient.patch(`/listings/${listingId}`, { status: newStatus });
            setSuccess(`Listing ${newStatus === 'ACTIVE' ? 'activated' : 'paused'}`);
            fetchMyListings();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update listing status');
        }
    };

    const deleteListing = async (listingId: string) => {
        try {
            await apiClient.delete(`/listings/${listingId}`);
            setSuccess('Listing deleted successfully');
            setDeletingId(null);
            fetchMyListings();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to delete listing');
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
        try {
            await apiClient.delete('/users/me');
            logout();
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Failed to delete account');
        }
    };

    const handleExportData = async () => {
        try {
            const data = await apiClient.get<any>('/users/me/export');
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'my-nexis-data.json';
            a.click();
            URL.revokeObjectURL(url);
            setSuccess('Data exported successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError('Export not available yet');
            setTimeout(() => setError(''), 3000);
        }
    };

    const tabs = [
        { id: 'profile' as SettingsTab, label: 'Profile', icon: <User size={16} /> },
        { id: 'listings' as SettingsTab, label: 'My Listings', icon: <Package size={16} /> },
        { id: 'notifications' as SettingsTab, label: 'Notifications', icon: <Bell size={16} /> },
        { id: 'privacy' as SettingsTab, label: 'Privacy', icon: <Shield size={16} /> },
        { id: 'preferences' as SettingsTab, label: 'Preferences', icon: <Palette size={16} /> },
        { id: 'account' as SettingsTab, label: 'Account', icon: <Lock size={16} /> },
    ];

    if (!isAuthenticated) {
        return (
            <main className="min-h-screen pt-24 flex items-center justify-center">
                <Navbar />
                <div className="text-center px-6">
                    <SettingsIcon size={64} className="mx-auto text-white/10 mb-6" />
                    <h2 className="text-2xl font-bold mb-3 text-white">Settings</h2>
                    <p className="text-white/40 mb-6 max-w-sm mx-auto">Sign in to manage your account settings</p>
                    <Link href="/login" className="px-6 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-medium text-white">
                        Sign In
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen bg-[#030304]">
            <Navbar />

            <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 relative"
                >
                    <div className="absolute -top-24 -left-20 w-64 h-64 bg-[#6c5ce7]/20 rounded-full blur-[100px] pointer-events-none" />
                    <div className="relative">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 mb-3 tracking-tight">Account Settings</h1>
                        <p className="text-base text-white/50">Manage your profile, preferences, and account security</p>
                    </div>
                </motion.div>

                {/* Success / Error Toasts */}
                <AnimatePresence>
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed top-28 right-6 z-[200] px-5 py-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-sm text-emerald-300 backdrop-blur-xl flex items-center gap-2"
                        >
                            <Check size={16} /> {success}
                        </motion.div>
                    )}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed top-28 right-6 z-[200] px-5 py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-sm text-red-300 backdrop-blur-xl flex items-center gap-2"
                        >
                            <AlertTriangle size={16} /> {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar Tabs */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:w-64 flex-shrink-0"
                    >
                        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
                            {/* User info */}
                            <div className="p-5 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center text-white text-sm font-bold overflow-hidden shadow-lg">
                                        {avatar ? (
                                            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{firstName?.[0] || 'U'}{lastName?.[0] || ''}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{firstName} {lastName}</p>
                                        <p className="text-[10px] text-white/30 truncate">{profile?.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="p-3 space-y-1 bg-black/20">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden group ${activeTab === tab.id
                                            ? 'text-white'
                                            : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                                            }`}
                                    >
                                        {activeTab === tab.id && (
                                            <motion.div
                                                layoutId="activeTabIndicator"
                                                className="absolute inset-0 bg-gradient-to-r from-[#6c5ce7]/20 to-transparent border-l-2 border-[#a29bfe] z-0"
                                            />
                                        )}
                                        <span className={`relative z-10 transition-colors duration-300 ${activeTab === tab.id ? 'text-[#a29bfe]' : 'group-hover:text-white/60'}`}>{tab.icon}</span>
                                        <span className="relative z-10">{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        <AnimatePresence mode="wait">
                            {/* ═══════════════ PROFILE TAB ═══════════════ */}
                            {activeTab === 'profile' && (
                                <motion.div
                                    key="profile"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    {/* Avatar Section */}
                                    <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/5 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#6c5ce7]/10 rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110" />
                                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                                            <Camera size={18} className="text-[#a29bfe]" /> Profile Picture
                                        </h3>
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
                                            <div
                                                className="w-24 h-24 rounded-full bg-gradient-to-br from-[#6c5ce7]/40 to-[#a29bfe]/40 flex items-center justify-center text-white text-3xl font-bold overflow-hidden border-4 border-[#030304] shadow-xl shadow-[#6c5ce7]/20 relative cursor-pointer group"
                                                onClick={() => document.getElementById('settings-avatar-upload')?.click()}
                                            >
                                                {avatar ? (
                                                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={40} className="text-white/40" />
                                                )}
                                                {avatarUploading ? (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                                                        <Loader2 size={24} className="animate-spin text-white" />
                                                    </div>
                                                ) : (
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                                        <Camera size={18} className="text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                id="settings-avatar-upload"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleAvatarUpload}
                                            />
                                            <div className="flex-1 space-y-3 w-full sm:w-auto">
                                                <div>
                                                    <label className="text-xs font-semibold text-white/50 block tracking-wide uppercase mb-1">Profile Photo</label>
                                                    <p className="text-[10px] text-white/30">Click the avatar or the button below to upload a new photo</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => document.getElementById('settings-avatar-upload')?.click()}
                                                    disabled={avatarUploading}
                                                    className="flex items-center gap-2 px-5 py-2.5 bg-[#0a0a0a] hover:bg-white/5 border border-white/10 hover:border-[#6c5ce7]/40 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-all disabled:opacity-50"
                                                >
                                                    {avatarUploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                                                    {avatarUploading ? 'Uploading...' : 'Upload Photo'}
                                                </button>
                                                {avatar && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setAvatar('')}
                                                        className="flex items-center gap-1 px-3 py-1.5 text-[10px] text-red-400/70 hover:text-red-400 transition-colors"
                                                    >
                                                        <X size={10} /> Remove photo
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Personal Info */}
                                    <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/5 relative overflow-hidden group">
                                         <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                                            <FileText size={18} className="text-[#a29bfe]" /> Personal Information
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10">
                                            <div>
                                                <label className="text-xs font-semibold text-white/50 block mb-2 tracking-wide uppercase">First Name</label>
                                                <input
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]/50 focus:border-transparent transition-all shadow-inner"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-white/50 block mb-2 tracking-wide uppercase">Last Name</label>
                                                <input
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]/50 focus:border-transparent transition-all shadow-inner"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-white/50 block mb-2 tracking-wide uppercase">Phone</label>
                                                <input
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    placeholder="+1 (555) 123-4567"
                                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]/50 focus:border-transparent transition-all shadow-inner"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-white/50 block mb-2 tracking-wide uppercase flex items-center justify-between">Email <Lock size={10} className="text-white/30" /></label>
                                                <input
                                                    value={profile?.email || ''}
                                                    disabled
                                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white/40 cursor-not-allowed shadow-inner"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-white/50 block mb-2 tracking-wide uppercase">Address</label>
                                                <input
                                                    value={address}
                                                    onChange={(e) => setAddress(e.target.value)}
                                                    placeholder="123 Main St"
                                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]/50 focus:border-transparent transition-all shadow-inner"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-white/50 block mb-2 tracking-wide uppercase">City</label>
                                                <input
                                                    value={city}
                                                    onChange={(e) => setCity(e.target.value)}
                                                    placeholder="San Francisco, CA"
                                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]/50 focus:border-transparent transition-all shadow-inner"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-5 relative z-10">
                                            <label className="text-xs font-semibold text-white/50 block mb-2 tracking-wide uppercase">Bio</label>
                                            <textarea
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                                placeholder="Tell others about yourself..."
                                                rows={4}
                                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]/50 focus:border-transparent transition-all shadow-inner resize-none"
                                            />
                                        </div>

                                        <div className="flex justify-end mt-8 relative z-10">
                                            <button
                                                onClick={saveProfile}
                                                disabled={saving}
                                                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#6c5ce7]/20 disabled:opacity-50 disabled:hover:scale-100"
                                            >
                                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ═══════════════ LISTINGS TAB ═══════════════ */}
                            {activeTab === 'listings' && (
                                <motion.div
                                    key="listings"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-white">Manage Listings</h3>
                                        <Link href="/listings/new">
                                            <button className="flex items-center gap-2 px-4 py-2 bg-[#6c5ce7] text-white rounded-xl text-xs font-bold hover:bg-[#5f4dd0] transition-all">
                                                <Package size={14} /> New Listing
                                            </button>
                                        </Link>
                                    </div>

                                    {listingsLoading ? (
                                        <div className="flex items-center justify-center h-48">
                                            <Loader2 className="w-8 h-8 animate-spin text-[#6c5ce7]" />
                                        </div>
                                    ) : myListings.length === 0 ? (
                                        <div className="glass-card rounded-2xl p-12 text-center">
                                            <Package size={48} className="mx-auto text-white/10 mb-4" />
                                            <h3 className="text-lg font-bold text-white/60 mb-2">No listings yet</h3>
                                            <p className="text-sm text-white/30 mb-6">Create your first listing to start earning</p>
                                            <Link href="/listings/new" className="px-6 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-medium text-white text-sm">
                                                Create Listing
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {myListings.map(listing => (
                                                <motion.div
                                                    key={listing.id}
                                                    layout
                                                    className="glass-card rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all"
                                                >
                                                    <div className="flex flex-col sm:flex-row gap-4">
                                                        {/* Thumbnail */}
                                                        <div className="w-full sm:w-24 h-20 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                                                            {(() => {
                                                                const img = listing.media?.find(m => m.type === 'IMAGE')?.url || listing.images?.[0];
                                                                return img ? (
                                                                    <img src={img} alt={listing.title} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center"><Package size={20} className="text-white/10" /></div>
                                                                );
                                                            })()}
                                                        </div>

                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div>
                                                                    <h4 className="text-sm font-bold text-white truncate">{listing.title}</h4>
                                                                    <p className="text-[10px] text-white/30 flex items-center gap-1 mt-0.5">
                                                                        <MapPin size={10} /> {listing.location}
                                                                    </p>
                                                                </div>
                                                                <span className={`shrink-0 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${listing.status === 'ACTIVE'
                                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                                    : listing.status === 'PAUSED'
                                                                        ? 'bg-amber-500/20 text-amber-400'
                                                                        : 'bg-red-500/20 text-red-400'
                                                                    }`}>
                                                                    {listing.status}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-4 mt-2 text-[10px] text-white/40">
                                                                <span className="flex items-center gap-1"><DollarSign size={10} />${listing.price}/{listing.priceUnit?.toLowerCase()}</span>
                                                                <span className="flex items-center gap-1"><Eye size={10} />{listing.views} views</span>
                                                                <span className="flex items-center gap-1"><Star size={10} />{listing.rating?.toFixed(1) || 'New'}</span>
                                                                <span className="flex items-center gap-1"><Calendar size={10} />{new Date(listing.createdAt).toLocaleDateString()}</span>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="flex flex-wrap gap-2 mt-3">
                                                                <button
                                                                    onClick={() => handleEditListing(listing)}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-medium text-white/60 hover:text-white transition-all"
                                                                >
                                                                    <Edit3 size={12} /> Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => toggleListingStatus(listing.id, listing.status)}
                                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${listing.status === 'ACTIVE'
                                                                        ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                                                                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                                                        }`}
                                                                >
                                                                    {listing.status === 'ACTIVE' ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Activate</>}
                                                                </button>
                                                                <Link href={`/item/${listing.id}`}>
                                                                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6c5ce7]/10 hover:bg-[#6c5ce7]/20 text-[10px] font-medium text-[#a29bfe] transition-all">
                                                                        <ExternalLink size={12} /> View
                                                                    </button>
                                                                </Link>
                                                                <button
                                                                    onClick={() => setDeletingId(listing.id)}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-[10px] font-medium text-red-400 transition-all"
                                                                >
                                                                    <Trash2 size={12} /> Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Delete confirmation */}
                                                    <AnimatePresence>
                                                        {deletingId === listing.id && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
                                                            >
                                                                <p className="text-xs text-red-300 mb-2">Are you sure? This action cannot be undone.</p>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => setDeletingId(null)}
                                                                        className="px-4 py-1.5 rounded-lg bg-white/5 text-xs text-white/60 hover:text-white transition-colors"
                                                                    >Cancel</button>
                                                                    <button
                                                                        onClick={() => deleteListing(listing.id)}
                                                                        className="px-4 py-1.5 rounded-lg bg-red-500/20 text-xs font-bold text-red-400 hover:bg-red-500/30 transition-colors"
                                                                    >Confirm Delete</button>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* ═══════════════ NOTIFICATIONS TAB ═══════════════ */}
                            {activeTab === 'notifications' && (
                                <motion.div
                                    key="notifications"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/5 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                                            <Bell size={18} className="text-[#a29bfe]" /> Notification Preferences
                                        </h3>
                                        <div className="space-y-4 relative z-10">
                                            {[
                                                { label: 'Email Notifications', desc: 'Receive updates via email', value: emailNotifs, setter: setEmailNotifs },
                                                { label: 'Push Notifications', desc: 'Browser push notifications', value: pushNotifs, setter: setPushNotifs },
                                                { label: 'Booking Alerts', desc: 'New bookings and confirmations', value: bookingAlerts, setter: setBookingAlerts },

                                                { label: 'Promotional Emails', desc: 'Deals and announcements', value: promotionEmails, setter: setPromotionEmails },
                                                { label: 'Weekly Digest', desc: 'Summary of your activity', value: weeklyDigest, setter: setWeeklyDigest },
                                            ].map(item => (
                                                <div
                                                    key={item.label}
                                                    className="flex items-center justify-between py-3 border-b border-white/5 last:border-b-0"
                                                >
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{item.label}</p>
                                                        <p className="text-[10px] text-white/30">{item.desc}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => item.setter(!item.value)}
                                                        className={`w-11 h-6 rounded-full transition-all duration-300 relative ${item.value ? 'bg-[#6c5ce7]' : 'bg-white/10'}`}
                                                    >
                                                        <motion.div
                                                            className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md"
                                                            animate={{ left: item.value ? 22 : 2 }}
                                                            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                                                        />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-end mt-8 relative z-10">
                                            <button
                                                onClick={saveMockSettings}
                                                disabled={saving}
                                                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#6c5ce7]/20 disabled:opacity-50 disabled:hover:scale-100"
                                            >
                                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                                Save Preferences
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ═══════════════ PRIVACY TAB ═══════════════ */}
                            {activeTab === 'privacy' && (
                                <motion.div
                                    key="privacy"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/5 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                                            <Shield size={18} className="text-[#a29bfe]" /> Privacy Settings
                                        </h3>
                                        <div className="space-y-4 relative z-10">
                                            {[
                                                { label: 'Show Profile Publicly', desc: 'Others can see your profile page', value: showProfile, setter: setShowProfile },
                                                { label: 'Show My Listings', desc: 'Listings visible in search results', value: showListings, setter: setShowListings },
                                                { label: 'Show My Reviews', desc: 'Reviews visible on your profile', value: showReviews, setter: setShowReviews },
                                            ].map(item => (
                                                <div
                                                    key={item.label}
                                                    className="flex items-center justify-between py-3 border-b border-white/5 last:border-b-0"
                                                >
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{item.label}</p>
                                                        <p className="text-[10px] text-white/30">{item.desc}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => item.setter(!item.value)}
                                                        className={`w-11 h-6 rounded-full transition-all duration-300 relative ${item.value ? 'bg-[#6c5ce7]' : 'bg-white/10'}`}
                                                    >
                                                        <motion.div
                                                            className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md"
                                                            animate={{ left: item.value ? 22 : 2 }}
                                                            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                                                        />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-end mt-8 relative z-10">
                                            <button
                                                onClick={saveMockSettings}
                                                disabled={saving}
                                                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#6c5ce7]/20 disabled:opacity-50 disabled:hover:scale-100"
                                            >
                                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                                Save Settings
                                            </button>
                                        </div>
                                    </div>

                                    <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/5 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 relative z-10">
                                            <Download size={18} className="text-[#a29bfe]" /> Data Management
                                        </h3>
                                        <p className="text-xs text-white/40 mb-5 relative z-10">Download a copy of all your data or request account deletion</p>
                                        <div className="flex flex-wrap gap-3 relative z-10">
                                            <button
                                                onClick={handleExportData}
                                                className="flex items-center gap-2 px-6 py-3 bg-[#0a0a0a] hover:bg-white/5 rounded-xl text-sm font-medium text-white/80 hover:text-white transition-all border border-white/10 hover:border-white/20 shadow-inner"
                                            >
                                                <Download size={16} /> Export My Data
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ═══════════════ PREFERENCES TAB ═══════════════ */}
                            {activeTab === 'preferences' && (
                                <motion.div
                                    key="preferences"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/5 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                                            <Palette size={18} className="text-[#a29bfe]" /> Display Preferences
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                                            <div>
                                                <label className="text-xs font-semibold text-white/50 block mb-2 tracking-wide uppercase">Default Currency</label>
                                                <select
                                                    value={currency}
                                                    onChange={(e) => setCurrency(e.target.value)}
                                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]/50 focus:border-transparent transition-all shadow-inner"
                                                >
                                                    <option value="USD">USD - US Dollar</option>
                                                    <option value="EUR">EUR - Euro</option>
                                                    <option value="GBP">GBP - British Pound</option>
                                                    <option value="NPR">NPR - Nepali Rupee</option>
                                                    <option value="INR">INR - Indian Rupee</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-white/50 block mb-2 tracking-wide uppercase">Language</label>
                                                <select
                                                    value={language}
                                                    onChange={(e) => setLanguage(e.target.value)}
                                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]/50 focus:border-transparent transition-all shadow-inner"
                                                >
                                                    <option value="en">English</option>
                                                    <option value="es">Español</option>
                                                    <option value="fr">Français</option>
                                                    <option value="ne">नेपाली</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-white/50 block mb-2 tracking-wide uppercase">Distance Unit</label>
                                                <select
                                                    value={distanceUnit}
                                                    onChange={(e) => setDistanceUnit(e.target.value)}
                                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]/50 focus:border-transparent transition-all shadow-inner"
                                                >
                                                    <option value="mi">Miles</option>
                                                    <option value="km">Kilometers</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/5 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 relative z-10">
                                            <Globe size={18} className="text-[#a29bfe]" /> Interests
                                        </h3>
                                        <p className="text-xs text-white/40 mb-6 relative z-10">Select categories you&#39;re interested in for personalized recommendations</p>
                                        <div className="flex flex-wrap gap-3 relative z-10">
                                            {['Tech', 'Vehicles', 'Rooms', 'Equipment', 'Fashion', 'Studios', 'Tools', 'Digital', 'Sports', 'Music', 'Photography', 'Outdoor'].map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => setSelectedInterests(prev => prev.includes(cat) ? prev.filter(i => i !== cat) : [...prev, cat])}
                                                    className={`px-4 py-2 rounded-xl text-sm transition-all border shadow-sm ${selectedInterests.includes(cat)
                                                        ? 'bg-[#6c5ce7]/20 text-white border-[#6c5ce7]/50 shadow-[#6c5ce7]/10 hover:bg-[#6c5ce7]/30'
                                                        : 'bg-[#0a0a0a] text-white/60 hover:text-white hover:bg-white/5 border-white/10 hover:border-white/20'
                                                        }`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex justify-end mt-8 relative z-10">
                                            <button
                                                onClick={savePreferences}
                                                disabled={saving}
                                                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#6c5ce7]/20 disabled:opacity-50 disabled:hover:scale-100"
                                            >
                                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                                Save Preferences
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ═══════════════ ACCOUNT TAB ═══════════════ */}
                            {activeTab === 'account' && (
                                <motion.div
                                    key="account"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/5 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                                            <Lock size={18} className="text-[#a29bfe]" /> Security
                                        </h3>
                                        <div className="space-y-4 relative z-10">
                                            <div className="flex items-center justify-between py-3 border-b border-white/5">
                                                <div>
                                                    <p className="text-sm font-medium text-white">Change Password</p>
                                                    <p className="text-[10px] text-white/30">Update your account password</p>
                                                </div>
                                                <button
                                                    onClick={() => handleMockAction('Password reset link sent to your email.')}
                                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-medium text-white/70 hover:text-white transition-all border border-white/10"
                                                >
                                                    Change
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between py-3 border-b border-white/5">
                                                <div>
                                                    <p className="text-sm font-medium text-white">Two-Factor Authentication</p>
                                                    <p className="text-[10px] text-white/30">Add an extra layer of security</p>
                                                </div>
                                                <button
                                                    onClick={() => handleMockAction('Two-factor authentication setup initialized.')}
                                                    className="px-4 py-2 bg-[#6c5ce7]/10 hover:bg-[#6c5ce7]/20 rounded-xl text-xs font-bold text-[#a29bfe] transition-all border border-[#6c5ce7]/20"
                                                >
                                                    Enable
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between py-3">
                                                <div>
                                                    <p className="text-sm font-medium text-white">Active Sessions</p>
                                                    <p className="text-[10px] text-white/30">View and manage logged-in devices</p>
                                                </div>
                                                <button
                                                    onClick={() => handleMockAction('Active sessions retrieved.')}
                                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-medium text-white/70 hover:text-white transition-all border border-white/10"
                                                >
                                                    View
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/5 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                                            <HelpCircle size={18} className="text-[#a29bfe]" /> Support
                                        </h3>
                                        <div className="space-y-3 relative z-10">
                                            <Link href="/help" className="flex items-center justify-between py-3 border-b border-white/5 group">
                                                <span className="text-sm text-white/60 group-hover:text-white transition-colors">Help Center</span>
                                                <ChevronRight size={16} className="text-white/20 group-hover:text-white/60 transition-colors" />
                                            </Link>
                                            <Link href="/help" className="flex items-center justify-between py-3 border-b border-white/5 group">
                                                <span className="text-sm text-white/60 group-hover:text-white transition-colors">Contact Support</span>
                                                <ChevronRight size={16} className="text-white/20 group-hover:text-white/60 transition-colors" />
                                            </Link>
                                            <Link href="/help" className="flex items-center justify-between py-3 group">
                                                <span className="text-sm text-white/60 group-hover:text-white transition-colors">Terms of Service</span>
                                                <ChevronRight size={16} className="text-white/20 group-hover:text-white/60 transition-colors" />
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Danger Zone */}
                                    <div className="glass-card rounded-2xl p-6 sm:p-8 border border-red-500/20 bg-red-500/5 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.03] to-transparent pointer-events-none" />
                                        <h3 className="text-lg font-bold text-red-400 mb-2 flex items-center gap-2 relative z-10">
                                            <AlertTriangle size={18} /> Danger Zone
                                        </h3>
                                        <p className="text-xs text-red-300/60 mb-6 relative z-10">These actions are irreversible. Please proceed with caution.</p>
                                        <div className="flex flex-wrap gap-4 relative z-10">
                                            <button
                                                onClick={() => { logout(); router.push('/'); }}
                                                className="flex items-center gap-2 px-6 py-3 bg-[#0a0a0a] hover:bg-white/5 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-all border border-white/10 hover:border-white/20 shadow-inner"
                                            >
                                                <LogOut size={16} /> Log Out
                                            </button>
                                            <button
                                                onClick={handleDeleteAccount}
                                                className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-sm font-bold text-red-400 transition-all border border-red-500/20 hover:border-red-500/40 shadow-inner"
                                            >
                                                <Trash2 size={16} /> Delete Account
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Edit Listing Modal */}
            <AnimatePresence>
                {editingListing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setEditingListing(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="glass-card rounded-3xl p-8 w-full max-w-lg border border-white/10 shadow-2xl relative overflow-hidden group"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <h3 className="text-xl font-bold text-white tracking-wide">Edit Listing</h3>
                                <button onClick={() => setEditingListing(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                                    <X size={18} className="text-white/60 hover:text-white" />
                                </button>
                            </div>
                            <div className="space-y-5 relative z-10">
                                <div>
                                    <label className="text-xs font-semibold text-white/50 block mb-2 tracking-wide uppercase">Title</label>
                                    <input
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]/50 focus:border-transparent transition-all shadow-inner"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-xs font-semibold text-white/50 block mb-2 tracking-wide uppercase">Price</label>
                                        <input
                                            type="number"
                                            value={editPrice}
                                            onChange={(e) => setEditPrice(e.target.value)}
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]/50 focus:border-transparent transition-all shadow-inner"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-white/50 block mb-2 tracking-wide uppercase">Location</label>
                                        <input
                                            value={editLocation}
                                            onChange={(e) => setEditLocation(e.target.value)}
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]/50 focus:border-transparent transition-all shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 mt-8 relative z-10">
                                <button
                                    onClick={() => setEditingListing(null)}
                                    className="flex-1 py-3.5 rounded-xl text-sm font-medium text-white/70 bg-[#0a0a0a] hover:bg-white/5 border border-white/10 transition-colors shadow-inner"
                                >Cancel</button>
                                <button
                                    onClick={saveListingEdit}
                                    disabled={saving}
                                    className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] hover:opacity-90 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-[#6c5ce7]/20"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
