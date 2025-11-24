import { useQuery } from "@tanstack/react-query";
import { usersAPI, examsAPI, questionsAPI, categoriesAPI } from "../../lib/api";
import { Users, ClipboardList, FileQuestion, FolderOpen } from "lucide-react";

export default function AdminDashboard() {
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersAPI.getAll().then((res) => res.data),
  });

  const { data: examsRes } = useQuery({
    queryKey: ["exams"],
    queryFn: () => examsAPI.getAll().then((res) => res.data),
  });

  const { data: questionsRes } = useQuery({
    queryKey: ["questions"],
    queryFn: () => questionsAPI.getAll().then((res) => res.data),
  });

  const { data: categoriesRes } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesAPI.getAll().then((res) => res.data),
  });

  const stats = [
    {
      title: "Total Students",
      value: users?.users?.filter((u) => u.role === "student").length || 0,
      icon: Users,
      color: "#3b82f6",
    },
    {
      title: "Total Exams",
      value: examsRes?.exams?.length || 0,
      icon: ClipboardList,
      color: "#8b5cf6",
    },
    {
      title: "Total Questions",
      value: questionsRes?.questions?.length || 0,
      icon: FileQuestion,
      color: "#10b981",
    },
    {
      title: "Categories",
      value: categoriesRes?.categories?.length || 0,
      icon: FolderOpen,
      color: "#f59e0b",
    },
  ];

  return (
    <div>
      <h1
        style={{
          fontSize: "32px",
          fontWeight: "700",
          color: "#1f2937",
          marginBottom: "24px",
        }}
      >
        Admin Dashboard
      </h1>

      <div className="grid grid-2 mb-4">
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
                      fontSize: "32px",
                      fontWeight: "700",
                      color: "#1f2937",
                    }}
                  >
                    {stat.value}
                  </p>
                </div>
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "12px",
                    background: `${stat.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={32} color={stat.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-2 gap-4">
        <div className="card">
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "16px",
            }}
          >
            Recent Exams
          </h2>
          {examsRes?.exams?.slice(0, 5).map((exam) => (
            <div
              key={exam._id}
              style={{
                padding: "12px",
                borderBottom: "1px solid #e5e7eb",
                ":last-child": { borderBottom: "none" },
              }}
            >
              <p style={{ fontWeight: "500", color: "#1f2937" }}>{exam.name}</p>
              <p
                style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}
              >
                {exam.category} • {exam.questions.length} questions
              </p>
            </div>
          ))}
        </div>

        <div className="card">
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "16px",
            }}
          >
            Question Distribution
          </h2>
          {categoriesRes?.categories?.map((cat) => {
            const count =
              questionsRes?.questions?.filter(
                (q) => q.categoryId.name === cat.name
              ).length || 0;
            return (
              <div
                key={cat.id}
                style={{
                  padding: "12px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <div className="flex-between">
                  <p style={{ fontWeight: "500", color: "#1f2937" }}>
                    {cat.name}
                  </p>
                  <span className="badge badge-blue">{count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
