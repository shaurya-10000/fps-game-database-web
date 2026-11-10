import DashboardShell from "../DashboardShell/DashboardShell";
import DmsClient from "./DmsClient";

export const instant = false;

export default function DmsPage() {
  return (
    <DashboardShell>
      <DmsClient />
    </DashboardShell>
  );
}