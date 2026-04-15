"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Citrus, Menu, X, LayoutDashboard, FlaskConical, Home, BookOpen, MapPin, ShieldCheck, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "首页", href: "/", icon: Home },
  { name: "产区品种", href: "/origins", icon: MapPin },
  { name: "评级标准", href: "/grading", icon: ShieldCheck },
  { name: "政策资料", href: "/policy", icon: FileText },
  { name: "智能分析", href: "/analysis", icon: FlaskConical },
  { name: "数据看板", href: "/dashboard", icon: LayoutDashboard },
  { name: "技术原理", href: "/about", icon: BookOpen },
];


export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
        isScrolled
          ? "bg-white/80 backdrop-blur-md shadow-sm py-3"
          : "bg-transparent py-3"
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary text-white p-2 rounded-xl group-hover:scale-105 transition-transform">
              <Citrus size={24} />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">
              橙源<span className="text-primary">智鉴</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "relative px-3 py-2 rounded-full text-sm font-medium transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-foreground/70 hover:text-primary hover:bg-orange-50"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <item.icon size={16} />
                    {item.name}
                  </span>
                  {isActive && mounted && (
                    <motion.div
                      layoutId="navbar-active"
                      className="absolute inset-0 bg-orange-100 rounded-full -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t border-orange-100 py-4 px-4 flex flex-col gap-2"
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-orange-100 text-primary"
                    : "text-foreground/70 hover:bg-orange-50 hover:text-primary"
                )}
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </motion.div>
      )}
    </header>
  );
}
