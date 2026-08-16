import { createActorClient, globalEventBus } from "../src/lib/actor-runner.js";
import { coordinator } from "../src/actors/coordinator.js";
import { researchWorker } from "../src/actors/researchWorker.js";

async function main() {
  console.log("==========================================");
  console.log("Testing Step 5: Full End-to-End Multi-Agent Research System");
  console.log("==========================================");

  const registry = {
    actors: {
      coordinator,
      researchWorker
    }
  };

  const client = createActorClient(registry);
  const sessionId = `e2e-session-${Date.now()}`;
  const coordinatorHandle = client.coordinator.getOrCreate([sessionId]);

  globalEventBus.on("broadcast", ({ actorName, event, data }) => {
    console.log(`📡 [Realtime Event] ${actorName} -> ${event}:`, data.sessionId || data);
  });

  const query = "What are the core technical advantages of Rivet Actors for distributed AI workloads?";
  console.log(`\nInitiating research query: "${query}" (Session: ${sessionId})...\n`);

  await coordinatorHandle.start(query);

  // Poll for completion (up to 90 seconds)
  let attempts = 0;
  while (attempts < 90) {
    await new Promise((r) => setTimeout(r, 1000));
    attempts++;

    const state = await coordinatorHandle.getState();
    const findingsCount = Object.keys(state.findings || {}).length;
    const totalSub = state.subQuestions?.length || 0;
    console.log(`[Polling ${attempts}s] Status: ${state.status} | Findings: ${findingsCount}/${totalSub}`);

    if (state.status === "done" && state.report) {
      console.log("\n==========================================");
      console.log("🎉 E2E MULTI-AGENT RESEARCH COMPLETE!");
      console.log("==========================================");
      console.log("\nFinal Report Preview:\n");
      console.log(state.report.slice(0, 600) + "\n...\n");
      console.log("==========================================");
      console.log("✅ Step 5 SUCCESS: Full end-to-end research flow verified!");
      console.log("==========================================");
      process.exit(0);
    }
  }

  console.error("❌ Step 5 FAILED: Timed out waiting for report compilation.");
  process.exit(1);
}

main().catch((err) => {
  console.error("❌ Step 5 FAILED:", err);
  process.exit(1);
});
