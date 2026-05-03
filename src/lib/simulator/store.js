import { createInitialSimulatorState } from "@/lib/simulator/fixtures";
import { simulatorStorageKey } from "@/lib/simulator/runtime";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getWindowStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function loadSimulatorState() {
  const storage = getWindowStorage();
  if (!storage) {
    return createInitialSimulatorState();
  }

  const raw = storage.getItem(simulatorStorageKey);
  if (!raw) {
    const initial = createInitialSimulatorState();
    storage.setItem(simulatorStorageKey, JSON.stringify(initial));
    return initial;
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      ...createInitialSimulatorState(),
      ...parsed,
      auth: {
        ...createInitialSimulatorState().auth,
        ...(parsed.auth || {}),
      },
      counters: {
        ...createInitialSimulatorState().counters,
        ...(parsed.counters || {}),
      },
      CoffeeProfile: Array.isArray(parsed.CoffeeProfile) ? parsed.CoffeeProfile : createInitialSimulatorState().CoffeeProfile,
      CoffeePreference: Array.isArray(parsed.CoffeePreference) ? parsed.CoffeePreference : createInitialSimulatorState().CoffeePreference,
      Order: Array.isArray(parsed.Order) ? parsed.Order : createInitialSimulatorState().Order,
    };
  } catch {
    const initial = createInitialSimulatorState();
    storage.setItem(simulatorStorageKey, JSON.stringify(initial));
    return initial;
  }
}

export function saveSimulatorState(state) {
  const storage = getWindowStorage();
  if (!storage) return;
  storage.setItem(simulatorStorageKey, JSON.stringify(state));
}

export function resetSimulatorState() {
  const storage = getWindowStorage();
  if (!storage) return createInitialSimulatorState();
  const initial = createInitialSimulatorState();
  storage.setItem(simulatorStorageKey, JSON.stringify(initial));
  return initial;
}

export function mutateSimulatorState(mutator) {
  const state = loadSimulatorState();
  const draft = clone(state);
  const nextState = mutator(draft) || draft;
  saveSimulatorState(nextState);
  return nextState;
}

export function readCollection(name) {
  const state = loadSimulatorState();
  return clone(state[name] || []);
}

export function writeCollection(name, records) {
  return mutateSimulatorState((state) => {
    state[name] = clone(records);
    return state;
  });
}

export function nextSimulatorId(collectionName) {
  let nextId = null;
  mutateSimulatorState((state) => {
    const current = state.counters?.[collectionName] || 1;
    state.counters[collectionName] = current + 1;
    nextId = `${collectionName}_${String(current).padStart(3, "0")}`;
    return state;
  });
  return nextId;
}
