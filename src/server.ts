import "./lib/patch-fetch.js";
import { createRegistry } from "./registry.js";
import { createActorClient, saveStoredActorState } from "./lib/actor-runner.js";
import { coordinator } from "./actors/coordinator.js";
import { researchWorker } from "./actors/researchWorker.js";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import dotenv from "dotenv";

dotenv.config();

const registry = createRegistry();

// Initialize client caller
const actorClient = createActorClient({
  actors: {
    coordinator,
    researchWorker
  }
});

const app = new Hono();

// API Routes for Frontend
app.post("/api/research", async (c) => {
  try {
    const { query } = await c.req.json();
    if (!query) return c.json({ error: "Query required" }, 400);

    const sessionId = `session-${Date.now()}`;
    const coordinatorHandle = actorClient.coordinator.getOrCreate([sessionId]);

    // Trigger research asynchronously
    coordinatorHandle.start(query).catch((err: any) => {
      console.error(`[Session ${sessionId}] Error during start:`, err);
    });

    return c.json({ sessionId });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get("/api/research/:sessionId", async (c) => {
  const sessionId = c.req.param("sessionId");
  try {
    const coordinatorHandle = actorClient.coordinator.getOrCreate([sessionId]);
    const state = await coordinatorHandle.getState();
    return c.json(state);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post("/api/crash-demo", async (c) => {
  try {
    const sessionId = `crash-demo-${Date.now()}`;
    const subKey = [sessionId, "sub-crash-1"];
    const subQ = "What guarantees state durability in Rivet Actors?";

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

    const recoveredWorkerHandle = actorClient.researchWorker.getOrCreate(subKey);
    const startTime = Date.now();
    const result = await recoveredWorkerHandle.startResearch(subKey[0], subQ);
    const duration = Date.now() - startTime;

    return c.json({
      sessionId,
      status: result.status,
      sourcesRetained: result.sources.length,
      synthesisCompleted: Boolean(result.answer),
      executionTimeMs: duration,
      answer: result.answer
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Serve static frontend files
app.use("/*", serveStatic({ root: "./public" }));

const port = parseInt(process.env.PORT ?? "3000", 10);

// Start Rivet engine registration
registry.start();

// Serve Hono HTTP server
serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`🚀 Rivet Research App Server listening on http://localhost:${info.port}`);
});
