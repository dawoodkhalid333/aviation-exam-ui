import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { examsAPI } from "../../lib/api";
import { Plus, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function Exams() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["exams"],
    queryFn: () => examsAPI.getAll().then((res) => res.data.exams || []),
  });

  const deleteMutation = useMutation({
    mutationFn: examsAPI.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exams"] }),
  });

  if (isLoading)
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );

  return (
    <div>
      <div className="flex-between mb-4">
        <h1 style={{ fontSize: "32px", fontWeight: "700", color: "#1f2937" }}>
          Exams
        </h1>
        <Link to="/admin/exams/create" className="btn btn-primary">
          <Plus size={18} />
          Create Exam
        </Link>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Type</th>
              <th>Questions</th>
              <th>Opens At</th>
              <th>Closes At</th>
              <th style={{ width: "140px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((exam) => (
              <tr key={exam.id}>
                <td style={{ fontWeight: "500" }}>{exam.name}</td>
                <td>{exam.categoryId?.name || "Uncategorized"}</td>
                <td>
                  <span
                    className={`badge ${
                      exam.type === "timed" ? "badge-blue" : "badge-gray"
                    }`}
                  >
                    {exam.type}
                  </span>
                </td>
                <td>{exam.questions?.length || 0}</td>
                <td>
                  {exam.opensAt
                    ? format(new Date(exam.opensAt), "MMM d, yyyy h:mm a")
                    : "-"}
                </td>
                <td>
                  {exam.closesAt
                    ? format(new Date(exam.closesAt), "MMM d, yyyy h:mm a")
                    : "-"}
                </td>
                <td>
                  <div className="flex gap-2">
                    <Link
                      to={`/admin/exams/${exam.id}`}
                      className="btn btn-outline"
                      style={{ padding: "6px 12px" }}
                    >
                      <Eye size={16} />
                    </Link>
                    <button
                      className="btn btn-danger"
                      style={{ padding: "6px 12px" }}
                      onClick={() => {
                        if (
                          confirm(
                            "Delete this exam? This action cannot be undone."
                          )
                        )
                          deleteMutation.mutate(exam.id);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
