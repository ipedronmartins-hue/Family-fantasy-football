"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav({ teamSlug }: { teamSlug: string }) {
  const pathname = usePathname();
  const base = `/${teamSlug}`;

  const TABS = [
    { href: base, label: "Início", icon: "🏠" },
    { href: `${base}/equipa`, label: "Equipa", icon: "⚽" },
    { href: `${base}/prever`, label: "Prever", icon: "🎯" },
    { href: `${base}/classificacao`, label: "Ranking", icon: "🏆" },
    { href: `${base}/jogos`, label: "Jogos", icon: "📅" },
  ] as const;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-white">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {TABS.map((tab) => {
          const active = tab.href === base ? pathname === base : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                active ? "text-blue" : "text-ink/50"
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
