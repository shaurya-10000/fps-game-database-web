import DashboardShell from "../DashboardShell/DashboardShell";
import GlobalChatClient from "./GlobalChatClient";

export default function GlobalChatPage() {
  return (
    <DashboardShell>
      <GlobalChatClient />
    </DashboardShell>
  );
}