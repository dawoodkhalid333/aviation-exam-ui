import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { sessionsAPI, gradesAPI, examsAPI } from "../../lib/api";
import { ArrowLeft, Clock, UserCircle, BookOpen } from "lucide-react";
import { format } from "date-fns";

export default function SessionReview() {
  const { sessionId } = useParams();

  const { data: session, isLoading } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => sessionsAPI.getById(sessionId).then((res) => res.data),
    enabled: Boolean(sessionId),
  });

  const { data: answers } = useQuery({
    queryKey: ["session-answers", sessionId],
    queryFn: () => sessionsAPI.getAnswers(sessionId).then((res) => res.data),
    enabled: Boolean(sessionId),
  });

  const { data: grade } = useQuery({
    queryKey: ["grade", sessionId],
    queryFn: () => gradesAPI.getBySession(sessionId).then((res) => res.data),
    enabled: Boolean(sessionId),
  });

  const { data: exam } = useQuery({
    queryKey: ["exam", session?.examId],
    queryFn: () => examsAPI.getById(session.examId).then((res) => res.data),
    enabled: Boolean(session?.examId),
  });

  if (isLoading || !session)
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );

  return (
    <div>
      <Link to="/admin/grades" className="btn btn-outline mb-4">
        <ArrowLeft size={18} />
        Back to Grades
      </Link>

      <div className="card mb-4">
        <div className="flex-between">
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "700" }}>
              Session Review
            </h1>
            <p style={{ color: "#6b7280" }}>Session ID: {sessionId}</p>
          </div>
          <span
            className={`badge ${
              session.isSubmitted ? "badge-green" : "badge-yellow"
            }`}
          >
            {session.isSubmitted ? "Submitted" : "In progress"}
          </span>
        </div>
        <div className="grid grid-2 gap-4" style={{ marginTop: "16px" }}>
          {/* <div className="card" style={{ background: "#f9fafb" }}>
            <div className="flex gap-2" style={{ alignItems: "center" }}>
              <UserCircle size={18} />
              <span>{session.student?.name}</span>
            </div>
            <p className="text-xs text-gray">{session.student?.email}</p>
          </div> */}
          <div className="card" style={{ background: "#f9fafb" }}>
            <div className="flex gap-2" style={{ alignItems: "center" }}>
              <BookOpen size={18} />
              <span>{exam?.name}</span>
            </div>
            <p className="text-xs text-gray">{exam?.category}</p>
          </div>
          <div className="card" style={{ background: "#f9fafb" }}>
            <div className="flex gap-2" style={{ alignItems: "center" }}>
              <Clock size={18} />
              <span>
                {session.endedAt
                  ? format(new Date(session.endedAt), "MMM d, yyyy HH:mm")
                  : "Not started"}
              </span>
            </div>
            <p className="text-xs text-gray">
              {session.isSubmitted ? "Submitted" : "Not submitted"}
            </p>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <h2
          style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}
        >
          Performance Snapshot
        </h2>
        {grade ? (
          <div className="flex gap-4" style={{ alignItems: "center" }}>
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                border: "6px solid #2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: "700",
                color: "#2563eb",
              }}
            >
              {((grade.obtainedMarks / grade.totalMarks) * 100).toFixed(0)}%
            </div>
            <div>
              <p style={{ fontSize: "20px", fontWeight: "600" }}>
                {grade.obtainedMarks} / {grade.totalMarks} marks
              </p>
              <p style={{ color: "#6b7280" }}>
                Auto-graded on {format(new Date(grade.createdAt), "MMM d yyyy")}
              </p>
            </div>
          </div>
        ) : (
          <p style={{ color: "#6b7280" }}>Session not graded yet.</p>
        )}
      </div>

      <div className="card">
        <h2
          style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}
        >
          Questions & Answers
        </h2>
        {grade?.answers?.length ? (
          grade?.answers?.map((entry, index) => {
            const questionText =
              entry.question?.text || "Question text unavailable";
            const marks = entry.question?.marks || 0;
            const studentAnswer =
              entry.answer?.short || entry.answer?.mcq || "—";
            const correctAnswer =
              entry.question?.correctAnswer?.short?.value ||
              entry.question?.correctAnswer?.mcq ||
              "—";
            return (
              <div
                key={entry.questionId || `${index}`}
                style={{
                  padding: "16px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <p style={{ fontWeight: 600, marginBottom: "8px" }}>
                  Question {index + 1} ({marks} marks)
                </p>
                <p style={{ marginBottom: "12px" }}>{questionText}</p>
                <p>
                  <strong>Student Answer:</strong> {studentAnswer}
                </p>
                <p>
                  <strong>Correct Answer:</strong> {correctAnswer}
                </p>
                {entry.feedback && (
                  <p style={{ marginTop: "8px", color: "#2563eb" }}>
                    Feedback: {entry.feedback}
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <p style={{ color: "#6b7280" }}>No answers recorded yet.</p>
        )}
      </div>
    </div>
  );
}
