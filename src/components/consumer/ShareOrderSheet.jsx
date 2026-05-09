import { lazy, Suspense } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Copy, Share2 } from "lucide-react";
import CoffeeCupSvg from "./CoffeeCupSvg";
import { buildCanonicalChipUrl } from "@/lib/personal-id";

// Lazy-load QR code to keep initial bundle lean
const QRCode = lazy(() => import("react-qr-code").then(m => ({ default: m.default ?? m.QRCode ?? m })));

export default function ShareOrderSheet({ profile, preference, open, onClose }) {
  const shareUrl = buildCanonicalChipUrl(profile.nfc_id);

  const layers = {
    coffee: preference.coffee_pct || 0,
    water:  preference.water_pct  || 0,
    milk:   preference.milk_pct   || 0,
    foam:   preference.foam_pct   || 0,
  };

  const details = [
    preference.milk && preference.milk !== "None" && preference.milk,
    preference.sugar && preference.sugar !== "None" && `${preference.sugar} sugar`,
    preference.temperature,
  ].filter(Boolean);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement("textarea");
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({
        title: `My TapCup order — ${preference.name}`,
        url:   shareUrl,
      });
    } else {
      await handleCopy();
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-10">
        <SheetHeader className="text-left mb-6">
          <SheetTitle>Share My Order</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col items-center gap-6">
          {/* Cup preview */}
          <CoffeeCupSvg
            layers={layers}
            vessel={preference.vessel || "mug"}
            size={preference.size || "large"}
            temp={preference.temperature}
            width={140}
            showLabels={true}
            clipId="cup-share-sheet"
          />

          {/* Preference summary */}
          <div className="text-center">
            <p className="font-bold text-lg">{preference.name}</p>
            {preference.coffee_type && (
              <p className="text-sm text-muted-foreground">{preference.coffee_type}</p>
            )}
            <div className="flex flex-wrap justify-center gap-1.5 mt-2">
              {details.map((d, i) => (
                <span key={i} className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full">
                  {d}
                </span>
              ))}
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-white rounded-2xl p-4 border border-border">
            <Suspense fallback={<div className="w-32 h-32 bg-muted rounded-xl animate-pulse" />}>
              <QRCode value={shareUrl} size={128} />
            </Suspense>
          </div>

          {/* URL display */}
          <p className="text-[11px] font-mono text-muted-foreground text-center break-all max-w-xs">
            {shareUrl}
          </p>

          {/* Actions */}
          <div className="flex gap-3 w-full">
            <Button onClick={handleCopy} variant="outline" className="flex-1 h-11 rounded-xl gap-2">
              <Copy className="w-4 h-4" /> Copy Link
            </Button>
            <Button onClick={handleShare} className="flex-1 h-11 rounded-xl gap-2">
              <Share2 className="w-4 h-4" /> Share
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
