import {
  useEffect,
  useState,
} from "react";

import AdminLayout from "../../components/admin/layout/AdminLayout";
import DashboardHero from "../../components/admin/dashboard/DashboardHero";
import MissionCard from "../../components/admin/dashboard/MissionCard";
import KPIGrid from "../../components/admin/dashboard/KPIGrid";
import ActionCentre from "../../components/admin/dashboard/ActionCentre";

import {
  fetchAdminDashboardData,
} from "../../services/adminDashboardService";

const EMPTY_STATS = {
  students: 0,
  verifiedRounds: 0,
  activeMemberships: 0,
  badgesAwarded: 0,
};

export default function AdminDashboard() {
  const [stats, setStats] =
    useState(EMPTY_STATS);

  const [tasks, setTasks] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        setIsLoading(true);
        setLoadError("");

        const data =
          await fetchAdminDashboardData();

        if (!isMounted) return;

        setStats(data.stats);
        setTasks(data.tasks);
      } catch (error) {
        console.error(
          "Unable to load admin dashboard:",
          error,
        );

        if (isMounted) {
          setLoadError(
            "Some dashboard information could not be loaded.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AdminLayout>
      <DashboardHero />

      {loadError && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {loadError}
        </div>
      )}

      <MissionCard
        tasks={tasks}
        isLoading={isLoading}
      />

      <KPIGrid
        stats={stats}
        isLoading={isLoading}
      />

      <ActionCentre />
    </AdminLayout>
  );
}

