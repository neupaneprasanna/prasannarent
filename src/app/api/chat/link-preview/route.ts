import { NextResponse } from 'next/server';

// GET - Fetch link preview metadata (Open Graph)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const url = searchParams.get('url');

        if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

        // Validate URL
        try { new URL(url); } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }); }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Nexis-Bot/1.0',
                'Accept': 'text/html'
            },
            signal: controller.signal,
            redirect: 'follow'
        });
        clearTimeout(timeout);

        if (!response.ok) return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 502 });

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) {
            return NextResponse.json({ url, title: null, description: null, image: null, siteName: null });
        }

        const html = await response.text();

        // Parse Open Graph / meta tags
        const getMetaContent = (name: string): string | null => {
            const patterns = [
                new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
                new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`, 'i'),
            ];
            for (const regex of patterns) {
                const match = html.match(regex);
                if (match?.[1]) return match[1];
            }
            return null;
        };

        const title = getMetaContent('og:title') || getMetaContent('twitter:title') || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || null;
        const description = getMetaContent('og:description') || getMetaContent('twitter:description') || getMetaContent('description') || null;
        const image = getMetaContent('og:image') || getMetaContent('twitter:image') || null;
        const siteName = getMetaContent('og:site_name') || null;

        return NextResponse.json({
            url,
            title: title?.substring(0, 200) || null,
            description: description?.substring(0, 300) || null,
            image: image || null,
            siteName: siteName || null,
        });
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return NextResponse.json({ error: 'Request timed out' }, { status: 504 });
        }
        console.error('Link preview error:', error);
        return NextResponse.json({ error: 'Failed to fetch preview' }, { status: 500 });
    }
}
