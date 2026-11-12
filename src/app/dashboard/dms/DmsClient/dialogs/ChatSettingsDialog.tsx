"use client";

import { cn } from "@/lib/utils";
import { isSnoozed, updateChatSettings, useChatSettings, type FontSize } from "@/lib/chat-settings";
import { useNotificationPermission } from "../hooks/useNotificationPermission";
import Modal from "../ui/Modal";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

interface SwitchRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function SwitchRow({ label, description, checked, onChange }: SwitchRowProps) {
  return (
    <div className="flex items-start gap-4 py-3 cursor-pointer" onClick={() => onChange(!checked)}>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium text-foreground">{label}</div>
        {description && <p className="mt-0.5 text-[12px] leading-snug text-muted">{description}</p>}
      </div>
      <div className="mt-0.5">
        <ToggleSwitch enabled={checked} />
      </div>
    </div>
  );
}

interface SegmentedProps<T extends string | number> {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
}

function Segmented<T extends string | number>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex gap-1 rounded-xl border border-border bg-surface p-1">
      {options.map((option) => (
        <button
          key={String(option.id)}
          type="button"
          aria-pressed={option.id === value}
          onClick={() => onChange(option.id)}
          className={cn(
            "flex-1 rounded-lg py-1.5 text-[12px] font-medium transition-colors",
            option.id === value ? "bg-background text-foreground shadow-sm" : "text-muted hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

const SNOOZE_HOURS: { id: number; label: string }[] = [
  { id: 0, label: "Off" },
  { id: 1, label: "1 hour" },
  { id: 8, label: "8 hours" },
  { id: 24, label: "24 hours" },
];

const FONT_SIZES: { id: FontSize; label: string }[] = [
  { id: "small", label: "Small" },
  { id: "medium", label: "Medium" },
  { id: "large", label: "Large" },
];

/** Chat preferences. Stored in this browser only. */
export default function ChatSettingsDialog({ onClose }: { onClose: () => void }) {
  const settings = useChatSettings();
  const { permission, request: requestPermission } = useNotificationPermission();

  const snoozed = isSnoozed(settings);

  return (
    <Modal title="Chat settings" description="These apply to this browser." onClose={onClose}>
      <div className="divide-y divide-border px-6">
        <section className="py-2">
          <h3 className="pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Global Chat</h3>
          <SwitchRow
            label="Show Global Chat"
            description="Turn it off to hide Global Chat from the sidebar. Your DMs and group chats are not affected."
            checked={settings.globalChat}
            onChange={(globalChat) => updateChatSettings({ globalChat })}
          />
        </section>

        <section className="py-2">
          <h3 className="pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Notifications</h3>
          <SwitchRow
            label="Message sounds"
            description="A short chime for messages in chats you don't have open."
            checked={settings.sounds}
            onChange={(sounds) => updateChatSettings({ sounds })}
          />
          <div className="py-3">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <span className="text-[14px] font-medium text-foreground">Snooze notifications</span>
              {snoozed && (
                <span className="text-[12px] text-muted">
                  until {new Date(settings.snoozeUntil).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </span>
              )}
            </div>
            <Segmented
              label="Snooze notifications"
              value={snoozed ? -1 : 0}
              options={SNOOZE_HOURS}
              onChange={(hours) => updateChatSettings({ snoozeUntil: hours === 0 ? 0 : Date.now() + hours * 3_600_000 })}
            />
            <p className="mt-1.5 text-[12px] text-muted">Mutes message sounds and desktop notifications. Calls still ring.</p>
          </div>
          <div className="flex items-start gap-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-medium text-foreground">Desktop notifications</div>
              <p className="mt-0.5 text-[12px] leading-snug text-muted">
                {permission === "granted" && "On. You'll be notified about messages and calls while this tab is in the background."}
                {permission === "default" && "Get notified about calls and messages while this tab is in the background."}
                {permission === "denied" && "Blocked in your browser. Allow notifications for this site in the browser's site settings to turn them on."}
                {permission === "unsupported" && "Your browser doesn't support desktop notifications."}
              </p>
            </div>
            {permission === "default" && (
              <button
                type="button"
                onClick={() => void requestPermission()}
                className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-[12px] font-semibold text-background transition-opacity hover:opacity-90"
              >
                Enable
              </button>
            )}
          </div>
        </section>

        <section className="py-2">
          <h3 className="pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Typing</h3>
          <SwitchRow
            label="Enter sends the message"
            description="Turn off to send with Ctrl+Enter and use Enter for a new line."
            checked={settings.enterToSend}
            onChange={(enterToSend) => updateChatSettings({ enterToSend })}
          />
          <div className="py-3">
            <div className="mb-2 text-[14px] font-medium text-foreground">Message text size</div>
            <Segmented
              label="Message text size"
              value={settings.fontSize}
              options={FONT_SIZES}
              onChange={(fontSize) => updateChatSettings({ fontSize })}
            />
          </div>
        </section>
      </div>
    </Modal>
  );
}
