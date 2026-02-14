import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AIModel = 'gpt-4-turbo' | 'gpt-3.5-turbo' | 'claude-3-opus' | 'claude-3-sonnet' | 'llama-3-70b';
export type AITaskType = 'description_generation' | 'moderation' | 'image_alt_text' | 'price_suggestion' | 'chat_support';

interface AIConfig {
    activeModel: AIModel;
    temperature: number;
    maxTokens: number;
    isEnabled: boolean;
}

interface AIUsageStats {
    totalTokens: number;
    costEstimate: number;
    requestsCount: number;
    lastActive: string;
}

interface AdminAIState {
    configs: Record<AITaskType, AIConfig>;
    usage: AIUsageStats;
    systemPrompts: Record<AITaskType, string>;

    // Actions
    updateConfig: (task: AITaskType, config: Partial<AIConfig>) => void;
    updatePrompt: (task: AITaskType, prompt: string) => void;
    simulateUsage: (tokens: number, cost: number) => void;
}

export const useAdminAIStore = create<AdminAIState>()(
    persist(
        (set) => ({
            configs: {
                description_generation: {
                    activeModel: 'gpt-4-turbo',
                    temperature: 0.7,
                    maxTokens: 500,
                    isEnabled: true,
                },
                moderation: {
                    activeModel: 'gpt-3.5-turbo',
                    temperature: 0.1,
                    maxTokens: 100,
                    isEnabled: true,
                },
                image_alt_text: {
                    activeModel: 'claude-3-sonnet',
                    temperature: 0.5,
                    maxTokens: 150,
                    isEnabled: false,
                },
                price_suggestion: {
                    activeModel: 'llama-3-70b',
                    temperature: 0.3,
                    maxTokens: 200,
                    isEnabled: true,
                },
                chat_support: {
                    activeModel: 'gpt-3.5-turbo',
                    temperature: 0.8,
                    maxTokens: 1000,
                    isEnabled: true,
                },
            },
            usage: {
                totalTokens: 145020,
                costEstimate: 4.25,
                requestsCount: 342,
                lastActive: new Date().toISOString(),
            },
            systemPrompts: {
                description_generation: "You are a luxury real estate copywriter. Write a compelling, high-converting description for a rental property based on the following details...",
                moderation: "You are a strict content moderator. Analyze the following text for hate speech, discrimination, or policy violations. Return 'SAFE' or 'FLAGGED'...",
                image_alt_text: "Describe this image for screen readers. Focus on architectural details, lighting, and accessibility...",
                price_suggestion: "Analyze current market trends and comparable properties to suggest an optimal daily rental rate...",
                chat_support: "You are a helpful support agent for RentVerse. Answer user questions about bookings, payments, and account management...",
            },

            updateConfig: (task, config) => set((state) => ({
                configs: {
                    ...state.configs,
                    [task]: { ...state.configs[task], ...config }
                }
            })),

            updatePrompt: (task, prompt) => set((state) => ({
                systemPrompts: {
                    ...state.systemPrompts,
                    [task]: prompt
                }
            })),

            simulateUsage: (tokens, cost) => set((state) => ({
                usage: {
                    ...state.usage,
                    totalTokens: state.usage.totalTokens + tokens,
                    costEstimate: state.usage.costEstimate + cost,
                    requestsCount: state.usage.requestsCount + 1,
                    lastActive: new Date().toISOString(),
                }
            })),
        }),
        {
            name: 'admin-ai-storage', // unique name
        }
    )
);
