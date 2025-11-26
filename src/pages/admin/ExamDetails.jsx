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
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import BulkAssignStudentSelect from "../../components/BulkAssignStudentSelect";

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
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: exam, isLoading: examLoading } = useQuery({
    queryKey: ["exam", id],
    queryFn: () => examsAPI.getById(id).then((res) => res.data.exam),
  });

  const { data: studentsData } = useQuery({
    queryKey: ["students"],
    queryFn: () =>
      usersAPI
        .getAll()
        .then((res) =>
          (res.data.users || []).filter((user) => user.role === "student")
        ),
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
    return studentsData.filter((s) => !assignedIds.has(s.id.toString()));
  }, [studentsData, assignments]);

  const filteredAssignments = useMemo(() => {
    if (!searchTerm.trim()) return assignments;

    const lowerSearch = searchTerm.toLowerCase();
    return assignments.filter((assignment) => {
      const studentName = assignment.studentId.name?.toLowerCase() || "";
      const studentEmail = assignment.studentId.email?.toLowerCase() || "";
      return (
        studentName.includes(lowerSearch) || studentEmail.includes(lowerSearch)
      );
    });
  }, [assignments, searchTerm]);

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
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isActive =
    exam.opensAt && exam.closesAt
      ? new Date() >= new Date(exam.opensAt) &&
        new Date() <= new Date(exam.closesAt)
      : false;

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link
        to="/admin/exams"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium hover:underline"
      >
        <ArrowLeft size={20} />
        Back to Exams
      </Link>

      {/* Header + Assign Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
            <ShieldCheck className="text-blue-600" size={40} />
            {exam.name}
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <span
              className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider ${
                isActive
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {isActive ? "Live Now" : "Scheduled"}
            </span>
            <span className="text-gray-600">
              {exam.questions?.length || 0} Questions • {assignments.length}{" "}
              Assigned
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowAssignModal(true)}
          className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
        >
          <UserPlus size={22} />
          Assign to Students
        </button>
      </div>

      {/* Exam Info Card */}
      <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Exam Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Category</p>
            <p className="font-semibold text-gray-800">
              {exam.categoryId?.name || "Uncategorized"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Type</p>
            <p className="font-semibold text-gray-800 capitalize">
              {exam.type === "timed"
                ? `Timed • ${exam.duration / 60} mins`
                : "Untimed"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Default Attempts</p>
            <p className="font-semibold text-gray-800">
              {exam.defaultAttempts || 1}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Review Mode</p>
            <p className="font-semibold text-gray-800 capitalize">
              {exam.reviewMode === "practice"
                ? "Practice (Allowed)"
                : "Assessment (Disabled)"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Calendar size={16} /> Opens At
            </p>
            <p className="font-semibold text-gray-800">
              {exam.opensAt ? format(new Date(exam.opensAt), "PPP • p") : "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <CalendarClock size={16} /> Closes At
            </p>
            <p className="font-semibold text-gray-800">
              {exam.closesAt ? format(new Date(exam.closesAt), "PPP • p") : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Assignments Section with Search */}
      <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Users className="text-blue-600" size={28} />
            <h2 className="text-2xl font-bold text-gray-800">
              Student Assignments
            </h2>
            <span className="text-gray-600">
              ({assignments.length} assigned
              {searchTerm && ` • ${filteredAssignments.length} shown`})
            </span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none w-full sm:w-80"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XCircle size={20} />
              </button>
            )}
          </div>
        </div>

        {assignmentsLoading ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-20">
            <Users size={72} className="mx-auto text-gray-300 mb-6" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No students assigned yet
            </h3>
            <p className="text-gray-500 mb-8">
              Assign students to make this exam available
            </p>
            <button
              onClick={() => setShowAssignModal(true)}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition"
            >
              <UserPlus size={22} />
              Assign Students
            </button>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <p className="text-xl font-medium text-gray-600">
              No students found
            </p>
            <p className="text-gray-500 mt-2">Try adjusting your search term</p>
            <button
              onClick={() => setSearchTerm("")}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                  <th className="pb-3">Student</th>
                  <th className="pb-3">Attempts</th>
                  <th className="pb-3">Opens At</th>
                  <th className="pb-3">Closes At</th>
                  <th className="pb-3">Review</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((assignment) => (
                  <tr
                    key={assignment.id}
                    className="border-b border-gray-100 hover:bg-blue-50/30 transition"
                  >
                    <td className="py-4">
                      <div>
                        <p className="font-medium text-gray-800">
                          {assignment.studentId.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {assignment.studentId.email}
                        </p>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {assignment.attemptsUsed || 0} /{" "}
                        {assignment.allowedAttempts || "∞"}
                      </span>
                    </td>
                    <td className="py-4 text-sm">
                      {assignment.opensAt ? (
                        <span className="text-gray-700">
                          {format(new Date(assignment.opensAt), "PP • p")}
                        </span>
                      ) : (
                        <span className="text-gray-500 italic">Default</span>
                      )}
                    </td>
                    <td className="py-4 text-sm">
                      {assignment.closesAt ? (
                        <span className="text-gray-700">
                          {format(new Date(assignment.closesAt), "PP • p")}
                        </span>
                      ) : (
                        <span className="text-gray-500 italic">Default</span>
                      )}
                    </td>
                    <td className="py-4">
                      {assignment.isReviewAllowed ? (
                        <CheckCircle2 className="text-emerald-600" size={20} />
                      ) : (
                        <XCircle className="text-gray-400" size={20} />
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(assignment)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                "Remove this student's assignment?"
                              )
                            ) {
                              deleteAssignmentMutation.mutate(assignment.id);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Assign Exam to Students
              </h2>
              <p className="text-gray-600 mb-6">
                Leave fields empty to use exam defaults
              </p>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Students ({selectedStudents.length} selected)
                </label>
                <BulkAssignStudentSelect
                  unassignedStudents={unassignedStudents}
                  selectedStudents={selectedStudents}
                  setSelectedStudents={setSelectedStudents}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Allowed Attempts (optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder={`Default: ${exam.defaultAttempts || 1}`}
                    value={assignmentSettings.allowedAttempts}
                    onChange={(e) =>
                      setAssignmentSettings((prev) => ({
                        ...prev,
                        allowedAttempts: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assignmentSettings.isReviewAllowed}
                      onChange={(e) =>
                        setAssignmentSettings((prev) => ({
                          ...prev,
                          isReviewAllowed: e.target.checked,
                        }))
                      }
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700 font-medium">
                      Allow review after submission
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Custom Opens At (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={assignmentSettings.opensAt}
                    onChange={(e) =>
                      setAssignmentSettings((prev) => ({
                        ...prev,
                        opensAt: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Custom Closes At (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={assignmentSettings.closesAt}
                    min={assignmentSettings.opensAt}
                    onChange={(e) =>
                      setAssignmentSettings((prev) => ({
                        ...prev,
                        closesAt: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAssign}
                  disabled={
                    selectedStudents.length === 0 ||
                    bulkAssignMutation.isPending
                  }
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed transition-all"
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
        </div>
      )}

      {/* Edit Assignment Modal */}
      {editingAssignment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Edit Assignment: {editingAssignment.studentId.name}
            </h3>
            <form onSubmit={handleUpdateAssignment} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Allowed Attempts
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingAssignment.allowedAttempts || ""}
                    onChange={(e) =>
                      setEditingAssignment((prev) => ({
                        ...prev,
                        allowedAttempts: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                  />
                </div>
                <div className="flex items-center justify-center">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingAssignment.isReviewAllowed}
                      onChange={(e) =>
                        setEditingAssignment((prev) => ({
                          ...prev,
                          isReviewAllowed: e.target.checked,
                        }))
                      }
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700 font-medium">
                      Allow Review
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Opens At
                  </label>
                  <input
                    type="datetime-local"
                    value={editingAssignment.opensAt}
                    onChange={(e) =>
                      setEditingAssignment((prev) => ({
                        ...prev,
                        opensAt: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Closes At
                  </label>
                  <input
                    type="datetime-local"
                    value={editingAssignment.closesAt}
                    min={editingAssignment.opensAt}
                    onChange={(e) =>
                      setEditingAssignment((prev) => ({
                        ...prev,
                        closesAt: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingAssignment(null)}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateAssignmentMutation.isPending}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-70 transition-all"
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
