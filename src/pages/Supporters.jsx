import React from "react";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";

const IMAGE_BASE = "/images/supporters/Photos";

const schoolPilots = [
  {
    name: "St. Xavier's Private School",
    detail: "October–December 2025 · Standards 3–5",
    description:
      "St. Xavier's Private School welcomed a school-based multiplication pilot, giving students the opportunity to explore CountMeInTT in a classroom setting.",
    image: "st-xaviers-pilot.webp",
    alt: "Classroom multiplication activity during the St. Xavier's pilot",
  },
  {
    name: "San Juan Girls' R.C. School",
    detail: "January 2026 · Standards 2–4",
    description:
      "San Juan Girls' R.C. School hosted a two-day multiplication pilot, where students took part in interactive challenges and helped us learn from real classroom use.",
    image: "san-juan-girls-pilot.webp",
    alt: "Students participating in the San Juan Girls' multiplication pilot",
  },
];

const supporters = [
  {
    name: "RIK Trinidad Book World",
    type: "Prize sponsor",
    detail: "October 2025 Multiplication Challenge",
    description: "Provided prize vouchers for the month-end multiplication challenge.",
  },
  {
    name: "Styles Unisex Barber Salon",
    type: "Community activation host",
    detail: "July–August 2026",
    description: "Opened its doors to host the Barbershop Challenge.",
  },
  {
    name: "Private community supporter",
    type: "Individual donor",
    detail: "Barbershop Challenge · 2026",
    description: "Contributed towards vouchers and setup for the challenge. Recognised anonymously with appreciation.",
  },
  {
    name: "The Agentzee",
    type: "Transport and logistics support",
    detail: "Bocas Lit Fest activations · 2026",
    description: "Helped make community activations possible through transport support.",
  },
  {
    name: "Seventh-day Adventist Church, Arouca",
    type: "Community event host",
    detail: "Youthopia 2 · June 2026",
    description: "Hosted the Youthopia 2 activation at the church hall.",
  },
  {
    name: "Adulting with Sherrinne",
    type: "Volunteer and media support",
    detail: "Community activations",
    description: "Helped with on-the-ground engagement, photography, media capture and post-event content.",
  },
];

const media = [
  {
    name: "Trinidad and Tobago Guardian",
    type: "Feature article · November 2025",
    description: "A feature on the story behind CountMeInTT.",
    href: "https://www.guardian.co.tt/article/andre-burton-6.2.2449695.ed1a3e0e8b",
    action: "Read the feature",
  },
  {
    name: "The Catholic News",
    type: "Instagram feature",
    description: "Sharing the CountMeInTT story with a wider audience.",
    href: "https://www.instagram.com/p/DPVDFjJjnkE/",
    action: "View the feature",
  },
  {
    name: "Trini TechCast",
    type: "Podcast interview · October 2025",
    description: "A conversation about the platform and technology in education.",
    href: "https://youtu.be/Lnj_9eMvg-0",
    action: "Watch the interview",
  },
];

function SectionHeading({ eyebrow, title, children }) {
  return (
    <div className="mb-8 max-w-3xl">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-[#0B2D5B] sm:text-4xl">{title}</h2>
      {children && <p className="mt-4 text-base leading-8 text-slate-600 sm:text-lg">{children}</p>}
    </div>
  );
}

export default function Supporters() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <SiteHeader />
      <main id="main-content">
        <section className="overflow-hidden bg-[#fff9e8]">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-14 lg:py-20">
            <div>
              <p className="inline-flex rounded-full border border-yellow-300 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-blue-700">CountMeInTT community</p>
              <h1 className="mt-6 text-4xl font-black leading-[1.08] tracking-tight text-[#0B2D5B] sm:text-5xl lg:text-6xl">
                Growing together. <span className="text-blue-600">Making maths count.</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-700">
                CountMeInTT is growing with the support of schools, businesses, community organisations and individuals who believe in making mathematics more engaging and accessible.
              </p>
              <p className="mt-4 text-lg leading-7 text-slate-600">
                From opening doors to students and providing prizes to helping us reach communities across Trinidad and Tobago, every contribution has played a part in our journey.
              </p>
              <a href="#our-supporters" className="mt-8 inline-flex rounded-xl bg-[#2463FF] px-6 py-3 font-black text-white shadow-sm transition hover:bg-[#174dd2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Meet our supporters <span aria-hidden="true" className="ml-2">→</span></a>
            </div>
            <div className="relative">
              <div className="absolute -right-3 -top-3 h-full w-full rounded-[2rem] bg-[#FFD52A]" aria-hidden="true" />
              <img src={`${IMAGE_BASE}/supporters-hero.webp`} alt="CountMeInTT mathematics activity with a student at a laptop" fetchPriority="high" className="relative aspect-[4/3] w-full rounded-[2rem] object-cover shadow-xl" />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20" aria-labelledby="bocas-heading">
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-yellow-100 px-4 py-2 text-xs font-black uppercase tracking-widest text-[#0B2D5B]">Featured collaboration</span>
            <span className="text-sm font-semibold text-slate-500">2026 · Trinidad and Tobago</span>
          </div>
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <h2 id="bocas-heading" className="text-3xl font-black tracking-tight text-[#0B2D5B] sm:text-5xl">Taking maths on the road</h2>
              <p className="mt-3 text-lg font-bold text-blue-700">Bocas Lit Fest Children's Festival &amp; Community Festival Tour</p>
              <p className="mt-5 leading-8 text-slate-700">Through the Bocas Lit Fest Children's Festival and community events, CountMeInTT brought its interactive multiplication challenge to children and families across Trinidad.</p>
              <p className="mt-4 leading-8 text-slate-700">From Port of Spain to Couva, Arima and Siparia, these events offered opportunities to try the game, challenge multiplication skills and experience maths in a welcoming environment.</p>
              <p className="mt-4 leading-8 text-slate-700">We appreciate Bocas Lit Fest for welcoming CountMeInTT into these events and creating opportunities to connect with communities.</p>
              <div className="mt-7 flex flex-wrap gap-2" aria-label="Festival locations">
                {["Port of Spain", "Couva", "Arima", "Siparia"].map((place) => <span key={place} className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-800">{place}</span>)}
              </div>
            </div>
            <img src={`${IMAGE_BASE}/bocas-feature.webp`} alt="CountMeInTT presence at a Bocas Lit Fest event" loading="lazy" className="aspect-[3/2] w-full rounded-3xl object-cover shadow-lg" />
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            <figure className="overflow-hidden rounded-2xl bg-slate-100"><img src={`${IMAGE_BASE}/bocas-tour-2026.webp`} alt="CountMeInTT on the Road graphic showing the four festival stops" loading="lazy" className="aspect-square w-full object-cover" /><figcaption className="px-4 py-3 text-sm font-semibold text-slate-600">Four stops across Trinidad</figcaption></figure>
            <figure className="overflow-hidden rounded-2xl bg-slate-100"><img src={`${IMAGE_BASE}/bocas-student-playing.webp`} alt="A student using the CountMeInTT multiplication game at an event" loading="lazy" className="aspect-square w-full object-cover" /><figcaption className="px-4 py-3 text-sm font-semibold text-slate-600">Hands-on maths practice</figcaption></figure>
            <figure className="overflow-hidden rounded-2xl bg-slate-100"><img src={`${IMAGE_BASE}/bocas-gallery.webp`} alt="A participant playing CountMeInTT at a community activation" loading="lazy" className="aspect-square w-full object-cover" /><figcaption className="px-4 py-3 text-sm font-semibold text-slate-600">Learning through participation</figcaption></figure>
          </div>
        </section>

        <section className="bg-[#f3f7ff] py-16 sm:py-20" aria-labelledby="schools-heading">
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <div id="schools-heading"><SectionHeading eyebrow="School collaborations" title="Schools that opened their doors">Our early school pilots helped bring the multiplication challenge into classrooms and gave students opportunities to engage with the platform.</SectionHeading></div>
            <div className="grid gap-6 md:grid-cols-2">
              {schoolPilots.map((school) => (
                <article key={school.name} className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
                  <img src={`${IMAGE_BASE}/${school.image}`} alt={school.alt} loading="lazy" className="aspect-[16/10] w-full object-cover" />
                  <div className="p-6 sm:p-8">
                    <p className="text-xs font-black uppercase tracking-widest text-blue-700">School pilot</p>
                    <h3 className="mt-2 text-2xl font-black text-[#0B2D5B]">{school.name}</h3>
                    <p className="mt-2 text-sm font-bold text-slate-500">{school.detail}</p>
                    <p className="mt-4 leading-7 text-slate-700">{school.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="our-supporters" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16 sm:px-6 sm:py-20" aria-labelledby="supporters-heading">
          <div id="supporters-heading"><SectionHeading eyebrow="With appreciation" title="People and organisations making a difference">Support comes in many forms. We recognise each contribution for what it was: prizes, hosting, transport, funding, volunteer time or media assistance.</SectionHeading></div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {supporters.map((supporter) => (
              <article key={supporter.name} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md">
                <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[#0B2D5B]">{supporter.type}</span>
                <h3 className="mt-5 text-xl font-black text-[#0B2D5B]">{supporter.name}</h3>
                <p className="mt-2 text-sm font-bold text-blue-700">{supporter.detail}</p>
                <p className="mt-4 leading-7 text-slate-600">{supporter.description}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 grid items-center gap-6 overflow-hidden rounded-3xl bg-[#0B2D5B] text-white md:grid-cols-[0.8fr_1.2fr]">
            <img src={`${IMAGE_BASE}/general-activity.webp`} alt="Children participating in a CountMeInTT community maths activity" loading="lazy" className="h-full max-h-80 w-full object-cover md:max-h-none" />
            <div className="p-7 md:py-9 md:pr-10">
              <p className="text-xs font-black uppercase tracking-widest text-yellow-300">Every contribution counts</p>
              <h3 className="mt-3 text-2xl font-black sm:text-3xl">Thank you for being part of the journey.</h3>
              <p className="mt-4 leading-8 text-blue-100">Each opportunity to reach a student, meet a family or bring maths into a new space helps CountMeInTT grow.</p>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-16 sm:py-20" aria-labelledby="media-heading">
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <div id="media-heading"><SectionHeading eyebrow="In the media" title="Sharing the CountMeInTT story">These interviews and features have helped introduce our work to wider audiences. Media coverage is listed separately from supporters and sponsors.</SectionHeading></div>
            <div className="grid gap-5 md:grid-cols-3">
              {media.map((item) => (
                <article key={item.name} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-widest text-blue-700">{item.type}</p>
                  <h3 className="mt-4 text-xl font-black text-[#0B2D5B]">{item.name}</h3>
                  <p className="mt-3 flex-1 leading-7 text-slate-600">{item.description}</p>
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex w-fit items-center gap-2 rounded-lg font-black text-blue-700 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700">{item.action} <span aria-hidden="true">↗</span><span className="sr-only">(opens in a new tab)</span></a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#FFD52A] px-7 py-12 text-center sm:px-12 sm:py-16">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0B2D5B]">Join the journey</p>
            <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black tracking-tight text-[#0B2D5B] sm:text-5xl">Help us make maths count.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#0B2D5B]">Whether you're a school, business or individual interested in supporting maths learning, we'd love to hear from you.</p>
            <a href="/about-us-contact.pdf" target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex rounded-xl bg-[#0B2D5B] px-7 py-3.5 font-black text-white transition hover:bg-[#174b88] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5B]">About &amp; contact <span aria-hidden="true" className="ml-2">↗</span><span className="sr-only">(opens PDF in a new tab)</span></a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
