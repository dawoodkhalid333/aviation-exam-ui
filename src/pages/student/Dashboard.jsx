import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { assignmentsAPI, sessionsAPI } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Trophy,
  Target,
  Calendar,
  PlayCircle,
  Eye,
} from "lucide-react";
import { format } from "date-fns";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments", user?.userId],
    queryFn: () =>
      assignmentsAPI.getAll().then((res) => res.data.assignments || []),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions", user?.userId],
    queryFn: () => sessionsAPI.getAll().then((res) => res.data.sessions || []),
  });

  const inProgressCount = sessions.filter((s) => !s.submittedAt).length;
  const completedCount = sessions.filter((s) => s.submittedAt).length;

  const stats = [
    {
      title: "Assigned Exams",
      value: assignments.length,
      icon: BookOpen,
      gradient: "from-blue-500 to-cyan-500",
      bg: "bg-blue-50",
      border: "border-blue-200",
    },
    {
      title: "In Progress",
      value: inProgressCount,
      icon: Clock,
      gradient: "from-amber-500 to-orange-500",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
    {
      title: "Completed",
      value: completedCount,
      icon: CheckCircle2,
      gradient: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },
  ];

  const recentSessions = sessions.slice(0, 6);

  return (
    <div className="space-y-10 pb-10">
      {/* Hero Welcome */}
      <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 p-1 shadow-2xl">
        <div className="rounded-3xl bg-white/95 backdrop-blur-xl p-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div>
              <h1 className="text-5xl font-bold text-gray-800 mb-4">
                Welcome back, {user?.name.split(" ")[0]}!
              </h1>
              <p className="text-xl text-gray-600">
                Ready to continue your aviation training journey?
              </p>
            </div>
            <div className="text-center">
              <Trophy className="mx-auto text-yellow-500 mb-3" size={80} />
              <p className="text-2xl font-bold text-gray-800">
                {completedCount}
              </p>
              <p className="text-gray-600">Exams Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="group relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-10`}
                />
              </div>

              <div className="p-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-gray-600 font-medium">{stat.title}</p>
                    <p className="text-5xl font-bold text-gray-800 mt-3">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${stat.gradient} p-1 shadow-lg`}
                  >
                    <div className="w-full h-full rounded-2xl bg-white/90 flex items-center justify-center">
                      <Icon size={36} className="text-gray-700" />
                    </div>
                  </div>
                </div>

                {stat.title === "Assigned Exams" && assignments.length > 0 && (
                  <Link
                    to="/student/exams"
                    className="inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700 transition"
                  >
                    View All Exams
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Sessions */}
      <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Target className="text-blue-600" size={32} />
              Recent Activity
            </h2>
            {sessions.length > 6 && (
              <Link
                to="/student/history"
                className="text-blue-600 hover:text-blue-700 font-medium transition"
              >
                View All →
              </Link>
            )}
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {recentSessions.length === 0 ? (
            <div className="text-center py-20">
              <PlayCircle size={72} className="mx-auto text-gray-300 mb-6" />
              <h3 className="text-2xl font-semibold text-gray-700 mb-3">
                No sessions yet
              </h3>
              <p className="text-gray-500 mb-8">
                When you start an exam, it will appear here
              </p>
              <Link
                to="/student/exams"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <BookOpen size={24} />
                Browse Available Exams
              </Link>
            </div>
          ) : (
            recentSessions.map((session) => {
              const exam = session.assignmentId?.examId;
              const isSubmitted = !!session.submittedAt;
              const isReviewAllowed = session.assignmentId?.isReviewAllowed;

              return (
                <div
                  key={session.id}
                  className="p-6 hover:bg-blue-50/30 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                          {exam?.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg">
                            {exam?.name || "Unknown Exam"}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar size={16} />
                              {format(
                                new Date(session.createdAt),
                                "dd MMM yyyy, HH:mm"
                              )}
                            </span>
                            {session.submittedAt && (
                              <span className="text-emerald-600 font-medium">
                                Submitted in{" "}
                                {Math.round(
                                  (new Date(session.submittedAt) -
                                    new Date(session.createdAt)) /
                                    60000
                                )}{" "}
                                min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-4 py-2 rounded-full font-bold text-sm ${
                          isSubmitted
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {isSubmitted ? "Completed" : "In Progress"}
                      </span>

                      {isSubmitted && isReviewAllowed && (
                        <button
                          onClick={() =>
                            navigate(`/student/results/${session.id}`)
                          }
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl hover:shadow-lg transition-all"
                        >
                          <Eye size={18} />
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
