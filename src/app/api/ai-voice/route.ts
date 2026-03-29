import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;
const groq = apiKey ? new Groq({ apiKey }) : null;

export async function POST(req: Request) {
    if (!groq) {
        return NextResponse.json({ error: 'AI Voice service not configured.' }, { status: 500 });
    }

    try {
        const user = await authenticate(req);
        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const formData = await req.formData();
        const fileData = formData.get('file');

        if (!fileData) {
            return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
        }

        const buffer = await (fileData as Blob).arrayBuffer();
        const file = new File([buffer], "audio.webm", { type: (fileData as Blob).type || "audio/webm" });

        const conversionResponse = await groq.audio.transcriptions.create({
            file: file,
            model: "whisper-large-v3",
            response_format: "json",
            language: "en"
        });

        return NextResponse.json({ text: conversionResponse.text });

    } catch (error: any) {
        console.error('Whisper API Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to transcribe audio' }, { status: 500 });
    }
}
