import { CheckCircle2, Clock3 } from "lucide-react";

const tasks = [
  {
    id: 1,
    text: "Approve 4 membership requests",
  },
  {
    id: 2,
    text: "Review 2 new student registrations",
  },
  {
    id: 3,
    text: "Verify 1 Styles Challenge winner",
  },
];

export default function MissionCard() {
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
                Here's what needs your attention.
              </h2>

              <p className="mt-3 max-w-2xl text-slate-800">
                Complete these priority tasks to keep
                CountMeInTT running smoothly.
              </p>

            </div>

            <div className="hidden lg:flex h-20 w-20 items-center justify-center rounded-3xl bg-white/25">

              <CheckCircle2
                size={40}
                className="text-slate-900"
              />

            </div>

          </div>

          <div className="mt-8 space-y-4">

            {tasks.map((task) => (

              <div
                key={task.id}
                className="flex items-center justify-between rounded-2xl bg-white/35 backdrop-blur px-5 py-4"
              >

                <div className="flex items-center gap-4">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">

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

            ))}

          </div>

          <div className="mt-8 flex items-center gap-3 text-slate-900">

            <Clock3 size={18} />

            <span className="font-semibold">
              Estimated completion time: 12 minutes
            </span>

          </div>

        </div>

      </div>
    </section>
  );
}

