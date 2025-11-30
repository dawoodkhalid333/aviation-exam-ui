import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersAPI, assignmentsAPI, sessionsAPI } from "../../lib/api";
import {
  ArrowLeft,
  Shield,
  RefreshCw,
  Plus,
  Minus,
  Ban,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Mail,
  Filter,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

export default function StudentProfile() {
  const { studentId } = useParams();
  const queryClient = useQueryClient();

  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => usersAPI.getById(studentId).then((res) => res.data.user),
    enabled: !!studentId,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const { data: allAssignments = [] } = useQuery({
    queryKey: ["assignments"],
    queryFn: () =>
      assignmentsAPI.getAll().then((res) => res.data.assignments || []),
  });

  const { data: allSessions = [] } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => sessionsAPI.getAll().then((res) => res.data.sessions || []),
  });

  const studentAssignments = allAssignments.filter(
    (a) => a.studentId?.id === studentId
  );

  const studentSessions = allSessions.filter(
    (s) => s.assignmentId?.studentId?.id === studentId
  );

  // Filter sessions based on exam name
  const filteredSessions = studentSessions.filter((session) =>
    (session.assignmentId?.examId?.name || "Unknown")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const updateAssignment = useMutation({
    mutationFn: ({ assignmentId, data }) =>
      assignmentsAPI.update(assignmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  const deleteAssignment = useMutation({
    mutationFn: assignmentsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  const handleAdjustAttempts = (assignment, delta) => {
    const newAttempts = Math.max(1, (assignment.allowedAttempts || 1) + delta);
    updateAssignment.mutate({
      assignmentId: assignment.id,
      data: { allowedAttempts: newAttempts },
    });
  };

  const handleToggleReview = (assignment) => {
    updateAssignment.mutate({
      assignmentId: assignment.id,
      data: { isReviewAllowed: !assignment.isReviewAllowed },
    });
  };

  if (studentLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-20">
        <User size={72} className="mx-auto text-gray-300 mb-6" />
        <h3 className="text-2xl font-semibold text-gray-700">
          Student not found
        </h3>
      </div>
    );
  }

  const completedCount = studentSessions.filter((s) => s.submittedAt).length;
  const inProgressCount = studentSessions.length - completedCount;

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link
        to="/admin/students"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium hover:underline"
      >
        <ArrowLeft size={20} />
        Back to Students
      </Link>

      {/* Student Header */}
      <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-2xl">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800">
                {student.name}
              </h1>
              <p className="text-xl text-gray-600 mt-2 flex items-center gap-2">
                <Mail size={18} className="text-gray-500" />
                {student.email}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Joined {format(new Date(student.createdAt), "MMMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-blue-100 p-6 border border-sky-200">
            <p className="text-sm font-medium text-sky-700">Assigned Exams</p>
            <p className="text-4xl font-bold text-sky-900 mt-2">
              {studentAssignments.length}
            </p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-green-100 p-6 border border-emerald-200">
            <p className="text-sm font-medium text-emerald-700">Completed</p>
            <p className="text-4xl font-bold text-emerald-900 mt-2">
              {completedCount}
            </p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-100 p-6 border border-amber-200">
            <p className="text-sm font-medium text-amber-700">In Progress</p>
            <p className="text-4xl font-bold text-amber-900 mt-2">
              {inProgressCount}
            </p>
          </div>
        </div>
      </div>

      {/* Exam Assignments */}
      <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="text-blue-600" size={28} />
            <h2 className="text-2xl font-bold text-gray-800">
              Exam Assignments
            </h2>
          </div>
          <p className="text-sm text-gray-600">
            Adjust attempts • Toggle review • Remove access
          </p>
        </div>

        {studentAssignments.length === 0 ? (
          <div className="text-center py-16">
            <Shield size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              No exams assigned to this student yet
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                  <th className="pb-4">Exam</th>
                  <th className="pb-4">Attempts</th>
                  <th className="pb-4">Used</th>
                  <th className="pb-4">Opens / Closes</th>
                  <th className="pb-4">Review</th>
                  <th className="pb-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentAssignments.map((assignment) => {
                  const exam = assignment.examId;
                  const opens = assignment.opensAt
                    ? format(new Date(assignment.opensAt), "MMM d, h:mm a")
                    : "Default";
                  const closes = assignment.closesAt
                    ? format(new Date(assignment.closesAt), "MMM d, h:mm a")
                    : "Default";

                  return (
                    <tr
                      key={assignment.id}
                      className="border-b border-gray-100 hover:bg-blue-50/30 transition"
                    >
                      <td className="py-5">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {exam?.name || "Unknown"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {exam?.categoryId?.name || "Uncategorized"}
                          </p>
                        </div>
                      </td>
                      <td className="py-5">
                        <span className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-bold text-sm">
                          {assignment.allowedAttempts || "∞"}
                        </span>
                      </td>
                      <td className="py-5">
                        <span className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                          {assignment.attemptsUsed || 0}
                        </span>
                      </td>
                      <td className="py-5 text-sm">
                        <div className="text-gray-700">{opens}</div>
                        <div className="text-red-600 font-medium">{closes}</div>
                      </td>
                      <td className="py-5">
                        <button
                          onClick={() => handleToggleReview(assignment)}
                          className="group relative"
                        >
                          {assignment.isReviewAllowed ? (
                            <CheckCircle2
                              className="text-emerald-600 group-hover:text-emerald-700 transition"
                              size={22}
                            />
                          ) : (
                            <XCircle
                              className="text-gray-400 group-hover:text-red-500 transition"
                              size={22}
                            />
                          )}
                        </button>
                      </td>
                      <td className="py-5">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleAdjustAttempts(assignment, 1)}
                            className="p-2.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition"
                          >
                            <Plus size={18} />
                          </button>
                          <button
                            onClick={() => handleAdjustAttempts(assignment, -1)}
                            disabled={(assignment.allowedAttempts || 1) <= 1}
                            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus size={18} />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Remove this exam assignment permanently?"
                                )
                              ) {
                                deleteAssignment.mutate(assignment.id);
                              }
                            }}
                            className="p-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition"
                          >
                            <Ban size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Sessions */}
      <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Clock className="text-blue-600" size={28} />
            Recent Exam Sessions
          </h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 sm:flex-initial">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by exam name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full sm:w-64 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="text-center py-16">
            <Clock size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {searchTerm
                ? `No exam sessions found matching "${searchTerm}"`
                : "No exam sessions started yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                  <th className="pb-4">Exam</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Started</th>
                  <th className="pb-4">Submitted</th>
                  <th className="pb-4">Time Left</th>
                  <th className="pb-4 text-center">Grade</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.slice(0, 10).map((session) => {
                  const isSubmitted = !!session.submittedAt;
                  const timeLeft = session.remainingTime;

                  return (
                    <tr
                      key={session.id}
                      className="border-b border-gray-100 hover:bg-blue-50/30 transition"
                    >
                      <td className="py-5 font-medium text-gray-800">
                        {session.assignmentId?.examId?.name || "Unknown"}
                      </td>
                      <td className="py-5">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                            isSubmitted
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {isSubmitted ? "Submitted" : "In Progress"}
                        </span>
                      </td>
                      <td className="py-5 text-sm text-gray-600">
                        {session.createdAt
                          ? format(new Date(session.createdAt), "MMM d, h:mm a")
                          : "—"}
                      </td>
                      <td className="py-5 text-sm text-gray-600">
                        {session.submittedAt
                          ? format(
                              new Date(session.submittedAt),
                              "MMM d, h:mm a"
                            )
                          : "—"}
                      </td>
                      <td className="py-5 text-sm">
                        {timeLeft === null ? (
                          <span className="text-gray-500 italic">Untimed</span>
                        ) : timeLeft === 0 ? (
                          <span className="text-red-600 font-medium">
                            Time Up
                          </span>
                        ) : timeLeft > 0 ? (
                          <span className="font-medium">
                            {Math.floor(timeLeft / 60)}m {timeLeft % 60}s
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-5 text-center">
                        {session.submittedAt ? (
                          <Link
                            to={`/admin/grades/${session.id}`}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl hover:shadow-lg transition-all"
                          >
                            <Eye size={18} />
                            View Grade
                          </Link>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
