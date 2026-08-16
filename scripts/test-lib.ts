import { webSearch } from "../src/lib/search.js";
import { planSubQuestions, synthesizeAnswer, compileReport } from "../src/lib/llm.js";

async function main() {
  console.log("==========================================");
  console.log("Testing Step 2: LLM & Search Helper Modules");
  console.log("==========================================");

  const query = "What makes actor-based architectures suitable for durable multi-agent AI systems?";
  console.log(`\n1. Testing planSubQuestions for query: "${query}"`);
  const subQuestions = await planSubQuestions(query);
  console.log("Planned Sub-Questions:", subQuestions);

  if (!Array.isArray(subQuestions) || subQuestions.length === 0) {
    throw new Error("planSubQuestions failed: returned invalid sub-questions array.");
  }

  const subQ = subQuestions[0];
  console.log(`\n2. Testing webSearch for sub-question: "${subQ}"`);
  const sources = await webSearch(subQ);
  console.log(`Found ${sources.length} sources.`);
  sources.forEach((s, idx) => console.log(`  [${idx + 1}] ${s.title} (${s.url})`));

  if (!Array.isArray(sources) || sources.length === 0) {
    throw new Error("webSearch failed: returned empty sources array.");
  }

  console.log(`\n3. Testing synthesizeAnswer for sub-question: "${subQ}"`);
  const answer = await synthesizeAnswer(subQ, sources);
  console.log("Synthesized Answer Output (preview):");
  console.log(answer.slice(0, 300) + "...\n");

  if (!answer || typeof answer !== "string") {
    throw new Error("synthesizeAnswer failed: returned empty answer.");
  }

  console.log("\n4. Testing compileReport...");
  const findings: Record<string, string> = {};
  for (const sq of subQuestions) {
    findings[sq] = `Synthesized research findings for "${sq}". Key metrics indicate high throughput and instant resume upon failure.`;
  }

  const report = await compileReport(query, findings);
  console.log("Compiled Report Output (preview):");
  console.log(report.slice(0, 400) + "...\n");

  if (!report || typeof report !== "string") {
    throw new Error("compileReport failed: returned empty report.");
  }

  console.log("==========================================");
  console.log("✅ Step 2 SUCCESS: All LLM and Search helper modules verified!");
  console.log("==========================================");
}

main().catch((err) => {
  console.error("❌ Step 2 FAILED:", err);
  process.exit(1);
});
