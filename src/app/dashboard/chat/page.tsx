import DashboardShell from "../DashboardShell/DashboardShell";
import GlobalChatClient from "./GlobalChatClient/GlobalChatClient";

export default function GlobalChatPage() {
  return (
    <DashboardShell>
      <GlobalChatClient />
    </DashboardShell>
  );
}
