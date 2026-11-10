"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { ArrowRight, LayoutDashboard, LogIn, UserPlus } from "lucide-react";
import { getToken, isTokenValid } from "@/lib/auth";

type Stats = {
  weapons: number;
  characters: number;
  maps: number;
  modes: number;
  throwables: number;
  equipment: number;
};

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function Hero({ stats }: { stats: Stats }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  useEffect(() => {
    const checkAuth = () => {
      const token = getToken();
      setIsLoggedIn(isTokenValid(token));
    };

    checkAuth();
    window.addEventListener("fps-auth-changed", checkAuth);
    return () => window.removeEventListener("fps-auth-changed", checkAuth);
  }, []);

  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden pt-20 pb-32">
      
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="absolute top-1/3 left-1/4 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-accent/15 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] translate-y-1/3 rounded-full bg-fuchsia-500/10 blur-[100px] mix-blend-screen" />
        <div 
          className="absolute inset-0 opacity-[0.04]" 
          style={{
            backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            maskImage: "radial-gradient(ellipse at center, black 10%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 10%, transparent 70%)"
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-5 text-center sm:px-8">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-zinc-300 backdrop-blur-md"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex size-2 rounded-full bg-accent"></span>
          </span>
          The Ultimate FPS Database
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="font-heading text-6xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-7xl md:text-8xl lg:text-[110px]"
        >
          Master the <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-blue-400 to-fuchsia-500">
            meta.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="mt-8 max-w-2xl text-[16px] leading-relaxed text-zinc-400 sm:text-[18px]"
        >
          The complete competitive FPS reference. Master every ballistics profile, counter every map, and track your live Elo progression in one place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          className="mt-12 flex h-[120px] w-full flex-col items-center justify-center gap-4 sm:h-auto sm:flex-row"
        >
          {!mounted ? (
            <div className="h-14 w-full sm:w-[180px] rounded-2xl bg-white/5 animate-pulse" />
          ) : isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                className="group flex h-14 w-full sm:w-auto min-w-[200px] items-center justify-center rounded-2xl bg-white px-8 text-[15px] font-bold text-black transition-all hover:scale-105 hover:bg-zinc-200 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              >
                <LayoutDashboard className="mr-2 size-5" />
                Go to Dashboard
              </Link>
              <Link
                href="/weapons"
                className="group flex h-14 w-full sm:w-auto min-w-[200px] items-center justify-center rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md px-8 text-[15px] font-bold text-white transition-all hover:bg-white/10"
              >
                Browse Database
                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard/login"
                className="group flex h-14 w-full sm:w-auto min-w-[200px] items-center justify-center rounded-2xl bg-white px-8 text-[15px] font-bold text-black transition-all hover:scale-105 hover:bg-zinc-200 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              >
                <LogIn className="mr-2 size-5" />
                Sign In
              </Link>
              <Link
                href="/dashboard/login"
                className="group flex h-14 w-full sm:w-auto min-w-[200px] items-center justify-center rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md px-8 text-[15px] font-bold text-white transition-all hover:bg-white/10"
              >
                <UserPlus className="mr-2 size-5" />
                Create Account
              </Link>
            </>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 border-t border-white/10 pt-8 w-full max-w-2xl text-center"
        >
          <div className="flex flex-col items-center">
            <span className="font-heading text-3xl font-black text-white">{stats.weapons}</span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Weapons</span>
          </div>
          <div className="hidden h-8 w-px bg-white/10 sm:block" />
          <div className="flex flex-col items-center">
            <span className="font-heading text-3xl font-black text-white">{stats.characters}</span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Characters</span>
          </div>
          <div className="hidden h-8 w-px bg-white/10 sm:block" />
          <div className="flex flex-col items-center">
            <span className="font-heading text-3xl font-black text-white">{stats.maps}</span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Maps</span>
          </div>
          <div className="hidden h-8 w-px bg-white/10 sm:block" />
          <div className="flex flex-col items-center">
            <span className="font-heading text-3xl font-black text-white">{stats.modes}</span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Modes</span>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
