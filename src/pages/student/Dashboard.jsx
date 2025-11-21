import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { assignmentsAPI, sessionsAPI } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import { BookOpen, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: assignments } = useQuery({
    queryKey: ["assignments", user.userId],
    queryFn: () => assignmentsAPI.getAll().then((res) => res.data.assignments),
  });

  const { data: sessions } = useQuery({
    queryKey: ["sessions", user.userId],
    queryFn: () =>
      sessionsAPI
        .getAll({ studentId: user.userId })
        .then((res) => res.data.sessions),
  });

  const stats = [
    {
      title: "Assigned Exams",
      value: assignments?.length || 0,
      icon: BookOpen,
      color: "#3b82f6",
    },
    {
      title: "In Progress",
      value: sessions?.sessions?.filter((s) => !s.isSubmitted).length || 0,
      icon: Clock,
      color: "#f59e0b",
    },
    {
      title: "Completed",
      value: sessions?.sessions?.filter((s) => s.isSubmitted).length || 0,
      icon: CheckCircle,
      color: "#10b981",
    },
  ];

  return (
    <div>
      <h1
        style={{
          fontSize: "32px",
          fontWeight: "700",
          color: "#1f2937",
          marginBottom: "8px",
        }}
      >
        Welcome back, {user.name}!
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "32px" }}>
        Here's an overview of your exam activities
      </p>

      <div className="grid grid-3 mb-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="card">
              <div className="flex-between">
                <div>
                  <p
                    style={{
                      color: "#6b7280",
                      fontSize: "14px",
                      marginBottom: "8px",
                    }}
                  >
                    {stat.title}
                  </p>
                  <p
                    style={{
                      fontSize: "28px",
                      fontWeight: "700",
                      color: "#1f2937",
                    }}
                  >
                    {stat.value}
                  </p>
                </div>
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "10px",
                    background: `${stat.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={24} color={stat.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h2
          style={{ fontSize: "20px", fontWeight: "600", marginBottom: "16px" }}
        >
          Recent Sessions
        </h2>
        {sessions?.sessions?.slice(0, 5).map((session) => (
          <div
            key={session._id}
            style={{
              padding: "16px",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ fontWeight: "500", color: "#1f2937" }}>
                Attempt {session.attemptNumber}
              </p>
              <p
                style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}
              >
                Started:{" "}
                {format(new Date(session.startedAt), "MMM d, yyyy HH:mm")}
              </p>
            </div>
            <span
              className={`badge ${
                session.isSubmitted ? "badge-green" : "badge-yellow"
              }`}
              style={{ display: "block", marginLeft: "auto" }}
            >
              {session.isSubmitted ? "Submitted" : "In Progress"}
            </span>
            {session?.isSubmitted && (
              <span
                className="badge badge-blue"
                style={{ cursor: "pointer", marginLeft: "4px" }}
                onClick={() => navigate(`results/${session?._id}`)}
              >
                Review
              </span>
            )}
          </div>
        ))}
        {!sessions?.sessions?.length && (
          <p style={{ textAlign: "center", color: "#6b7280", padding: "20px" }}>
            No exam sessions yet.{" "}
            <Link to="/student/exams" style={{ color: "#2563eb" }}>
              View your exams
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
