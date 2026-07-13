import React from "react";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";

export default function Supporters() {
  return (
    <div className="min-h-screen bg-white text-black">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-5 py-16">
        <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-8">
          <p className="text-sm font-black uppercase tracking-wider text-blue-600">
            CountMeInTT Community
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Our Supporters
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-gray-600">
            This page will recognise the sponsors, partners, schools,
            donors and community supporters helping CountMeInTT grow.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

