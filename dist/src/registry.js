import { setup } from "rivetkit";
import { coordinator } from "./actors/coordinator.js";
import { researchWorker } from "./actors/researchWorker.js";
export function createRegistry() {
    return setup({
        use: {
            coordinator,
            researchWorker
        }
    });
}
