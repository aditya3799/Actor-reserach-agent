import { actor } from "rivetkit";
import { planSubQuestions, compileReport } from "../lib/llm.js";
export const coordinator = actor({
    state: {
        query: "",
        subQuestions: [],
        findings: {},
        report: "",
        status: "idle"
    },
    actions: {
        start: async (c, query) => {
            const sessionId = c.key[0] || "default-session";
            console.log(`[Coordinator Actor ${sessionId}] Starting research workflow for: "${query}"`);
            c.state.query = query;
            c.state.status = "planning";
            c.state.findings = {};
            c.state.report = "";
            await c.saveState({ immediate: true });
            // Step 1: Plan Sub-Questions using Groq LLM
            const subQuestions = await planSubQuestions(query);
            c.state.subQuestions = subQuestions;
            c.state.status = "researching";
            await c.saveState({ immediate: true });
            console.log(`[Coordinator Actor ${sessionId}] 📋 Planned ${subQuestions.length} sub-questions.`);
            c.broadcast("planReady", {
                sessionId,
                query,
                subQuestions
            });
            // Step 2: Spawn parallel Research Workers (with 600ms stagger delay)
            const client = c.client();
            for (let i = 0; i < subQuestions.length; i++) {
                const subQ = subQuestions[i];
                setTimeout(async () => {
                    try {
                        console.log(`[Coordinator Actor ${sessionId}] 🚀 Spawning research worker for sub-question ${i + 1}/${subQuestions.length}...`);
                        const workerHandle = client.researchWorker.getOrCreate([sessionId, `sub-${i + 1}`]);
                        await workerHandle.startResearch(sessionId, subQ);
                    }
                    catch (err) {
                        console.error(`[Coordinator Actor ${sessionId}] Error executing worker for sub-question "${subQ}":`, err.message);
                    }
                }, i * 600);
            }
            return {
                query: c.state.query,
                subQuestions: c.state.subQuestions,
                status: c.state.status
            };
        },
        workerDone: async (c, subQuestion, answer) => {
            const sessionId = c.key[0] || "default-session";
            console.log(`[Coordinator Actor ${sessionId}] 📩 Received worker finding for: "${subQuestion}"`);
            if (!c.state.findings) {
                c.state.findings = {};
            }
            c.state.findings[subQuestion] = answer;
            await c.saveState({ immediate: true });
            const completedCount = Object.keys(c.state.findings).length;
            const totalCount = c.state.subQuestions.length;
            console.log(`[Coordinator Actor ${sessionId}] Progress: ${completedCount}/${totalCount} workers complete.`);
            c.broadcast("progress", {
                sessionId,
                subQuestion,
                answer,
                completedCount,
                totalCount,
                findings: c.state.findings
            });
            // If all workers are finished, compile the final research report
            if (completedCount >= totalCount && totalCount > 0 && c.state.status !== "done") {
                console.log(`[Coordinator Actor ${sessionId}] 📝 All workers completed! Compiling final research report...`);
                c.state.status = "done";
                const finalReport = await compileReport(c.state.query, c.state.findings);
                c.state.report = finalReport;
                await c.saveState({ immediate: true });
                console.log(`[Coordinator Actor ${sessionId}] 🎉 Final report compiled and saved!`);
                c.broadcast("reportReady", {
                    sessionId,
                    query: c.state.query,
                    report: c.state.report
                });
            }
            return {
                completedCount,
                totalCount,
                isComplete: c.state.status === "done"
            };
        },
        getState: (c) => {
            return c.state;
        }
    }
});
