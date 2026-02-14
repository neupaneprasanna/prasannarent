'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Settings,
    Globe,
    Users,
    DollarSign,
    Bell,
    Shield,
    Key,
    Save,
    RotateCcw
} from 'lucide-react';
import { useAdminSettingsStore } from '@/store/admin/admin-settings-store';

export default function SettingsPage() {
    const {
        general, registration, fees, notifications,
        updateGeneral, updateRegistration, updateFees, updateNotifications
    } = useAdminSettingsStore();

    const [activeTab, setActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);
    const [savedMessage, setSavedMessage] = useState('');

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API call
        setTimeout(() => {
            setIsSaving(false);
            setSavedMessage('Settings saved successfully');
            setTimeout(() => setSavedMessage(''), 3000);
        }, 1000);
    };

    const tabs = [
        { id: 'general', label: 'General', icon: Globe },
        { id: 'registration', label: 'Registration', icon: Users },
        { id: 'fees', label: 'Fees & Payouts', icon: DollarSign },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
    ];

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--admin-text-primary)] tracking-tight flex items-center gap-3">
                        <Settings className="text-[var(--admin-accent)]" />
                        Platform Settings
                    </h1>
                    <p className="text-sm text-[var(--admin-text-tertiary)] mt-1">
                        Configure global platform behavior, fees, and system preferences.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {savedMessage && (
                        <span className="text-xs font-bold text-[var(--admin-success)] animate-fade-in">
                            {savedMessage}
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold text-white transition-all ${isSaving
                                ? 'bg-[var(--admin-surface-active)] cursor-wait'
                                : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20 hover:scale-105 active:scale-95'
                            }`}
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Tabs Sidebar */}
                <div className="space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-[var(--admin-surface-active)] text-[var(--admin-text-primary)] border border-[var(--admin-border-hover)]'
                                    : 'text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)]'
                                }`}
                        >
                            <tab.icon size={18} className={activeTab === tab.id ? 'text-[var(--admin-accent)]' : 'opacity-70'} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-6 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)] space-y-8"
                    >
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold text-[var(--admin-text-primary)]">General Configuration</h2>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wide">Site Name</label>
                                        <input
                                            type="text"
                                            value={general.siteName}
                                            onChange={(e) => updateGeneral({ siteName: e.target.value })}
                                            className="w-full bg-[var(--admin-bg)] border border-[var(--admin-border)] rounded-xl px-4 py-2 text-sm text-[var(--admin-text-primary)] focus:outline-none focus:border-[var(--admin-accent)]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wide">Support Email</label>
                                        <input
                                            type="email"
                                            value={general.supportEmail}
                                            onChange={(e) => updateGeneral({ supportEmail: e.target.value })}
                                            className="w-full bg-[var(--admin-bg)] border border-[var(--admin-border)] rounded-xl px-4 py-2 text-sm text-[var(--admin-text-primary)] focus:outline-none focus:border-[var(--admin-accent)]"
                                        />
                                    </div>

                                    <div className="pt-4 border-t border-[var(--admin-border)]">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-bold text-[var(--admin-text-primary)]">Maintenance Mode</h3>
                                                <p className="text-xs text-[var(--admin-text-tertiary)] mt-1">Disables the public site for all non-admin users.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={general.maintenanceMode}
                                                    onChange={(e) => updateGeneral({ maintenanceMode: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-[var(--admin-surface-active)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--admin-accent)]"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'registration' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold text-[var(--admin-text-primary)]">User Registration</h2>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--admin-bg)] border border-[var(--admin-border)]">
                                        <div>
                                            <h3 className="text-sm font-bold text-[var(--admin-text-primary)]">Allow New Registrations</h3>
                                            <p className="text-xs text-[var(--admin-text-tertiary)] mt-1">If disabled, no new users can sign up.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={registration.allowNewUsers}
                                                onChange={(e) => updateRegistration({ allowNewUsers: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-[var(--admin-surface-active)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--admin-accent)]"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--admin-bg)] border border-[var(--admin-border)]">
                                        <div>
                                            <h3 className="text-sm font-bold text-[var(--admin-text-primary)]">Require Email Verification</h3>
                                            <p className="text-xs text-[var(--admin-text-tertiary)] mt-1">Users must verify email before logging in.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={registration.requireEmailVerification}
                                                onChange={(e) => updateRegistration({ requireEmailVerification: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-[var(--admin-surface-active)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--admin-accent)]"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'fees' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold text-[var(--admin-text-primary)]">Fees & Payments</h2>

                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wide">Platform Service Fee</label>
                                            <span className="text-sm font-bold text-[var(--admin-accent)]">{fees.platformFeePercent}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="30"
                                            step="0.5"
                                            value={fees.platformFeePercent}
                                            onChange={(e) => updateFees({ platformFeePercent: parseFloat(e.target.value) })}
                                            className="w-full h-2 bg-[var(--admin-surface-active)] rounded-lg appearance-none cursor-pointer accent-[var(--admin-accent)]"
                                        />
                                        <p className="text-xs text-[var(--admin-text-tertiary)] mt-2">
                                            Percentage taken from each booking total as service fee.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold text-[var(--admin-text-primary)]">System Notifications</h2>
                                <p className="text-sm text-[var(--admin-text-tertiary)]">Configure how and when admins are notified.</p>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--admin-bg)] border border-[var(--admin-border)]">
                                        <div>
                                            <h3 className="text-sm font-bold text-[var(--admin-text-primary)]">Email Alerts</h3>
                                            <p className="text-xs text-[var(--admin-text-tertiary)] mt-1">Receive critical system alerts via email.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={notifications.emailAlerts}
                                                onChange={(e) => updateNotifications({ emailAlerts: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-[var(--admin-surface-active)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--admin-accent)]"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold text-[var(--admin-text-primary)]">Security Settings</h2>

                                <div className="p-4 rounded-xl bg-[var(--admin-surface-active)]/50 border border-[var(--admin-accent)]/20">
                                    <h3 className="text-sm font-bold text-[var(--admin-text-primary)] flex items-center gap-2">
                                        <Shield size={16} className="text-[var(--admin-accent)]" />
                                        Two-Factor Authentication
                                    </h3>
                                    <p className="text-xs text-[var(--admin-text-tertiary)] mt-1 mb-4">
                                        Enforce 2FA for all admin accounts.
                                    </p>
                                    <button className="px-4 py-2 bg-[var(--admin-accent)] text-white text-xs font-bold rounded-lg hover:brightness-110 transition-all">
                                        Enable Enforcement
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wide">Session Timeout</label>
                                    <select className="w-full bg-[var(--admin-bg)] border border-[var(--admin-border)] rounded-xl px-4 py-2 text-sm text-[var(--admin-text-primary)] focus:outline-none focus:border-[var(--admin-accent)]">
                                        <option>15 Minutes</option>
                                        <option>30 Minutes</option>
                                        <option>1 Hour</option>
                                        <option>4 Hours</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
