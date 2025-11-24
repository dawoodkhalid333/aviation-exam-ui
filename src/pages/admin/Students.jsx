import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "../../lib/api";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { UserPlus, X } from "lucide-react";

export default function Students() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const queryClient = useQueryClient();

  const { data: students, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () =>
      usersAPI
        .getAll()
        .then(
          (res) => res.data?.users?.filter((u) => u.role === "student") || []
        ),
  });

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
      setShowAddModal(false);
      setFormData({ name: "", email: "", password: "" });
      setError("");
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Failed to create student");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.email || !formData.password) {
      setError("All fields are required");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    createMutation.mutate();
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
      {/* Header */}
      <div className="flex-between mb-4">
        <h1 style={{ fontSize: "32px", fontWeight: "700", color: "#1f2937" }}>
          Students
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span className="text-sm text-gray">
            Total: <strong>{students.length}</strong> student
            {students.length !== 1 ? "s" : ""}
          </span>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <UserPlus size={18} />
            Add Student
          </button>
        </div>
      </div>

      {/* Students Table */}
      {students.length === 0 ? (
        <div className="card">
          <div
            style={{
              padding: "60px 24px",
              textAlign: "center",
              color: "#6b7280",
            }}
          >
            <div
              style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}
            >
              Students
            </div>
            <p style={{ fontSize: "18px", marginBottom: "20px" }}>
              No students registered yet
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <UserPlus size={18} />
              Add Your First Student
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Registered On</th>
                <th style={{ width: "120px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>
                    <Link
                      to={`/admin/students/${student.id}`}
                      style={{
                        fontWeight: "600",
                        color: "#2563eb",
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.textDecoration = "underline")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.textDecoration = "none")
                      }
                    >
                      {student.name}
                    </Link>
                  </td>
                  <td>
                    <span style={{ fontFamily: "monospace", fontSize: "14px" }}>
                      {student.email}
                    </span>
                  </td>
                  <td>{format(new Date(student.createdAt), "MMM d, yyyy")}</td>
                  <td>
                    <Link
                      to={`/admin/students/${student.id}`}
                      className="btn btn-outline"
                      style={{ padding: "6px 14px", fontSize: "13px" }}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal"
            style={{ maxWidth: "500px", width: "90%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-between mb-4">
              <h2 style={{ fontSize: "22px", fontWeight: "700" }}>
                Add New Student
              </h2>
              <button
                className="btn btn-outline"
                style={{ padding: "6px" }}
                onClick={() => setShowAddModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="John Doe"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="label">Email Address *</label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="john@example.com"
                />
              </div>

              <div className="form-group">
                <label className="label">Password *</label>
                <input
                  type="password"
                  className="input"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder="Minimum 6 characters"
                />
              </div>

              {error && (
                <div className="error-text" style={{ marginBottom: "16px" }}>
                  {error}
                </div>
              )}

              <div
                className="flex"
                style={{ justifyContent: "flex-end", gap: "12px" }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddModal(false)}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating..." : "Create Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
