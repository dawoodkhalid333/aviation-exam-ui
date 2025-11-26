import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { examsAPI } from "../../lib/api";
import {
  Plus,
  Eye,
  Trash2,
  Clock,
  Calendar,
  FileQuestion,
  AlertCircle,
  Edit,
} from "lucide-react";
import { format } from "date-fns";

export default function Exams() {
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: ["exams"],
    queryFn: () => examsAPI.getAll().then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: examsAPI.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exams"] }),
  });

  const exams = data?.exams || [];

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
            <FileQuestion className="text-blue-600" size={40} />
            Exams
          </h1>
          <p className="text-gray-600 mt-2">
            Create and manage aviation certification exams
          </p>
        </div>

        <Link
          to="/admin/exams/create"
          className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
        >
          <Plus size={22} />
          Create New Exam
        </Link>
      </div>

      {/* Exams Grid */}
      {exams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {exams.map((exam) => {
            const isActive =
              exam.opensAt && exam.closesAt
                ? new Date() >= new Date(exam.opensAt) &&
                  new Date() <= new Date(exam.closesAt)
                : false;

            const isUpcoming =
              exam.opensAt && new Date() < new Date(exam.opensAt);
            // const isClosed =
            //   exam.closesAt && new Date() > new Date(exam.closesAt);

            return (
              <div
                key={exam.id}
                className="group relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Gradient Top Bar */}
                <div
                  className={`h-2 ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                      : "bg-gradient-to-r from-blue-500 to-cyan-500"
                  }`}
                />

                <div className="p-6">
                  {/* Status & Type Badges */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : isUpcoming
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {isActive ? "Live" : isUpcoming ? "Upcoming" : "Closed"}
                    </span>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        exam.type === "timed"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {exam.type === "timed" ? "Timed" : "Practice"}
                    </span>
                  </div>

                  {/* Exam Name */}
                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition">
                    {exam.name}
                  </h3>

                  {/* Category */}
                  <p className="text-sm text-gray-600 mb-4">
                    {exam.categoryId?.name || "Uncategorized"}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-5 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <FileQuestion size={18} className="text-blue-600" />
                      <span>{exam.questions?.length || 0} Questions</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock size={18} className="text-purple-600" />
                      <span>
                        {exam.duration
                          ? `${exam.duration / 60} mins`
                          : "No limit"}
                      </span>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-2 text-xs text-gray-600 border-t border-gray-200 pt-4">
                    {exam.opensAt ? (
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-green-600" />
                        <span>
                          Opens:{" "}
                          {format(
                            new Date(exam.opensAt),
                            "MMM d, yyyy • h:mm a"
                          )}
                        </span>
                      </div>
                    ) : (
                      <div className="text-gray-500 italic">
                        No opening date
                      </div>
                    )}

                    {exam.closesAt ? (
                      <div className="flex items-center gap-2">
                        <AlertCircle size={14} className="text-red-600" />
                        <span>
                          Closes:{" "}
                          {format(
                            new Date(exam.closesAt),
                            "MMM d, yyyy • h:mm a"
                          )}
                        </span>
                      </div>
                    ) : (
                      <div className="text-gray-500 italic">
                        No closing date
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-200">
                    <Link
                      to={`/admin/exams/${exam.id}`}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <Eye size={18} />
                      View Details
                    </Link>
                    <Link
                      to={`/admin/exams/${exam.id}/edit`}
                      className="p-3 text-amber-600 hover:bg-amber-50 rounded-xl transition-all duration-200"
                    >
                      <Edit size={20} /> {/* Add this import */}
                    </Link>

                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            "Delete this exam permanently? This will delete all associated assignments too."
                          )
                        ) {
                          deleteMutation.mutate(exam.id);
                        }
                      }}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20">
          <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <FileQuestion size={64} className="text-gray-400" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-700 mb-2">
            No exams created yet
          </h3>
          <p className="text-gray-500 mb-8">
            Start by creating your first certification exam
          </p>
          <Link
            to="/admin/exams/create"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            <Plus size={24} />
            Create Your First Exam
          </Link>
        </div>
      )}
    </div>
  );
}
