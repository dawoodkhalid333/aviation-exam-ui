import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { examsAPI, assignmentsAPI, usersAPI } from "../../lib/api";
import {
  ArrowLeft,
  UserPlus,
  Edit,
  ShieldCheck,
  CalendarClock,
  Trash2,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { useMemo, useState } from "react";

export default function ExamDetails() {
  const { id } = useParams();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [assignmentSettings, setAssignmentSettings] = useState({
    allowedAttempts: "",
    opensAt: "",
    closesAt: "",
    isReviewAllowed: true,
  });
  const [editingAssignment, setEditingAssignment] = useState(null);
  const queryClient = useQueryClient();

  const { data: exam, isLoading: examLoading } = useQuery({
    queryKey: ["exam", id],
    queryFn: () => examsAPI.getById(id).then((res) => res.data.exam),
  });

  const { data: studentsData } = useQuery({
    queryKey: ["students"],
    queryFn: () => usersAPI.getAll().then((res) => res.data.users || []),
  });

  const { data: assignmentsData, isLoading: assignmentsLoading } = useQuery({
    queryKey: ["assignments"],
    queryFn: () =>
      assignmentsAPI.getAll().then((res) => res.data.assignments || []),
  });

  const assignments = useMemo(() => {
    return (assignmentsData || []).filter((a) => a.examId.id === id);
  }, [assignmentsData, id]);

  const unassignedStudents = useMemo(() => {
    if (!studentsData || !assignments) return studentsData || [];
    const assignedIds = new Set(
      assignments.map((a) => a.studentId.id.toString())
    );
    return studentsData.filter((s) => !assignedIds.has(s.id));
  }, [studentsData, assignments]);

  const bulkAssignMutation = useMutation({
    mutationFn: assignmentsAPI.bulkCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      setShowAssignModal(false);
      setSelectedStudents([]);
      setAssignmentSettings({
        allowedAttempts: "",
        opensAt: "",
        closesAt: "",
        isReviewAllowed: true,
      });
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: ({ assignmentId, data }) =>
      assignmentsAPI.update(assignmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      setEditingAssignment(null);
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: assignmentsAPI.delete,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["assignments"] }),
  });

  const handleBulkAssign = () => {
    if (selectedStudents.length === 0) return;

    const payload = {
      examId: id,
      studentIds: selectedStudents,
      allowedAttempts: assignmentSettings.allowedAttempts
        ? Number(assignmentSettings.allowedAttempts)
        : undefined,
      opensAt: assignmentSettings.opensAt
        ? new Date(assignmentSettings.opensAt).toISOString()
        : undefined,
      closesAt: assignmentSettings.closesAt
        ? new Date(assignmentSettings.closesAt).toISOString()
        : undefined,
      isReviewAllowed: assignmentSettings.isReviewAllowed,
    };

    bulkAssignMutation.mutate(payload);
  };

  const openEditModal = (assignment) => {
    setEditingAssignment({
      ...assignment,
      opensAt: assignment.opensAt
        ? new Date(assignment.opensAt).toISOString().slice(0, 16)
        : "",
      closesAt: assignment.closesAt
        ? new Date(assignment.closesAt).toISOString().slice(0, 16)
        : "",
    });
  };

  const handleUpdateAssignment = (e) => {
    e.preventDefault();
    if (!editingAssignment) return;

    const data = {
      allowedAttempts: editingAssignment.allowedAttempts
        ? Number(editingAssignment.allowedAttempts)
        : undefined,
      opensAt: editingAssignment.opensAt
        ? new Date(editingAssignment.opensAt).toISOString()
        : undefined,
      closesAt: editingAssignment.closesAt
        ? new Date(editingAssignment.closesAt).toISOString()
        : undefined,
      isReviewAllowed: editingAssignment.isReviewAllowed,
    };

    updateAssignmentMutation.mutate({
      assignmentId: editingAssignment.id,
      data,
    });
  };

  if (examLoading) {
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
      {/* Back Button */}
      <Link to="/admin/exams" className="btn btn-outline mb-4">
        <ArrowLeft size={18} />
        Back to Exams
      </Link>

      {/* Exam Info Card */}
      <div className="card mb-4">
        <div className="flex-between mb-4">
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1f2937" }}>
            {exam.name}
          </h1>
          <button
            className="btn btn-primary"
            onClick={() => setShowAssignModal(true)}
          >
            <UserPlus size={18} />
            Assign Students
          </button>
        </div>

        <div className="grid grid-3">
          <div>
            <p className="text-sm text-gray">Category</p>
            <p style={{ fontWeight: "600", marginTop: "4px" }}>
              {exam.categoryId?.name || "Uncategorized"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray">Type</p>
            <p style={{ fontWeight: "600", marginTop: "4px" }}>
              {exam.type === "timed"
                ? `Timed (${exam.duration} mins)`
                : "Untimed"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray">Questions</p>
            <p style={{ fontWeight: "600", marginTop: "4px" }}>
              {exam.questions?.length || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray">Default Attempts</p>
            <p style={{ fontWeight: "600", marginTop: "4px" }}>
              {exam.defaultAttempts || 1}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray">Default Expiry</p>
            <p style={{ fontWeight: "600", marginTop: "4px" }}>
              {exam.defaultExpiry} day{exam.defaultExpiry !== 1 ? "s" : ""}{" "}
              after start
            </p>
          </div>
          <div>
            <p className="text-sm text-gray">Review Mode</p>
            <p style={{ fontWeight: "600", marginTop: "4px" }}>
              {exam.reviewMode === "practice" ? "Practice" : "Assessment"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray">Opens At</p>
            <p style={{ fontWeight: "600", marginTop: "4px" }}>
              {exam.opensAt
                ? format(new Date(exam.opensAt), "MMM d, yyyy h:mm a")
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray">Closes At</p>
            <p style={{ fontWeight: "600", marginTop: "4px" }}>
              {exam.closesAt
                ? format(new Date(exam.closesAt), "MMM d, yyyy h:mm a")
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="card">
        <div className="flex-between mb-4">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <ShieldCheck size={20} style={{ color: "#2563eb" }} />
            <h2 style={{ fontSize: "20px", fontWeight: "600" }}>
              Student Assignments
            </h2>
            <span className="text-sm text-gray">
              {assignments.length} student{assignments.length !== 1 ? "s" : ""}{" "}
              assigned
            </span>
          </div>
        </div>

        {assignmentsLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : assignments.length === 0 ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              color: "#6b7280",
            }}
          >
            <Users size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
            <p style={{ fontSize: "16px", marginBottom: "16px" }}>
              No students assigned yet
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setShowAssignModal(true)}
            >
              Assign Students
            </button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Attempts</th>
                <th>Opens At</th>
                <th>Closes At</th>
                <th>Review</th>
                <th style={{ width: "160px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td>
                    <div>
                      <p style={{ fontWeight: "600" }}>
                        {assignment.studentId.name}
                      </p>
                      <span className="text-xs text-gray">
                        {assignment.studentId.email}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-blue">
                      {assignment.attemptsUsed || 0} /{" "}
                      {assignment.allowedAttempts}
                    </span>
                  </td>
                  <td>
                    {assignment.opensAt ? (
                      format(new Date(assignment.opensAt), "MMM d, h:mm a")
                    ) : (
                      <span className="text-gray">Default</span>
                    )}
                  </td>
                  <td>
                    {assignment.closesAt ? (
                      format(new Date(assignment.closesAt), "MMM d, h:mm a")
                    ) : (
                      <span className="text-gray">Default</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        assignment.isReviewAllowed
                          ? "badge-green"
                          : "badge-gray"
                      }`}
                    >
                      {assignment.isReviewAllowed ? "Allowed" : "Disabled"}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-outline"
                        style={{ padding: "6px 10px" }}
                        onClick={() => openEditModal(assignment)}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: "6px 10px" }}
                        onClick={() => {
                          if (confirm("Remove this student's assignment?")) {
                            deleteAssignmentMutation.mutate(assignment.id);
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Bulk Assign Modal */}
      {showAssignModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAssignModal(false)}
        >
          <div
            className="modal"
            style={{ maxWidth: "640px", width: "90%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontSize: "22px",
                fontWeight: "700",
                marginBottom: "20px",
              }}
            >
              Assign Exam to Students
            </h2>

            <p className="text-sm text-gray mb-4">
              Leave fields empty to use exam defaults.
            </p>

            <div
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              {unassignedStudents.length === 0 ? (
                <p
                  style={{
                    padding: "32px",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  All students are already assigned.
                </p>
              ) : (
                unassignedStudents.map((student) => (
                  <label
                    key={student.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      borderBottom: "1px solid #f3f4f6",
                      cursor: "pointer",
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: "500" }}>{student.name}</p>
                      <span className="text-xs text-gray">{student.email}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={(e) =>
                        setSelectedStudents((prev) =>
                          e.target.checked
                            ? [...prev, student.id]
                            : prev.filter((id) => id !== student.id)
                        )
                      }
                    />
                  </label>
                ))
              )}
            </div>

            <div className="grid grid-2 gap-4 mb-4">
              <div className="form-group">
                <label className="label">Allowed Attempts (optional)</label>
                <input
                  type="number"
                  min="1"
                  className="input"
                  placeholder={`Default: ${exam.defaultAttempts || 1}`}
                  value={assignmentSettings.allowedAttempts}
                  onChange={(e) =>
                    setAssignmentSettings((prev) => ({
                      ...prev,
                      allowedAttempts: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="label">Review Allowed</label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "8px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={assignmentSettings.isReviewAllowed}
                    onChange={(e) =>
                      setAssignmentSettings((prev) => ({
                        ...prev,
                        isReviewAllowed: e.target.checked,
                      }))
                    }
                  />
                  <span>Allow review after submission</span>
                </label>
              </div>
            </div>

            <div className="grid grid-2 gap-4">
              <div className="form-group">
                <label className="label">Custom Opens At (optional)</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={assignmentSettings.opensAt}
                  onChange={(e) =>
                    setAssignmentSettings((prev) => ({
                      ...prev,
                      opensAt: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="label">Custom Closes At (optional)</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={assignmentSettings.closesAt}
                  min={assignmentSettings.opensAt}
                  onChange={(e) =>
                    setAssignmentSettings((prev) => ({
                      ...prev,
                      closesAt: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div
              className="flex"
              style={{
                justifyContent: "flex-end",
                marginTop: "24px",
                gap: "12px",
              }}
            >
              <button
                className="btn btn-outline"
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={
                  selectedStudents.length === 0 || bulkAssignMutation.isPending
                }
                onClick={handleBulkAssign}
              >
                {bulkAssignMutation.isPending
                  ? "Assigning..."
                  : `Assign to ${selectedStudents.length} Student${
                      selectedStudents.length > 1 ? "s" : ""
                    }`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {editingAssignment && (
        <div
          className="modal-overlay"
          onClick={() => setEditingAssignment(null)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "700",
                marginBottom: "20px",
              }}
            >
              Edit Assignment: {editingAssignment.studentId.name}
            </h3>
            <form onSubmit={handleUpdateAssignment}>
              <div className="grid grid-2 gap-4 mb-4">
                <div className="form-group">
                  <label className="label">Allowed Attempts</label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={editingAssignment.allowedAttempts || ""}
                    onChange={(e) =>
                      setEditingAssignment((prev) => ({
                        ...prev,
                        allowedAttempts: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="label">Review Allowed</label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "8px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={editingAssignment.isReviewAllowed}
                      onChange={(e) =>
                        setEditingAssignment((prev) => ({
                          ...prev,
                          isReviewAllowed: e.target.checked,
                        }))
                      }
                    />
                    <span>Allow review</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-2 gap-4">
                <div className="form-group">
                  <label className="label">Opens At</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={editingAssignment.opensAt}
                    onChange={(e) =>
                      setEditingAssignment((prev) => ({
                        ...prev,
                        opensAt: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="label">Closes At</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={editingAssignment.closesAt}
                    min={editingAssignment.opensAt}
                    onChange={(e) =>
                      setEditingAssignment((prev) => ({
                        ...prev,
                        closesAt: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div
                className="flex"
                style={{
                  justifyContent: "flex-end",
                  marginTop: "24px",
                  gap: "12px",
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditingAssignment(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updateAssignmentMutation.isPending}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
