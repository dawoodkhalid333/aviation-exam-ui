import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "../../lib/api";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import {
  UserPlus,
  X,
  Search,
  Users,
  Calendar,
  Mail,
  Edit3,
  Trash2,
} from "lucide-react";

export default function Students() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "", // optional on edit
  });
  const [error, setError] = useState("");

  const queryClient = useQueryClient();

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () =>
      usersAPI
        .getAll()
        .then(
          (res) => res.data?.users?.filter((u) => u.role === "student") || []
        ),
  });

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const term = searchTerm.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: () =>
      usersAPI.create({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: "student",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      closeModals();
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Failed to create student");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: () =>
      usersAPI.update(selectedStudent.id, {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        ...(formData.password && { password: formData.password }), // only send if provided
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      closeModals();
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Failed to update student");
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => usersAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Failed to delete student");
    },
  });

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedStudent(null);
    setFormData({ name: "", email: "", password: "" });
    setError("");
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      password: "",
    });
    setError("");
    setShowEditModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.email) {
      setError("Name and email are required");
      return;
    }

    if (showAddModal && formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (showAddModal) {
      createMutation.mutate();
    } else {
      updateMutation.mutate();
    }
  };

  if (isLoading) {
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
            <Users className="text-blue-600" size={40} />
            Students
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your aviation students and their accounts
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-gray-600">
            Total: <strong className="text-blue-600">{students.length}</strong>{" "}
            student
            {students.length !== 1 ? "s" : ""}
            {searchTerm && (
              <>
                {" • "}Showing:{" "}
                <strong className="text-blue-600">
                  {filteredStudents.length}
                </strong>
              </>
            )}
          </div>

          <button
            onClick={() => {
              setShowAddModal(true);
              setFormData({ name: "", email: "", password: "" });
              setError("");
            }}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            <UserPlus size={22} />
            Add Student
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-2xl">
        <Search
          className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
          size={22}
        />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-14 pr-12 py-4 bg-white/70 backdrop-blur-xl border border-white/30 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all text-gray-800 placeholder-gray-500"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Students Grid or Empty State */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-32 h-32 mx-auto mb-8 bg-gray-100 rounded-full flex items-center justify-center">
            {searchTerm ? (
              <Search size={64} className="text-gray-400" />
            ) : (
              <Users size={64} className="text-gray-400" />
            )}
          </div>
          <h3 className="text-2xl font-semibold text-gray-700 mb-3">
            {searchTerm
              ? `No students found for "${searchTerm}"`
              : "No students registered yet"}
          </h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            {searchTerm
              ? "Try adjusting your search terms"
              : "Get started by adding your first student"}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              <UserPlus size={24} />
              Add Your First Student
            </button>
          )}
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl transition-all duration-300"
            >
              <Link
                to={`/admin/students/${student.id}`}
                className="block p-6 pb-4 group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition">
                      {student.name}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                      <Mail size={14} />
                      {student.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={16} />
                    <span>
                      Joined{" "}
                      {format(new Date(student.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                  <span className="text-blue-600 font-medium group-hover:translate-x-1 transition">
                    View Profile →
                  </span>
                </div>
              </Link>

              {/* Edit button in bottom-right corner */}
              <div className="px-6 pb-6">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(student);
                  }}
                  className="cursor-pointer mt-4 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition"
                >
                  <Edit3 size={18} />
                  Edit Student
                </button>
              </div>
              <div className="px-6 pb-6">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      window.confirm(
                        `Are you sure you want to delete student "${student.name}"? This action cannot be undone.`
                      )
                    ) {
                      deleteMutation.mutate(student.id);
                    }
                  }}
                  className="cursor-pointer mt-2 flex items-center gap-2 text-sm text-red-600 hover:text-red-800 font-medium transition"
                >
                  <Trash2 size={18} />
                  Delete Student
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal (shared) */}
      {(showAddModal || showEditModal) && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeModals}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <UserPlus size={28} className="text-blue-600" />
                {showEditModal ? "Edit Student" : "Add New Student"}
              </h2>
              <button
                onClick={closeModals}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="John Doe"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password{" "}
                  {showAddModal && <span className="text-red-500">*</span>}
                  {showEditModal && (
                    <span className="text-gray-500 text-xs font-normal">
                      {" (leave blank to keep current)"}
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder={
                    showAddModal
                      ? "Minimum 6 characters"
                      : "Enter new password to change"
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={closeModals}
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-70 transition-all"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : showEditModal
                    ? "Update Student"
                    : "Create Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
