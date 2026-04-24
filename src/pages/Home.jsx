import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Coffee, Wifi } from "lucide-react";

export default function Home() {
  const [hovered, setHovered] = useState(null);

  const roles = [
    {
      id: "consumer",
      icon: Coffee,
      label: "I'm a Coffee Lover",
      sub: "Manage your profile & preferences",
      href: "/consumer",
      color: "from-amber-800 to-amber-600",
      textColor: "text-amber-50",
      bg: "bg-amber-900/10 hover:bg-amber-900/20",
      border: "border-amber-200 hover:border-amber-400",
    },
    {
      id: "shop",
      icon: Wifi,
      label: "I'm a Coffee Shop",
      sub: "Scan customers & log orders",
      href: "/shop",
      color: "from-stone-800 to-stone-600",
      textColor: "text-stone-50",
      bg: "bg-stone-900/10 hover:bg-stone-900/20",
      border: "border-stone-300 hover:border-stone-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-800 to-amber-500 flex items-center justify-center shadow-lg">
            <Coffee className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-playfair text-4xl font-bold text-foreground tracking-tight">
            TapCup
          </h1>
        </div>
        <p className="text-muted-foreground text-sm tracking-wide uppercase font-medium">
          Tap. Sip. Repeat.
        </p>
      </motion.div>

      {/* Role cards */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        {roles.map((role, i) => {
          const Icon = role.icon;
          return (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 * i + 0.2, duration: 0.4 }}
            >
              <Link to={role.href}>
                <div
                  className={`
                    relative flex items-center gap-4 px-5 py-4 rounded-2xl border-2 cursor-pointer
                    transition-all duration-200 ${role.bg} ${role.border}
                  `}
                  onMouseEnter={() => setHovered(role.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center shadow-md flex-shrink-0`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-base leading-tight">
                      {role.label}
                    </p>
                    <p className="text-muted-foreground text-sm mt-0.5">{role.sub}</p>
                  </div>
                  <motion.div
                    animate={{ x: hovered === role.id ? 4 : 0 }}
                    className="text-muted-foreground"
                  >
                    →
                  </motion.div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-10 text-xs text-muted-foreground/60 text-center"
      >
        NFC-powered coffee ordering
      </motion.p>
    </div>
  );
}