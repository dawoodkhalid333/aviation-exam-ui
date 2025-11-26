import { useMutation, useQuery } from "@tanstack/react-query";
import { assignmentsAPI, sessionsAPI } from "../../lib/api";
import {
  PlayCircle,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Timer,
  BookOpen,
  Eye,
  Lock,
  EyeOff,
} from "lucide-react";
import { format, isPast, isFuture } from "date-fns";
import { useNavigate } from "react-router-dom";

// ──────────────────────────────────────────────────────────────
// BULLETPROOF DATE UTILITIES – NEVER CRASH AGAIN
// ──────────────────────────────────────────────────────────────
const toSafeDate = (timestamp) => {
  if (!timestamp) return null;
  const num = Number(timestamp);
  if (isNaN(num) || num === 0) return null;
  const date =
    num.toString().length <= 10 ? new Date(num * 1000) : new Date(num);
  return isNaN(date.getTime()) ? null : date;
};

const formatDate = (date, fmt = "dd MMM yyyy, HH:mm") => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return "—";
  }
  return format(date, fmt);
};

export default function StudentExams() {
  const navigate = useNavigate();

  const { data: myAssignments = [], isLoading } = useQuery({
    queryKey: ["assignments"],
    queryFn: () =>
      assignmentsAPI.getAll().then((res) => res.data.assignments || []),
  });

  const startMutation = useMutation({
    mutationFn: (assignmentId) => sessionsAPI.start({ assignmentId }),
  });

  const resumeMutation = useMutation({
    mutationFn: (sessionId) => sessionsAPI.resume(sessionId),
  });

  const startExam = async (assignmentId) => {
    try {
      const { data } = await startMutation.mutateAsync(assignmentId);
      navigate(`/student/exams/${assignmentId}/take`, {
        state: { startRes: data },
      });
    } catch (err) {
      console.error("Failed to start exam:", err);
    }
  };

  const resumeExam = async (session) => {
    try {
      const { data } = await resumeMutation.mutateAsync(session.id);
      navigate(`/student/exams/${session.assignmentId}/take`, {
        state: { startRes: data },
      });
    } catch (err) {
      console.error("Failed to resume exam:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-20 h-20 border-6 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-5xl font-bold text-gray-800 mb-4">My Exams</h1>
        <p className="text-xl text-gray-600">
          Select an exam to begin or continue your assessment
        </p>
      </div>

      {/* Empty State */}
      {myAssignments.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-32 h-32 mx-auto mb-8 bg-gray-100 rounded-full flex items-center justify-center">
            <BookOpen size={72} className="text-gray-400" />
          </div>
          <h3 className="text-3xl font-bold text-gray-700 mb-4">
            No exams assigned yet
          </h3>
          <p className="text-gray-500 text-lg max-w-md mx-auto">
            Your instructor will assign exams when you're ready to begin
            training modules.
          </p>
        </div>
      ) : (
        <div className="grid gap-8">
          {myAssignments.map((assignment) => {
            const exam = assignment.examId;
            const opensAt = toSafeDate(assignment.opensAt);
            const closesAt = toSafeDate(assignment.closesAt);

            const isNotStarted = opensAt && isFuture(opensAt);
            const isExpired = closesAt && isPast(closesAt);
            const attemptsLeft =
              assignment.allowedAttempts - (assignment.attemptsUsed || 0);
            const hasActiveSession = !!assignment.sessionToResume?.id;
            const canStart = !isNotStarted && !isExpired && attemptsLeft > 0;

            return (
              <div
                key={assignment.id}
                className="group relative rounded-3xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-blue-500 to-cyan-500" />

                <div className="p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    {/* Exam Details */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition">
                          {exam.name}
                        </h3>
                        {canStart && (
                          <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold flex items-center gap-2">
                            <CheckCircle2 size={16} />
                            Ready to Start
                          </span>
                        )}
                      </div>

                      {/* Meta Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Timer size={18} className="text-blue-600" />
                          <span>
                            {exam.type === "timed"
                              ? `${exam.duration / 60} min`
                              : "Untimed"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <BookOpen size={18} className="text-blue-600" />
                          <span>{exam.questions?.length || 0} questions</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <div className="w-4 h-4 bg-blue-500 rounded"></div>
                          <span>{exam.categoryId?.name || "General"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {assignment.isReviewAllowed ? (
                            <Eye size={18} className="text-emerald-600" />
                          ) : (
                            <EyeOff size={18} className="text-gray-400" />
                          )}
                          <span
                            className={
                              assignment.isReviewAllowed
                                ? "text-emerald-700"
                                : "text-gray-500"
                            }
                          >
                            {assignment.isReviewAllowed
                              ? "Review Allowed"
                              : "No Review"}
                          </span>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="flex flex-wrap gap-6 text-sm">
                        {opensAt ? (
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-500" />
                            <span
                              className={
                                isNotStarted
                                  ? "text-amber-600 font-medium"
                                  : "text-gray-600"
                              }
                            >
                              Opens: {formatDate(opensAt)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500 italic">
                            Available anytime
                          </span>
                        )}

                        {closesAt && (
                          <div className="flex items-center gap-2">
                            <Clock
                              size={16}
                              className={
                                isExpired ? "text-red-600" : "text-gray-500"
                              }
                            />
                            <span
                              className={
                                isExpired
                                  ? "text-red-600 font-medium"
                                  : "text-gray-600"
                              }
                            >
                              Closes: {formatDate(closesAt)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-3 mt-6">
                        <span
                          className={`px-4 py-2 rounded-full font-bold text-sm ${
                            attemptsLeft > 0
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {attemptsLeft} / {assignment.allowedAttempts} Attempts
                        </span>
                        {exam.reviewMode === "practice" && (
                          <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full font-bold text-sm">
                            Practice Mode
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action / Status */}
                    <div className="flex flex-col items-end gap-5">
                      {isNotStarted && (
                        <div className="text-center">
                          <Lock
                            size={36}
                            className="mx-auto text-amber-500 mb-2"
                          />
                          <p className="text-amber-600 font-medium">
                            Not Yet Open
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Opens {formatDate(opensAt, "dd MMM 'at' HH:mm")}
                          </p>
                        </div>
                      )}

                      {isExpired && (
                        <div className="text-center">
                          <XCircle
                            size={36}
                            className="mx-auto text-red-500 mb-2"
                          />
                          <p className="text-red-600 font-medium">
                            Exam Expired
                          </p>
                        </div>
                      )}

                      {attemptsLeft <= 0 && !isExpired && !isNotStarted && (
                        <div className="text-center">
                          <AlertCircle
                            size={36}
                            className="mx-auto text-gray-500 mb-2"
                          />
                          <p className="text-gray-600 font-medium">
                            No Attempts Left
                          </p>
                        </div>
                      )}

                      {canStart && (
                        <button
                          onClick={() =>
                            hasActiveSession
                              ? resumeExam(assignment.sessionToResume)
                              : startExam(assignment.id)
                          }
                          disabled={
                            startMutation.isPending || resumeMutation.isPending
                          }
                          className="group relative inline-flex items-center gap-4 px-10 py-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold text-xl rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          <PlayCircle size={32} />
                          <span className="tracking-wide">
                            {startMutation.isPending || resumeMutation.isPending
                              ? "Preparing..."
                              : hasActiveSession
                              ? "Resume Exam"
                              : "Start Exam"}
                          </span>
                          <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-20 transition"></div>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
