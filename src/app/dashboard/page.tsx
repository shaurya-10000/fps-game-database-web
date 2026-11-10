import DashboardShell from "./DashboardShell/DashboardShell";
import ProfileClient from "./ProfileClient";

export const instant = false;

export default function DashboardPage() {
  return (
    <DashboardShell>
      <ProfileClient />
    </DashboardShell>
  );
}
