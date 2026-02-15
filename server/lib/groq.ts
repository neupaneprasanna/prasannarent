import Groq from "groq-sdk";
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GROQ_API_KEY;
const groq = apiKey ? new Groq({ apiKey }) : null;

export interface SearchIntent {
    category: string | null;
    minPrice: number | null;
    maxPrice: number | null;
    keywords: string[];
    semanticQuery: string;
    explanation: string;
}

export async function detectSearchIntent(query: string, categories: string[]): Promise<SearchIntent> {
    if (!groq) {
        return {
            category: null,
            minPrice: null,
            maxPrice: null,
            keywords: [query],
            semanticQuery: query,
            explanation: "Searching using basic filters (add GROQ_API_KEY for real AI)."
        };
    }

    try {
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `You are an AI search assistant for RentVerse, a peer-to-peer rental platform. 
                    Your goal is to parse user natural language queries into structured search parameters.
                    
                    Available categories: ${categories.join(', ')}
                    
                    Return ONLY a JSON object with:
                    - category: The most relevant category from the list above, or null if uncertain.
                    - minPrice: Minimum price detected as a number, or null.
                    - maxPrice: Maximum price detected as a number, or null.
                    - keywords: An array of specific item keywords to use for text matching.
                    - semanticQuery: A cleaned up version of the query for semantic comparison.
                    - explanation: A short, friendly message explaining what you're searching for (e.g., "Looking for professional cameras under $200").
                    
                    Instructions for improved accuracy:
                    1. Map "needs" or "problems" to specific items. 
                       - "I need to cut some wood" -> keywords: ["axe", "chainsaw", "saw"], category: "Tools" or "Equipment"
                       - "want to record a high quality video" -> keywords: ["camera", "sony", "canon", "tripod"], category: "Tech"
                       - "something to move my furniture" -> keywords: ["truck", "van", "pickup"], category: "Vehicles"
                    2. Clean up "fluff" words (e.g., "I want", "Please search for").
                    3. If multiple categories could apply, pick the most specific one.
                    4. Map informal names to categories (e.g., "car" -> "vehicles", "room" -> "rooms").`
                },
                {
                    role: "user",
                    content: query
                }
            ],
            response_format: { type: "json_object" }
        });

        const responseText = completion.choices[0]?.message?.content || '{}';
        return JSON.parse(responseText) as SearchIntent;
    } catch (error) {
        console.error('Groq Intent Detection Error:', error);
        return {
            category: null,
            minPrice: null,
            maxPrice: null,
            keywords: [query],
            semanticQuery: query,
            explanation: "Searching across all items."
        };
    }
}

export async function rankResults(query: string, results: any[]): Promise<any[]> {
    if (!groq || results.length <= 1) return results;

    try {
        const simplifiedResults = results.map(r => ({
            id: r.id,
            title: r.title,
            description: r.description?.substring(0, 300),
            category: r.category
        }));

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `Rank the following rental items based on their relevance to the user's query. 
                    Consider the item's title, category, and description.
                    
                    CRITICAL: You MUST return a JSON object with a 'rankedIds' array containing ALL of the IDs provided, sorted from most relevant to least relevant. DO NOT omit any IDs.
                    
                    Query: ${query}`
                },
                {
                    role: "user",
                    content: `Items to rank (IDs): ${JSON.stringify(simplifiedResults)}`
                }
            ],
            response_format: { type: "json_object" }
        });

        const responseText = completion.choices[0]?.message?.content || '{"rankedIds": []}';
        const { rankedIds } = JSON.parse(responseText);

        const resultMap = new Map(results.map(r => [r.id, r]));
        const sortedResults: any[] = [];
        const seenIds = new Set<string>();

        // Process ranked IDs from AI
        if (Array.isArray(rankedIds)) {
            for (const id of rankedIds) {
                const item = resultMap.get(id);
                if (item && !seenIds.has(id)) {
                    sortedResults.push(item);
                    seenIds.add(id);
                }
            }
        }

        // Safety fallback: append any items the AI missed
        for (const item of results) {
            if (!seenIds.has(item.id)) {
                sortedResults.push(item);
                seenIds.add(item.id);
            }
        }

        return sortedResults;
    } catch (error) {
        console.error('Groq Ranking Error:', error);
        return results;
    }
}
