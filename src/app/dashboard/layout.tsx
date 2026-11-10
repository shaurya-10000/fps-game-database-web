import DashboardCallLayer from "./DashboardCallLayer";

export const metadata = {
  title: "Dashboard",
};

export const instant = false;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardCallLayer>{children}</DashboardCallLayer>;
}