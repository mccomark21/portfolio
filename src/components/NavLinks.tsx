"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
}

interface Props {
  items: NavItem[];
}

export default function NavLinks({ items }: Props) {
  const pathname = usePathname();

  return (
    <>
      {items.map(({ href, label }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`nav-link text-sm pb-0.5 ${
              isActive ? "border-[var(--color-link-accent)]" : ""
            }`}
          >
            {label}
          </Link>
        );
      })}
    </>
  );
}
