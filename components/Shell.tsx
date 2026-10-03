"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  FileText,
  Gift,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { adminApi } from "../lib/api";

const links = [
  ["/dashboard", "Dashboard", LayoutDashboard],
  ["/applications", "Applications", FileText],
  ["/users", "Users", Users],
  ["/policies", "Policies", ShieldCheck],
  ["/rewards", "Rewards", Gift],
  ["/banners", "Banners", ImageIcon],
  ["/activity", "Activity", Activity],
] as const;

export default function Shell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  const path = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) {
      router.replace("/login");
      return;
    }

    adminApi
      .me()
      .then(() => setReady(true))
      .catch(() => router.replace("/login"));
  }, [router]);

  if (!ready) {
    return (
      <div className="loading">
        Loading admin panel...
      </div>
    );
  }

  function logout() {
    localStorage.clear();
    router.replace("/login");
  }

  return (
    <div className="admin">
      <aside className={`side ${open ? "open" : ""}`}>
        <div className="brand">
          <b>Vinsure</b>
          <small>Admin</small>
        </div>

        <nav className="nav">
          {links.map(
            ([href, label, Icon]) => (
              <Link
                key={href}
                href={href}
                className={
                  path === href ||
                  path.startsWith(href + "/")
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setOpen(false)
                }
              >
                <Icon size={18} />
                {label}
              </Link>
            )
          )}
        </nav>

        <button
          className="logout"
          onClick={logout}
        >
          <LogOut size={15} />
          Logout
        </button>
      </aside>

      {open && (
        <div
          className="drawer"
          onClick={() => setOpen(false)}
        />
      )}

      <main className="main">
        <header className="top">
          <button
            className="menu"
            onClick={() => setOpen(true)}
          >
            <Menu size={23} />
          </button>

          <span
            style={{
              marginLeft: "auto",
              color: "#667085",
              fontSize: 13,
            }}
          >
            Admin Panel
          </span>
        </header>

        {children}
      </main>
    </div>
  );
}