import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, BarChart3, Coffee, KeyRound, Search, Shield, Store, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PasswordGate from "@/components/shared/PasswordGate";
import ProfileChipSetup from "@/components/shared/ProfileChipSetup";
import {
  buildCanonicalChipUrl,
  generatePersonalId,
  setCachedRoleContext,
} from "@/lib/personal-id";

const ADMIN_SESSION_KEY = "tapcup_admin_unlocked";
const ADMIN_PASSWORD = import.meta.env.VITE_TAPCUP_ADMIN_PASSWORD = "admin";

const emptyShopForm = { name: "", address: "", phone: "", notes: "" };
const emptyStaffForm = {
  display_name: "",
  email: "",
  role: "shop",
  shop_id: "",
  can_setup_chips: true,
};

function entityApi(name) {
  return base44.entities[name];
}

function matchesProfile(profile, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [profile.display_name, profile.phone, profile.nfc_id, profile.user_email]
    .filter(Boolean)
    .some((value) => `${value}`.toLowerCase().includes(q));
}

export default function AdminPage() {
  const [searchParams] = useSearchParams();
  const incomingPersonalId = searchParams.get("personal_id") || "";
  const [profiles, setProfiles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [chips, setChips] = useState([]);
  const [shops, setShops] = useState([]);
  const [staff, setStaff] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [profileQuery, setProfileQuery] = useState(incomingPersonalId);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [shopForm, setShopForm] = useState(emptyShopForm);
  const [editingShop, setEditingShop] = useState(null);
  const [staffForm, setStaffForm] = useState(emptyStaffForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [newProfile, setNewProfile] = useState({
    display_name: "",
    phone: "",
    personal_id: incomingPersonalId || generatePersonalId(),
  });

  useEffect(() => {
    setCachedRoleContext("admin", "/admin");
    loadAdminData();
  }, []);

  useEffect(() => {
    if (incomingPersonalId) setProfileQuery(incomingPersonalId);
  }, [incomingPersonalId]);

  const filteredProfiles = useMemo(
    () => profiles.filter((profile) => matchesProfile(profile, profileQuery)).slice(0, 12),
    [profiles, profileQuery]
  );

  const stats = useMemo(() => {
    const activeShops = shops.filter((shop) => shop.status !== "inactive").length;
    const activeChips = chips.filter((chip) => chip.status !== "inactive").length;
    const completedOrders = orders.filter((order) => order.status === "Completed").length;
    return { profiles: profiles.length, activeShops, activeChips, completedOrders };
  }, [chips, orders, profiles, shops]);

  async function loadAdminData() {
    setLoading(true);
    setError("");
    try {
      const [
        profileRows,
        orderRows,
        chipRows,
        shopRows,
        staffRows,
        auditRows,
      ] = await Promise.all([
        base44.entities.CoffeeProfile.filter({}),
        base44.entities.Order.filter({}),
        entityApi("NfcChip")?.filter({}) || [],
        entityApi("Shop")?.filter({}) || [],
        entityApi("StaffAccess")?.filter({}) || [],
        entityApi("AdminAuditLog")?.filter({}) || [],
      ]);
      setProfiles(profileRows);
      setOrders(orderRows);
      setChips(chipRows);
      setShops(shopRows);
      setStaff(staffRows);
      setAuditLogs(auditRows.sort((a, b) => new Date(b.created_at || b.created_date).getTime() - new Date(a.created_at || a.created_date).getTime()));

      if (incomingPersonalId) {
        const match = profileRows.find((profile) => profile.nfc_id === incomingPersonalId);
        if (match) setSelectedProfile(match);
      }
    } catch (err) {
      setError(err?.message || "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }

  async function createAuditLog(action, entityType, entityId, details = {}) {
    if (!entityApi("AdminAuditLog")) return;
    await entityApi("AdminAuditLog").create({
      actor_role: "admin",
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      created_at: new Date().toISOString(),
    });
  }

  async function saveShop(event) {
    event.preventDefault();
    if (!shopForm.name.trim()) return;
    setSaving(true);
    try {
      if (editingShop) {
        await entityApi("Shop").update(editingShop.id, { ...shopForm, status: editingShop.status || "active" });
        await createAuditLog("update_shop", "Shop", editingShop.id, shopForm);
      } else {
        const created = await entityApi("Shop").create({ ...shopForm, status: "active" });
        await createAuditLog("create_shop", "Shop", created.id, shopForm);
      }
      setShopForm(emptyShopForm);
      setEditingShop(null);
      await loadAdminData();
    } finally {
      setSaving(false);
    }
  }

  async function deactivateShop(shop) {
    setSaving(true);
    try {
      await entityApi("Shop").update(shop.id, { status: "inactive" });
      await createAuditLog("deactivate_shop", "Shop", shop.id, { name: shop.name });
      await loadAdminData();
    } finally {
      setSaving(false);
    }
  }

  async function saveStaff(event) {
    event.preventDefault();
    if (!staffForm.display_name.trim()) return;
    setSaving(true);
    try {
      const created = await entityApi("StaffAccess").create({ ...staffForm, status: "active" });
      await createAuditLog("create_staff_access", "StaffAccess", created.id, staffForm);
      setStaffForm(emptyStaffForm);
      await loadAdminData();
    } finally {
      setSaving(false);
    }
  }

  async function deactivateStaff(record) {
    setSaving(true);
    try {
      await entityApi("StaffAccess").update(record.id, { status: "inactive" });
      await createAuditLog("deactivate_staff_access", "StaffAccess", record.id, { display_name: record.display_name });
      await loadAdminData();
    } finally {
      setSaving(false);
    }
  }

  async function createSeedProfile(event) {
    event.preventDefault();
    if (!newProfile.display_name.trim() || !newProfile.personal_id.trim()) return;
    setSaving(true);
    try {
      const created = await base44.entities.CoffeeProfile.create({
        display_name: newProfile.display_name,
        phone: newProfile.phone,
        nfc_id: newProfile.personal_id,
        user_email: newProfile.phone || newProfile.personal_id,
      });
      await createAuditLog("create_seed_profile", "CoffeeProfile", created.id, {
        personal_id: created.nfc_id,
        canonical_url: buildCanonicalChipUrl(created.nfc_id),
      });
      setSelectedProfile(created);
      setNewProfile({ display_name: "", phone: "", personal_id: generatePersonalId() });
      await loadAdminData();
    } finally {
      setSaving(false);
    }
  }

  function beginEditShop(shop) {
    setEditingShop(shop);
    setShopForm({
      name: shop.name || "",
      address: shop.address || "",
      phone: shop.phone || "",
      notes: shop.notes || "",
    });
  }

  return (
    <PasswordGate
      title="Admin Access"
      description="Enter the TapCup admin password to manage chips, shops, staff, and system statistics."
      password={ADMIN_PASSWORD} 
      sessionKey={ADMIN_SESSION_KEY}
    >
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-semibold">Admin</span>
            <Button variant="outline" onClick={loadAdminData} className="ml-auto h-9 rounded-xl">
              Refresh
            </Button>
          </div>
        </div>

        <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={Users} label="Consumers" value={stats.profiles} />
            <StatCard icon={Store} label="Active shops" value={stats.activeShops} />
            <StatCard icon={KeyRound} label="Active chips" value={stats.activeChips} />
            <StatCard icon={Coffee} label="Completed orders" value={stats.completedOrders} />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-800 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
              <section className="space-y-6">
                <Panel title="Consumer Oversight" icon={Search}>
                  <Input
                    value={profileQuery}
                    onChange={(event) => setProfileQuery(event.target.value)}
                    placeholder="Search name, phone, personal ID, or email"
                    className="h-11 rounded-xl"
                  />
                  <div className="mt-3 divide-y divide-border rounded-2xl border border-border overflow-hidden">
                    {filteredProfiles.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => setSelectedProfile(profile)}
                        className={`w-full text-left p-3 hover:bg-muted/60 transition-colors ${
                          selectedProfile?.id === profile.id ? "bg-amber-50" : "bg-card"
                        }`}
                      >
                        <p className="font-medium text-sm">{profile.display_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {profile.phone || "No phone"} · <span className="font-mono">{profile.nfc_id}</span>
                        </p>
                      </button>
                    ))}
                    {filteredProfiles.length === 0 && (
                      <p className="p-4 text-sm text-muted-foreground">No matching consumers.</p>
                    )}
                  </div>
                </Panel>

                <Panel title="Create Seed Profile" icon={KeyRound}>
                  <form onSubmit={createSeedProfile} className="grid md:grid-cols-3 gap-3">
                    <Input
                      value={newProfile.display_name}
                      onChange={(event) => setNewProfile((form) => ({ ...form, display_name: event.target.value }))}
                      placeholder="Customer name"
                      className="h-11 rounded-xl"
                    />
                    <Input
                      value={newProfile.phone}
                      onChange={(event) => setNewProfile((form) => ({ ...form, phone: event.target.value }))}
                      placeholder="Phone"
                      className="h-11 rounded-xl"
                    />
                    <div className="flex gap-2">
                      <Input
                        value={newProfile.personal_id}
                        onChange={(event) => setNewProfile((form) => ({ ...form, personal_id: event.target.value }))}
                        placeholder="Personal ID"
                        className="h-11 rounded-xl font-mono"
                      />
                      <Button type="submit" disabled={saving} className="h-11 rounded-xl">Create</Button>
                    </div>
                  </form>
                </Panel>

                <Panel title="Shop Management" icon={Store}>
                  <form onSubmit={saveShop} className="grid md:grid-cols-2 gap-3 mb-4">
                    <Input value={shopForm.name} onChange={(event) => setShopForm((form) => ({ ...form, name: event.target.value }))} placeholder="Shop name" className="h-11 rounded-xl" />
                    <Input value={shopForm.phone} onChange={(event) => setShopForm((form) => ({ ...form, phone: event.target.value }))} placeholder="Phone" className="h-11 rounded-xl" />
                    <Input value={shopForm.address} onChange={(event) => setShopForm((form) => ({ ...form, address: event.target.value }))} placeholder="Address" className="h-11 rounded-xl md:col-span-2" />
                    <Textarea value={shopForm.notes} onChange={(event) => setShopForm((form) => ({ ...form, notes: event.target.value }))} placeholder="Notes" className="rounded-xl md:col-span-2" />
                    <Button type="submit" disabled={saving || !shopForm.name.trim()} className="h-11 rounded-xl">
                      {editingShop ? "Save Shop" : "Add Shop"}
                    </Button>
                    {editingShop && (
                      <Button type="button" variant="outline" onClick={() => { setEditingShop(null); setShopForm(emptyShopForm); }} className="h-11 rounded-xl">
                        Cancel Edit
                      </Button>
                    )}
                  </form>
                  <div className="space-y-2">
                    {shops.map((shop) => (
                      <RecordRow
                        key={shop.id}
                        title={shop.name}
                        detail={`${shop.status || "active"} · ${shop.phone || "no phone"}`}
                        inactive={shop.status === "inactive"}
                        onEdit={() => beginEditShop(shop)}
                        onDeactivate={() => deactivateShop(shop)}
                      />
                    ))}
                  </div>
                </Panel>
              </section>

              <aside className="space-y-6">
                {selectedProfile ? (
                  <ProfileChipSetup
                    profile={selectedProfile}
                    actorRole="admin"
                    actorLabel="Admin"
                    onAssigned={(updatedProfile) => {
                      setSelectedProfile(updatedProfile);
                      loadAdminData();
                    }}
                  />
                ) : (
                  <Panel title="NFC Chip Setup" icon={KeyRound}>
                    <p className="text-sm text-muted-foreground">Select a consumer to assign or reassign a chip.</p>
                  </Panel>
                )}

                <Panel title="Staff Access" icon={Users}>
                  <form onSubmit={saveStaff} className="space-y-3 mb-4">
                    <Input value={staffForm.display_name} onChange={(event) => setStaffForm((form) => ({ ...form, display_name: event.target.value }))} placeholder="Staff name" className="h-10 rounded-xl" />
                    <Input value={staffForm.email} onChange={(event) => setStaffForm((form) => ({ ...form, email: event.target.value }))} placeholder="Email" className="h-10 rounded-xl" />
                    <select
                      value={staffForm.shop_id}
                      onChange={(event) => setStaffForm((form) => ({ ...form, shop_id: event.target.value }))}
                      className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    >
                      <option value="">No shop assigned</option>
                      {shops.filter((shop) => shop.status !== "inactive").map((shop) => (
                        <option key={shop.id} value={shop.id}>{shop.name}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={staffForm.can_setup_chips}
                        onChange={(event) => setStaffForm((form) => ({ ...form, can_setup_chips: event.target.checked }))}
                      />
                      Can setup chips
                    </label>
                    <Button type="submit" disabled={saving || !staffForm.display_name.trim()} className="w-full h-10 rounded-xl">
                      Add Staff
                    </Button>
                  </form>
                  <div className="space-y-2">
                    {staff.map((record) => (
                      <RecordRow
                        key={record.id}
                        title={record.display_name}
                        detail={`${record.role} · ${record.can_setup_chips ? "chip setup" : "lookup only"} · ${record.status || "active"}`}
                        inactive={record.status === "inactive"}
                        onDeactivate={() => deactivateStaff(record)}
                      />
                    ))}
                  </div>
                </Panel>

                <Panel title="Audit Log" icon={BarChart3}>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {auditLogs.slice(0, 12).map((log) => (
                      <div key={log.id} className="rounded-xl border border-border p-3">
                        <p className="text-sm font-medium">{log.action}</p>
                        <p className="text-xs text-muted-foreground">{log.entity_type} · {log.actor_role}</p>
                      </div>
                    ))}
                    {auditLogs.length === 0 && <p className="text-sm text-muted-foreground">No audit events yet.</p>}
                  </div>
                </Panel>
              </aside>
            </div>
          )}
        </main>
      </div>
    </PasswordGate>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <Icon className="w-4 h-4 text-primary mb-3" />
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-primary" />
        <h2 className="font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function RecordRow({ title, detail, inactive, onEdit, onDeactivate }) {
  return (
    <div className={`rounded-xl border border-border p-3 flex items-center gap-3 ${inactive ? "opacity-60 bg-muted/40" : "bg-background"}`}>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{detail}</p>
      </div>
      {onEdit && (
        <Button type="button" variant="outline" onClick={onEdit} className="h-8 rounded-lg px-3">
          Edit
        </Button>
      )}
      {!inactive && onDeactivate && (
        <Button type="button" variant="outline" onClick={onDeactivate} className="h-8 rounded-lg px-3 text-destructive">
          Remove
        </Button>
      )}
    </div>
  );
}
