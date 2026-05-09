export const SIMULATOR_DEFAULT_USER = {
  id: "sim-user-1",
  email: "sim@tapcup.local",
  full_name: "Simulator User",
  role: "customer",
};

// ── Profiles ────────────────────────────────────────────────────────────────

export const SIMULATOR_PRIMARY_PROFILE = {
  id: "profile_sim_001",
  user_email: "sim@tapcup.local",
  display_name: "Maya Bean",
  phone: "+972500000001",
  nfc_id: "SIM-111111",
  avatar_url: "",
};

const PROFILE_ALEX = {
  id: "profile_sim_002",
  user_email: "alex@tapcup.local",
  display_name: "Alex Rivera",
  phone: "+972500000002",
  nfc_id: "SIM-222222",
  avatar_url: "",
};

const PROFILE_DANA = {
  id: "profile_sim_003",
  user_email: "dana@tapcup.local",
  display_name: "Dana Levi",
  phone: "+972500000003",
  nfc_id: "SIM-333333",
  avatar_url: "",
};

// ── Preferences ─────────────────────────────────────────────────────────────

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

const PREF_ALEX_FLAT_WHITE = {
  id: "pref_sim_002",
  profile_id: PROFILE_ALEX.id,
  user_email: PROFILE_ALEX.user_email,
  name: "Flat White",
  coffee_type: "Flat White",
  strength: "2",
  milk: "Whole",
  sugar: "None",
  temperature: "Hot",
  notes: "",
  image_url: "",
  is_default: true,
  water_pct: 0,
  milk_pct: 60,
  coffee_pct: 40,
  foam_pct: 0,
  vessel: "mug",
  size: "small",
};

const PREF_ALEX_ICED_AMERICANO = {
  id: "pref_sim_003",
  profile_id: PROFILE_ALEX.id,
  user_email: PROFILE_ALEX.user_email,
  name: "Iced Americano",
  coffee_type: "Americano",
  strength: "2",
  milk: "None",
  sugar: "None",
  temperature: "Iced",
  notes: "",
  image_url: "",
  is_default: false,
  water_pct: 60,
  milk_pct: 0,
  coffee_pct: 40,
  foam_pct: 0,
  vessel: "glass",
  size: "large",
};

const PREF_DANA_OAT_CAPPUCCINO = {
  id: "pref_sim_004",
  profile_id: PROFILE_DANA.id,
  user_email: PROFILE_DANA.user_email,
  name: "Oat Cappuccino",
  coffee_type: "Cappuccino",
  strength: "1",
  milk: "Oat",
  sugar: "None",
  temperature: "Hot",
  notes: "",
  image_url: "",
  is_default: true,
  water_pct: 0,
  milk_pct: 50,
  coffee_pct: 30,
  foam_pct: 20,
  vessel: "mug",
  size: "small",
};

const PREF_DANA_SWEET_LATTE = {
  id: "pref_sim_005",
  profile_id: PROFILE_DANA.id,
  user_email: PROFILE_DANA.user_email,
  name: "Sweet Latte",
  coffee_type: "Latte",
  strength: "2",
  milk: "Almond",
  sugar: "2 tsp",
  temperature: "Extra Hot",
  notes: "",
  image_url: "",
  is_default: false,
  water_pct: 0,
  milk_pct: 30,
  coffee_pct: 40,
  foam_pct: 30,
  vessel: "mug",
  size: "large",
};

// ── Shops ────────────────────────────────────────────────────────────────────

export const SIMULATOR_SHOP_1 = {
  id: "shop_sim_001",
  name: "TapCup Roasters",
  address: "12 Dizengoff St, Tel Aviv",
  phone: "+97235000001",
  login_username: "tap",
  login_password: "tap1",
  status: "active",
  notes: "",
};

export const SIMULATOR_SHOP_2 = {
  id: "shop_sim_002",
  name: "Bean There Café",
  address: "8 Rothschild Blvd, Tel Aviv",
  phone: "+97235000002",
  login_username: "bean",
  login_password: "bean1",
  status: "active",
  notes: "",
};

// ── NFC Chips ────────────────────────────────────────────────────────────────

const CHIP_MAYA = {
  id: "chip_sim_001",
  personal_id: SIMULATOR_PRIMARY_PROFILE.nfc_id,
  canonical_url: `https://tap-cup.base44.app/consumer?personal_id=${SIMULATOR_PRIMARY_PROFILE.nfc_id}`,
  profile_id: SIMULATOR_PRIMARY_PROFILE.id,
  status: "active",
  assigned_by_role: "shop",
  assigned_by_label: SIMULATOR_SHOP_1.name,
  assigned_at: "2026-04-01T10:00:00.000Z",
};

const CHIP_ALEX = {
  id: "chip_sim_002",
  personal_id: PROFILE_ALEX.nfc_id,
  canonical_url: `https://tap-cup.base44.app/consumer?personal_id=${PROFILE_ALEX.nfc_id}`,
  profile_id: PROFILE_ALEX.id,
  status: "active",
  assigned_by_role: "shop",
  assigned_by_label: SIMULATOR_SHOP_1.name,
  assigned_at: "2026-04-02T11:00:00.000Z",
};

const CHIP_DANA = {
  id: "chip_sim_003",
  personal_id: PROFILE_DANA.nfc_id,
  canonical_url: `https://tap-cup.base44.app/consumer?personal_id=${PROFILE_DANA.nfc_id}`,
  profile_id: PROFILE_DANA.id,
  status: "active",
  assigned_by_role: "shop",
  assigned_by_label: SIMULATOR_SHOP_2.name,
  assigned_at: "2026-04-03T09:00:00.000Z",
};

// ── Orders ───────────────────────────────────────────────────────────────────

export const SIMULATOR_PRIMARY_ORDER = {
  id: "order_sim_001",
  profile_id: SIMULATOR_PRIMARY_PROFILE.id,
  user_email: SIMULATOR_PRIMARY_PROFILE.user_email,
  preference_id: SIMULATOR_PRIMARY_PREFERENCE.id,
  preference_snapshot: { ...SIMULATOR_PRIMARY_PREFERENCE },
  shop_id: SIMULATOR_SHOP_1.id,
  shop_name: SIMULATOR_SHOP_1.name,
  barista_notes: "Simulator seed order",
  price: 4.8,
  status: "Completed",
  ordered_at: "2026-05-03T09:30:00.000Z",
  created_date: "2026-05-03T09:30:00.000Z",
};

const ORDER_ALEX_1 = {
  id: "order_sim_002",
  profile_id: PROFILE_ALEX.id,
  user_email: PROFILE_ALEX.user_email,
  preference_id: PREF_ALEX_FLAT_WHITE.id,
  preference_snapshot: { ...PREF_ALEX_FLAT_WHITE },
  shop_id: SIMULATOR_SHOP_1.id,
  shop_name: SIMULATOR_SHOP_1.name,
  barista_notes: "",
  price: 5.0,
  status: "Completed",
  ordered_at: "2026-05-04T08:15:00.000Z",
  created_date: "2026-05-04T08:15:00.000Z",
};

const ORDER_ALEX_2 = {
  id: "order_sim_003",
  profile_id: PROFILE_ALEX.id,
  user_email: PROFILE_ALEX.user_email,
  preference_id: PREF_ALEX_ICED_AMERICANO.id,
  preference_snapshot: { ...PREF_ALEX_ICED_AMERICANO },
  shop_id: SIMULATOR_SHOP_2.id,
  shop_name: SIMULATOR_SHOP_2.name,
  barista_notes: "Extra ice",
  price: 4.5,
  status: "Completed",
  ordered_at: "2026-05-05T14:00:00.000Z",
  created_date: "2026-05-05T14:00:00.000Z",
};

const ORDER_DANA_1 = {
  id: "order_sim_004",
  profile_id: PROFILE_DANA.id,
  user_email: PROFILE_DANA.user_email,
  preference_id: PREF_DANA_OAT_CAPPUCCINO.id,
  preference_snapshot: { ...PREF_DANA_OAT_CAPPUCCINO },
  shop_id: SIMULATOR_SHOP_2.id,
  shop_name: SIMULATOR_SHOP_2.name,
  barista_notes: "",
  price: 5.2,
  status: "Completed",
  ordered_at: "2026-05-06T10:45:00.000Z",
  created_date: "2026-05-06T10:45:00.000Z",
};

// ── State factory ─────────────────────────────────────────────────────────────

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
      CoffeeProfile: 4,
      CoffeePreference: 6,
      Order: 5,
      NfcChip: 4,
      Shop: 3,
    },
    CoffeeProfile: [
      clone(SIMULATOR_PRIMARY_PROFILE),
      clone(PROFILE_ALEX),
      clone(PROFILE_DANA),
    ],
    CoffeePreference: [
      clone(SIMULATOR_PRIMARY_PREFERENCE),
      clone(PREF_ALEX_FLAT_WHITE),
      clone(PREF_ALEX_ICED_AMERICANO),
      clone(PREF_DANA_OAT_CAPPUCCINO),
      clone(PREF_DANA_SWEET_LATTE),
    ],
    Order: [
      clone(SIMULATOR_PRIMARY_ORDER),
      clone(ORDER_ALEX_1),
      clone(ORDER_ALEX_2),
      clone(ORDER_DANA_1),
    ],
    NfcChip: [
      clone(CHIP_MAYA),
      clone(CHIP_ALEX),
      clone(CHIP_DANA),
    ],
    Shop: [
      clone(SIMULATOR_SHOP_1),
      clone(SIMULATOR_SHOP_2),
    ],
  };
}
