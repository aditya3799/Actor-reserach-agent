import "../src/lib/patch-fetch.js";
import { setup } from "rivetkit";
import { counter } from "../src/actors/counter.js";
async function main() {
    const r = setup({ use: { counter } });
    const handler = r.serve();
    const reqs = [
        { path: "/metadata", method: "GET" },
        { path: "/actors", method: "PUT" },
        { path: "/api/rivet/metadata", method: "GET" },
        { path: "/api/rivet/actors", method: "PUT" },
        { path: "/api/rivet/actors/counter/test-session-1", method: "POST" },
        { path: "/actors/counter/test-session-1", method: "POST" }
    ];
    for (const { path, method } of reqs) {
        try {
            const res = await handler.fetch(new Request("http://127.0.0.1:6420" + path, {
                method,
                headers: { "content-type": "application/json" },
                body: method !== "GET" ? JSON.stringify({}) : undefined
            }));
            const text = await res.text();
            console.log(`${method} ${path} -> ${res.status}: ${text.slice(0, 100)}`);
        }
        catch (err) {
            console.error(`${method} ${path} -> ERROR:`, err.message);
        }
    }
}
main();
