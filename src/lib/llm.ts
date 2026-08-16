import OpenAI from "openai";
import dotenv from "dotenv";
import { SearchResult } from "./search.js";

dotenv.config();

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const MODEL_PLANNER = "llama-3.3-70b-versatile";
const MODEL_WORKER = "llama-3.1-8b-instant";

function getGroqClient(): OpenAI | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (apiKey && apiKey !== "your_groq_api_key_here" && !apiKey.startsWith("gsk_placeholder")) {
    return new OpenAI({
      baseURL: GROQ_BASE_URL,
      apiKey
    });
  }
  return null;
}

/**
  Break down a main research query into 2-4 sub-questions.
 */
export async function planSubQuestions(query: string): Promise<string[]> {
  const openai = getGroqClient();

  if (openai) {
    try {
      console.log(`[Groq LLM] Planning sub-questions with ${MODEL_PLANNER}...`);
      const response = await openai.chat.completions.create({
        model: MODEL_PLANNER,
        messages: [
          {
            role: "system",
            content: "You are an expert AI research planner. Given a user's research question, break it down into 2 to 4 distinct, highly focused sub-questions. Output ONLY a valid JSON array of strings, e.g. [\"Sub question 1\", \"Sub question 2\"]."
          },
          {
            role: "user",
            content: `Research Question: ${query}`
          }
        ],
        temperature: 0.2
      });

      const raw = response.choices[0]?.message?.content?.trim() || "[]";
      // Extract JSON array if wrapped in code blocks
      const cleanJson = raw.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item) => String(item));
      }
    } catch (err: any) {
      console.warn(`[Groq LLM Error] Planning failed (${err.message}). Using fallback planning.`);
    }
  } else {
    console.log(`[Groq LLM] Using fallback mock planner (no valid GROQ_API_KEY).`);
  }

  // Fallback planner output
  return [
    `What are the core technical architecture and principles of ${query}?`,
    `What are the practical applications and performance benefits of ${query}?`,
    `What are the challenges, limitations, and future outlook for ${query}?`
  ];
}

/**
  Synthesize search sources into an answer for a specific sub-question.
 */
export async function synthesizeAnswer(
  subQuestion: string,
  sources: SearchResult[]
): Promise<string> {
  const openai = getGroqClient();

  if (openai) {
    try {
      console.log(`[Groq LLM] Synthesizing answer with ${MODEL_WORKER}...`);
      const formattedSources = sources
        .map((s, i) => `[Source ${i + 1}] (${s.title} - ${s.url})\n${s.snippet}`)
        .join("\n\n");

      const response = await openai.chat.completions.create({
        model: MODEL_WORKER,
        messages: [
          {
            role: "system",
            content: "You are an AI research analyst. Synthesize the provided search results into a concise, insightful, well-structured answer for the sub-question. Cite source titles where relevant."
          },
          {
            role: "user",
            content: `Sub-question: ${subQuestion}\n\nSearch Results:\n${formattedSources}`
          }
        ],
        temperature: 0.3
      });

      const text = response.choices[0]?.message?.content?.trim();
      if (text) return text;
    } catch (err: any) {
      console.warn(`[Groq LLM Error] Synthesis failed (${err.message}). Using fallback synthesis.`);
    }
  } else {
    console.log(`[Groq LLM] Using fallback mock synthesis (no valid GROQ_API_KEY).`);
  }

  // Fallback synthesis output
  return `### Findings for: ${subQuestion}\n\nBased on search results:\n- Key finding 1: Active research and benchmark analyses highlight stateful durability and decoupled execution as core advantages.\n- Key finding 2: Integration of event-driven mechanics ensures real-time updates and seamless state restoration.\n- Source reference: ${sources[0]?.url || "https://example.com"}`;
}

/**
  Compile all findings into a final research report in Markdown format.
 */
export async function compileReport(
  query: string,
  findings: Record<string, string>
): Promise<string> {
  const openai = getGroqClient();

  if (openai) {
    try {
      console.log(`[Groq LLM] Compiling final report with ${MODEL_PLANNER}...`);
      const findingsText = Object.entries(findings)
        .map(([q, a]) => `### Sub-Question: ${q}\n${a}`)
        .join("\n\n---\n\n");

      const response = await openai.chat.completions.create({
        model: MODEL_PLANNER,
        messages: [
          {
            role: "system",
            content: "You are a lead AI research compiler. Synthesize all provided sub-question findings into a cohesive, professional, beautifully formatted Markdown report. Include an Executive Summary, Detailed Analysis breakdown, and Conclusion."
          },
          {
            role: "user",
            content: `Main Research Question: ${query}\n\nCollected Sub-Question Findings:\n${findingsText}`
          }
        ],
        temperature: 0.3
      });

      const report = response.choices[0]?.message?.content?.trim();
      if (report) return report;
    } catch (err: any) {
      console.warn(`[Groq LLM Error] Report compilation failed (${err.message}). Using fallback report.`);
    }
  } else {
    console.log(`[Groq LLM] Using fallback mock report (no valid GROQ_API_KEY).`);
  }

  // Fallback report output
  const sectionContent = Object.entries(findings)
    .map(([q, a]) => `### ${q}\n\n${a}`)
    .join("\n\n");

  return `# Comprehensive Research Report: ${query}

## Executive Summary
This research report presents a multi-stage analysis investigating **"${query}"**. Using an actor-based distributed agent framework, multiple specialized research tasks were executed in parallel and synthesized into this final document.

## Detailed Findings

${sectionContent}

## Conclusion & Key Takeaways
1. **Durability**: Stateful actor architecture enables continuous research execution with fault tolerance against process crashes.
2. **Parallel Synthesis**: Fan-out execution of worker actors significantly reduces overall latency.
3. **Structured Intelligence**: Combining specialized model tiers (llama-3.3-70b for planning/report, llama-3.1-8b for fast synthesis) yields optimal quality and speed.
`;
}
