import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { sessionsAPI, submittedAnswersAPI } from "../../lib/api";
import {
  ArrowLeft,
  Clock,
  UserCircle,
  BookOpen,
  CheckCircle,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { format, formatDuration, intervalToDuration } from "date-fns";

export default function SessionReview() {
  const { sessionId } = useParams();

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () =>
      sessionsAPI.getById(sessionId).then((res) => res.data.session),
    enabled: Boolean(sessionId),
  });

  const { data: answers = [], isLoading: answersLoading } = useQuery({
    queryKey: ["answers", sessionId],
    queryFn: () =>
      submittedAnswersAPI
        .getBySession(sessionId)
        .then((res) => res.data.answers || []),
    enabled: Boolean(sessionId),
  });

  if (sessionLoading || answersLoading) {
    return (
      <div className="flex-center" style={{ minHeight: "100vh" }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!session) return null;

  const exam = session.assignmentId?.examId;
  const questions = exam?.questions || [];
  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  const obtainedMarks = session.grade || 0;
  const percentage =
    totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(1) : 0;

  // Time taken
  const timeTakenSeconds = session.timeConsumedBeforeResume || 0;
  const duration = intervalToDuration({
    start: 0,
    end: timeTakenSeconds * 1000,
  });
  const formattedTime =
    formatDuration(duration, { format: ["hours", "minutes", "seconds"] }) ||
    "0 seconds";
  const answerMap = answers.reduce((map, ans) => {
    map[ans.questionId.id] = ans;
    return map;
  }, {});

  return (
    <div className="container" style={{ padding: "32px 20px 64px" }}>
      {/* Back Button */}
      <Link
        to={`/admin/students/${session.assignmentId?.studentId?.id}`}
        className="btn btn-outline"
        style={{ marginBottom: "24px" }}
      >
        <ArrowLeft size={18} />
        Back to Student Profile
      </Link>

      {/* Header Card */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="flex-between" style={{ marginBottom: "20px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>
              Session Review
            </h1>
            <p className="text-gray" style={{ marginTop: "6px" }}>
              {exam?.name} • Submitted on{" "}
              {format(new Date(session.submittedAt), "dd MMM yyyy 'at' HH:mm")}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span className="badge badge-green">Submitted</span>
          </div>
        </div>

        {/* Summary Grid */}
        <div className="grid grid-3" style={{ gap: "20px", marginTop: "24px" }}>
          <div
            className="card"
            style={{ background: "#f9fafb", padding: "16px" }}
          >
            <div className="flex gap-2">
              <UserCircle size={20} style={{ color: "#2563eb" }} />
              <div>
                <p className="text-sm text-gray">Student</p>
                <p style={{ fontWeight: "600", fontSize: "15px" }}>
                  {session.assignmentId?.studentId?.name}
                </p>
                <p className="text-xs text-gray">
                  {session.assignmentId?.studentId?.email}
                </p>
              </div>
            </div>
          </div>

          <div
            className="card"
            style={{ background: "#f9fafb", padding: "16px" }}
          >
            <div className="flex gap-2">
              <BookOpen size={20} style={{ color: "#2563eb" }} />
              <div>
                <p className="text-sm text-gray">Exam</p>
                <p style={{ fontWeight: "600", fontSize: "15px" }}>
                  {exam?.name}
                </p>
                <p className="text-xs text-gray">{exam?.categoryId?.name}</p>
              </div>
            </div>
          </div>

          <div
            className="card"
            style={{ background: "#f9fafb", padding: "16px" }}
          >
            <div className="flex gap-2">
              <Clock size={20} style={{ color: "#2563eb" }} />
              <div>
                <p className="text-sm text-gray">Time Taken</p>
                <p style={{ fontWeight: "600", fontSize: "15px" }}>
                  {formattedTime}
                </p>
                <p className="text-xs text-gray">
                  out of{" "}
                  {exam?.duration ? `${exam.duration / 60} minutes` : "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div
            className="card"
            style={{ background: "#f9fafb", padding: "16px" }}
          >
            <div className="flex gap-4">
              <div
                style={{
                  fontSize: "38px",
                  fontWeight: "bold",
                  color:
                    percentage >= 70
                      ? "#16a34a"
                      : percentage >= 50
                      ? "#ca8a04"
                      : "#dc2626",
                }}
              >
                {percentage}%
              </div>
              <div style={{ alignSelf: "center" }}>
                <p className="text-sm text-gray">Final Score</p>
                <p style={{ fontWeight: "600", fontSize: "16px" }}>
                  {obtainedMarks} / {totalMarks} marks
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Questions with Student Answers */}
      <div className="card">
        <h2
          style={{ fontSize: "22px", fontWeight: "600", marginBottom: "24px" }}
        >
          Detailed Answers
        </h2>

        {questions.map((question, index) => {
          const studentAnswer = answerMap[question.id];
          const submittedValue = studentAnswer?.submittedValue;
          const isCorrect = studentAnswer?.isCorrect === true;
          const wasAttempted = !!studentAnswer;

          let correctAnswerText;
          if (question.type === "mcq") {
            if (Array.isArray(question.correctAnswer?.mcq)) {
              correctAnswerText = question.correctAnswer.mcq[0];
            } else {
              correctAnswerText =
                question.correctAnswer || question.correctAnswer?.mcq?.[0];
            }
          } else {
            correctAnswerText =
              question.correctAnswer?.short || question.correctAnswer;
          }

          return (
            <div
              key={question.id}
              style={{
                padding: "24px 0",
                borderBottom:
                  index < questions.length - 1 ? "1px solid #e5e7eb" : "none",
              }}
            >
              <div className="flex-between" style={{ marginBottom: "12px" }}>
                <div style={{ flex: 1 }}>
                  <div
                    className="flex gap-2"
                    style={{ alignItems: "center", marginBottom: "8px" }}
                  >
                    <span style={{ fontWeight: "600", fontSize: "18px" }}>
                      Q{index + 1}.
                    </span>
                    {wasAttempted ? (
                      isCorrect ? (
                        <CheckCircle size={20} style={{ color: "#16a34a" }} />
                      ) : (
                        <XCircle size={20} style={{ color: "#dc2626" }} />
                      )
                    ) : (
                      <HelpCircle size={20} style={{ color: "#6b7280" }} />
                    )}
                    <span style={{ fontSize: "14px", color: "#6b7280" }}>
                      ({question.marks} mark{question.marks > 1 ? "s" : ""})
                    </span>
                  </div>
                  <p style={{ color: "#1f2937", lineHeight: "1.5" }}>
                    {question.text}
                  </p>
                </div>
              </div>

              {/* MCQ Options */}
              {question.type === "mcq" && question.options && (
                <div
                  style={{ marginTop: "16px", display: "grid", gap: "10px" }}
                >
                  {question.options.map((opt, i) => {
                    const isCorrectOption =
                      opt.text === correctAnswerText ||
                      (Array.isArray(question.correctAnswer?.mcq) &&
                        question.correctAnswer.mcq.includes(opt.text));

                    const isSelected = opt.text === submittedValue;

                    let bg, borderColor, textColor, icon;

                    if (isCorrectOption) {
                      bg = "#f0fdf4";
                      borderColor = "#16a34a";
                      textColor = "#166534";
                      icon = (
                        <CheckCircle size={18} style={{ color: "#16a34a" }} />
                      );
                    } else if (isSelected && !isCorrect) {
                      bg = "#fef2f2";
                      borderColor = "#dc2626";
                      textColor = "#991b1b";
                      icon = <XCircle size={18} style={{ color: "#dc2626" }} />;
                    } else {
                      bg = "#f9fafb";
                      borderColor = "#d1d1d5db";
                      textColor = "inherit";
                      icon = (
                        <div
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "50%",
                            border: "2px solid #d1d5db",
                          }}
                        />
                      );
                    }

                    return (
                      <div
                        key={i}
                        style={{
                          padding: "12px 16px",
                          borderRadius: "8px",
                          border: `1px solid ${borderColor}`,
                          background: bg,
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        {icon}
                        <span
                          style={{
                            color: textColor,
                            fontWeight: isSelected ? "600" : "normal",
                          }}
                        >
                          {opt.text}
                          {isSelected && !isCorrectOption && " (Your Answer)"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Feedback */}
              {question.feedback && (
                <div
                  style={{
                    marginTop: "20px",
                    padding: "16px",
                    background: "#eff6ff",
                    borderRadius: "8px",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  <p
                    style={{
                      fontWeight: "500",
                      color: "#1e40af",
                      fontSize: "14px",
                    }}
                  >
                    Explanation
                  </p>
                  <p
                    style={{
                      marginTop: "6px",
                      color: "#1e40af",
                      lineHeight: "1.5",
                    }}
                  >
                    {question.feedback}
                  </p>
                </div>
              )}

              {/* Unanswered note */}
              {!wasAttempted && (
                <p
                  style={{
                    marginTop: "12px",
                    fontStyle: "italic",
                    color: "#6b7280",
                  }}
                >
                  Not answered
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
