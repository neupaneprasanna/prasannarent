'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Save, Edit3, Eye, Layers } from 'lucide-react';
import { useAdminAuthStore } from '@/store/admin/admin-auth-store';
import { toast } from 'sonner';

interface ContentBlock {
    id: string;
    key: string;
    section: string;
    value: string;
    active: boolean;
    order: number;
}

export default function ContentPage() {
    const { token } = useAdminAuthStore();
    const [blocks, setBlocks] = useState<ContentBlock[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const fetchBlocks = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/content/blocks`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBlocks(data.blocks);
            }
        } catch (error) {
            console.error('Failed to fetch content blocks', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/content/blocks/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ value: editValue })
            });

            if (res.ok) {
                toast.success('Content updated successfully');
                setBlocks(prev => prev.map(b => b.id === id ? { ...b, value: editValue } : b));
                setEditingId(null);
            } else {
                toast.error('Failed to update content');
            }
        } catch (error) {
            toast.error('Network error');
        }
    };

    useEffect(() => {
        fetchBlocks();
    }, [token]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-display text-white">Content Management</h1>
                    <p className="text-[var(--admin-text-secondary)]">Manage static text and banners</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-2 border-[var(--admin-accent)] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : blocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-[var(--admin-text-tertiary)] bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)]">
                    <Layers className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-medium">No content blocks found</p>
                    <p className="text-sm">Add blocks in the database first.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {blocks.map((block) => (
                        <motion.div
                            key={block.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] hover:border-[var(--admin-border-hover)] transition-all group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded bg-[var(--admin-surface-active)] text-[var(--admin-accent)]">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-sm uppercase tracking-wider">{block.key.replace(/_/g, ' ')}</h3>
                                        <p className="text-xs text-[var(--admin-text-tertiary)]">Section: {block.section}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {editingId === block.id ? (
                                        <>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="px-3 py-1.5 text-xs font-medium text-[var(--admin-text-tertiary)] hover:text-white transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleSave(block.id)}
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--admin-accent)] text-white hover:bg-[var(--admin-accent)]/80 text-xs font-bold transition-colors"
                                            >
                                                <Save className="w-3 h-3" />
                                                Save
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setEditingId(block.id);
                                                setEditValue(block.value);
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--admin-surface-hover)] text-[var(--admin-text-secondary)] hover:text-white text-xs font-medium transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Edit3 className="w-3 h-3" />
                                            Edit
                                        </button>
                                    )}
                                </div>
                            </div>

                            {editingId === block.id ? (
                                <textarea
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-full h-32 p-4 rounded-lg bg-[var(--admin-background)] border border-[var(--admin-border)] text-white focus:border-[var(--admin-accent)] focus:outline-none resize-none font-mono text-sm"
                                />
                            ) : (
                                <div className="p-4 rounded-lg bg-[var(--admin-background)] border border-[var(--admin-border)] text-[var(--admin-text-secondary)] text-sm whitespace-pre-wrap">
                                    {block.value}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
