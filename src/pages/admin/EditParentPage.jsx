import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

import AdminLayout from "../../components/admin/layout/AdminLayout";
import ParentForm from "../../components/admin/parents/ParentForm";

import {
  fetchAdminParentById,
  updateAdminParentProfile,
} from "../../services/adminParentsService";

import {
  mapSupabaseParentToAdminParent,
} from "../../utils/adminParentMapper";

export default function EditParentPage() {
  const { parentId } = useParams();
  const navigate = useNavigate();

  const [parent, setParent] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  const [isSaving, setIsSaving] =
    useState(false);

useEffect(() => {
  let isMounted = true;

  async function loadParent() {
    try {
      setIsLoading(true);
      setLoadError("");

      const data =
        await fetchAdminParentById(
          parentId,
        );

      if (!isMounted) return;

      setParent(
        data
          ? mapSupabaseParentToAdminParent(
              data,
            )
          : null,
      );
    } catch (error) {
      console.error(
        "Unable to load parent:",
        error,
      );

      if (isMounted) {
        setLoadError(
          "The parent account could not be loaded.",
        );
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }

  loadParent();

  return () => {
    isMounted = false;
  };
}, [parentId]);

  async function handleSave(formData) {
  try {
    setIsSaving(true);

    await updateAdminParentProfile(
      parentId,
      {
        full_name:
          formData.name?.trim() ||
          `${formData.firstName || ""} ${
            formData.lastName || ""
          }`.trim(),

        phone:
          formData.phone?.trim() || null,

        communication_preference:
          formData.communicationPreference
            ?.trim()
            .toLowerCase() || null,

        account_status:
          formData.status
            ?.trim()
            .toLowerCase() || "active",
      },
    );

    navigate(
      `/admin/parents/${parentId}`,
    );
  } catch (error) {
    console.error(
      "Unable to update parent:",
      error,
    );

    alert(
      error.message ||
        "Unable to update parent. Please try again.",
    );
  } finally {
    setIsSaving(false);
  }
}

if (isLoading) {
  return (
    <AdminLayout>
      <section className="py-16 text-center">
        <p className="font-bold text-slate-600">
          Loading parent information...
        </p>
      </section>
    </AdminLayout>
  );
}

if (loadError) {
  return (
    <AdminLayout>
      <section className="py-16 text-center">
        <h1 className="text-2xl font-black text-red-700">
          Unable to load parent
        </h1>

        <p className="mt-3 text-red-600">
          {loadError}
        </p>
      </section>
    </AdminLayout>
  );
}

  if (!parent) {
    return (
      <AdminLayout>
        <section className="mx-auto max-w-3xl py-20 text-center">

          <h1 className="text-4xl font-black text-slate-900">
            Parent Not Found
          </h1>

          <p className="mt-4 text-slate-600">
            The parent account you are trying to edit
            could not be found.
          </p>

          <Link
            to="/admin/parents"
            className="mt-8 inline-flex items-center rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-slate-900 transition hover:bg-yellow-500"
          >
            Return to Parents
          </Link>

        </section>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>

      <section className="mx-auto max-w-5xl pb-12">

        <Link
          to={`/admin/parents/${parentId}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-yellow-600"
        >
          <ArrowLeft size={18} />
          Back to Parent Profile
        </Link>

        <div className="mt-6">

          <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
            Account Management
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Edit Parent
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-slate-600">
            Update this parent's account information,
            communication preferences and account settings.
          </p>

        </div>

        <div className="mt-8">

          <ParentForm
            mode="edit"
            initialData={parent}
            onSubmit={handleSave}
             onCancel={() =>
              navigate(`/admin/parents/${parentId}`)
            }
             isSubmitting={isSaving}
          />
        </div>

      </section>

    </AdminLayout>
  );
}

