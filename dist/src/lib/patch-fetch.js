import fs from "node:fs";
import { fileURLToPath } from "node:url";
const originalFetch = globalThis.fetch;
let localHandler = null;
export function setLocalServerHandler(handler) {
    localHandler = handler;
}
if (typeof globalThis.fetch === "function") {
    globalThis.fetch = async function (input, init) {
        let urlStr = "";
        if (typeof input === "string") {
            urlStr = input;
        }
        else if (input && typeof input.href === "string") {
            urlStr = input.href;
        }
        else if (input && typeof input.url === "string") {
            urlStr = input.url;
        }
        else {
            urlStr = String(input);
        }
        if (urlStr.startsWith("file://")) {
            try {
                const filePath = fileURLToPath(urlStr);
                const buffer = fs.readFileSync(filePath);
                return new Response(buffer, {
                    status: 200,
                    headers: { "Content-Type": "application/wasm" }
                });
            }
            catch (err) {
                console.error("Error reading file in patched fetch:", err);
            }
        }
        if (localHandler && (urlStr.startsWith("http://127.0.0.1:6420") || urlStr.startsWith("http://localhost:6420"))) {
            let targetUrl = urlStr;
            if (!targetUrl.includes("/api/rivet")) {
                targetUrl = targetUrl.replace("http://127.0.0.1:6420", "http://127.0.0.1:6420/api/rivet");
                targetUrl = targetUrl.replace("http://localhost:6420", "http://localhost:6420/api/rivet");
            }
            const req = input instanceof Request ? new Request(targetUrl, input) : new Request(targetUrl, init);
            console.log(`[PATCHED-FETCH] ${req.method} ${req.url}`);
            const res = await localHandler.fetch(req);
            console.log(`[PATCHED-FETCH-RES] ${res.status}`);
            return res;
        }
        return originalFetch(input, init);
    };
}
