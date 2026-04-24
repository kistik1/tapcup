import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Terminal, Wifi, Zap, RefreshCw, User, Coffee, ShoppingBag } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import CustomerProfileView from "@/components/shop/CustomerProfileView";

export default function DevPage() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [tapLog, setTapLog] = useState([]);

  useEffect(() => { loadProfiles(); }, []);

  async function loadProfiles() {
    setLoading(true);
    const all = await base44.entities.CoffeeProfile.list();
    setProfiles(all);
    setLoading(false);
  }

  async function simulateTap(profile) {
    setSimulating(true);
    setSelectedProfile(null);
    addLog(`📡 Scanning NFC signal...`, "info");
    await sleep(600);
    addLog(`🔑 NFC ID detected: ${profile.nfc_id}`, "info");
    await sleep(500);
    addLog(`🔍 Looking up profile...`, "info");
    await sleep(400);
    addLog(`✅ Profile found: ${profile.display_name}`, "success");
    setSelectedProfile(profile);
    setSimulating(false);
  }

  function addLog(msg, type = "info") {
    const ts = new Date().toLocaleTimeString();
    setTapLog(prev => [{ msg, type, ts, id: Date.now() + Math.random() }, ...prev].slice(0, 12));
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-emerald-950/95 backdrop-blur border-b border-emerald-800 px-4 py-3 flex items-center gap-3">
        <Link to="/" className="text-emerald-400 hover:text-emerald-200 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Terminal className="w-5 h-5 text-emerald-400" />
        <span className="font-mono font-bold text-emerald-300">Developer Mode</span>
        <span className="ml-auto text-xs bg-emerald-800 text-emerald-300 px-2 py-0.5 rounded-full font-mono">NFC SIMULATOR</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        {/* Instructions */}
        <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-2xl p-4 mb-6">
          <p className="text-emerald-700 text-xs font-mono leading-relaxed">
            {">"} Tap any profile card below to simulate an NFC tap event.<br />
            {">"} Watch the simulated scan sequence play out in the log.<br />
            {">"} The full shop view will open — exactly as a real barista would see it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: NFC simulator */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Registered Profiles</p>
              <button onClick={loadProfiles} className="text-muted-foreground hover:text-foreground">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-10">
                <User className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No profiles yet.</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Create one in Consumer mode first.</p>
                <Link to="/consumer" className="mt-3 inline-block text-xs text-amber-600 underline">Go to Consumer →</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {profiles.map(profile => (
                  <motion.button
                    key={profile.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => simulateTap(profile)}
                    disabled={simulating}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all
                      ${selectedProfile?.id === profile.id
                        ? "border-emerald-500 bg-emerald-950/20"
                        : "border-border hover:border-emerald-400 bg-card hover:bg-emerald-950/10"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-700 to-amber-500 flex items-center justify-center text-white font-bold text-sm">
                        {profile.display_name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{profile.display_name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{profile.nfc_id}</p>
                      </div>
                      <Wifi className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Tap log */}
            {tapLog.length > 0 && (
              <div className="mt-5 bg-black/80 rounded-xl p-3 font-mono text-xs">
                <p className="text-emerald-500 mb-2 text-[10px] uppercase tracking-widest">Terminal Log</p>
                <AnimatePresence initial={false}>
                  {tapLog.map(log => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`mb-1 ${log.type === "success" ? "text-emerald-400" : "text-emerald-600"}`}
                    >
                      <span className="text-emerald-900 mr-2">{log.ts}</span>
                      {log.msg}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {simulating && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-emerald-500">processing...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Profile view */}
          <div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Shop View</p>
            <AnimatePresence mode="wait">
              {!selectedProfile && !simulating ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-2 border-dashed border-border rounded-2xl h-64 flex flex-col items-center justify-center text-center px-6"
                >
                  <Wifi className="w-10 h-10 text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground">Tap a profile to simulate NFC scan</p>
                </motion.div>
              ) : simulating ? (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-2 border-emerald-500/30 rounded-2xl h-64 flex flex-col items-center justify-center"
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full border-4 border-emerald-400/40 flex items-center justify-center">
                        <Wifi className="w-5 h-5 text-emerald-500 animate-pulse" />
                      </div>
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-500 animate-ping opacity-20" />
                  </div>
                  <p className="text-emerald-600 text-sm font-mono mt-4">Scanning NFC...</p>
                </motion.div>
              ) : selectedProfile ? (
                <motion.div
                  key={selectedProfile.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <CustomerProfileView profile={selectedProfile} compact />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}