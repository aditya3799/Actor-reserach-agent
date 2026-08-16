import { tavily } from "@tavily/core";
import dotenv from "dotenv";
dotenv.config();
export async function webSearch(query) {
    const apiKey = process.env.TAVILY_API_KEY;
    if (apiKey && apiKey !== "your_tavily_api_key_here" && !apiKey.startsWith("tvly-placeholder")) {
        try {
            console.log(`[Tavily Search] Querying live API: "${query}"...`);
            const client = tavily({ apiKey });
            const response = await client.search(query, {
                maxResults: 3,
                searchDepth: "basic"
            });
            return response.results.map((r) => ({
                title: r.title || query,
                url: r.url || "https://tavily.com",
                snippet: r.content || r.snippet || "No snippet available."
            }));
        }
        catch (err) {
            console.warn(`[Tavily Search Error] Live search failed (${err.message}). Falling back to mock results.`);
        }
    }
    else {
        console.log(`[Tavily Search] Using fallback mock data (no valid TAVILY_API_KEY configured).`);
    }
    // Fallback mock search results for testing/demo
    return [
        {
            title: `Overview and key facts regarding: ${query}`,
            url: `https://example.com/research/${encodeURIComponent(query.slice(0, 20))}`,
            snippet: `Comprehensive overview of ${query}. Key findings indicate significant progress and technical development in this area.`
        },
        {
            title: `Technical Deep-Dive: ${query}`,
            url: `https://example.com/tech/${encodeURIComponent(query.slice(0, 20))}`,
            snippet: `In-depth analysis of ${query} detailing architectural components, state durability, performance metrics, and implementation patterns.`
        },
        {
            title: `Recent Developments in ${query}`,
            url: `https://example.com/news/${encodeURIComponent(query.slice(0, 20))}`,
            snippet: `Recent industry reports on ${query} highlight emerging trends, scalability improvements, and future roadmap expectations.`
        }
    ];
}
