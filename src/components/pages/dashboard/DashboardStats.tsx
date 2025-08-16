import React from "react";

interface StatsData {
  totalPatients: number;
  todayAppointments: number;
  pendingConsultations: number;
  completedToday: number;
}

type Props = {
  stats?: StatsData;
  isLoading?: boolean;
};

const CardIconCalendar = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M7 10H9V12H7zM11 10H13V12H11zM15 10H17V12H15z"
      fill="white"
      opacity="0.9"
    />
    <path
      d="M7 3V5M17 3V5"
      stroke="white"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect
      x="3"
      y="5"
      width="18"
      height="16"
      rx="2"
      stroke="white"
      strokeWidth="1.2"
      fill="none"
    />
  </svg>
);

const CardIconCheck = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M20 6L9 17L4 12"
      stroke="white"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CardIconHourglass = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M6 2H18M6 22H18"
      stroke="white"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 6H16M8 18H16"
      stroke="white"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 6C8 9 11 11 12 12C13 11 16 9 16 6"
      stroke="white"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 18C8 15 11 13 12 12C13 13 16 15 16 18"
      stroke="white"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CardIconUsers = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
      stroke="white"
      strokeWidth="1.2"
      fill="none"
    />
    <path
      d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z"
      stroke="white"
      strokeWidth="1.2"
      fill="none"
    />
  </svg>
);

const DashboardStatsSection = ({ stats, isLoading = false }: Props) => {
  // Use real stats if provided, otherwise fall back to default values
  const displayStats = [
    {
      id: "patients",
      value: stats?.totalPatients || 0,
      label: "Total Patients",
      colorFrom: "#4db6ff",
      colorTo: "#2b9cff",
      icon: <CardIconUsers />,
    },
    {
      id: "today",
      value: stats?.todayAppointments || 0,
      label: "Today's Appointments",
      colorFrom: "#6ee7b7",
      colorTo: "#16a34a",
      icon: <CardIconCalendar />,
    },
    {
      id: "pending",
      value: stats?.pendingConsultations || 0,
      label: "Pending Consultations",
      colorFrom: "#ffb36b",
      colorTo: "#f97316",
      icon: <CardIconHourglass />,
    },
    {
      id: "completed",
      value: stats?.completedToday || 0,
      label: "Completed Today",
      colorFrom: "#ff7bd1",
      colorTo: "#8b5cf6",
      icon: <CardIconCheck />,
    },
  ];

  return (
    <section className="w-full">
      <div className="w-full px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayStats.map((s) => (
            <div
              key={s.id}
              className="relative overflow-hidden rounded-sm shadow-md py-5 px-6 flex items-center transition transform duration-200 ease-out hover:scale-[1.01]"
              style={{
                background: `linear-gradient(90deg, ${s.colorFrom}, ${s.colorTo})`,
              }}
              aria-labelledby={`stat-${s.id}-title`}
              role="group"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white/18 backdrop-blur flex items-center justify-center mr-4">
                {s.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div
                  id={`stat-${s.id}-title`}
                  className="text-white text-2xl font-semibold leading-tight"
                >
                  {isLoading ? (
                    <div className="animate-pulse bg-white/20 h-8 w-16 rounded"></div>
                  ) : (
                    s.value
                  )}
                </div>
                <div className="text-white/90 text-sm truncate mt-1">
                  {s.label}
                </div>
              </div>

              <div
                aria-hidden
                className="pointer-events-none absolute right-4 top-4 opacity-30"
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 9999,
                  filter: "blur(18px)",
                  background: "rgba(255,255,255,0.06)",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DashboardStatsSection;
