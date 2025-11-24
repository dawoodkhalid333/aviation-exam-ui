import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { sessionsAPI, submittedAnswersAPI } from "../../lib/api";
import {
  Clock,
  Bookmark,
  Send,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useState, useEffect } from "react";

const formatTime = (seconds) => {
  if (seconds === null || seconds === undefined) return "Untimed";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function TakeExam() {
  const navigate = useNavigate();
  const { startRes } = useLocation().state || {};

  const sessionId = startRes?.session?.id;
  const exam = startRes?.session?.assignmentId?.examId;

  // Current question state
  const [currentQuestion, setCurrentQuestion] = useState(
    startRes?.currentQuestion || null
  );
  const [currentIndex, setCurrentIndex] = useState(
    startRes?.currentQuestionIndex ?? 0
  );
  const [answeredCount, setAnsweredCount] = useState(0);
  const [currentGrade, setCurrentGrade] = useState(
    startRes?.session?.grade || 0
  );
  const [showFeedback, setShowFeedback] = useState(null); // { isCorrect, message }

  // Form state
  const [selectedOption, setSelectedOption] = useState("");
  const [shortAnswer, setShortAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Time remaining query
  const { data: timeRemaining } = useQuery({
    queryKey: ["remaining-time", sessionId],
    queryFn: () =>
      sessionsAPI
        .getRemainingTime(sessionId)
        .then((res) => res.data.remainingTime),
    refetchInterval: 1000,
    enabled: !!sessionId && exam?.type === "timed",
  });

  const { data: lastSubmittedANswer } = useQuery({
    queryKey: ["last-submitted", sessionId],
    queryFn: () =>
      submittedAnswersAPI.getLastBySession(sessionId).then((res) => {
        const data = res.data;
        setCurrentQuestion(data.nextQuestion);
        setCurrentIndex(data.nextQuestionIndex);
        setAnsweredCount(data.answeredCount);
        return data;
      }),
    enabled: !!sessionId,
    refetchOnWindowFocus: true,
  });

  console.log(lastSubmittedANswer);

  const submitMutation = useMutation({
    mutationFn: ({ questionId, submittedValue }) =>
      submittedAnswersAPI.create({
        sessionId,
        questionId,
        submittedValue,
      }),
    onSuccess: (response) => {
      const data = response.data;

      setCurrentGrade(data.currentGrade);
      setAnsweredCount(data.answeredCount);

      if (
        data.isCorrect !== undefined &&
        startRes?.session?.assignmentId?.isReviewAllowed
      ) {
        setShowFeedback({
          isCorrect: data.isCorrect,
          message: data.isCorrect
            ? `+${currentQuestion.marks} marks`
            : "Incorrect",
        });
      }

      // Show feedback briefly
      setTimeout(() => setShowFeedback(null), 1500);

      if (data.examCompleted || data.isLastQuestion) {
        console.log("Exam completed");
        navigate("/student/exams", { state: { completed: true } });
      } else if (data.nextQuestion) {
        // Move to next question
        setCurrentQuestion(data.nextQuestion);
        setCurrentIndex(data.nextQuestionIndex);
        setSelectedOption("");
        setShortAnswer("");
      }

      setIsSubmitting(false);
    },
    onError: (err) => {
      console.error(err);
      alert("Failed to submit answer. Please try again.");
      setIsSubmitting(false);
    },
  });

  const handleNext = () => {
    if (!currentQuestion) return;

    let submittedValue;

    if (currentQuestion.type === "mcq") {
      if (!selectedOption) {
        alert("Please select an option");
        return;
      }
      submittedValue = selectedOption;
    } else if (currentQuestion.type === "short") {
      const num = Number(shortAnswer);
      if (isNaN(num) || !Number.isInteger(num) || shortAnswer.trim() === "") {
        alert("Please enter a valid whole number");
        return;
      }
      submittedValue = num;
    }

    setIsSubmitting(true);
    submitMutation.mutate({
      questionId: currentQuestion.id,
      submittedValue,
    });
  };

  const handleSubmit = () => {
    if (answeredCount < startRes?.totalQuestions) {
      if (
        !window.confirm("You haven't answered all questions. Submit exam now?")
      ) {
        return;
      }
    }
    handleNext(); // This will trigger final submission
  };

  // Auto-submit when time runs out
  useEffect(() => {
    if (
      exam?.type === "timed" &&
      timeRemaining !== undefined &&
      timeRemaining <= 0
    ) {
      handleSubmit(); // Force submit if time ends
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining]);

  // useEffect(()=>{

  // },[lastSubmittedANswer])

  if (!startRes || !currentQuestion) {
    return (
      <div
        className="container"
        style={{ padding: "40px 20px", textAlign: "center" }}
      >
        <div className="card" style={{ maxWidth: 500, margin: "0 auto" }}>
          <AlertCircle
            size={48}
            style={{ color: "#dc2626", margin: "0 auto 16px" }}
          />
          <h2>Invalid Exam Session</h2>
          <p>You may have accessed this page incorrectly.</p>
          <button
            className="btn btn-primary mt-4"
            onClick={() => navigate("/student")}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isTimed = exam?.type === "timed";
  const totalQuestions = startRes?.totalQuestions;

  return (
    <div
      style={{
        display: "flex",
        gap: "24px",
        padding: "20px 0",
        minHeight: "100vh",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: "300px",
          background: "white",
          borderRadius: "8px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          height: "fit-content",
          position: "sticky",
          top: "20px",
        }}
      >
        <h2
          style={{ fontSize: "18px", fontWeight: "600", marginBottom: "24px" }}
        >
          {exam?.name}
        </h2>

        <div className="mb-4">
          <p className="text-sm text-gray" style={{ marginBottom: "4px" }}>
            Progress
          </p>
          <p style={{ fontSize: "24px", fontWeight: "700" }}>
            {answeredCount} / {totalQuestions}
          </p>
          <div
            style={{
              height: "8px",
              background: "#e5e7eb",
              borderRadius: "4px",
              marginTop: "8px",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(answeredCount / totalQuestions) * 100}%`,
                background: "#2563eb",
                borderRadius: "4px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {isTimed && (
          <div className="mb-4">
            <p
              className="text-sm text-gray"
              style={{
                marginBottom: "4px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Clock size={16} /> Time Remaining
            </p>
            <p
              style={{
                fontSize: "32px",
                fontWeight: "700",
                color: timeRemaining < 300 ? "#dc2626" : "#1d4ed8",
              }}
            >
              {formatTime(timeRemaining)}
            </p>
            {timeRemaining < 300 && timeRemaining > 0 && (
              <p style={{ color: "#dc2626", fontSize: "14px" }}>
                <AlertCircle
                  size={16}
                  style={{ display: "inline", marginRight: "4px" }}
                />
                Less than 5 minutes left!
              </p>
            )}
          </div>
        )}

        {startRes?.session?.assignmentId?.isReviewAllowed && (
          <div style={{ marginTop: "32px" }}>
            <p className="text-sm text-gray">Current Score</p>
            <p
              style={{ fontSize: "20px", fontWeight: "700", color: "#16a34a" }}
            >
              {currentGrade} marks
            </p>
          </div>
        )}

        <button
          className="btn btn-success"
          style={{ width: "100%", marginTop: "24px" }}
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          <Send size={16} />
          Submit Exam
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        <div className="card">
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h1 style={{ fontSize: "18px", fontWeight: "600" }}>
                Question {currentIndex + 1} of {totalQuestions}
              </h1>
              <span className="badge badge-blue">
                {currentQuestion.marks}{" "}
                {currentQuestion.marks === 1 ? "mark" : "marks"}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: "32px" }}>
            <p style={{ fontSize: "18px", lineHeight: "1.6" }}>
              {currentQuestion.text}
            </p>
            {currentQuestion.difficulty && (
              <span
                className={`badge badge-${
                  currentQuestion.difficulty === "easy"
                    ? "green"
                    : currentQuestion.difficulty === "medium"
                    ? "yellow"
                    : "red"
                }`}
                style={{ marginTop: "12px", display: "inline-block" }}
              >
                {currentQuestion.difficulty}
              </span>
            )}
          </div>

          {/* Answer Input */}
          {currentQuestion.type === "mcq" ? (
            <div>
              {currentQuestion.options.map((opt, idx) => (
                <label
                  key={idx}
                  style={{
                    display: "block",
                    padding: "14px 16px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    marginBottom: "12px",
                    cursor: "pointer",
                    background:
                      selectedOption === opt.text ? "#dbeafe" : "transparent",
                    transition: "all 0.2s",
                  }}
                  onClick={() => !isSubmitting && setSelectedOption(opt.text)}
                >
                  <input
                    type="radio"
                    name="mcq"
                    checked={selectedOption === opt.text}
                    onChange={() => setSelectedOption(opt.text)}
                    style={{ marginRight: "12px" }}
                    disabled={isSubmitting}
                  />
                  {opt.text}
                </label>
              ))}
            </div>
          ) : (
            <div className="form-group">
              <label className="label">Your Answer (whole number only)</label>
              <input
                type="text"
                className="input"
                style={{ fontSize: "18px", textAlign: "center" }}
                value={shortAnswer}
                onChange={(e) =>
                  setShortAnswer(e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="e.g. 42"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray" style={{ marginTop: "8px" }}>
                Enter a whole number (e.g., 123)
              </p>
            </div>
          )}

          <div style={{ marginTop: "32px", textAlign: "right" }}>
            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={
                isSubmitting ||
                (!selectedOption && currentQuestion.type === "mcq") ||
                (currentQuestion.type === "short" && shortAnswer === "")
              }
            >
              {isSubmitting ? (
                <>Submitting...</>
              ) : answeredCount + 1 === totalQuestions ? (
                <>
                  <Send size={16} /> Submit Final Answer
                </>
              ) : (
                "Next Question"
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Feedback Toast */}
      {showFeedback && (
        <div
          style={{
            position: "fixed",
            bottom: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            background: showFeedback.isCorrect ? "#16a34a" : "#dc2626",
            color: "white",
            padding: "16px 32px",
            borderRadius: "8px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontWeight: "600",
            zIndex: 1000,
            animation: "slideUp 0.4s ease",
          }}
        >
          {showFeedback.isCorrect ? (
            <CheckCircle size={24} />
          ) : (
            <XCircle size={24} />
          )}
          {showFeedback.message}
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateX(-50%) translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
