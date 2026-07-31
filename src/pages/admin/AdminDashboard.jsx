import AdminLayout from "../../components/admin/layout/AdminLayout";
import DashboardHero from "../../components/admin/dashboard/DashboardHero";
import MissionCard from "../../components/admin/dashboard/MissionCard";
import KPIGrid from "../../components/admin/dashboard/KPIGrid";
import ActionCentre from "../../components/admin/dashboard/ActionCentre";

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <DashboardHero />
        <MissionCard />
        <KPIGrid />
        <ActionCentre />
    </AdminLayout>
  );
}


