import { useQuery } from "@tanstack/react-query";
import { usersAPI, examsAPI, questionsAPI, categoriesAPI } from "../../lib/api";
import {
  Users,
  ClipboardList,
  FileQuestion,
  FolderOpen,
  TrendingUp,
  Clock,
} from "lucide-react";

export default function AdminDashboard() {
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersAPI.getAll().then((res) => res.data),
  });

  const { data: examsRes } = useQuery({
    queryKey: ["exams"],
    queryFn: () => examsAPI.getAll().then((res) => res.data),
  });

  const { data: questionsRes } = useQuery({
    queryKey: ["questions"],
    queryFn: () => questionsAPI.getAll().then((res) => res.data),
  });

  const { data: categoriesRes } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesAPI.getAll().then((res) => res.data),
  });

  const stats = [
    {
      title: "Total Students",
      value: users?.users?.filter((u) => u.role === "student").length || 0,
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Exams",
      value: examsRes?.exams?.length || 0,
      icon: ClipboardList,
      color: "from-purple-500 to-indigo-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Total Questions",
      value: questionsRes?.questions?.length || 0,
      icon: FileQuestion,
      color: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Categories",
      value: categoriesRes?.categories?.length || 0,
      icon: FolderOpen,
      color: "from-amber-500 to-orange-500",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-800">
          Welcome back, Admin 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening in your aviation exam platform today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 group"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`p-4 rounded-2xl ${stat.bg} group-hover:scale-110 transition-transform`}
                  >
                    <Icon
                      size={32}
                      className={`bg-clip-text bg-gradient-to-r text-${stat.color}`}
                    />
                  </div>
                </div>
                {/* <div className="mt-4 flex items-center text-xs text-green-600 font-medium">
                  <TrendingUp size={16} />
                  <span className="ml-1">+12% from last month</span>
                </div> */}
              </div>
              <div
                className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${stat.color}`}
              />
            </div>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Exams */}
        <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Recent Exams</h2>
            <Clock className="text-blue-600" size={22} />
          </div>
          <div className="space-y-4">
            {examsRes?.exams?.length > 0 ? (
              examsRes?.exams?.slice(0, 5).map((exam) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-white/50 transition"
                >
                  <div>
                    <p className="font-semibold text-gray-800">{exam.name}</p>
                    <p className="text-sm text-gray-500">
                      {exam.category} • {exam.questions.length} questions
                    </p>
                  </div>
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                    Active
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <FolderOpen size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-600">No recent exams found</p>
              </div>
            )}
          </div>
        </div>

        {/* Question Distribution */}
        <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Question Distribution
          </h2>
          <div className="space-y-4">
            {categoriesRes?.categories?.map((cat) => {
              const count =
                questionsRes?.questions?.filter(
                  (q) => q.categoryId?.name === cat.name
                ).length || 0;
              const percentage = questionsRes?.questions?.length
                ? (count / questionsRes.questions.length) * 100
                : 0;

              return (
                <div key={cat.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      {cat.name}
                    </span>
                    <span className="text-gray-600">{count} questions</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-700"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
