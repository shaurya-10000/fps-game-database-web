import { ChatAvatar } from "@/app/dashboard/chat/chat-shared";
import { cn } from "@/lib/utils";

interface PersonRowProps {
  name: string;
  subtitle?: React.ReactNode;
  online?: boolean;
  /** Buttons on the right. */
  children?: React.ReactNode;
}

/** A person with an avatar, name, optional status line and actions. Used by requests, search results and blocks. */
export default function PersonRow({ name, subtitle, online = false, children }: PersonRowProps) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-3 sm:px-4">
      <span className="relative shrink-0">
        <ChatAvatar name={name} size={44} />
        {online && (
          <span aria-label="Online" className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-surface bg-emerald-500" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-foreground">{name}</p>
        {subtitle && <p className={cn("truncate text-[12px] text-muted")}>{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">{children}</div>
    </li>
  );
}

export const PRIMARY_BUTTON =
  "rounded-lg bg-accent px-3 py-1.5 text-[12px] font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50";
export const SECONDARY_BUTTON =
  "rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] font-semibold text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-50";