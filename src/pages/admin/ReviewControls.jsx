import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { examsAPI } from "../../lib/api";
import {
  Eye,
  EyeOff,
  RefreshCw,
  ListChecks,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

export default function ReviewControls() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");

  const { data: examsData, isLoading } = useQuery({
    queryKey: ["exams"],
    queryFn: () => examsAPI.getAll().then((res) => res.data),
  });

  const updateExam = useMutation({
    mutationFn: ({ id, data }) => examsAPI.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(["exams"]),
  });

  const exams = examsData?.exams || [];
  const filtered = exams.filter((exam) =>
    filter === "all" ? true : exam.reviewMode === filter
  );

  return (
    <div>
      <div className="flex-between mb-4">
        <h1 style={{ fontSize: "32px", fontWeight: "700", color: "#1f2937" }}>
          Review Controls
        </h1>
        <button
          className="btn btn-outline"
          onClick={() => queryClient.invalidateQueries(["exams"])}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="card mb-4">
        <div className="flex-between">
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <ListChecks size={18} color="#2563eb" />
            <p style={{ fontWeight: 600 }}>Filter by exam mode</p>
          </div>
          <select
            className="input"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ maxWidth: "200px" }}
          >
            <option value="all">All exams</option>
            <option value="practice">Practice (review allowed)</option>
            <option value="assessment">Assessment (review blocked)</option>
          </select>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : filtered.length === 0 ? (
          <p style={{ padding: "16px", color: "#6b7280" }}>
            No exams match the selected filter.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Mode</th>
                <th>Review</th>
                <th>Feedback</th>
                <th style={{ width: "160px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((exam) => (
                <tr key={exam._id}>
                  <td style={{ fontWeight: 600 }}>{exam.name}</td>
                  <td>
                    <span
                      className={`badge ${
                        exam.reviewMode === "practice"
                          ? "badge-green"
                          : "badge-red"
                      }`}
                    >
                      {exam.reviewMode === "practice"
                        ? "Practice"
                        : "Assessment"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        exam.allowReview ? "badge-green" : "badge-gray"
                      }`}
                    >
                      {exam.allowReview ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td>
                    {exam.showFeedback ? (
                      <span className="badge badge-blue">
                        <Eye size={14} />
                        Feedback
                      </span>
                    ) : (
                      <span className="badge badge-gray">
                        <EyeOff size={14} />
                        Hidden
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-outline"
                        style={{ padding: "4px 8px" }}
                        onClick={() => {
                          const nextMode =
                            exam.reviewMode === "practice"
                              ? "assessment"
                              : "practice";
                          updateExam.mutate({
                            id: exam._id,
                            data: {
                              reviewMode: nextMode,
                              allowReview: nextMode === "practice",
                              showFeedback: nextMode === "practice",
                            },
                          });
                        }}
                      >
                        {exam.reviewMode === "practice" ? (
                          <>
                            <ToggleLeft size={14} />
                            Assessment
                          </>
                        ) : (
                          <>
                            <ToggleRight size={14} />
                            Practice
                          </>
                        )}
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{ padding: "4px 8px" }}
                        onClick={() =>
                          updateExam.mutate({
                            id: exam._id,
                            data: { allowReview: !exam.allowReview },
                          })
                        }
                      >
                        {exam.allowReview ? "Disable Review" : "Enable Review"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

