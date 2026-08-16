import { createActorClient } from "../src/lib/actor-runner.js";
import { researchWorker } from "../src/actors/researchWorker.js";

async function main() {
  console.log("==========================================");
  console.log("Testing Step 3: Standalone researchWorker Actor");
  console.log("==========================================");

  const registry = {
    actors: {
      researchWorker
    }
  };

  const client = createActorClient(registry);
  const workerHandle = client.researchWorker.getOrCreate(["test-session-1", "sub-1"]);

  const subQ = "How do actors achieve durable execution during node crashes?";
  console.log(`\nCalling startResearch on worker actor for: "${subQ}"...`);

  const res = await workerHandle.startResearch("test-session-1", subQ);
  console.log("\nWorker execution result:", {
    subQuestion: res.subQuestion,
    sourcesCount: res.sources.length,
    status: res.status,
    answerPreview: res.answer.slice(0, 200) + "..."
  });

  if (res.sources.length > 0 && res.answer && res.status === "done") {
    console.log("\n==========================================");
    console.log("✅ Step 3 SUCCESS: researchWorker actor completed research & state checkpointing!");
    console.log("==========================================");
    process.exit(0);
  } else {
    console.error("❌ Step 3 FAILED: Invalid worker completion state.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Step 3 FAILED:", err);
  process.exit(1);
});
