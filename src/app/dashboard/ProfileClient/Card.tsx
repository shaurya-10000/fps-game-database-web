import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardProps {
  title: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export default function Card({ title, icon: Icon, action, className, children }: CardProps) {
  return (
    <section className={cn("rounded-2xl border border-border bg-surface p-5 sm:p-6", className)}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Icon size={16} />
            </span>
          )}
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">{title}</h3>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}