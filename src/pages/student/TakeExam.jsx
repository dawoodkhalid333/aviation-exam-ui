import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { sessionsAPI, submittedAnswersAPI } from "../../lib/api";
import {
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Timer,
  Trophy,
  Target,
} from "lucide-react";
import { useState, useEffect } from "react";

const formatTime = (seconds) => {
  if (seconds === null || seconds === undefined) return "Untimed";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

export default function TakeExam() {
  const navigate = useNavigate();
  const { startRes } = useLocation().state || {};

  const sessionId = startRes?.session?.id;
  const exam = startRes?.session?.assignmentId?.examId;
  const assignment = startRes?.session?.assignmentId;

  const [currentQuestion, setCurrentQuestion] = useState(
    startRes?.currentQuestion || null
  );
  const [currentIndex, setCurrentIndex] = useState(
    startRes?.currentQuestionIndex ?? 0
  );
  const [answeredCount, setAnsweredCount] = useState(
    startRes?.answeredCount || 0
  );
  const [currentGrade, setCurrentGrade] = useState(
    startRes?.session?.grade || 0
  );
  const [selectedOption, setSelectedOption] = useState("");
  const [shortAnswer, setShortAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: "success" | "error", message }

  const isTimed = exam?.type === "timed";
  const totalQuestions = startRes?.totalQuestions || 0;
  const showScore = assignment?.isReviewAllowed;

  // Real-time remaining time
  const { data: timeRemaining } = useQuery({
    queryKey: ["remaining-time", sessionId],
    queryFn: () =>
      sessionsAPI
        .getRemainingTime(sessionId)
        .then((res) => res.data.remainingTime),
    refetchInterval: 1000,
    enabled: !!sessionId && isTimed,
  });

  // Auto-submit when time runs out
  useEffect(() => {
    if (isTimed && timeRemaining !== undefined && timeRemaining <= 0) {
      // eslint-disable-next-line react-hooks/immutability
      handleSubmitExam();
    }
  }, [timeRemaining]);

  const submitMutation = useMutation({
    mutationFn: ({ questionId, submittedValue }) =>
      submittedAnswersAPI.create({
        sessionId,
        questionId,
        submittedValue,
      }),
    onSuccess: (res) => {
      const data = res.data;

      setCurrentGrade(data.currentGrade || currentGrade);
      setAnsweredCount(data.answeredCount || answeredCount);

      if (showScore && data.isCorrect !== undefined) {
        setFeedback({
          type: data.isCorrect ? "success" : "error",
          message: data.isCorrect
            ? `+${currentQuestion.marks} marks`
            : "Incorrect",
        });
        setTimeout(() => setFeedback(null), 2000);
      }

      if (data.examCompleted || data.isLastQuestion) {
        navigate("/student/exams", { state: { completed: true } });
      } else if (data.nextQuestion) {
        setCurrentQuestion(data.nextQuestion);
        setCurrentIndex(data.nextQuestionIndex);
        setSelectedOption("");
        setShortAnswer("");
      }

      setIsSubmitting(false);
    },
    onError: () => {
      alert("Failed to submit. Please try again.");
      setIsSubmitting(false);
    },
  });

  const handleNext = () => {
    if (!currentQuestion) return;

    let submittedValue;

    if (currentQuestion.type === "mcq") {
      if (!selectedOption) {
        alert("Please select an answer");
        return;
      }
      submittedValue = selectedOption;
    } else if (currentQuestion.type === "short") {
      const num = Number(shortAnswer);
      if (shortAnswer.trim() === "" || isNaN(num) || !Number.isInteger(num)) {
        alert("Please enter a valid whole number");
        return;
      }
      submittedValue = num;
    }

    setIsSubmitting(true);
    submitMutation.mutate({ questionId: currentQuestion.id, submittedValue });
  };

  const handleSubmitExam = () => {
    if (answeredCount < totalQuestions) {
      if (!window.confirm("Submit exam now? Some questions are unanswered."))
        return;
    }
    handleNext();
  };

  if (!startRes || !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center p-10 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50">
          <AlertCircle size={80} className="mx-auto text-red-500 mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Invalid Session
          </h2>
          <p className="text-gray-600 mb-8">
            This exam session is not accessible.
          </p>
          <button
            onClick={() => navigate("/student")}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const progressPercent =
    totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const isLastQuestion = answeredCount + 1 === totalQuestions;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-100">
      <div className="flex gap-8 p-6 max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className="w-80">
          <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl p-8 sticky top-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-3">
              <Target className="text-blue-600" size={32} />
              {exam?.name}
            </h2>

            {/* Progress */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-600 mb-3">
                <span>Progress</span>
                <span className="font-bold text-blue-600">
                  {answeredCount} / {totalQuestions}
                </span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Timer */}
            {isTimed && (
              <div className="mb-8 p-6 bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl border border-rose-200">
                <div className="flex items-center gap-3 mb-3">
                  <Timer
                    size={28}
                    className={`animate-pulse ${
                      timeRemaining < 300 ? "text-red-600" : "text-blue-600"
                    }`}
                  />
                  <span className="text-lg font-bold text-gray-800">
                    Time Remaining
                  </span>
                </div>
                <div
                  className={`text-5xl font-bold ${
                    timeRemaining < 300 ? "text-red-600" : "text-blue-600"
                  }`}
                >
                  {formatTime(timeRemaining)}
                </div>
                {timeRemaining < 300 && timeRemaining > 0 && (
                  <p className="text-red-600 mt-3 flex items-center gap-2">
                    <AlertCircle size={20} />
                    Less than 5 minutes left!
                  </p>
                )}
              </div>
            )}

            {/* Score */}
            {showScore && (
              <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200">
                <Trophy className="mx-auto text-yellow-500 mb-3" size={40} />
                <p className="text-sm text-gray-600">Current Score</p>
                <p className="text-4xl font-bold text-emerald-700">
                  {currentGrade} marks
                </p>
              </div>
            )}

            {/* Submit Button */}
            {/* <button
              onClick={handleSubmitExam}
              disabled={isSubmitting}
              className="w-full mt-8 py-5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-xl rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-70"
            >
              <Send size={24} className="inline mr-3" />
              Submit Exam
            </button> */}
          </div>
        </aside>

        {/* Main Question Area */}
        <main className="flex-1">
          <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl p-10">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800">
                Question {currentIndex + 1} of {totalQuestions}
              </h1>
              <span className="px-5 py-3 bg-blue-100 text-blue-700 rounded-full font-bold text-lg">
                {currentQuestion.marks} mark
                {currentQuestion.marks > 1 ? "s" : ""}
              </span>
            </div>

            <div className="mb-10">
              <p className="text-2xl leading-relaxed text-gray-800 font-medium">
                {currentQuestion.text}
              </p>
              {/* {currentQuestion.difficulty && (
                <span
                  className={`inline-block mt-4 px-4 py-2 rounded-full text-sm font-bold ${
                    currentQuestion.difficulty === "easy"
                      ? "bg-emerald-100 text-emerald-700"
                      : currentQuestion.difficulty === "medium"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {currentQuestion.difficulty.toUpperCase()}
                </span>
              )} */}
            </div>

            {/* Answer Input */}
            {currentQuestion.type === "mcq" ? (
              <div className="space-y-4">
                {currentQuestion.options.map((opt, i) => (
                  <label
                    key={i}
                    className={`block p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                      selectedOption === opt.text
                        ? "border-blue-500 bg-blue-50 shadow-lg"
                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                    }`}
                    onClick={() => !isSubmitting && setSelectedOption(opt.text)}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedOption === opt.text
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedOption === opt.text && (
                          <div className="w-4 h-4 bg-white rounded-full" />
                        )}
                      </div>
                      <span className="text-lg font-medium text-gray-800">
                        {opt.text}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <input
                  type="text"
                  value={shortAnswer}
                  onChange={(e) =>
                    setShortAnswer(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  placeholder="Enter your answer (e.g. 42)"
                  disabled={isSubmitting}
                  className="w-full text-center text-4xl font-bold py-8 px-6 rounded-2xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-all"
                />
                <p className="text-center text-gray-600 mt-4">
                  Whole numbers only
                </p>
              </div>
            )}

            {/* Next / Submit Button */}
            <div className="text-right mt-12">
              <button
                onClick={handleNext}
                disabled={
                  isSubmitting ||
                  (currentQuestion.type === "mcq" && !selectedOption) ||
                  (currentQuestion.type === "short" && !shortAnswer)
                }
                className="inline-flex items-center gap-4 px-10 py-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold text-xl rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  "Submitting..."
                ) : isLastQuestion ? (
                  <>
                    Submit Final Answer <Send size={28} />
                  </>
                ) : (
                  <>
                    Next Question <ChevronRight size={32} />
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-5 rounded-2xl shadow-2xl flex items-center gap-4 text-white font-bold text-xl z-50 animate-bounce ${
            feedback.type === "success" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 size={36} />
          ) : (
            <XCircle size={36} />
          )}
          {feedback.message}
        </div>
      )}

      <style jsx>{`
        @keyframes bounce {
          0%,
          100% {
            transform: translateX(-50%) translateY(0);
          }
          50% {
            transform: translateX(-50%) translateY(-10px);
          }
        }
        .animate-bounce {
          animation: bounce 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
