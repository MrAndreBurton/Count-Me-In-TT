import {
  ArrowLeft,
  CheckCircle2,
  UserPlus,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useState } from "react";

import AdminLayout from "../../components/admin/layout/AdminLayout";
import ParentForm from "../../components/admin/parents/ParentForm";

import {
  createAdminParent,
  getAdminParents,
} from "../../data/adminParents";

export default function AddParentPage() {
  const navigate = useNavigate();

  const [createdParent, setCreatedParent] =
    useState(null);

  const [pageError, setPageError] =
    useState("");

  async function handleCreateParent(
    formData,
  ) {
    setPageError("");

    const emailExists =
      getAdminParents().some(
        (parent) =>
          parent.email.toLowerCase() ===
          formData.email.toLowerCase(),
      );

    if (emailExists) {
      setPageError(
        "A parent account with this email address already exists.",
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    try {
      const newParent =
        createAdminParent(formData);

      setCreatedParent(newParent);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(
        "Unable to create parent:",
        error,
      );

      setPageError(
        "The parent account could not be created. Please try again.",
      );
    }
  }

  if (createdParent) {
    return (
      <AdminLayout>
        <section className="mx-auto max-w-3xl pb-12">
          <div className="rounded-[2rem] border border-emerald-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={40} />
            </div>

            <p className="mt-7 text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">
              Parent Created
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Parent created successfully
            </h1>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600">
              <strong className="text-slate-950">
                {createdParent.name}
              </strong>{" "}
              has been added to CountMeInTT.
              Student profiles can now be
              connected to this parent account.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to={`/admin/parents/${createdParent.id}`}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-yellow-400 hover:text-slate-950"
              >
                View parent profile
              </Link>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/admin/students/new?parentId=${createdParent.id}`,
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-yellow-500"
              >
                <UserPlus size={18} />
                Add student
              </button>

              <Link
                to="/admin/parents"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Return to parents
              </Link>
            </div>
          </div>
        </section>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <section className="mx-auto max-w-5xl pb-12">
        <Link
          to="/admin/parents"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-yellow-600"
        >
          <ArrowLeft size={18} />
          Back to parents
        </Link>

        <div className="mt-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
            Account Management
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Add Parent
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-slate-600">
            Create a parent or guardian
            account that can manage one or
            more student profiles.
          </p>
        </div>

        {pageError && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700"
          >
            {pageError}
          </div>
        )}

        <div className="mt-8">
          <ParentForm
            mode="create"
            onSubmit={handleCreateParent}
            onCancel={() =>
              navigate("/admin/parents")
            }
          />
        </div>
      </section>
    </AdminLayout>
  );
}


