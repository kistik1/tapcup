export const SIMULATOR_DEFAULT_USER = {
  id: "sim-user-1",
  email: "sim@tapcup.local",
  full_name: "Simulator User",
  role: "customer",
};

export const SIMULATOR_PRIMARY_PROFILE = {
  id: "profile_sim_001",
  user_email: SIMULATOR_DEFAULT_USER.email,
  display_name: "Maya Bean",
  phone: "+972500000001",
  nfc_id: "SIM-111111",
  avatar_url: "",
};

export const SIMULATOR_PRIMARY_PREFERENCE = {
  id: "pref_sim_001",
  profile_id: SIMULATOR_PRIMARY_PROFILE.id,
  user_email: SIMULATOR_PRIMARY_PROFILE.user_email,
  name: "Morning Latte",
  coffee_type: "Latte",
  strength: "2",
  milk: "Oat",
  sugar: "Half",
  temperature: "Hot",
  notes: "Extra hot cup",
  image_url: "",
  is_default: true,
  water_pct: 0,
  milk_pct: 20,
  coffee_pct: 50,
  foam_pct: 30,
  vessel: "mug",
  size: "large",
};

export const SIMULATOR_PRIMARY_ORDER = {
  id: "order_sim_001",
  profile_id: SIMULATOR_PRIMARY_PROFILE.id,
  user_email: SIMULATOR_PRIMARY_PROFILE.user_email,
  preference_id: SIMULATOR_PRIMARY_PREFERENCE.id,
  preference_snapshot: { ...SIMULATOR_PRIMARY_PREFERENCE },
  shop_name: "TapCup Roasters",
  barista_notes: "Simulator seed order",
  price: 4.8,
  status: "Completed",
  ordered_at: "2026-05-03T09:30:00.000Z",
  created_date: "2026-05-03T09:30:00.000Z",
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createInitialSimulatorState() {
  return {
    auth: {
      isAuthenticated: true,
      user: clone(SIMULATOR_DEFAULT_USER),
    },
    counters: {
      CoffeeProfile: 2,
      CoffeePreference: 2,
      Order: 2,
    },
    CoffeeProfile: [clone(SIMULATOR_PRIMARY_PROFILE)],
    CoffeePreference: [clone(SIMULATOR_PRIMARY_PREFERENCE)],
    Order: [clone(SIMULATOR_PRIMARY_ORDER)],
  };
}
