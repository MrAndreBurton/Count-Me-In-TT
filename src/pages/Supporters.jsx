import React from "react";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";

export default function Supporters() {
  return (
    <div className="min-h-screen bg-white text-black">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-5 py-16">
  <section className="rounded-3xl border border-yellow-200 bg-yellow-50 p-8 sm:p-10">
    <p className="text-sm font-black uppercase tracking-wider text-blue-600">
      CountMeInTT Community
    </p>

    <h1 className="mt-2 text-4xl font-black sm:text-5xl">
      Our Supporters
    </h1>

    <p className="mt-4 max-w-3xl text-lg leading-8 text-gray-700">
      CountMeInTT continues to grow because of the schools, businesses,
      sponsors, community partners, donors, parents, educators and
      individuals who believe in the mission.
    </p>
  </section>

  <section className="mt-10 rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-12">
    <div
      aria-hidden="true"
      className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-100 text-3xl"
    >
      🛠️
    </div>

    <p className="mt-6 text-sm font-black uppercase tracking-wider text-blue-600">
      Page in progress
    </p>

    <h2 className="mt-2 text-3xl font-black">
      We are building our supporters wall.
    </h2>

    <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-600">
      We are currently putting together a fuller record of the people and
      organisations that have supported CountMeInTT so far and those who
      continue to help us reach more students.
    </p>

    <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-600">
      To every supporter who has contributed time, resources, encouragement,
      prizes, opportunities or financial support, thank you for helping us
      make maths practice more engaging and accessible.
    </p>

    <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-yellow-200 bg-yellow-50 px-6 py-5">
      <p className="font-black text-gray-950">
        More supporter profiles and acknowledgements will be added soon.
      </p>
    </div>
  </section>
</main>




      <SiteFooter />
    </div>
  );
}

