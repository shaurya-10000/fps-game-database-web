import { Inbox, Send } from "lucide-react";
import EmptyState from "@/app/dashboard/dms/DmsClient/ui/EmptyState";
import { timeAgo } from "./format";
import PersonRow, { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./PersonRow";
import type { RequestRow } from "./types";

interface RequestsPanelProps {
  incoming: RequestRow[];
  outgoing: RequestRow[];
  onAccept: (request: RequestRow) => void;
  onDecline: (request: RequestRow) => void;
  onCancel: (request: RequestRow) => void;
}

export default function RequestsPanel({ incoming, outgoing, onAccept, onDecline, onCancel }: RequestsPanelProps) {
  if (incoming.length === 0 && outgoing.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No pending requests"
        description="Requests you send and receive show up here, so you can accept, decline or cancel them."
      />
    );
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="incoming-heading">
        <h3 id="incoming-heading" className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Received - {incoming.length}
        </h3>
        {incoming.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-[13px] text-muted">
            No requests waiting for you.
          </p>
        ) : (
          <ul className="space-y-2">
            {incoming.map((request) => (
              <PersonRow key={request.rowId} name={request.name} avatarUrl={request.avatarUrl} subtitle={request.at ? `Sent you a request ${timeAgo(request.at)}` : "Sent you a request"}>
                <button type="button" onClick={() => onAccept(request)} className={PRIMARY_BUTTON}>
                  Accept
                </button>
                <button type="button" onClick={() => onDecline(request)} className={SECONDARY_BUTTON}>
                  Decline
                </button>
              </PersonRow>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="outgoing-heading">
        <h3 id="outgoing-heading" className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          <Send size={12} /> Sent - {outgoing.length}
        </h3>
        {outgoing.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-[13px] text-muted">
            You haven&apos;t sent any requests.
          </p>
        ) : (
          <ul className="space-y-2">
            {outgoing.map((request) => (
              <PersonRow key={request.rowId} name={request.name} avatarUrl={request.avatarUrl} subtitle={request.at ? `Waiting since ${timeAgo(request.at)}` : "Waiting for a reply"}>
                <button type="button" onClick={() => onCancel(request)} className={SECONDARY_BUTTON}>
                  Cancel
                </button>
              </PersonRow>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
