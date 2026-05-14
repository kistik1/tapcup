import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import CoffeeCupSvg from "@/components/consumer/CoffeeCupSvg";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatStrengthLabel, SIZE_DEFS, VESSEL_DEFS } from "@/components/consumer/cup-constants.jsx";

function getPreferenceSortValue(pref) {
  if (pref.is_default) return 0;
  return 1;
}

function buildPreferenceLayers(pref) {
  if (!pref) {
    return { coffee: 60, water: 0, milk: 20, foam: 20 };
  }

  const hasLayerData = (pref.coffee_pct || 0) + (pref.water_pct || 0) + (pref.milk_pct || 0) + (pref.foam_pct || 0) > 0;
  if (!hasLayerData) {
    return { coffee: 60, water: 0, milk: 20, foam: 20 };
  }

  return {
    coffee: pref.coffee_pct || 0,
    water: pref.water_pct || 0,
    milk: pref.milk_pct || 0,
    foam: pref.foam_pct || 0,
  };
}

function formatPreferenceMeta(pref) {
  if (!pref) return [];

  const vesselLabel = VESSEL_DEFS.find((item) => item.value === pref.vessel)?.label || "Mug";
  const sizeLabel = SIZE_DEFS.find((item) => item.value === pref.size)?.label || "Large";

  return [
    pref.coffee_type,
    pref.strength && `${formatStrengthLabel(pref.strength)} strength`,
    pref.milk && `${pref.milk} milk`,
    pref.sugar && `${pref.sugar} sugar`,
    pref.temperature,
    `${sizeLabel} ${vesselLabel}`,
  ].filter(Boolean);
}

function RecentOrders({ orders }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-[hsl(var(--border))] bg-white/70 px-5 py-6 text-sm text-muted-foreground">
        No recent orders yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const pref = order.preference_snapshot;
        const date = order.ordered_at || order.created_date;
        const when = date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Today";

        return (
          <div
            key={order.id}
            data-testid={`shop-recent-order-${order.id}`}
            className="rounded-[24px] border border-white/70 bg-white/90 px-4 py-4 shadow-[0_18px_40px_-26px_rgba(120,53,15,0.45)]"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#fff3e2_0%,#f4e1cc_100%)]">
                <CoffeeCupSvg
                  layers={buildPreferenceLayers(pref)}
                  vessel={pref?.vessel || "mug"}
                  size={pref?.size || "large"}
                  temp={pref?.temperature}
                  width={42}
                  clipId={`shop-recent-order-${order.id}`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {pref?.name || pref?.coffee_type || "Custom Order"}
                  </p>
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">{when}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[pref?.coffee_type, pref?.temperature, order.shop_name].filter(Boolean).join(" · ")}
                </p>
                {order.barista_notes && (
                  <p className="mt-2 text-xs italic text-slate-600">{order.barista_notes}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CustomerProfileView({ profile, shopName = "Coffee Shop", onBackToShop }) {
  const [preferences, setPreferences] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPreferenceId, setSelectedPreferenceId] = useState("");
  const [baristaNotes, setBaristaNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [postOrderOpen, setPostOrderOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setSubmitMessage("");

      const prefs = await base44.entities.CoffeePreference.filter({ profile_id: profile.id });
      const sortedPrefs = [...prefs].sort((a, b) => {
        const sortDelta = getPreferenceSortValue(a) - getPreferenceSortValue(b);
        if (sortDelta !== 0) return sortDelta;
        return (a.name || "").localeCompare(b.name || "");
      });

      const ords = await base44.entities.Order.filter({ profile_id: profile.id });
      const sortedOrders = [...ords].sort(
        (a, b) => new Date(b.ordered_at || b.created_date).getTime() - new Date(a.ordered_at || a.created_date).getTime()
      );

      if (cancelled) return;

      setPreferences(sortedPrefs);
      setOrders(sortedOrders);

      const defaultPref = sortedPrefs.find((pref) => pref.is_default);
      setSelectedPreferenceId(defaultPref?.id || sortedPrefs[0]?.id || "");
      setBaristaNotes("");
      setLoading(false);
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [profile.id]);

  const selectedPreference = useMemo(
    () => preferences.find((pref) => pref.id === selectedPreferenceId) || null,
    [preferences, selectedPreferenceId]
  );
  const selectedMeta = formatPreferenceMeta(selectedPreference);
  const recentOrders = orders.slice(0, 3);

  async function handleLogOrder(event) {
    event.preventDefault();
    setSaving(true);
    setSubmitMessage("");

    try {
      await base44.entities.Order.create({
        profile_id: profile.id,
        user_email: profile.user_email,
        preference_id: selectedPreference?.id || null,
        preference_snapshot: selectedPreference || null,
        shop_name: shopName,
        barista_notes: baristaNotes,
        status: "Completed",
        ordered_at: new Date().toISOString(),
      });

      const ords = await base44.entities.Order.filter({ profile_id: profile.id });
      const sortedOrders = [...ords].sort(
        (a, b) => new Date(b.ordered_at || b.created_date).getTime() - new Date(a.ordered_at || a.created_date).getTime()
      );
      setOrders(sortedOrders);
      setBaristaNotes("");
      setSubmitMessage(selectedPreference ? `Logged ${selectedPreference.name || selectedPreference.coffee_type}.` : "Logged custom order.");
      setPostOrderOpen(true);
    } finally {
      setSaving(false);
    }
  }

  function handleBackToShopMenu() {
    setPostOrderOpen(false);
    setSubmitMessage("");
    onBackToShop?.();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Dialog open={postOrderOpen} onOpenChange={setPostOrderOpen}>
        <DialogContent className="rounded-[28px] border-amber-200 bg-[linear-gradient(180deg,#fffaf2_0%,#fff3df_100%)] p-0 sm:max-w-md" data-testid="shop-post-order-dialog">
          <div className="p-6 sm:p-7">
            <DialogHeader className="text-left">
              <div className="inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800">
                Order Logged
              </div>
              <DialogTitle className="pt-3 text-2xl font-semibold tracking-tight text-slate-900">
                What next?
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-slate-600">
                {submitMessage || "Return to the shop page to log one more coffee or add and edit an NFC chip."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6 flex-col gap-3 sm:flex-col sm:space-x-0">
              <Button
                type="button"
                onClick={handleBackToShopMenu}
                className="h-12 w-full rounded-2xl bg-[linear-gradient(180deg,#b45309_0%,#92400e_100%)] text-base font-semibold text-white"
                data-testid="shop-post-order-back"
              >
                Back to Shop Page
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <div className="overflow-hidden rounded-[32px] border border-amber-200/70 bg-[radial-gradient(circle_at_top,#fff6ea_0%,#f7e7cf_48%,#f3dcc0_100%)] shadow-[0_30px_80px_-40px_rgba(120,53,15,0.55)]">
        <div className="border-b border-amber-200/80 px-5 py-5 sm:px-7">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-[linear-gradient(180deg,#a16207_0%,#d97706_100%)] text-xl font-bold text-white shadow-lg">
              {profile.display_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p data-testid="shop-customer-display-name" className="text-xl font-semibold tracking-tight text-slate-900">
                {profile.display_name}
              </p>
              {profile.phone && <p className="mt-1 text-sm text-slate-600">{profile.phone}</p>}
              <p data-testid="shop-customer-nfc-id" className="mt-1 text-xs font-medium text-slate-500">
                {profile.nfc_id}
              </p>
            </div>
            <div className="rounded-full border border-amber-300 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
              Barista View
            </div>
          </div>
        </div>

        <div className="grid gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] bg-[linear-gradient(180deg,#4c2a16_0%,#24150d_100%)] px-5 py-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            {selectedPreference ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/80">
                      Active Cup
                    </p>
                    <h2 data-testid="shop-selected-preference-name" className="mt-2 text-2xl font-semibold tracking-tight">
                      {selectedPreference.name}
                    </h2>
                    <p className="mt-1 text-sm text-amber-100/80">{selectedPreference.coffee_type}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedPreference.is_default && (
                      <span className="rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-100">
                        Customer Default
                      </span>
                    )}
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90">
                      Serving Now
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid items-center gap-5 sm:grid-cols-[1fr_1fr]">
                  <div className="flex justify-center rounded-[28px] border border-white/10 bg-white/5 px-4 py-5">
                    <CoffeeCupSvg
                      layers={buildPreferenceLayers(selectedPreference)}
                      vessel={selectedPreference.vessel || "mug"}
                      size={selectedPreference.size || "large"}
                      temp={selectedPreference.temperature}
                      width={180}
                      clipId={`shop-active-cup-${selectedPreference.id}`}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {selectedMeta.map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-medium text-amber-50/95"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-dashed border-white/15 bg-black/10 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200/70">Customer Notes</p>
                      <p data-testid="shop-selected-preference-notes" className="mt-2 text-sm leading-6 text-white/88">
                        {selectedPreference.notes || "No customer notes on this preference."}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div data-testid="shop-no-preferences-state" className="rounded-[28px] border border-dashed border-white/15 bg-white/5 px-5 py-8">
                <p className="text-lg font-semibold text-white">No saved preferences</p>
                <p className="mt-2 text-sm leading-6 text-amber-100/80">
                  This customer can still be served, but there is no saved default or alternate drink on file.
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleLogOrder} className="space-y-4">
            <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_40px_-26px_rgba(120,53,15,0.45)] backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Saved Drinks</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">Switch for this order</h3>
                </div>
                <div className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-medium text-amber-800">
                  Order only
                </div>
              </div>

              {preferences.length > 0 ? (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-1" data-testid="shop-preference-switcher">
                  {preferences.map((pref) => {
                    const isSelected = pref.id === selectedPreferenceId;
                    return (
                      <button
                        key={pref.id}
                        type="button"
                        onClick={() => setSelectedPreferenceId(pref.id)}
                        data-testid={`shop-preference-option-${pref.id}`}
                        className={`min-h-[132px] min-w-[220px] rounded-[26px] border px-4 py-4 text-left transition-all ${
                          isSelected
                            ? "border-amber-500 bg-[linear-gradient(180deg,#fff6e8_0%,#fde7c3_100%)] shadow-[0_16px_35px_-24px_rgba(180,83,9,0.65)]"
                            : "border-[hsl(var(--border))] bg-[#fffaf3] hover:border-amber-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{pref.name}</p>
                            <p className="mt-1 text-xs text-slate-600">{pref.coffee_type}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {pref.is_default && (
                              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                                Default
                              </span>
                            )}
                            {isSelected && (
                              <span className="rounded-full bg-amber-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-600">
                          {formatPreferenceMeta(pref).join(" · ")}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 px-4 py-5 text-sm text-muted-foreground">
                  No saved preferences on file for this customer.
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_40px_-26px_rgba(120,53,15,0.45)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Log Order</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">
                    {selectedPreference ? selectedPreference.name : "Custom order"}
                  </h3>
                </div>
                {selectedPreference && (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-800">
                    {selectedPreference.coffee_type}
                  </span>
                )}
              </div>

              <div className="mt-4">
                <label htmlFor="shop-barista-notes" className="text-sm font-medium text-slate-800">
                  Barista note
                </label>
                <Input
                  id="shop-barista-notes"
                  value={baristaNotes}
                  onChange={(event) => setBaristaNotes(event.target.value)}
                  placeholder="e.g. Extra hot, oat milk"
                  className="mt-2 h-12 rounded-2xl bg-[#fffdf9]"
                  data-testid="shop-barista-notes"
                />
              </div>

              {submitMessage && (
                <p className="mt-3 text-sm font-medium text-emerald-700" data-testid="shop-order-submit-message">
                  {submitMessage}
                </p>
              )}

              <Button
                type="submit"
                disabled={saving}
                className="mt-5 h-12 w-full rounded-2xl bg-[linear-gradient(180deg,#b45309_0%,#92400e_100%)] text-base font-semibold text-white hover:opacity-95"
                data-testid="shop-log-order"
              >
                {saving ? "Logging..." : "Log Order"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <section data-testid="shop-recent-orders" className="rounded-[30px] border border-amber-100 bg-[linear-gradient(180deg,#fffdf9_0%,#fff6ea_100%)] p-5 shadow-[0_18px_45px_-32px_rgba(120,53,15,0.4)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Recent Orders</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">Quick context</h3>
          </div>
          <span className="rounded-full border border-amber-200 bg-white px-3 py-1 text-[11px] font-medium text-amber-800">
            Last {Math.min(recentOrders.length, 3)}
          </span>
        </div>
        <div className="mt-4">
          <RecentOrders orders={recentOrders} />
        </div>
      </section>
    </div>
  );
}
