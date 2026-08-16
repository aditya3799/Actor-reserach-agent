import { setLocalServerHandler } from "../src/lib/patch-fetch.js";
import { setup } from "rivetkit";
import { createClient } from "rivetkit/client";
import { counter } from "../src/actors/counter.js";
async function main() {
    console.log("Starting RivetKit Counter Test...");
    const registry = setup({
        use: { counter },
        namespace: "default"
    });
    const serverHandler = registry.serve();
    setLocalServerHandler(serverHandler);
    console.log("Registered in-memory server handler!");
    const client = createClient("http://127.0.0.1:6420");
    console.log("Creating counter actor handle...");
    const handle = client.counter.getOrCreate(["test-session-1"]);
    console.log("Calling increment(5)...");
    const res1 = await handle.increment(5);
    console.log("Increment by 5 ->", res1);
    console.log("Calling increment(3)...");
    const res2 = await handle.increment(3);
    console.log("Increment by 3 ->", res2);
    const finalCount = await handle.getCount();
    console.log("Final count ->", finalCount);
    if (finalCount === 8) {
        console.log("✅ Step 1 VERIFIED: RivetKit runs locally and responds to action calls!");
        process.exit(0);
    }
    else {
        console.error("❌ Step 1 FAILED: Expected count 8, got", finalCount);
        process.exit(1);
    }
}
main().catch((err) => {
    console.error("Error in counter test:", err);
    process.exit(1);
});
