import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Gift,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const products = [
  {
    name: "Orbit Brass",
    price: "$24",
    tone: "Brushed brass",
    copy: "Warm metallic finish with a deep-etched monogram plate for daily carry.",
    accent: "from-amber-300 via-yellow-200 to-stone-100",
  },
  {
    name: "Signal Acrylic",
    price: "$18",
    tone: "Smoked crystal",
    copy: "Layered translucent body with precise edge polish and color-filled engraving.",
    accent: "from-cyan-300 via-sky-200 to-white",
  },
  {
    name: "Afterglow Leather",
    price: "$29",
    tone: "Vegetable-tanned",
    copy: "Soft pull-up leather loop with contrast stitching and engraved steel clasp.",
    accent: "from-orange-300 via-rose-200 to-stone-100",
  },
];

const highlights = [
  "Hand-finished in small weekly batches",
  "Gift-ready packaging included",
  "Fast personalization preview in 24 hours",
];

const stats = [
  { label: "Repeat buyers", value: "62%" },
  { label: "Avg. production", value: "3 days" },
  { label: "5-star reviews", value: "1.2k" },
];

export default function KeychainLandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,211,153,0.28),_transparent_34%),linear-gradient(180deg,_hsl(var(--background)),_#fff7ed_44%,_hsl(var(--background)))] text-foreground">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-16 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,_hsl(var(--primary)),_hsl(var(--accent)))] shadow-[0_18px_40px_rgba(120,72,22,0.25)]">
              <Tag className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-playfair text-2xl font-bold tracking-tight">Latch & Loop</p>
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                Custom Keychains
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <a href="#collection" className="text-sm text-muted-foreground transition hover:text-foreground">
              Collection
            </a>
            <a href="#craft" className="text-sm text-muted-foreground transition hover:text-foreground">
              Craft
            </a>
            <a href="#reviews" className="text-sm text-muted-foreground transition hover:text-foreground">
              Reviews
            </a>
            <Button className="rounded-full px-5">Start Your Design</Button>
          </div>
        </header>

        <main className="flex-1">
          <section className="grid items-center gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-white/80 px-4 py-2 text-sm shadow-sm backdrop-blur">
                <Sparkles className="h-4 w-4 text-amber-700" />
                Personal stories, clipped to your pocket
              </div>

              <h1 className="mt-6 font-playfair text-5xl font-bold leading-none tracking-tight text-stone-950 sm:text-6xl lg:text-7xl">
                Keychains worth
                <span className="block text-primary">showing off.</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-stone-700">
                Boutique keychains for gifts, merch drops, and everyday carry. Pick your
                material, add initials or artwork, and ship a piece that feels more collectible
                than accessory.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button className="h-12 rounded-full px-6 text-sm">
                  Shop Signature Styles
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" className="h-12 rounded-full border-stone-300 bg-white/80 px-6 text-sm">
                  Bulk Orders & Events
                </Button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-3xl border border-white/70 bg-white/75 px-4 py-4 shadow-[0_20px_45px_rgba(120,72,22,0.08)] backdrop-blur"
                  >
                    <p className="text-2xl font-semibold text-stone-950">{stat.value}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative"
            >
              <div className="absolute -left-6 top-8 hidden h-24 w-24 rounded-full bg-amber-200/70 blur-2xl lg:block" />
              <div className="absolute -right-4 bottom-10 hidden h-28 w-28 rounded-full bg-orange-200/70 blur-2xl lg:block" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(160deg,_rgba(255,255,255,0.88),_rgba(255,244,230,0.96))] p-6 shadow-[0_35px_80px_rgba(120,72,22,0.16)]">
                <div className="grid gap-5 sm:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[1.75rem] bg-stone-950 p-5 text-stone-50">
                    <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Featured Drop</p>
                    <div className="mt-6 flex items-center justify-center rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,221,173,0.25),_transparent_40%),linear-gradient(180deg,_rgba(255,255,255,0.08),_rgba(255,255,255,0.02))] px-6 py-10">
                      <div className="relative flex h-56 w-40 items-center justify-center">
                        <div className="absolute top-4 h-16 w-16 rounded-full border-[10px] border-amber-300/80" />
                        <div className="absolute top-16 h-32 w-24 rounded-[1.8rem] bg-[linear-gradient(160deg,_#f5d39c,_#b7813f_60%,_#704214)] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_20px_30px_rgba(0,0,0,0.35)]" />
                        <div className="absolute top-[5.8rem] flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-black/20">
                          <Star className="h-6 w-6 text-amber-100" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between rounded-[1.75rem] bg-white/80 p-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Why It Converts</p>
                      <ul className="mt-5 space-y-4">
                        {highlights.map((item) => (
                          <li key={item} className="flex items-start gap-3 text-sm leading-6 text-stone-700">
                            <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                              <Check className="h-4 w-4" />
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 rounded-[1.5rem] border border-amber-100 bg-amber-50/80 p-4">
                      <p className="text-xs uppercase tracking-[0.26em] text-amber-800">Starter Bundle</p>
                      <div className="mt-3 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-3xl font-semibold text-stone-950">$52</p>
                          <p className="text-sm text-stone-600">3 personalized pieces</p>
                        </div>
                        <Gift className="h-7 w-7 text-amber-700" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          <section
            id="collection"
            className="mt-10 rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_25px_60px_rgba(120,72,22,0.08)] backdrop-blur sm:p-8"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Collection</p>
                <h2 className="mt-3 font-playfair text-3xl font-bold text-stone-950 sm:text-4xl">
                  Three hero styles. Endless initials.
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-stone-600">
                The live 21st-dev commerce hero suggested a premium assortment layout. I used that
                direction here, but tailored it to a smaller handcrafted product catalog.
              </p>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {products.map((product, index) => (
                <motion.article
                  key={product.name}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white"
                >
                  <div className={`flex h-56 items-center justify-center bg-gradient-to-br ${product.accent}`}>
                    <div className="relative flex h-36 w-28 items-center justify-center">
                      <div className="absolute top-1 h-11 w-11 rounded-full border-[8px] border-stone-900/70" />
                      <div className="absolute top-10 h-24 w-16 rounded-[1.25rem] bg-white/80 shadow-[0_18px_35px_rgba(0,0,0,0.18)]" />
                      <div className="absolute top-[3.65rem] rounded-full bg-stone-900 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-stone-100">
                        Loop
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-stone-950">{product.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{product.tone}</p>
                      </div>
                      <p className="text-lg font-semibold text-primary">{product.price}</p>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-stone-600">{product.copy}</p>
                    <Button variant="outline" className="mt-5 w-full rounded-full border-stone-300 bg-transparent">
                      Customize This Piece
                    </Button>
                  </div>
                </motion.article>
              ))}
            </div>
          </section>

          <section id="craft" className="grid gap-6 py-12 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[2rem] bg-stone-950 p-8 text-stone-50 shadow-[0_30px_65px_rgba(28,25,23,0.26)]">
              <p className="text-sm uppercase tracking-[0.3em] text-stone-400">Craft Promise</p>
              <h2 className="mt-4 font-playfair text-3xl font-bold sm:text-4xl">
                Small accessories, luxury-level finish.
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-stone-300">
                Every order is reviewed by a human before engraving. That keeps lettering crisp,
                spacing balanced, and bulk runs consistent.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  "Laser-cut prototypes before final batch production",
                  "Scratch-resistant coating on acrylic and brass finishes",
                  "Backed by a 30-day remake guarantee",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/5 p-4">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-amber-300" />
                    <p className="text-sm leading-6 text-stone-200">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div
              id="reviews"
              className="rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.82),_rgba(255,248,240,0.94))] p-8 shadow-[0_25px_60px_rgba(120,72,22,0.08)]"
            >
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Social Proof</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {[
                  {
                    quote:
                      "Our event merch went from filler item to best-seller. The finish felt premium right out of the box.",
                    author: "Maya, studio founder",
                  },
                  {
                    quote:
                      "The acrylic version caught light beautifully in product photos and the customization turnaround was fast.",
                    author: "Noah, marketplace seller",
                  },
                ].map((review) => (
                  <div key={review.author} className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
                    <div className="flex gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-7 text-stone-700">“{review.quote}”</p>
                    <p className="mt-4 text-sm font-medium text-stone-950">{review.author}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-4 rounded-[1.5rem] border border-dashed border-amber-300 bg-amber-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-stone-950">Ready to launch a keychain drop?</p>
                  <p className="mt-1 text-sm text-stone-600">
                    Start with one piece or brief us for 500-unit branded runs.
                  </p>
                </div>
                <Button className="rounded-full px-6">Request a Sample Pack</Button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
