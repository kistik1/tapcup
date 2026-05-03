import { SIMULATOR_DEFAULT_USER } from "@/lib/simulator/fixtures";
import { loadSimulatorState, mutateSimulatorState, readCollection, nextSimulatorId } from "@/lib/simulator/store";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function matchesQuery(record, query = {}) {
  return Object.entries(query).every(([key, value]) => {
    if (value === undefined) return true;
    return record[key] === value;
  });
}

function getNowIso() {
  return new Date().toISOString();
}

function buildCollectionApi(collectionName, idPrefix) {
  return {
    async filter(query = {}) {
      const records = readCollection(collectionName);
      return records.filter((record) => matchesQuery(record, query));
    },
    async create(data) {
      const now = getNowIso();
      const id = nextSimulatorId(collectionName);
      const record = {
        id: `${idPrefix}_${id.split("_").pop()}`,
        created_date: now,
        updated_date: now,
        ...clone(data),
      };

      mutateSimulatorState((state) => {
        state[collectionName] = [...(state[collectionName] || []), record];
        return state;
      });

      return clone(record);
    },
    async update(id, data) {
      let updated = null;
      mutateSimulatorState((state) => {
        state[collectionName] = (state[collectionName] || []).map((record) => {
          if (record.id !== id) return record;
          updated = {
            ...record,
            ...clone(data),
            updated_date: getNowIso(),
          };
          return updated;
        });
        return state;
      });

      if (!updated) {
        throw new Error(`Record not found: ${collectionName}/${id}`);
      }

      return clone(updated);
    },
    async delete(id) {
      mutateSimulatorState((state) => {
        state[collectionName] = (state[collectionName] || []).filter((record) => record.id !== id);
        return state;
      });
      return true;
    },
  };
}

function setAuthenticatedState(isAuthenticated, user = null) {
  mutateSimulatorState((state) => {
    state.auth = {
      isAuthenticated,
      user: user ? clone(user) : null,
    };
    return state;
  });
}

function ensureAuthenticatedUser() {
  const state = loadSimulatorState();
  if (state.auth?.isAuthenticated && state.auth.user) {
    return clone(state.auth.user);
  }
  return null;
}

function goTo(target) {
  if (typeof window === "undefined" || !target) return;
  window.location.assign(target);
}

export function createSimulatorBase44() {
  return {
    auth: {
      async me() {
        const user = ensureAuthenticatedUser();
        if (!user) {
          throw new Error("Not authenticated");
        }
        return user;
      },
      async isAuthenticated() {
        const state = loadSimulatorState();
        return Boolean(state.auth?.isAuthenticated);
      },
      logout(target) {
        setAuthenticatedState(false, null);
        goTo(target);
      },
      redirectToLogin(target) {
        setAuthenticatedState(true, SIMULATOR_DEFAULT_USER);
        goTo(target);
      },
    },
    entities: {
      CoffeeProfile: buildCollectionApi("CoffeeProfile", "profile_sim"),
      CoffeePreference: buildCollectionApi("CoffeePreference", "pref_sim"),
      Order: buildCollectionApi("Order", "order_sim"),
    },
  };
}
