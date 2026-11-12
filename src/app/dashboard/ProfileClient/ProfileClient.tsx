"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, BarChart3, LayoutDashboard, Settings } from "lucide-react";
import ChatSettingsDialog from "@/app/dashboard/dms/DmsClient/dialogs/ChatSettingsDialog";
import EditProfileDialog from "./EditProfileDialog";
import OverviewTab from "./OverviewTab";
import ProfileHero from "./ProfileHero";
import ProfileSkeleton from "./ProfileSkeleton";
import SettingsTab from "./SettingsTab";
import StatsTab from "./StatsTab";
import Tabs, { type TabDef } from "./Tabs";
import { useProfile } from "./useProfile";

type TabId = "overview" | "stats" | "settings";

const TABS: TabDef<TabId>[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "stats", label: "Stats", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function ProfileClient() {
  const profile = useProfile();
  const reduceMotion = useReducedMotion();
  const [tab, setTab] = useState<TabId>("overview");
  const [dialog, setDialog] = useState<"edit" | "chat" | null>(null);

  if (profile.loading) return <ProfileSkeleton />;

  return (
    <div className="w-full space-y-6">
      <h1 className="sr-only">Your profile</h1>

      {profile.failed && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-600 dark:text-amber-400"
        >
          <span className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            Couldn&apos;t reach the server. Some details may be missing.
          </span>
          <button
            type="button"
            onClick={profile.reload}
            className="rounded-lg border border-amber-500/40 px-3 py-1 text-[12px] font-semibold transition-colors hover:bg-amber-500/10"
          >
            Retry
          </button>
        </div>
      )}

      <ProfileHero
        identity={profile.identity}
        progression={profile.progression}
        overview={profile.overview}
        onEdit={() => setDialog("edit")}
        onSettings={() => setDialog("chat")}
      />

      <Tabs tabs={TABS} value={tab} onChange={setTab} idPrefix="profile" />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          role="tabpanel"
          id={`profile-panel-${tab}`}
          aria-labelledby={`profile-tab-${tab}`}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.15 }}
        >
          {tab === "overview" && (
            <OverviewTab progression={profile.progression} overview={profile.overview} friendsCount={profile.friendsCount} />
          )}
          {tab === "stats" && <StatsTab overview={profile.overview} />}
          {tab === "settings" && (
            <SettingsTab identity={profile.identity} onEdit={() => setDialog("edit")} onChatSettings={() => setDialog("chat")} />
          )}
        </motion.div>
      </AnimatePresence>

      {dialog === "edit" && (
        <EditProfileDialog
          initial={{ displayName: profile.identity.displayName, username: profile.identity.username }}
          onSaved={profile.applyIdentity}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "chat" && <ChatSettingsDialog onClose={() => setDialog(null)} />}
    </div>
  );
}

