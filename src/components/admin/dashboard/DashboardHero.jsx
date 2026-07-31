function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good Morning";
  }

  if (hour < 17) {
    return "Good Afternoon";
  }

  return "Good Evening";
}

function formatCurrentDate() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

export default function DashboardHero() {
  const greeting = getGreeting();
  const currentDate = formatCurrentDate();

  return (
    <section className="pb-10 pt-2 sm:pb-12">
      <div className="max-w-4xl">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-600">
          {greeting}
        </p>

        <h1 className="mt-4 text-5xl font-black tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
          Andre
        </h1>

        <p className="mt-3 text-base font-semibold text-slate-500 sm:text-lg">
          Super Administrator
        </p>

        <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
          Welcome back. Here&apos;s what&apos;s happening
          across CountMeInTT today.
        </p>

        <p className="mt-4 text-sm font-medium text-slate-400 sm:text-base">
          {currentDate}
        </p>
      </div>
    </section>
  );
}

