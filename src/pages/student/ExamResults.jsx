import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { gradesAPI, sessionsAPI } from "../../lib/api";
import { CheckCircle, XCircle, ArrowLeft } from "lucide-react";

export default function ExamResults() {
  const { sessionId } = useParams();

  const { data: grade, isLoading } = useQuery({
    queryKey: ["grade", sessionId],
    queryFn: () => gradesAPI.getBySession(sessionId).then((res) => res.data),
    retry: false,
  });

  const { data: session } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => sessionsAPI.getById(sessionId).then((res) => res.data),
  });

  if (isLoading)
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );

  const reviewAllowed =
    session?.reviewEnabled ??
    session?.assignment?.reviewEnabled ??
    grade?.reviewEnabled ??
    grade?.allowReview ??
    false;

  if (!grade) {
    return (
      <div
        className="card text-center"
        style={{ maxWidth: "600px", margin: "0 auto" }}
      >
        <h2
          style={{ fontSize: "24px", fontWeight: "700", marginBottom: "16px" }}
        >
          Exam Submitted Successfully!
        </h2>
        <p style={{ color: "#6b7280", marginBottom: "24px" }}>
          Your exam has been submitted and is awaiting grading. You'll be
          notified once your results are available.
        </p>
        <Link to="/student/exams" className="btn btn-primary">
          <ArrowLeft size={18} />
          Back to Exams
        </Link>
      </div>
    );
  }

  if (false) {
    return (
      <div
        className="card text-center"
        style={{ maxWidth: "600px", margin: "0 auto" }}
      >
        <h2
          style={{ fontSize: "24px", fontWeight: "700", marginBottom: "16px" }}
        >
          Review Disabled
        </h2>
        <p style={{ color: "#6b7280", marginBottom: "24px" }}>
          This assessment does not allow post-exam review or feedback. Reach out
          to your instructor if you have questions about your performance.
        </p>
        <Link to="/student/exams" className="btn btn-primary">
          Back to My Exams
        </Link>
      </div>
    );
  }

  const percentage = (grade.obtainedMarks / grade.totalMarks) * 100;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <Link to="/student/exams" className="btn btn-outline mb-4">
        <ArrowLeft size={18} />
        Back to Exams
      </Link>

      <div className="card text-center mb-4">
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "700",
            color: "#1f2937",
            marginBottom: "16px",
          }}
        >
          Exam Results
        </h1>
        <div
          style={{
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            background: percentage >= 50 ? "#dcfce7" : "#fee2e2",
            color: percentage >= 50 ? "#15803d" : "#dc2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: "48px",
            fontWeight: "700",
          }}
        >
          {percentage.toFixed(0)}%
        </div>
        <div className="flex-center gap-4" style={{ fontSize: "24px" }}>
          <span style={{ fontWeight: "600" }}>{grade.obtainedMarks}</span>
          <span style={{ color: "#6b7280" }}>/</span>
          <span style={{ color: "#6b7280" }}>{grade.totalMarks}</span>
        </div>
        <p style={{ color: "#6b7280", marginTop: "8px" }}>Total Marks</p>
      </div>

      <div className="card">
        <h2
          style={{ fontSize: "20px", fontWeight: "600", marginBottom: "16px" }}
        >
          Question Breakdown
        </h2>
        {grade.breakdown.map((item, i) => (
          <div
            key={item.questionId}
            style={{
              padding: "16px",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div className="flex gap-4" style={{ alignItems: "center" }}>
              {item.awarded > 0 ? (
                <CheckCircle size={24} color="#10b981" />
              ) : (
                <XCircle size={24} color="#dc2626" />
              )}
              <span style={{ fontWeight: "500" }}>Question {i + 1}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: item.awarded > 0 ? "#10b981" : "#dc2626",
                }}
              >
                {item.awarded}
              </span>
              <span style={{ color: "#6b7280" }}> marks</span>
            </div>
          </div>
        ))}
      </div>

      <div
        className="card mt-4"
        style={{
          background: percentage >= 50 ? "#dcfce7" : "#fee2e2",
          border: `2px solid ${percentage >= 50 ? "#10b981" : "#dc2626"}`,
        }}
      >
        <p
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: percentage >= 50 ? "#15803d" : "#dc2626",
            textAlign: "center",
          }}
        >
          {percentage >= 50
            ? "🎉 Congratulations! You passed!"
            : "Keep practicing! You can do better next time."}
        </p>
      </div>
    </div>
  );
}
