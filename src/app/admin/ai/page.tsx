'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Brain,
    Bot,
    Sparkles,
    Zap,
    Cpu,
    Activity,
    Settings,
    Play,
    Save,
    RefreshCw,
    MessageSquare,
    Image as ImageIcon,
    Shield,
    DollarSign,
    Terminal
} from 'lucide-react';
import { useAdminAIStore, AITaskType, AIModel } from '@/store/admin/admin-ai-store';
import { AdminStatsCard } from '@/components/admin/ui/AdminStatsCard';

export default function AIControlCenter() {
    const { configs, usage, systemPrompts, updateConfig, updatePrompt, simulateUsage } = useAdminAIStore();
    const [selectedTask, setSelectedTask] = useState<AITaskType>('description_generation');
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationResult, setSimulationResult] = useState('');

    // Animation for "Neural Activity"
    const [tick, setTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 2000);
        return () => clearInterval(interval);
    }, []);

    const taskIcons: Record<AITaskType, React.ComponentType<any>> = {
        description_generation: FileTextIcon,
        moderation: Shield,
        image_alt_text: ImageIcon,
        price_suggestion: DollarSign,
        chat_support: MessageSquare,
    };

    const taskLabels: Record<AITaskType, string> = {
        description_generation: 'Description Generator',
        moderation: 'Content Moderation',
        image_alt_text: 'Image Analysis',
        price_suggestion: 'Dynamic Pricing',
        chat_support: 'Support Agent',
    };

    const runSimulation = () => {
        setIsSimulating(true);
        setSimulationResult('');

        // Mock processing delay
        setTimeout(() => {
            const tokens = Math.floor(Math.random() * 500) + 50;
            const cost = (tokens / 1000) * 0.03;

            simulateUsage(tokens, cost);
            setIsSimulating(false);
            setSimulationResult(`Success! Processed ${tokens} tokens using ${configs[selectedTask].activeModel}.`);
        }, 1500);
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--admin-text-primary)] tracking-tight flex items-center gap-3">
                        <Brain className="text-[var(--admin-accent)]" />
                        AI Neural Core
                    </h1>
                    <p className="text-sm text-[var(--admin-text-tertiary)] mt-1">
                        Monitor and configure the platform's artificial intelligence models.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--admin-surface-active)] border border-[var(--admin-accent)]/20 text-xs font-mono text-[var(--admin-accent)]">
                        <Zap size={12} className={isSimulating ? "animate-pulse" : ""} />
                        SYSTEM_ONLINE
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <AdminStatsCard
                    title="Total Tokens Processed"
                    value={usage.totalTokens.toLocaleString()}
                    icon={Cpu}
                    loading={false}
                />
                <AdminStatsCard
                    title="Estimated Cost"
                    value={`$${usage.costEstimate.toFixed(2)}`}
                    icon={DollarSign}
                    loading={false}
                    change={12.5}
                    changeType="increase"
                    description="vs last month"
                />
                <AdminStatsCard
                    title="AI Requests"
                    value={usage.requestsCount}
                    icon={Activity}
                    loading={false}
                />
                <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-purple-500/5 blur-xl group-hover:bg-purple-500/10 transition-colors" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-[var(--admin-text-secondary)]">Neural Load</h3>
                            <Sparkles size={16} className="text-purple-400" />
                        </div>
                        <p className="text-2xl font-bold text-white mb-1">Optimal</p>
                        <p className="text-xs text-[var(--admin-text-tertiary)]">All systems functioning within normal parameters.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Left Sidebar: Task Selection */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-[var(--admin-text-tertiary)] uppercase tracking-widest px-1">AI Agents</h3>
                    <div className="space-y-2">
                        {(Object.keys(taskLabels) as AITaskType[]).map((task) => {
                            const Icon = taskIcons[task];
                            const isActive = selectedTask === task;
                            const config = configs[task];

                            return (
                                <button
                                    key={task}
                                    onClick={() => setSelectedTask(task)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${isActive
                                        ? 'bg-[var(--admin-surface-active)] border-[var(--admin-accent)] shadow-[0_0_15px_-3px_var(--admin-accent-glow)]'
                                        : 'bg-[var(--admin-surface)] border-[var(--admin-border)] hover:bg-[var(--admin-surface-hover)]'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isActive ? 'bg-[var(--admin-accent)] text-white' : 'bg-[var(--admin-bg)] text-[var(--admin-text-secondary)]'}`}>
                                            <Icon size={18} />
                                        </div>
                                        <div className="text-left">
                                            <p className={`text-sm font-bold ${isActive ? 'text-white' : 'text-[var(--admin-text-primary)]'}`}>
                                                {taskLabels[task]}
                                            </p>
                                            <p className="text-[10px] text-[var(--admin-text-tertiary)] font-mono">
                                                {config.activeModel}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${config.isEnabled ? 'bg-[var(--admin-success)]' : 'bg-[var(--admin-text-muted)]'}`} />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content: Configuration & Playground */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="p-6 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-[var(--admin-text-primary)] flex items-center gap-2">
                                <Settings size={18} className="text-[var(--admin-text-secondary)]" />
                                Agent Configuration
                            </h2>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-medium text-[var(--admin-text-secondary)]">Active Status</label>
                                <button
                                    onClick={() => updateConfig(selectedTask, { isEnabled: !configs[selectedTask].isEnabled })}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${configs[selectedTask].isEnabled ? 'bg-[var(--admin-success)]' : 'bg-[var(--admin-surface-active)]'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${configs[selectedTask].isEnabled ? 'translate-x-5' : ''}`} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[var(--admin-text-secondary)] uppercase">Model Selection</label>
                                <select
                                    value={configs[selectedTask].activeModel}
                                    onChange={(e) => updateConfig(selectedTask, { activeModel: e.target.value as AIModel })}
                                    className="w-full bg-[var(--admin-bg)] border border-[var(--admin-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--admin-text-primary)] focus:outline-none focus:border-[var(--admin-accent)] appearance-none"
                                >
                                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                    <option value="claude-3-opus">Claude 3 Opus</option>
                                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                                    <option value="llama-3-70b">Llama 3 70B</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[var(--admin-text-secondary)] uppercase">Temperature ({configs[selectedTask].temperature})</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={configs[selectedTask].temperature}
                                    onChange={(e) => updateConfig(selectedTask, { temperature: parseFloat(e.target.value) })}
                                    className="w-full h-2 bg-[var(--admin-surface-active)] rounded-lg appearance-none cursor-pointer accent-[var(--admin-accent)]"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[var(--admin-text-secondary)] uppercase flex items-center gap-2">
                                <Terminal size={14} />
                                System Prompt
                            </label>
                            <textarea
                                value={systemPrompts[selectedTask]}
                                onChange={(e) => updatePrompt(selectedTask, e.target.value)}
                                className="w-full h-32 bg-[var(--admin-bg)] border border-[var(--admin-border)] rounded-xl p-4 text-sm font-mono text-[var(--admin-text-primary)] focus:outline-none focus:border-[var(--admin-accent)] resize-none"
                                placeholder="Enter system instructions..."
                            />
                        </div>
                    </div>

                    {/* Simulation Playground */}
                    <div className="p-6 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)]">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold text-[var(--admin-text-primary)] flex items-center gap-2">
                                <Bot size={16} className="text-[var(--admin-accent)]" />
                                Test Agent
                            </h2>
                            <button
                                onClick={runSimulation}
                                disabled={isSimulating}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all ${isSimulating ? 'bg-[var(--admin-surface-active)] cursor-wait' : 'bg-[var(--admin-accent)] hover:brightness-110'
                                    }`}
                            >
                                {isSimulating ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
                                {isSimulating ? 'Processing...' : 'Run Simulation'}
                            </button>
                        </div>

                        <div className="p-4 rounded-xl bg-black/40 border border-[var(--admin-border)] font-mono text-xs">
                            {isSimulating ? (
                                <div className="flex items-center gap-2 text-[var(--admin-text-secondary)]">
                                    <span className="w-1.5 h-1.5 bg-[var(--admin-accent)] rounded-full animate-ping" />
                                    Analyzing input stream...
                                </div>
                            ) : simulationResult ? (
                                <span className="text-[var(--admin-success)]">{simulationResult}</span>
                            ) : (
                                <span className="text-[var(--admin-text-tertiary)] opacity-50"> // Ready for input. Press 'Run Simulation' to test current configuration.</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Icons
function FileTextIcon(props: any) {
    return <Play {...props} />; // Placeholder
}
