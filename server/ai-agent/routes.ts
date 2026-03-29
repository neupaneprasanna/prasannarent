import { Router } from 'express';
import { runAgent } from '../../src/lib/agent';

export const agentRoutes = Router();

agentRoutes.post('/', async (req, res) => {
    try {
        const userId = (req as any).user.userId;
        const { message, currentPage = '/', pageContext = {}, conversationHistory = [], confirmedAction } = req.body;

        if (!message && !confirmedAction) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log(`[AI Agent] User: ${userId} | Message: "${message}" | Page: ${currentPage}`);

        const response = await runAgent(
            userId,
            message || 'Execute confirmed action',
            currentPage,
            pageContext,
            conversationHistory,
            confirmedAction
        );

        console.log(`[AI Agent] Response tools: ${response.toolResults?.map((t: any) => t.tool).join(', ') || 'none'}`);

        return res.json(response);
    } catch (error: any) {
        console.error('AI Agent API error:', error?.message || error);
        return res.status(500).json({
            error: `AI Agent error: ${error?.message || 'Unknown server error'}`,
            message: `Sorry, something went wrong: ${error?.message || 'Unknown error'}. Please try again.`,
            toolResults: [],
            actions: [],
            suggestions: ['Try again']
        });
    }
});
