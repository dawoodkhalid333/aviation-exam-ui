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
  Search,
  Filter,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { useState, useMemo } from "react";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, in-progress, completed
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, exam-name
  const [showFilters, setShowFilters] = useState(false);

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

  // Filter and sort sessions
  const filteredAndSortedSessions = useMemo(() => {
    let filtered = [...sessions];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((session) =>
        session.assignmentId?.examId?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((session) =>
        filterStatus === "completed"
          ? !!session.submittedAt
          : !session.submittedAt
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "exam-name":
          return (a.assignmentId?.examId?.name || "").localeCompare(
            b.assignmentId?.examId?.name || ""
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [sessions, searchTerm, filterStatus, sortBy]);

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

  // Get unique exam names for filter suggestions
  const examNames = useMemo(() => {
    const names = sessions
      .map((s) => s.assignmentId?.examId?.name)
      .filter(Boolean);
    return [...new Set(names)];
  }, [sessions]);

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

                {stat.title === "Assigned Exams" && assignments.length > 6 && (
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

      {/* Recent Sessions with Filters */}
      <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Target className="text-blue-600" size={32} />
              Recent Activity
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              <Filter size={20} />
              Filters
              {(searchTerm || filterStatus !== "all") && (
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search by exam name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Filter Options */}
              <div className="flex flex-wrap gap-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="exam-name">Sort by Exam Name</option>
                </select>

                {/* Quick filter chips for exam names */}
                {examNames.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {examNames.slice(0, 5).map((name) => (
                      <button
                        key={name}
                        onClick={() => setSearchTerm(name)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          searchTerm === name
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Filters */}
              {(searchTerm || filterStatus !== "all") && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Active filters:</span>
                  {searchTerm && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
                      Search: {searchTerm}
                      <button
                        onClick={() => setSearchTerm("")}
                        className="hover:text-blue-600"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  {filterStatus !== "all" && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
                      Status: {filterStatus}
                      <button
                        onClick={() => setFilterStatus("all")}
                        className="hover:text-blue-600"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="divide-y divide-gray-200">
          {filteredAndSortedSessions.length === 0 ? (
            <div className="text-center py-20">
              <PlayCircle size={72} className="mx-auto text-gray-300 mb-6" />
              <h3 className="text-2xl font-semibold text-gray-700 mb-3">
                No matching sessions found
              </h3>
              <p className="text-gray-500 mb-8">
                {sessions.length === 0
                  ? "When you start an exam, it will appear here"
                  : "Try adjusting your filters"}
              </p>
              {sessions.length > 0 && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("all");
                    setSortBy("newest");
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Clear all filters
                </button>
              )}
              {sessions.length === 0 && (
                <Link
                  to="/student/exams"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  <BookOpen size={24} />
                  Browse Available Exams
                </Link>
              )}
            </div>
          ) : (
            filteredAndSortedSessions.map((session) => {
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
                          {exam?.name?.charAt(0) || "?"}
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

        {/* Results count */}
        {filteredAndSortedSessions.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
            Showing {filteredAndSortedSessions.length} of {sessions.length}{" "}
            sessions
          </div>
        )}
      </div>
    </div>
  );
}