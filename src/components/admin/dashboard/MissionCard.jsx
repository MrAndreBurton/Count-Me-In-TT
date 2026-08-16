import {
  CheckCircle2,
  Clock3,
} from "lucide-react";

export default function MissionCard({
  tasks = [],
  isLoading = false,
}) {
  return (
    <section className="mb-10">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-yellow-400 to-amber-300 shadow-lg">
        <div className="p-8 lg:p-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-800">
                Today's Mission
              </p>

              <h2 className="mt-2 text-3xl font-black text-slate-900">
                Here's what needs your
                attention.
              </h2>

              <p className="mt-3 max-w-2xl text-slate-800">
                Priority administrative
                actions for CountMeInTT.
              </p>
            </div>

            <div className="hidden h-20 w-20 items-center justify-center rounded-3xl bg-white/25 lg:flex">
              <CheckCircle2
                size={40}
                className="text-slate-900"
              />
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {isLoading ? (
              <div className="rounded-2xl bg-white/35 px-5 py-5 backdrop-blur">
                <div className="flex items-center gap-4">
                  <Clock3
                    size={20}
                    className="text-slate-700"
                  />

                  <span className="font-semibold text-slate-700">
                    Checking for
                    administrative tasks...
                  </span>
                </div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="rounded-2xl bg-white/35 px-5 py-5 backdrop-blur">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                    <CheckCircle2
                      size={20}
                      className="text-emerald-600"
                    />
                  </div>

                  <div>
                    <p className="font-bold text-slate-900">
                      Everything is up to
                      date.
                    </p>

                    <p className="mt-1 text-sm text-slate-700">
                      No administrative
                      actions currently
                      require attention.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-2xl bg-white/35 px-5 py-4 backdrop-blur"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
                      <CheckCircle2
                        size={20}
                        className="text-yellow-600"
                      />
                    </div>

                    <span className="font-semibold text-slate-900">
                      {task.text}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

