import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, MapPin, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: CheckCircle2,
    title: "Purchase confirmed",
    description: "Your TapCup keychain is on its way. You'll receive a confirmation email shortly.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: MapPin,
    title: "Bring it to a TapCup shop",
    description: "Visit any participating TapCup location and ask a staff member to program your keychain chip.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: Smartphone,
    title: "Tap and enjoy",
    description: "Once programmed, tap your keychain at any TapCup shop to instantly share your coffee preferences.",
    color: "text-primary",
    bg: "bg-primary/5",
  },
];

const DEMO_SHOPS = [
  { name: "TapCup Roasters — Tel Aviv", address: "12 Rothschild Blvd, Tel Aviv", phone: "+972 3 000 0001" },
  { name: "TapCup Roasters — Jerusalem", address: "4 Jaffa St, Jerusalem", phone: "+972 2 000 0002" },
];

export default function KeychainOnboardingPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/keychains" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="font-semibold">Order Confirmed</span>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-10 pb-24 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-2">
          <div className="text-4xl mb-3">☕</div>
          <h1 className="text-2xl font-bold">Your keychain is on its way!</h1>
          <p className="text-muted-foreground text-sm">
            Follow these three steps to activate your TapCup keychain.
          </p>
          {sessionId && (
            <p className="text-[11px] text-muted-foreground font-mono mt-1">
              Order ref: {sessionId.slice(0, 20)}…
            </p>
          )}
        </div>

        {/* Steps */}
        <ol className="space-y-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={i} className={`flex gap-4 rounded-2xl p-4 ${step.bg}`}>
                <div className="shrink-0 mt-0.5">
                  <Icon className={`w-5 h-5 ${step.color}`} />
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    <span className="text-muted-foreground mr-1">{i + 1}.</span>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Find a shop */}
        <div>
          <h2 className="font-semibold text-sm mb-3">Participating shops</h2>
          <ul className="space-y-3">
            {DEMO_SHOPS.map((shop) => (
              <li key={shop.name} className="rounded-2xl border border-border bg-card p-4 space-y-1">
                <p className="font-medium text-sm">{shop.name}</p>
                <p className="text-xs text-muted-foreground">{shop.address}</p>
                <a href={`tel:${shop.phone}`} className="text-xs text-primary">{shop.phone}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="space-y-3 pt-2">
          <Link to="/consumer">
            <Button className="w-full h-12 rounded-2xl">Check my profile</Button>
          </Link>
          <Link to="/keychains" className="block text-center text-xs text-muted-foreground hover:text-foreground">
            Back to keychains
          </Link>
        </div>
      </div>
    </div>
  );
}
