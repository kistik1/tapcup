import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Menu, Search, ShoppingBasket } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const categories = [
  {
    title: "Monogram",
    image:
      "https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=1200&auto=format&fit=crop",
    href: "#monogram",
  },
  {
    title: "Leather",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop",
    href: "#leather",
  },
  {
    title: "Acrylic",
    image:
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1200&auto=format&fit=crop",
    href: "#acrylic",
  },
  {
    title: "Gift Sets",
    image:
      "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=1200&auto=format&fit=crop",
    href: "#gift-sets",
  },
];

const navigation = [
  { name: "Home", href: "/" },
  { name: "Shop", href: "#collection" },
  { name: "Collections", href: "#collection" },
  { name: "Story", href: "#story" },
];

export default function KeychainLandingPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(224,163,81,0.18),_transparent_35%),linear-gradient(180deg,_rgba(255,247,237,0.9),_transparent_50%)]" />

      <div className="relative container mx-auto min-h-screen max-w-7xl px-2">
        <div className="relative mt-6 rounded-2xl bg-accent/35">
          <header className="flex items-center">
            <div className="flex w-full items-center gap-2 rounded-br-2xl bg-background/95 p-4 backdrop-blur-sm md:w-2/3 lg:w-1/2">
              <Link
                to="/"
                className="text-xl font-semibold text-transparent bg-gradient-to-r from-primary to-primary/80 bg-clip-text"
              >
                Latch&Loop_
              </Link>

              <nav className="hidden w-full items-center justify-between lg:flex">
                {navigation.map((item) => (
                  <a key={item.name} href={item.href}>
                    <Button
                      variant="link"
                      className="group relative cursor-pointer transition-colors hover:text-primary"
                    >
                      {item.name}
                    </Button>
                  </a>
                ))}
                <Button
                  variant="ghost"
                  size="icon"
                  className="group relative cursor-pointer transition-colors hover:text-primary"
                >
                  <Search className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="group relative cursor-pointer transition-colors hover:text-primary"
                >
                  <ShoppingBasket className="h-5 w-5" />
                </Button>
              </nav>

              <Sheet>
                <SheetTrigger asChild className="ml-auto lg:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="transition-colors hover:text-primary"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[300px] border-r border-border/50 bg-background/95 p-0 backdrop-blur-md sm:w-[400px]"
                >
                  <SheetHeader className="border-b border-border/50 p-6 text-left">
                    <SheetTitle className="flex items-center justify-between">
                      <a
                        href="/keychains"
                        className="text-xl font-semibold text-transparent bg-gradient-to-r from-primary to-primary/80 bg-clip-text"
                      >
                        Latch&Loop_
                      </a>
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col space-y-1 p-6">
                    {navigation.map((item) => (
                      <a key={item.name} href={item.href}>
                        <Button
                          variant="ghost"
                          className="h-12 justify-start px-2 text-base font-medium transition-colors hover:bg-accent/50 hover:text-primary"
                        >
                          {item.name}
                        </Button>
                      </a>
                    ))}
                  </nav>
                  <Separator className="mx-6" />
                  <div className="flex flex-col gap-4 p-6">
                    <Button
                      variant="outline"
                      className="h-12 justify-start gap-2 transition-colors hover:bg-accent/50"
                    >
                      <Search className="h-4 w-4" />
                      Search
                    </Button>
                    <Button
                      variant="outline"
                      className="relative h-12 justify-start gap-2 transition-colors hover:bg-accent/50"
                    >
                      <ShoppingBasket className="h-4 w-4" />
                      Cart
                      <span className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        3
                      </span>
                    </Button>
                  </div>
                  <Separator className="mx-6" />
                  <div className="p-6">
                    <Button className="h-12 w-full bg-gradient-to-r from-primary to-primary/80 shadow-lg transition-all duration-300 hover:from-primary/90 hover:to-primary/70 hover:shadow-xl">
                      Start Designing
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="ml-auto hidden w-1/2 items-center justify-end gap-4 pr-4 md:flex">
              <Button
                variant="secondary"
                className="group cursor-pointer rounded-full bg-primary-foreground p-0 shadow-lg transition-all duration-300 hover:shadow-xl"
              >
                <span className="pl-4 py-2 text-sm font-medium">Build Your Set</span>
                <div className="ml-2 flex h-10 w-10 items-center justify-center rounded-full bg-background transition-transform duration-300 group-hover:scale-110">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </Button>
            </div>
          </header>

          <motion.section
            className="w-full px-4 py-24"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="mx-auto text-center">
              <motion.h1
                className="mb-6 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-7xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              >
                <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                  Curate your keychains
                </span>
                <br />
                <span className="text-foreground">into signature collections.</span>
              </motion.h1>
              <motion.p
                className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              >
                Personalize brass tags, leather loops, and crystal acrylic drops with a
                storefront shaped like a premium product catalog.
              </motion.p>
            </div>
          </motion.section>
        </div>

        <div
          id="collection"
          className="mx-auto mt-12 grid max-w-7xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {categories.map((category, index) => (
            <motion.div
              key={category.title}
              className="group relative min-h-[250px] w-full overflow-hidden rounded-3xl bg-muted/50 p-4 backdrop-blur-sm transition-all duration-500 sm:min-h-[300px] sm:p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
            >
              <a href={category.href} className="absolute inset-0 z-20">
                <h2 className="relative z-10 my-2 text-center text-2xl font-bold text-primary transition-colors duration-300 group-hover:text-primary/90 sm:my-4 sm:text-3xl md:text-4xl lg:text-[clamp(1.5rem,4vw,2.5rem)]">
                  {category.title}
                </h2>
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <img
                    src={category.image}
                    alt={category.title}
                    className={cn(
                      "h-auto w-full object-contain opacity-90 transition-all duration-500 group-hover:scale-110 group-hover:opacity-100",
                      "max-w-[min(40vw,200px)] sm:max-w-[min(30vw,180px)] md:max-w-[min(25vw,160px)] lg:max-w-[min(20vw,140px)]"
                    )}
                  />
                </div>
                <div className="absolute bottom-0 right-0 z-10 flex h-16 w-16 items-center justify-center rounded-tl-xl border-l border-t border-border/50 bg-background/95 backdrop-blur-sm md:h-20 md:w-20">
                  <div className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-secondary shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground md:bottom-3 md:right-3 md:h-12 md:w-12">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                </div>
              </a>
            </motion.div>
          ))}
        </div>

        <section id="story" className="mx-auto mt-12 grid max-w-7xl gap-6 pb-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
              Crafted for gifting
            </p>
            <h3 className="mt-4 font-playfair text-3xl font-bold text-foreground">
              Boutique details, sold like a premium drop.
            </h3>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
              This version follows the Magic 21st commerce-hero pattern directly: a split
              header, animated hero statement, and a four-card merchandising grid. The
              difference is the brand and catalog focus are now fully keychain-specific.
            </p>
          </div>

          <div className="rounded-3xl bg-primary p-6 text-primary-foreground shadow-lg">
            <p className="text-xs uppercase tracking-[0.28em] text-primary-foreground/70">
              Fast bundle
            </p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-4xl font-semibold">$52</p>
                <p className="mt-1 text-sm text-primary-foreground/80">
                  Three personalized pieces with gift packaging
                </p>
              </div>
              <ShoppingBasket className="h-8 w-8" />
            </div>
            <Button
              variant="secondary"
              className="mt-6 rounded-full bg-background text-foreground hover:bg-background/90"
            >
              Reserve Your Set
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
