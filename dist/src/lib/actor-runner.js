import { EventEmitter } from "node:events";
export const globalEventBus = new EventEmitter();
// In-memory persistent state store for actors across process restarts/simulated crashes
const actorStateStore = new Map();
export function getActorKeyString(actorName, key) {
    return `${actorName}:${key.join(":")}`;
}
export function getStoredActorState(actorName, key, defaultState) {
    const storeKey = getActorKeyString(actorName, key);
    if (!actorStateStore.has(storeKey)) {
        actorStateStore.set(storeKey, JSON.parse(JSON.stringify(defaultState)));
    }
    return actorStateStore.get(storeKey);
}
export function saveStoredActorState(actorName, key, state) {
    const storeKey = getActorKeyString(actorName, key);
    actorStateStore.set(storeKey, state);
}
export function clearActorStateStore() {
    actorStateStore.clear();
}
/**
  Create an actor context wrapper for RivetKit actions.
 */
export function createActorContext(actorName, key, defaultState, registry) {
    const initialState = getStoredActorState(actorName, key, defaultState);
    const ctx = {
        name: actorName,
        key,
        actorId: getActorKeyString(actorName, key),
        state: initialState,
        saveState: async () => {
            saveStoredActorState(actorName, key, ctx.state);
        },
        broadcast: (event, data) => {
            console.log(`[Broadcast:${actorName}:${key.join(":")}] Event "${event}":`, typeof data === "object" ? JSON.stringify(data).slice(0, 150) : data);
            globalEventBus.emit("broadcast", { actorName, key, event, data });
        },
        client: () => createActorClient(registry),
        actions: {}
    };
    return ctx;
}
/**
  Create cross-actor client caller.
 */
export function createActorClient(registry) {
    const client = {};
    for (const [actorName, actorDef] of Object.entries(registry.actors || registry)) {
        client[actorName] = {
            getOrCreate: (key) => {
                const initialState = getStoredActorState(actorName, key, actorDef.config?.state || actorDef.state || {});
                const ctx = createActorContext(actorName, key, initialState, registry);
                const boundActions = {};
                const actionMap = actorDef.config?.actions || actorDef.actions || {};
                for (const [actionName, actionFn] of Object.entries(actionMap)) {
                    boundActions[actionName] = async (...args) => {
                        // Always refresh ctx.state from storage before action execution
                        ctx.state = getStoredActorState(actorName, key, initialState);
                        const res = await actionFn(ctx, ...args);
                        saveStoredActorState(actorName, key, ctx.state);
                        return res;
                    };
                }
                ctx.actions = boundActions;
                return boundActions;
            }
        };
    }
    return client;
}
