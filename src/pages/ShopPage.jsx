import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Wifi } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CustomerProfileView from "@/components/shop/CustomerProfileView";

export default function ShopPage() {
  const [nfcInput, setNfcInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState("");

  async function searchCustomer(id) {
    const query = id || nfcInput.trim();
    if (!query) return;
    setSearching(true);
    setError("");
    setCustomer(null);
    const results = await base44.entities.CoffeeProfile.filter({ nfc_id: query });
    if (results.length === 0) {
      setError("No customer found with that NFC ID");
    } else {
      setCustomer(results[0]);
    }
    setSearching(false);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Wifi className="w-5 h-5 text-primary" />
          <span className="font-semibold">Coffee Shop</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-8 pb-24">
        <AnimatePresence mode="wait">
          {!customer ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-center mb-10">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-800 to-amber-500 flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <Wifi className="w-9 h-9 text-white" />
                </div>
                <h2 className="font-playfair text-2xl font-bold mb-1">Scan Customer</h2>
                <p className="text-muted-foreground text-sm">Enter or scan the NFC ID</p>
              </div>

              <div className="flex gap-2">
                <Input
                  value={nfcInput}
                  onChange={e => setNfcInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && searchCustomer()}
                  placeholder="NFC ID (e.g. NFC-ABC123)"
                  className="h-12 rounded-xl text-base font-mono"
                />
                <Button
                  onClick={() => searchCustomer()}
                  disabled={searching}
                  className="h-12 px-5 rounded-xl bg-primary text-primary-foreground"
                >
                  {searching ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-destructive text-sm mt-3 text-center"
                >
                  {error}
                </motion.p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <button
                onClick={() => { setCustomer(null); setNfcInput(""); }}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Search again
              </button>
              <CustomerProfileView profile={customer} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}