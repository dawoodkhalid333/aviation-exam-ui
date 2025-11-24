import { useMutation, useQuery } from "@tanstack/react-query";
import { assignmentsAPI, sessionsAPI } from "../../lib/api";
import { PlayCircle, Clock, Calendar, AlertCircle } from "lucide-react";
import { format, isPast, isFuture } from "date-fns";
import { useNavigate } from "react-router-dom";

// Safe date converter — handles both seconds and milliseconds
const toDate = (timestamp) => {
  if (!timestamp) return null;
  const str = timestamp.toString();
  return str.length <= 10 ? new Date(timestamp * 1000) : new Date(timestamp);
};

export default function StudentExams() {
  const navigate = useNavigate();
  const { data: myAssignments, isLoading } = useQuery({
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
      const response = await startMutation.mutateAsync(assignmentId);
      const startRes = response.data;
      navigate(`/student/exams/${assignmentId}/take`, { state: { startRes } });
    } catch (error) {
      console.error("Failed to start exam session:", error);
    }
  };
  const resumeExam = async (session) => {
    try {
      const response = await resumeMutation.mutateAsync(session?.id);
      const startRes = response.data;
      navigate(`/student/exams/${session?.assignmentId}/take`, {
        state: { startRes },
      });
    } catch (error) {
      console.error("Failed to start exam session:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div
      className="container"
      style={{ paddingTop: "24px", paddingBottom: "40px" }}
    >
      <h1
        style={{
          fontSize: "32px",
          fontWeight: "700",
          color: "#1f2937",
          marginBottom: "24px",
        }}
      >
        My Exams
      </h1>

      {myAssignments.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "60px" }}>
          <AlertCircle
            size={48}
            style={{ margin: "0 auto 16px", opacity: 0.3, color: "#6b7280" }}
          />
          <p style={{ color: "#6b7280", fontSize: "18px" }}>
            No exams have been assigned to you yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {myAssignments.map((assignment) => {
            const exam = assignment.examId;
            const opensAt = toDate(assignment.opensAt);
            const closesAt = toDate(assignment.closesAt);
            const isNotStarted = opensAt && isFuture(opensAt);
            const isExpired = closesAt && isPast(closesAt);
            const attemptsLeft =
              assignment.allowedAttempts - (assignment.attemptsUsed || 0);
            const canStart = !isNotStarted && !isExpired && attemptsLeft > 0;

            return (
              <div key={assignment.id} className="card">
                <div className="flex-between">
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontSize: "20px",
                        fontWeight: "600",
                        color: "#1f2937",
                        marginBottom: "8px",
                      }}
                    >
                      {exam.name}
                    </h3>

                    <div
                      className="flex gap-4 flex-wrap"
                      style={{ marginBottom: "12px" }}
                    >
                      <span className="text-sm text-gray">
                        <Clock
                          size={14}
                          style={{ display: "inline", marginRight: "4px" }}
                        />
                        {exam.type === "timed"
                          ? `${exam.duration / 60} mins`
                          : "Untimed"}
                      </span>
                      <span className="text-sm text-gray">
                        {exam.questions?.length || 0} questions
                      </span>
                      <span className="text-sm text-gray">
                        {exam.categoryId?.name || "General"}
                      </span>
                    </div>

                    <div className="flex gap-4 text-sm flex-wrap">
                      {opensAt && (
                        <span>
                          <Calendar
                            size={14}
                            style={{ display: "inline", marginRight: "4px" }}
                          />
                          Opens: {format(opensAt, "MMM d, yyyy h:mm a")}
                        </span>
                      )}
                      {closesAt && (
                        <span
                          style={{ color: isExpired ? "#dc2626" : "#374151" }}
                        >
                          Closes: {format(closesAt, "MMM d, yyyy h:mm a")}
                        </span>
                      )}
                      {!opensAt && !closesAt && (
                        <span className="text-sm text-gray">
                          Available anytime
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2 flex-wrap">
                      <span className="badge badge-blue">
                        Attempts Left: {attemptsLeft} /{" "}
                        {assignment.allowedAttempts}
                      </span>
                      <span
                        className={`badge ${
                          assignment.isReviewAllowed
                            ? "badge-green"
                            : "badge-gray"
                        }`}
                      >
                        {assignment.isReviewAllowed
                          ? "Review Allowed"
                          : "No Review"}
                      </span>
                      {exam.reviewMode === "practice" && (
                        <span className="badge badge-yellow">
                          Practice Mode
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ minWidth: "160px", textAlign: "right" }}>
                    {isNotStarted && (
                      <div>
                        <span className="badge badge-yellow">Not Started</span>
                        <p className="text-xs text-gray mt-2">
                          Opens {format(opensAt, "MMM d, h:mm a")}
                        </p>
                      </div>
                    )}

                    {isExpired && (
                      <span className="badge badge-red">Expired</span>
                    )}

                    {attemptsLeft <= 0 && !isExpired && !isNotStarted && (
                      <span className="badge badge-gray">No Attempts Left</span>
                    )}

                    {canStart && (
                      <button
                        className="btn btn-primary"
                        style={{ width: "100%", justifyContent: "center" }}
                        onClick={(e) => {
                          e.preventDefault();
                          if (assignment?.sessionToResume?.id) {
                            resumeExam(assignment?.sessionToResume);
                          } else startExam(assignment.id);
                        }}
                        disabled={!canStart || startMutation.isPending}
                      >
                        <PlayCircle size={18} />
                        {startMutation.isPending
                          ? "Starting..."
                          : assignment?.sessionToResume?.id
                          ? "Resume Exam"
                          : "Start Exam"}
                      </button>
                    )}

                    {!canStart &&
                      !isNotStarted &&
                      !isExpired &&
                      attemptsLeft > 0 && (
                        <span className="badge badge-gray">Unavailable</span>
                      )}
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
