import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { sessionsAPI, submittedAnswersAPI } from "../../lib/api";
import {
  CheckCircle,
  XCircle,
  HelpCircle,
  ArrowLeft,
  Clock,
  Trophy,
  Target,
} from "lucide-react";
import { format, formatDuration, intervalToDuration } from "date-fns";

export default function ExamResults() {
  const { sessionId } = useParams();

  const { data: sessionRes, isPending: sessionLoading } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => sessionsAPI.getById(sessionId).then((res) => res.data),
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

  if (!sessionRes?.success || !sessionRes.session) {
    return (
      <div className="container text-center" style={{ padding: "60px 20px" }}>
        <p className="text-gray">Session not found or review not available.</p>
        <Link
          to="/student"
          className="btn btn-primary"
          style={{ marginTop: "20px" }}
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const session = sessionRes.session;
  const exam = session.assignmentId?.examId;
  const questions = exam?.questions || [];
  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  const obtainedMarks = session.grade || 0;
  const percentage =
    totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;

  // Stats from answers
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const wrongCount = answers.filter((a) => a.isCorrect === false).length;
  const unansweredCount = questions.length - answers.length;

  // Time taken
  const timeTakenSeconds = session.timeConsumedBeforeResume || 0;
  const duration = intervalToDuration({
    start: 0,
    end: timeTakenSeconds * 1000,
  });
  const formattedTime =
    formatDuration(duration, {
      format: ["hours", "hours", "minutes"],
    }).trim() || "Less than a second";

  // Map answers for quick lookup
  const answerMap = answers.reduce((map, ans) => {
    map[ans.questionId.id] = ans;
    return map;
  }, {});

  const isPassed = percentage >= 70; // Adjust passing mark as needed

  return (
    <div
      className="container"
      style={{ padding: "32px 20px", maxWidth: "900px" }}
    >
      {/* Back Button */}
      <Link
        to="/student"
        className="btn btn-outline"
        style={{ marginBottom: "24px" }}
      >
        <ArrowLeft size={18} /> Back to My Exams
      </Link>

      {/* Result Header */}
      <div
        className="card text-center"
        style={{ padding: "40px", marginBottom: "32px" }}
      >
        <div
          className="flex-center"
          style={{ flexDirection: "column", gap: "16px" }}
        >
          <Trophy
            size={64}
            style={{
              color: isPassed ? "#16a34a" : "#dc2626",
            }}
          />
          <h1 style={{ fontSize: "36px", fontWeight: "700", margin: "0" }}>
            {isPassed ? "Congratulations!" : "Keep Practicing!"}
          </h1>
          <p style={{ fontSize: "20px", color: "#4b5563" }}>You scored</p>
          <div
            style={{
              fontSize: "72px",
              fontWeight: "800",
              color: isPassed ? "#16a34a" : "#dc2626",
              lineHeight: "1",
            }}
          >
            {percentage}%
          </div>
          <p style={{ fontSize: "18px", color: "#6b7280" }}>
            {obtainedMarks} out of {totalMarks} marks
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div
        className="grid grid-3"
        style={{ gap: "20px", marginBottom: "40px" }}
      >
        <div className="card text-center" style={{ padding: "24px" }}>
          <CheckCircle
            size={32}
            style={{ color: "#16a34a", margin: "0 auto 12px" }}
          />
          <p style={{ fontSize: "28px", fontWeight: "700", color: "#166534" }}>
            {correctCount}
          </p>
          <p className="text-gray">Correct</p>
        </div>

        <div className="card text-center" style={{ padding: "24px" }}>
          <XCircle
            size={32}
            style={{ color: "#dc2626", margin: "0 auto 12px" }}
          />
          <p style={{ fontSize: "28px", fontWeight: "700", color: "#991b1b" }}>
            {wrongCount}
          </p>
          <p className="text-gray">Incorrect</p>
        </div>

        <div className="card text-center" style={{ padding: "24px" }}>
          <HelpCircle
            size={32}
            style={{ color: "#6b7280", margin: "0 auto 12px" }}
          />
          <p style={{ fontSize: "28px", fontWeight: "700", color: "#4b5563" }}>
            {unansweredCount}
          </p>
          <p className="text-gray">Unanswered</p>
        </div>
      </div>

      {/* Exam Info */}
      <div className="card" style={{ padding: "24px", marginBottom: "32px" }}>
        <h2
          style={{ fontSize: "22px", fontWeight: "600", marginBottom: "16px" }}
        >
          Exam Details
        </h2>
        <div style={{ display: "grid", gap: "12px", fontSize: "16px" }}>
          <div className="flex-between">
            <span className="text-gray">Exam Name</span>
            <strong>{exam?.name || "N/A"}</strong>
          </div>
          <div className="flex-between">
            <span className="text-gray">Category</span>
            <strong>{exam?.categoryId?.name || "General"}</strong>
          </div>
          <div className="flex-between">
            <span className="text-gray">Time Taken</span>
            <strong>{formattedTime}</strong>
          </div>
          <div className="flex-between">
            <span className="text-gray">Submitted</span>
            <strong>
              {format(new Date(session.submittedAt), "dd MMM yyyy 'at' HH:mm")}
            </strong>
          </div>
        </div>
      </div>

      {/* Detailed Answers */}
      <div className="card">
        <h2
          style={{ fontSize: "22px", fontWeight: "600", marginBottom: "24px" }}
        >
          Your Answers
        </h2>

        {questions.map((question, index) => {
          const studentAns = answerMap[question.id];
          const submittedValue = studentAns?.submittedValue;
          const isCorrect = studentAns?.isCorrect === true;
          const wasAttempted = !!studentAns;

          let correctAnswerText = question.correctAnswer;
          if (question.type === "mcq") {
            correctAnswerText =
              question.correctAnswer?.mcq?.[0] ||
              question.correctAnswer ||
              "Not specified";
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
              <div style={{ marginBottom: "16px" }}>
                <div
                  className="flex"
                  style={{ gap: "12px", alignItems: "flex-start" }}
                >
                  <span
                    style={{
                      fontWeight: "600",
                      fontSize: "18px",
                      minWidth: "32px",
                    }}
                  >
                    Q{index + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div
                      className="flex"
                      style={{
                        gap: "8px",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
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
                        {question.marks} mark{question.marks > 1 ? "s" : ""}
                      </span>
                    </div>
                    <p style={{ marginTop: "8px", lineHeight: "1.5" }}>
                      {question.text}
                    </p>
                  </div>
                </div>
              </div>

              {/* Options */}
              {question.type === "mcq" && question.options && (
                <div
                  style={{ marginLeft: "44px", display: "grid", gap: "10px" }}
                >
                  {question.options.map((opt, i) => {
                    const isCorrectOpt = opt.text === correctAnswerText;
                    const isSelected = opt.text === submittedValue;

                    let style = {
                      padding: "12px 16px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      background: "#f9fafb",
                    };

                    if (isCorrectOpt) {
                      style = {
                        ...style,
                        borderColor: "#16a34a",
                        background: "#f0fdf4",
                      };
                    }
                    if (isSelected && !isCorrect) {
                      style = {
                        ...style,
                        borderColor: "#dc2626",
                        background: "#fef2f2",
                      };
                    }

                    return (
                      <div key={i} style={style}>
                        <div
                          className="flex"
                          style={{ gap: "10px", alignItems: "center" }}
                        >
                          {isCorrectOpt ? (
                            <CheckCircle
                              size={18}
                              style={{ color: "#16a34a" }}
                            />
                          ) : isSelected ? (
                            <XCircle size={18} style={{ color: "#dc2626" }} />
                          ) : (
                            <div
                              style={{
                                width: "18px",
                                height: "18px",
                                borderRadius: "50%",
                                border: "2px solid #d1d5db",
                              }}
                            />
                          )}
                          <span
                            style={{
                              fontWeight: isSelected ? "600" : "normal",
                              color: isCorrectOpt
                                ? "#166534"
                                : isSelected
                                ? "#991b1b"
                                : "inherit",
                            }}
                          >
                            {opt.text}
                            {isSelected && !isCorrectOpt && " (Your Answer)"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Feedback */}
              {question.feedback && (
                <div
                  style={{
                    marginLeft: "44px",
                    marginTop: "20px",
                    padding: "16px",
                    background: "#f0f9ff",
                    borderRadius: "8px",
                    border: "1px solid #7dd3fc",
                  }}
                >
                  <p
                    style={{
                      fontWeight: "500",
                      color: "#0369a1",
                      fontSize: "14px",
                    }}
                  >
                    Explanation:
                  </p>
                  <p
                    style={{
                      marginTop: "6px",
                      color: "#0c4a6e",
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
                    marginLeft: "44px",
                    marginTop: "12px",
                    fontStyle: "italic",
                    color: "#6b7280",
                  }}
                >
                  You did not answer this question
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Final Message */}
      <div
        className="text-center"
        style={{ marginTop: "40px", color: "#6b7280" }}
      >
        <p>Great effort! Keep practicing to improve your knowledge.</p>
      </div>
    </div>
  );
}
