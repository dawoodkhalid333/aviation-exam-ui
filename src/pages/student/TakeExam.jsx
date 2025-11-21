import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { sessionsAPI, submittedAnswersAPI } from "../../lib/api";
import { Clock, Bookmark, Send, AlertCircle } from "lucide-react";

export default function TakeExam() {
  const { id: assignmentId } = useParams(); // ← This is the assignment ID, not exam ID
  console.log(assignmentId);

  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: "A" | 42 }
  const [bookmarked, setBookmarked] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null); // seconds
  const [isLoading, setIsLoading] = useState(true);
  const progressKey = `exam-progress-${assignmentId}`;

  // Start or resume session
  const startOrResumeMutation = useMutation({
    mutationFn: async () => {
      const saved = localStorage.getItem(progressKey);
      if (saved) {
        const { sessionId } = JSON.parse(saved);
        if (sessionId) {
          return sessionsAPI.resume(sessionId);
        }
      }
      return sessionsAPI.start({ assignmentId });
    },
    onSuccess: (res) => {
      const data = res.data;
      setSession(data.session);
      setQuestions(data.session.assignmentId.examId.questions);
      setCurrentQuestionIndex(data.currentQuestionIndex || 0);
      setTimeRemaining(data.remainingTime);
      setIsLoading(false);

      // Restore saved answers if resuming
      if (data.answeredCount > 0) {
        submittedAnswersAPI.getBySession(data.session.id).then((ansRes) => {
          const savedAnswers = {};
          ansRes.data.answers.forEach((a) => {
            const val = a.submittedValue;
            savedAnswers[a.questionId.id] =
              typeof val === "string" ? val : Number(val);
          });
          setAnswers(savedAnswers);
        });
      }
    },
    onSettled: () => setIsLoading(false),
  });

  // Save answer mutation
  const saveAnswerMutation = useMutation({
    mutationFn: ({ questionId, value }) =>
      submittedAnswersAPI.create({
        sessionId: session.id,
        questionId,
        submittedValue: value,
      }),
    onSuccess: (res) => {
      const data = res.data;
      if (data.isLastQuestion || data.examCompleted) {
        localStorage.removeItem(progressKey);
        navigate(`/student/results/${session.id}`);
      } else if (data.nextQuestion) {
        const nextIdx = questions.findIndex(
          (q) => q.id === data.nextQuestion.id
        );
        if (nextIdx !== -1) setCurrentQuestionIndex(nextIdx);
      }
    },
  });

  // Submit exam (only used for manual submit)
  const submitMutation = useMutation({
    mutationFn: () => sessionsAPI.submit(session.id),
    onSuccess: () => {
      localStorage.removeItem(progressKey);
      navigate(`/student/results/${session.id}`);
    },
  });

  // Load session on mount
  useEffect(() => {
    startOrResumeMutation.mutate();
  }, [assignmentId]);

  // Timer
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          submitMutation.mutate(); // Auto-submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, session]);

  // Save progress to localStorage
  useEffect(() => {
    if (!session) return;
    localStorage.setItem(
      progressKey,
      JSON.stringify({
        sessionId: session.id,
        answers,
        bookmarked,
        timeRemaining,
      })
    );
  }, [answers, bookmarked, timeRemaining, session, progressKey]);

  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    saveAnswerMutation.mutate({ questionId, value });
  };

  const handleBookmark = (questionId) => {
    setBookmarked((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const formatTime = (seconds) => {
    if (seconds === null) return "Untimed";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading || !session || questions.length === 0) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const isTimed = session.assignmentId.examId.type === "timed";

  return (
    <div style={{ display: "flex", gap: "24px", padding: "20px 0" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "280px",
          background: "white",
          borderRadius: "8px",
          padding: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          height: "fit-content",
          position: "sticky",
          top: "20px",
        }}
      >
        <div className="mb-4">
          <p className="text-sm text-gray">Progress</p>
          <p style={{ fontSize: "20px", fontWeight: "700" }}>
            {answeredCount} / {questions.length}
          </p>
        </div>

        {isTimed && (
          <div className="mb-4">
            <p className="text-sm text-gray">Time Remaining</p>
            <p
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: timeRemaining < 300 ? "#dc2626" : "#1d4ed8",
              }}
            >
              {formatTime(timeRemaining)}
            </p>
          </div>
        )}

        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          {questions.map((q, i) => {
            const isAnswered = answers[q.id] !== undefined;
            const isCurrent = i === currentQuestionIndex;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(i)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "12px",
                  marginBottom: "8px",
                  borderRadius: "6px",
                  border: `2px solid ${isCurrent ? "#2563eb" : "#e5e7eb"}`,
                  background: isAnswered
                    ? isCurrent
                      ? "#1d4ed8"
                      : "#ecfdf5"
                    : isCurrent
                    ? "#eff6ff"
                    : "white",
                  color:
                    isAnswered && !isCurrent
                      ? "#065f46"
                      : isCurrent
                      ? isAnswered
                        ? "white"
                        : "#1d4ed8"
                      : "#374151",
                  fontWeight: "600",
                }}
              >
                Q{i + 1} ({q.marks} marks)
                {bookmarked[q.id] && (
                  <Bookmark
                    size={14}
                    fill="currentColor"
                    style={{ marginLeft: "6px" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1 }}>
        <div className="card mb-4">
          <div className="flex-between">
            <div>
              <h1 style={{ fontSize: "24px", fontWeight: "700" }}>
                {session.assignmentId.examId.name}
              </h1>
              <p className="text-sm text-gray">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              {isTimed && (
                <div style={{ marginBottom: "12px" }}>
                  <Clock
                    size={20}
                    style={{ display: "inline", marginRight: "8px" }}
                  />
                  <span
                    style={{
                      fontSize: "22px",
                      fontWeight: "700",
                      color: timeRemaining < 300 ? "#dc2626" : "#1d4ed8",
                    }}
                  >
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
              <button
                className="btn btn-success"
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
              >
                <Send size={18} />
                Submit Exam
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex-between mb-4">
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "600" }}>
                Question {currentQuestionIndex + 1}
              </h2>
              <p className="text-sm text-gray">{currentQuestion.marks} marks</p>
            </div>
            <button
              className="btn btn-outline"
              onClick={() => handleBookmark(currentQuestion.id)}
            >
              <Bookmark
                size={18}
                fill={bookmarked[currentQuestion.id] ? "currentColor" : "none"}
              />
            </button>
          </div>

          <p
            style={{
              fontSize: "16px",
              lineHeight: "1.7",
              marginBottom: "24px",
            }}
          >
            {currentQuestion.text}
          </p>

          {currentQuestion.questionType === "mcq" ? (
            <div className="grid grid-2 gap-3">
              {currentQuestion.options.map((opt, i) => (
                <label
                  key={i}
                  style={{
                    padding: "16px",
                    border: "2px solid",
                    borderColor:
                      answers[currentQuestion.id] === opt
                        ? "#2563eb"
                        : "#e5e7eb",
                    borderRadius: "8px",
                    background:
                      answers[currentQuestion.id] === opt ? "#eff6ff" : "white",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    value={opt}
                    checked={answers[currentQuestion.id] === opt}
                    onChange={() => handleAnswer(currentQuestion.id, opt)}
                    style={{ marginRight: "12px" }}
                  />
                  {opt}
                </label>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <input
                type="text"
                className="input"
                style={{ fontSize: "18px", padding: "16px" }}
                placeholder="Enter number"
                value={answers[currentQuestion.id] ?? ""}
                onChange={(e) => {
                  const num = e.target.value.replace(/[^\d.-]/g, "");
                  handleAnswer(
                    currentQuestion.id,
                    num === "" ? null : Number(num)
                  );
                }}
                inputMode="numeric"
              />
              {currentQuestion.unit && (
                <span className="badge badge-gray">{currentQuestion.unit}</span>
              )}
            </div>
          )}

          <div className="flex-between mt-4">
            <div className="flex gap-2">
              <button
                className="btn btn-outline"
                onClick={() =>
                  setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
                }
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </button>
              <button
                className="btn btn-outline"
                onClick={() =>
                  setCurrentQuestionIndex(
                    Math.min(questions.length - 1, currentQuestionIndex + 1)
                  )
                }
                disabled={currentQuestionIndex === questions.length - 1}
              >
                Next
              </button>
            </div>
            <div className="text-sm text-gray">
              <AlertCircle
                size={16}
                color="#10b981"
                style={{ marginRight: "6px" }}
              />
              Answers saved automatically
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
