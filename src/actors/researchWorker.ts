import { actor } from "rivetkit";
import { webSearch, SearchResult } from "../lib/search.js";
import { synthesizeAnswer } from "../lib/llm.js";

export interface ResearchWorkerState {
  sessionId: string;
  subQuestion: string;
  status: "idle" | "researching" | "synthesizing" | "done" | "error";
  sources: SearchResult[];
  answer: string;
}

export const researchWorker = actor({
  state: {
    sessionId: "",
    subQuestion: "",
    status: "idle",
    sources: [] as SearchResult[],
    answer: ""
  } as ResearchWorkerState,

  actions: {
    startResearch: async (c, sessionId: string, subQuestion: string) => {
      c.state.sessionId = sessionId;
      c.state.subQuestion = subQuestion;

      console.log(`[Worker Actor ${c.key.join(":")}] Starting research for: "${subQuestion}"`);

      // Checkpoint 1: Perform web search if not already checkpointed
      if (!c.state.sources || c.state.sources.length === 0) {
        c.state.status = "researching";
        await c.saveState({ immediate: true });

        const searchResults = await webSearch(subQuestion);
        c.state.sources = searchResults;

        console.log(`[Worker Actor ${c.key.join(":")}] 💾 Checkpointed ${searchResults.length} sources to actor state.`);
        await c.saveState({ immediate: true });
      } else {
        console.log(`[Worker Actor ${c.key.join(":")}] ⚡ Resuming from checkpointed sources (${c.state.sources.length} sources already saved).`);
      }

      // Checkpoint 2: Synthesize Answer using Groq LLM
      if (!c.state.answer) {
        c.state.status = "synthesizing";
        await c.saveState({ immediate: true });

        const answer = await synthesizeAnswer(subQuestion, c.state.sources);
        c.state.answer = answer;
        c.state.status = "done";
        await c.saveState({ immediate: true });

        console.log(`[Worker Actor ${c.key.join(":")}] ✅ Research complete. Reporting back to coordinator...`);
      }

      // Report back to coordinator actor
      try {
        const coordinatorClient = (c.client() as any).coordinator.getOrCreate([sessionId]);
        await coordinatorClient.workerDone(subQuestion, c.state.answer);
      } catch (err: any) {
        console.warn(`[Worker Actor ${c.key.join(":")}] Coordinator callback note: ${err.message}`);
      }

      return {
        subQuestion: c.state.subQuestion,
        sources: c.state.sources,
        answer: c.state.answer,
        status: c.state.status
      };
    },

    resumeResearch: async (c) => {
      console.log(`[Worker Actor ${c.key.join(":")}] Triggered explicit resumeResearch...`);
      if (c.state.status === "done" && c.state.answer) {
        console.log(`[Worker Actor ${c.key.join(":")}] Research already completed!`);
        return c.state;
      }

      if (!c.state.sources || c.state.sources.length === 0) {
        return await (c.actions as any).startResearch(c.state.sessionId, c.state.subQuestion);
      }

      // Resume from synthesis stage without re-searching
      console.log(`[Worker Actor ${c.key.join(":")}] 🔄 Resuming synthesis stage using existing ${c.state.sources.length} sources.`);
      c.state.status = "synthesizing";
      await c.saveState({ immediate: true });

      const answer = await synthesizeAnswer(c.state.subQuestion, c.state.sources);
      c.state.answer = answer;
      c.state.status = "done";
      await c.saveState({ immediate: true });

      if (c.state.sessionId) {
        try {
          const coordinatorClient = (c.client() as any).coordinator.getOrCreate([c.state.sessionId]);
          await coordinatorClient.workerDone(c.state.subQuestion, c.state.answer);
        } catch (err: any) {
          console.warn(`[Worker Actor ${c.key.join(":")}] Coordinator callback note: ${err.message}`);
        }
      }

      return c.state;
    },

    getState: (c) => {
      return c.state;
    }
  }
});
