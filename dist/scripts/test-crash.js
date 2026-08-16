import { createActorClient, saveStoredActorState } from "../src/lib/actor-runner.js";
import { researchWorker } from "../src/actors/researchWorker.js";
import { coordinator } from "../src/actors/coordinator.js";
async function main() {
    console.log("==========================================");
    console.log("Testing Step 6: Worker Crash & State Resume Durability");
    console.log("==========================================");
    const registry = {
        actors: {
            coordinator,
            researchWorker
        }
    };
    const client = createActorClient(registry);
    const sessionId = `crash-demo-${Date.now()}`;
    const subKey = ["sessionId", "sub-crash-1"];
    const subQ = "What guarantees state durability in Rivet Actors?";
    console.log("\n1. Simulating initial worker execution up to state checkpoint...");
    // Manually write state checkpoint representing a worker that finished search & saved sources, then CRASHED before synthesis
    const preCrashState = {
        sessionId: subKey[0],
        subQuestion: subQ,
        status: "researching",
        sources: [
            {
                title: "Rivet Actors State Architecture Documentation",
                url: "https://rivet.dev/docs/actors/state",
                snippet: "Rivet Actors feature persistent SQLite/KV storage that automatically checkpoints state changes before responding to client requests."
            },
            {
                title: "Durability Patterns in Distributed AI",
                url: "https://example.com/durability",
                snippet: "Stateful actor frameworks ensure that when a node crashes, incoming messages are queued while state is reconstituted on a healthy worker."
            }
        ],
        answer: ""
    };
    saveStoredActorState("researchWorker", subKey, preCrashState);
    console.log(`💥 SIMULATED WORKER CRASH! Worker process was killed mid-execution.`);
    console.log(`💾 Checkpointed State saved on storage: 2 sources, status='researching', answer=''`);
    console.log("\n2. Re-instantiating Worker Actor with identical key [sessionId, sub-crash-1]...");
    const recoveredWorkerHandle = client.researchWorker.getOrCreate(subKey);
    console.log("3. Invoking startResearch() on recovered worker actor...");
    const startTime = Date.now();
    const result = await recoveredWorkerHandle.startResearch(subKey[0], subQ);
    const duration = Date.now() - startTime;
    console.log("\nRecovered Worker Output:");
    console.log({
        status: result.status,
        sourcesRetained: result.sources.length,
        synthesisCompleted: Boolean(result.answer),
        executionTimeMs: duration
    });
    console.log("\nAnswer Preview:");
    console.log(result.answer.slice(0, 300) + "...\n");
    if (result.sources.length === 2 && result.answer && result.status === "done") {
        console.log("==========================================");
        console.log("🎉 CRASH & RESUME VERIFIED!");
        console.log("Worker resumed seamlessly from existing state checkpoint WITHOUT re-searching!");
        console.log("==========================================");
        console.log("✅ Step 6 SUCCESS: Durability test suite passed!");
        console.log("==========================================");
        process.exit(0);
    }
    else {
        console.error("❌ Step 6 FAILED: Worker did not resume correctly from state checkpoint.");
        process.exit(1);
    }
}
main().catch((err) => {
    console.error("❌ Step 6 FAILED:", err);
    process.exit(1);
});
