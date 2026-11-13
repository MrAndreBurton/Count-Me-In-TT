import React from "react";
import { Link } from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";

const experiences = [
  { title: "Multiplication Challenge", description: "Race the clock, challenge yourself and celebrate your personal best.", image: "/images/games/multiplication-challenge.webp", to: "/games/multiplication", label: "Play a challenge", tone: "bg-orange-50 border-orange-200", tag: "Challenge" },
  { title: "Times Table Practice", description: "Build multiplication fluency with practice that helps you learn from each attempt.", image: "/images/games/times-table-practice.webp", to: "/games/multiplication/practice", label: "Start practising", tone: "bg-green-50 border-green-200", tag: "Practise" },
  { title: "Numberverse", description: "Explore numbers, factors and the patterns that connect them.", image: "/images/games/numberverse.webp", to: "/games/numberverse", label: "Explore Numberverse", tone: "bg-purple-50 border-purple-200", tag: "Discover" },
  { title: "Math Language", description: "Get comfortable with the words and phrases used in mathematics.", image: "/images/games/math-language.webp", to: "/math-language", label: "Explore words", tone: "bg-blue-50 border-blue-200", tag: "Understand" },
  { title: "Symbol Bank", description: "Discover mathematical symbols and what they mean, from primary to secondary level.", image: "/images/games/symbol-bank.webp", to: "/symbol-bank", label: "Explore symbols", tone: "bg-teal-50 border-teal-200", tag: "Learn" },
];

const benefits = [
  "Save personal bests and recent results",
  "Build a personal learning profile",
  "Explore free maths games and learning tools",
  "Discover more with optional membership",
];

const primaryButton = "inline-flex items-center justify-center rounded-xl bg-blue-700 px-6 py-3.5 text-center font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700";
const secondaryButton = "inline-flex items-center justify-center rounded-xl border-2 border-blue-700 bg-white px-6 py-3 text-center font-extrabold text-blue-800 transition hover:-translate-y-0.5 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700";

export default function Home() {
  return (
    <div className="platform-page-bg min-h-screen text-slate-950">
      <SiteHeader />
      <main>
        <section className="overflow-hidden border-b border-blue-100 bg-gradient-to-br from-blue-50 via-white to-yellow-50 px-5 py-12 sm:py-16 lg:py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-9 lg:grid-cols-[0.94fr_1.06fr] lg:gap-12">
            <div>
              <p className="inline-flex rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-blue-700">Welcome to CountMeInTT</p>
              <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl xl:text-6xl">
                Maths You Can Play. <span className="text-blue-700">Progress You Can See.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-700 sm:text-lg">
                CountMeInTT brings learning and play together through interactive maths games, challenges and discovery activities. Students build skills, practise with purpose and track their progress, while parents and educators gain insights to support their learning.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link to="/games" className={primaryButton}>Explore Games &amp; Activities <span aria-hidden="true" className="ml-2">→</span></Link>
                <a href="#parents-educators" className={secondaryButton}>For Parents &amp; Educators</a>
              </div>
              <p className="mt-5 text-sm font-semibold text-slate-600">Start exploring for free. Create an account when you're ready to save your progress.</p>
            </div>
            <div className="relative mx-auto w-full max-w-2xl">
              <div aria-hidden="true" className="absolute inset-x-8 inset-y-12 rounded-[3rem] bg-yellow-200/40 blur-3xl" />
              <img src="/images/home/homepage-hero.webp" alt="A diverse group of children enjoying a maths learning activity together, with playful mathematics and progress visuals" className="relative w-full rounded-[2rem] object-contain" fetchPriority="high" />
            </div>
          </div>
        </section>

        <section id="learning-experiences" className="scroll-mt-20 px-5 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-blue-700">Explore the platform</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Find your way to play, practise and learn.</h2>
                <p className="mt-3 max-w-2xl leading-7 text-slate-600">Jump into a challenge, build your skills or discover something new. There is more than one way to enjoy maths.</p>
              </div>
              <Link to="/games" className="shrink-0 font-black text-blue-700 underline decoration-2 underline-offset-4 hover:text-blue-900">See all games &amp; activities →</Link>
            </div>
            <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {experiences.map((item) => (
                <Link key={item.title} to={item.to} className={`group flex h-full flex-col overflow-hidden rounded-3xl border shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${item.tone}`}>
                  <div className="relative flex h-48 items-center justify-center overflow-hidden p-4 sm:h-52">
                    <img src={item.image} alt="" loading="lazy" className="h-full w-full object-contain transition duration-300 group-hover:scale-105" />
                  </div>
                  <div className="flex flex-1 flex-col rounded-t-3xl bg-white p-6">
                    <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">{item.tag}</span>
                    <h3 className="mt-3 text-xl font-black sm:text-2xl">{item.title}</h3>
                    <p className="mt-3 flex-1 leading-7 text-slate-600">{item.description}</p>
                    <span className="mt-6 font-black text-blue-700">{item.label} <span aria-hidden="true" className="inline-block transition group-hover:translate-x-1">→</span></span>
                  </div>
                </Link>
              ))}
              <div className="flex flex-col justify-center rounded-3xl border border-blue-200 bg-blue-700 p-7 text-white sm:p-9">
                <span className="text-sm font-black uppercase tracking-wider text-yellow-300">More ways to join in</span>
                <h3 className="mt-3 text-2xl font-black">Ready for a little friendly competition?</h3>
                <p className="mt-3 leading-7 text-blue-50">Explore community challenges and see how players are doing on the leaderboards.</p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link to="/challenges" className="rounded-xl bg-yellow-400 px-4 py-3 font-black text-slate-950 hover:bg-yellow-300">Challenges</Link>
                  <Link to="/leaderboard" className="rounded-xl border border-white/70 px-4 py-3 font-black text-white hover:bg-white/10">Leaderboards</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-blue-50 px-5 py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="order-2 lg:order-1">
              <img src="/images/home/learning-progress.webp" alt="A learner celebrating maths practice, with examples of correcting an answer and following progress" loading="lazy" className="w-full rounded-3xl object-contain shadow-sm" />
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-sm font-black uppercase tracking-wider text-blue-700">Learning through practice</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Every attempt counts. Every improvement matters.</h2>
              <p className="mt-5 leading-8 text-slate-700">Practice is more meaningful when learners can see what they know, recognise what needs work and try again. CountMeInTT brings these moments together through interactive activities and performance feedback.</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  ["01", "Practise", "Build familiarity through repeated attempts."],
                  ["02", "Learn", "Notice mistakes and strengthen tricky facts."],
                  ["03", "Improve", "Follow accuracy, times and personal bests."],
                ].map(([number, title, description]) => (
                  <div key={title} className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                    <span className="text-sm font-black text-blue-700">{number}</span>
                    <h3 className="mt-2 font-black">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                  </div>
                ))}
              </div>
              <p className="mt-7 border-l-4 border-yellow-400 pl-4 font-semibold leading-7 text-slate-700">CountMeInTT is designed to support learning, and we're building the evidence to demonstrate its impact.</p>
            </div>
          </div>
        </section>

        <section id="parents-educators" className="scroll-mt-20 px-5 py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-blue-700">At home and at school</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Better learning starts with better support.</h2>
              <p className="mt-5 leading-8 text-slate-700">Students don't learn alone. Parents, teachers and schools all play a part in encouraging practice and recognising progress.</p>
              <div className="mt-7 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-black text-blue-800">For parents</h3><p className="mt-2 leading-7 text-slate-600">Make maths practice part of everyday life and celebrate the effort behind each improvement.</p></div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-black text-blue-800">For teachers and schools</h3><p className="mt-2 leading-7 text-slate-600">Encourage purposeful practice and use available results to spot strengths and areas needing reinforcement.</p></div>
              </div>
              <Link to="/games" className="mt-7 inline-flex font-black text-blue-700 underline decoration-2 underline-offset-4 hover:text-blue-900">Explore learning activities →</Link>
            </div>
            <img src="/images/home/supporting-learning.webp" alt="At home, a child shows her maths activity to her father on the couch; at school, a teacher supports students using a laptop" loading="lazy" className="w-full rounded-3xl object-contain shadow-sm" />
          </div>
        </section>

        <section className="bg-yellow-50 px-5 py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-9 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-blue-700">CountMeInTT in the community</p>
              <h2 className="mt-2 text-3xl font-black sm:text-4xl">Learning beyond the screen.</h2>
              <p className="mt-4 max-w-2xl leading-8 text-slate-700">From school visits to community challenges, CountMeInTT creates opportunities for learners to put their skills into action, cheer each other on and enjoy mathematics together.</p>
              <div className="mt-7 flex flex-wrap gap-3"><Link to="/challenges" className={primaryButton}>Explore Challenges</Link><Link to="/supporters" className={secondaryButton}>Meet Our Supporters</Link></div>
            </div>
            <div className="rounded-3xl border border-yellow-200 bg-white p-7 shadow-sm sm:p-9">
              <p className="text-sm font-black uppercase tracking-wider text-blue-700">Growing together</p>
              <h3 className="mt-3 text-2xl font-black">Students. Families. Schools. Community.</h3>
              <p className="mt-4 leading-8 text-slate-600">CountMeInTT grows through the participation of learners and the support of educators, community partners, sponsors and individuals who believe in making mathematics more accessible and engaging.</p>
            </div>
          </div>
        </section>

        <section className="px-5 py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-10 rounded-3xl bg-blue-800 p-7 text-white sm:p-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-yellow-300">Join CountMeInTT</p>
              <h2 className="mt-2 text-3xl font-black sm:text-4xl">Start free. Keep learning.</h2>
              <p className="mt-4 max-w-xl leading-8 text-blue-50">Explore games and activities as a guest, or create a free account to build your profile and save your progress. Optional membership unlocks more learning experiences.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link to="/register" className="rounded-xl bg-yellow-400 px-6 py-3 text-center font-black text-slate-950 transition hover:bg-yellow-300">Create Free Account</Link>
                <Link to="/membership" className="rounded-xl border-2 border-white px-6 py-3 text-center font-black text-white transition hover:bg-white/10">Explore Membership</Link>
              </div>
              <p className="mt-5 text-sm text-blue-100">Just looking around? <Link to="/games" className="font-bold underline underline-offset-4">Continue as a guest</Link>.</p>
            </div>
            <div className="rounded-2xl bg-white p-6 text-slate-950 sm:p-8">
              <h3 className="text-xl font-black">With a free account</h3>
              <ul className="mt-5 space-y-4">
                {benefits.map((benefit) => <li key={benefit} className="flex items-start gap-3"><span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-200 font-black">✓</span><span className="pt-0.5 font-semibold leading-6 text-slate-700">{benefit}</span></li>)}
              </ul>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
