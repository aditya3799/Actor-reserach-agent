import { EventEmitter } from "node:events";

export const globalEventBus = new EventEmitter();

// In-memory persistent state store for actors across process restarts/simulated crashes
const actorStateStore = new Map<string, any>();

export function getActorKeyString(actorName: string, key: string[]): string {
  return `${actorName}:${key.join(":")}`;
}

export function getStoredActorState<T>(actorName: string, key: string[], defaultState: T): T {
  const storeKey = getActorKeyString(actorName, key);
  if (!actorStateStore.has(storeKey)) {
    actorStateStore.set(storeKey, JSON.parse(JSON.stringify(defaultState)));
  }
  return actorStateStore.get(storeKey);
}

export function saveStoredActorState(actorName: string, key: string[], state: any) {
  const storeKey = getActorKeyString(actorName, key);
  actorStateStore.set(storeKey, state);
}

export function clearActorStateStore() {
  actorStateStore.clear();
}

/**
  Create an actor context wrapper for RivetKit actions.
 */
export function createActorContext(actorName: string, key: string[], defaultState: any, registry: any) {
  const initialState = getStoredActorState(actorName, key, defaultState);

  const ctx = {
    name: actorName,
    key,
    actorId: getActorKeyString(actorName, key),
    state: initialState,
    saveState: async () => {
      saveStoredActorState(actorName, key, ctx.state);
    },
    broadcast: (event: string, data: any) => {
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
export function createActorClient(registry: any) {
  const client: any = {};
  for (const [actorName, actorDef] of Object.entries<any>(registry.actors || registry)) {
    client[actorName] = {
      getOrCreate: (key: string[]) => {
        const initialState = getStoredActorState(actorName, key, actorDef.config?.state || actorDef.state || {});
        const ctx = createActorContext(actorName, key, initialState, registry);

        const boundActions: any = {};
        const actionMap = actorDef.config?.actions || actorDef.actions || {};
        for (const [actionName, actionFn] of Object.entries<Function>(actionMap)) {
          boundActions[actionName] = async (...args: any[]) => {
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
