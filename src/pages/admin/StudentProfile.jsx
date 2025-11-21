import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersAPI, assignmentsAPI, sessionsAPI } from "../../lib/api";
import { ArrowLeft, Shield, RefreshCw, Plus, Minus, Ban } from "lucide-react";
import { format } from "date-fns";

export default function StudentProfile() {
  const { studentId } = useParams();
  const queryClient = useQueryClient();

  // Fetch Student
  const { data: studentRes, isLoading: studentLoading } = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => usersAPI.getById(studentId).then((res) => res.data.user),
    enabled: Boolean(studentId),
  });

  // Fetch All Assignments (no query params anymore)
  const { data: allAssignmentsRes } = useQuery({
    queryKey: ["assignments"],
    queryFn: () =>
      assignmentsAPI.getAll().then((res) => res.data.assignments || []),
  });

  // Fetch All Sessions
  const { data: allSessionsRes } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => sessionsAPI.getAll().then((res) => res.data.sessions || []),
  });

  const studentAssignments = allAssignmentsRes
    ? allAssignmentsRes.filter((a) => a.studentId.id === studentId)
    : [];

  const studentSessions = allSessionsRes
    ? allSessionsRes.filter((s) => s.assignmentId?.studentId?.id === studentId)
    : [];

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
    const newAttempts = Math.max(1, assignment.allowedAttempts + delta);
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
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!studentRes) {
    return (
      <div className="container" style={{ padding: "40px" }}>
        <p className="error-text">Student not found.</p>
      </div>
    );
  }

  const completedCount = studentSessions.filter((s) => s.submittedAt).length;
  const inProgressCount = studentSessions.length - completedCount;

  return (
    <div
      className="container"
      style={{ paddingTop: "24px", paddingBottom: "40px" }}
    >
      {/* Back Button */}
      <Link to="/admin/students" className="btn btn-outline mb-4">
        <ArrowLeft size={18} />
        Back to Students
      </Link>

      {/* Student Header */}
      <div className="card mb-4">
        <div className="flex-between">
          <div>
            <h1
              style={{ fontSize: "28px", fontWeight: "700", color: "#1f2937" }}
            >
              {studentRes.name}
            </h1>
            <p style={{ color: "#6b7280", marginTop: "4px" }}>
              {studentRes.email}
            </p>
          </div>
          <button
            className="btn btn-outline"
            onClick={() => {
              queryClient.invalidateQueries({
                queryKey: ["student", studentId],
              });
              queryClient.invalidateQueries({ queryKey: ["assignments"] });
              queryClient.invalidateQueries({ queryKey: ["sessions"] });
            }}
          >
            <RefreshCw size={16} />
            Refresh Data
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-3 gap-4" style={{ marginTop: "24px" }}>
          <div
            className="card"
            style={{ background: "#f0f9ff", padding: "16px" }}
          >
            <p className="text-sm text-gray">Assigned Exams</p>
            <p
              style={{ fontSize: "32px", fontWeight: "700", color: "#0369a1" }}
            >
              {studentAssignments.length}
            </p>
          </div>
          <div
            className="card"
            style={{ background: "#ecfdf5", padding: "16px" }}
          >
            <p className="text-sm text-gray">Completed</p>
            <p
              style={{ fontSize: "32px", fontWeight: "700", color: "#15803d" }}
            >
              {completedCount}
            </p>
          </div>
          <div
            className="card"
            style={{ background: "#fef9c3", padding: "16px" }}
          >
            <p className="text-sm text-gray">In Progress</p>
            <p
              style={{ fontSize: "32px", fontWeight: "700", color: "#a16207" }}
            >
              {inProgressCount}
            </p>
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="card mb-4">
        <div className="flex-between mb-4">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Shield size={20} style={{ color: "#2563eb" }} />
            <h2 style={{ fontSize: "20px", fontWeight: "600" }}>
              Exam Assignments
            </h2>
          </div>
          <span className="text-sm text-gray">
            Manage attempts, review access, and remove assignments
          </span>
        </div>

        {studentAssignments.length === 0 ? (
          <div
            style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}
          >
            <p>No exams assigned to this student yet.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Exam</th>
                <th>Attempts</th>
                <th>Used</th>
                <th>Opens / Closes</th>
                <th>Review</th>
                <th style={{ width: "200px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {studentAssignments.map((assignment) => {
                const examName = assignment.examId?.name || "Unknown Exam";
                const opens = assignment.opensAt
                  ? format(new Date(assignment.opensAt), "MMM d, h:mm a")
                  : "Default";
                const closes = assignment.closesAt
                  ? format(new Date(assignment.closesAt), "MMM d, h:mm a")
                  : "Default";

                return (
                  <tr key={assignment.id}>
                    <td>
                      <div>
                        <p style={{ fontWeight: "600" }}>{examName}</p>
                        <span className="text-xs text-gray">
                          {assignment.examId?.categoryId?.name ||
                            "Uncategorized"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-blue">
                        {assignment.allowedAttempts}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-gray">
                        {assignment.attemptsUsed || 0}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: "12px" }}>
                        <div>{opens}</div>
                        <div style={{ color: "#dc2626" }}>{closes}</div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          assignment.isReviewAllowed
                            ? "badge-green"
                            : "badge-red"
                        }`}
                        style={{ cursor: "pointer" }}
                        onClick={() => handleToggleReview(assignment)}
                      >
                        {assignment.isReviewAllowed ? "Allowed" : "Disabled"}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-outline"
                          style={{ padding: "6px 10px" }}
                          onClick={() => handleAdjustAttempts(assignment, 1)}
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{ padding: "6px 10px" }}
                          onClick={() => handleAdjustAttempts(assignment, -1)}
                          disabled={assignment.allowedAttempts <= 1}
                        >
                          <Minus size={14} />
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: "6px 10px" }}
                          onClick={() => {
                            if (
                              confirm(
                                "Remove this exam assignment permanently?"
                              )
                            ) {
                              deleteAssignment.mutate(assignment.id);
                            }
                          }}
                        >
                          <Ban size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent Sessions */}
      <div className="card">
        <h2
          style={{ fontSize: "20px", fontWeight: "600", marginBottom: "16px" }}
        >
          Recent Exam Sessions
        </h2>

        {studentSessions.length === 0 ? (
          <p style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>
            No exam sessions started yet.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Exam</th>
                <th>Status</th>
                <th>Started</th>
                <th>Submitted</th>
                <th>Time Left</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {studentSessions.slice(0, 10).map((session) => {
                const isSubmitted = !!session.submittedAt;
                const timeLeft = session.remainingTime;

                return (
                  <tr key={session.id}>
                    <td style={{ fontWeight: "500" }}>
                      {session.assignmentId?.examId?.name || "Unknown"}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          isSubmitted ? "badge-green" : "badge-yellow"
                        }`}
                      >
                        {isSubmitted ? "Submitted" : "In Progress"}
                      </span>
                    </td>
                    <td>
                      {session.startedAt
                        ? format(
                            new Date(session.startedAt * 1000),
                            "MMM d, h:mm a"
                          )
                        : "—"}
                    </td>
                    <td>
                      {session.submittedAt
                        ? format(
                            new Date(session.submittedAt * 1000),
                            "MMM d, h:mm a"
                          )
                        : "—"}
                    </td>
                    <td>
                      {timeLeft === null ? (
                        <span className="text-gray">Untimed</span>
                      ) : timeLeft === 0 ? (
                        <span style={{ color: "#dc2626" }}>Time Up</span>
                      ) : timeLeft > 0 ? (
                        <span>
                          {Math.floor(timeLeft / 60)}m {timeLeft % 60}s
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <Link
                        to={`/admin/grades/${session.id}`}
                        className="btn btn-outline"
                        style={{ padding: "6px 12px", fontSize: "13px" }}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
