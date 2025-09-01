import DashboardLayout from "@/components/layout/DashboardLayout";
import SidebarSuperAdmin from "@/components/SidebarSuperAdmin";

export default function LayoutForSuperAdmin({ children }) {
  return (
    // "Suntikkan" SidebarSuperAdmin ke dalam DashboardLayout
    <DashboardLayout SidebarComponent={SidebarSuperAdmin}>
      {children}
    </DashboardLayout>
  );
}
