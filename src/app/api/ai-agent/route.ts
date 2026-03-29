import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { runAgent, AgentMessage } from '@/lib/agent';

export async function POST(req: Request) {
    // Only authenticated users can use the AI agent
    let user;
    try {
        user = await authenticate(req);
    } catch (authError) {
        console.error('AI Agent auth error:', authError);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    if (!user) {
        return NextResponse.json({ error: 'You must be logged in to use Nexis AI.' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            message,
            currentPage = '/',
            pageContext = {},
            conversationHistory = [],
            confirmedAction
        }: {
            message: string;
            currentPage: string;
            pageContext?: any;
            conversationHistory: AgentMessage[];
            confirmedAction?: { tool: string; args: any };
        } = body;

        if (!message && !confirmedAction) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        console.log(`[AI Agent] User: ${user.userId} | Message: "${message}" | Page: ${currentPage}`);

        const response = await runAgent(
            user.userId,
            message || 'Execute confirmed action',
            currentPage,
            pageContext,
            conversationHistory,
            confirmedAction
        );

        console.log(`[AI Agent] Response tools: ${response.toolResults?.map((t: any) => t.tool).join(', ') || 'none'}`);

        return NextResponse.json(response);
    } catch (error: any) {
        console.error('AI Agent API error:', error?.message || error);
        console.error('AI Agent stack:', error?.stack);
        return NextResponse.json({
            error: `AI Agent error: ${error?.message || 'Unknown server error'}`,
            message: `Sorry, something went wrong: ${error?.message || 'Unknown error'}. Please try again.`,
            toolResults: [],
            actions: [],
            suggestions: ['Try again']
        }, { status: 500 });
    }
}
