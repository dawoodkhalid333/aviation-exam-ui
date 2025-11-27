import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsAPI, submittedAnswersAPI } from "../../lib/api";
import {
  Send,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Timer,
  Trophy,
  Bookmark,
  BookmarkCheck,
  Radio,
} from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

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
  const { sessionId } = useLocation().state || {};
  const queryClient = useQueryClient();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [numericAnswer, setNumericAnswer] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);
  const [isSocketOpen, setIsSocketOpen] = useState(false);

  const { data: sessionData, isLoading } = useQuery({
    queryKey: ["exam-session", sessionId],
    queryFn: () =>
      sessionsAPI.getById(sessionId).then((res) => res.data.session),
    enabled: !!sessionId && isSocketOpen,
    refetchInterval: 10000, // Keep session fresh
  });
  const submitMutation = useMutation({
    mutationFn: ({ questionId, submittedValue }) =>
      submittedAnswersAPI.create({ sessionId, questionId, submittedValue }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-session", sessionId] });
      toast.success("Answer saved!");
      handleNext();
    },
    onError: (err) => toast.error(err?.message || "Failed to save answer"),
  });

  const bookmarkMutation = useMutation({
    mutationFn: (questionId) =>
      sessionsAPI.toggleBookmark(sessionId, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-session", sessionId] });
    },
  });

  const submitExamMutation = useMutation({
    mutationFn: () => sessionsAPI.submit(sessionId),
    onSuccess: () => {
      toast.success("Exam submitted successfully!");
      navigate(`/student`);
      // Navigate to results or dashboard
    },
    onError: () => toast.error("Failed to submit exam"),
  });

  // Timer logic
  useEffect(() => {
    if (!sessionData) return;

    const isTimed = sessionData.assignmentId.examId.type === "timed";
    const duration = sessionData.assignmentId.examId.duration;
    const consumed = sessionData.totalTimeConsumed || 0;

    if (isTimed) {
      const remaining = Math.max(0, duration - consumed);
      setTimeRemaining(remaining);

      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            submitExamMutation.mutate(); // Auto-submit on timeout
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(timer);
      };
    } else {
      setTimeRemaining(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionData]);

  useEffect(() => {
    if (!sessionId && !sessionData.assignmentId.examId.type === "timed") return;
    // Open WebSocket connection to notify server of active session
    const ws = new WebSocket(
      `wss://exampro-api.avantlabstech.com/exam-socket?sessionId=${sessionId}`
    );
    ws.onopen = () => {
      setIsSocketOpen(true);
    };
    ws.onclose = () => {
      setIsSocketOpen(false);
    };

    return () => {
      ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading || !sessionData) {
    return (
      <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const exam = sessionData.assignmentId.examId;
  const questions = exam.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const answeredQuestions = sessionData.answeredQuestions || [];
  const bookmarkedQuestions = sessionData.bookmarkedQuestions || [];

  const isAnswered = answeredQuestions.some(
    (a) => a.questionId === currentQuestion.id
  );
  const isBookmarked = bookmarkedQuestions.some(
    (b) => b.id === currentQuestion.id
  );

  const progress = (
    (answeredQuestions.length / questions.length) *
    100
  ).toFixed(1);

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((i) => i + 1);
      setSelectedOption("");
      setNumericAnswer("");
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((i) => i - 1);
      setSelectedOption("");
      setNumericAnswer("");
    }
  };

  const handleAnswerSubmit = () => {
    let value = "";
    if (currentQuestion.type === "mcq") {
      if (!selectedOption) return toast.error("Please select an option");
      value = selectedOption;
    } else if (currentQuestion.type === "short") {
      if (!numericAnswer || isNaN(numericAnswer))
        return toast.error("Enter a valid number");
      value = parseInt(numericAnswer, 10).toString();
    }

    submitMutation.mutate({
      questionId: currentQuestion.id,
      submittedValue: value,
    });
    setSelectedOption("");
    setNumericAnswer("");
  };

  const handleFinalSubmit = () => {
    if (answeredQuestions.length < questions.length * 0.8) {
      setShowSubmitWarning(true);
    } else {
      submitExamMutation.mutate();
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{exam.name}</h1>
            <p className="text-sm text-gray-600 mt-1">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>

          <div className="flex items-center gap-8">
            {/* Timer */}
            {exam.type === "timed" && (
              <div
                className={`flex items-center gap-3 text-lg font-mono ${
                  timeRemaining < 300
                    ? "text-red-600 animate-pulse"
                    : "text-gray-700"
                }`}
              >
                <Timer className="w-6 h-6" />
                <span className="font-bold">{formatTime(timeRemaining)}</span>
                {timeRemaining < 300 && <AlertCircle className="w-5 h-5" />}
              </div>
            )}

            {/* Progress */}
            <div className="flex items-center gap-3">
              <div className="w-48 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {progress}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
        {/* Main Question Area */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Question Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-gray-800">
                  Q{currentQuestionIndex + 1}.
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 leading-relaxed">
                    {currentQuestion.text}
                  </h2>
                  {currentQuestion.unit && (
                    <p className="text-sm text-gray-500 mt-1">
                      Answer in: {currentQuestion.unit}
                    </p>
                  )}
                </div>
              </div>

              {/* Bookmark Button */}
              <button
                onClick={() => bookmarkMutation.mutate(currentQuestion.id)}
                className={`p-2 rounded-lg transition-all ${
                  isBookmarked
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-6 h-6" />
                ) : (
                  <Bookmark className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Answer Status */}
            {isAnswered && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Answer saved</span>
              </div>
            )}

            {/* Answer Input */}
            <div className="space-y-4">
              {currentQuestion.type === "mcq" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.options.map((option, idx) => (
                    <label
                      key={idx}
                      className={`flex items-center gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all
                        ${
                          selectedOption === option ||
                          answeredQuestions.some(
                            (a) => a.submittedValue === option
                          )
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <Radio
                        className={`w-5 h-5 ${
                          selectedOption === option
                            ? "text-blue-600"
                            : "text-gray-400"
                        }`}
                      />
                      <span className="text-lg">{option}</span>
                      <input
                        type="radio"
                        name="mcq"
                        value={option}
                        checked={selectedOption === option}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        className="sr-only"
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <div className="max-w-md">
                  <input
                    type="number"
                    value={numericAnswer}
                    onChange={(e) => setNumericAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAnswerSubmit()}
                    placeholder="Enter your numeric answer"
                    className="w-full px-6 py-4 text-2xl font-medium text-center border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>
              )}

              {/* Save Answer Button */}
              <div className="flex justify-end mt-8">
                <button
                  onClick={handleAnswerSubmit}
                  disabled={submitMutation.isPending || isAnswered}
                  className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  {submitMutation.isPending ? "Saving..." : "Save Answer"}
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-all"
            >
              Previous
            </button>

            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={handleFinalSubmit}
                className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-all flex items-center gap-3"
              >
                <Trophy className="w-5 h-5" />
                Submit Exam
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                Next Question
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Question Palette Sidebar */}
        <div className="w-80">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-lg mb-4">Question Palette</h3>
            <div className="grid grid-cols-5 gap-3">
              {questions.map((q, idx) => {
                const answered = answeredQuestions.some(
                  (a) => a.questionId === q.id
                );
                const bookmarked = bookmarkedQuestions.some(
                  (b) => b.id === q.id
                );
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentQuestionIndex(idx);
                      setSelectedOption("");
                      setNumericAnswer("");
                    }}
                    className={`relative w-12 h-12 rounded-lg font-semibold text-sm transition-all
                      ${
                        idx === currentQuestionIndex
                          ? "ring-4 ring-blue-400 ring-offset-2"
                          : ""
                      }
                      ${
                        answered
                          ? "bg-green-500 text-white"
                          : bookmarked
                          ? "bg-yellow-400 text-gray-800"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                  >
                    {idx + 1}
                    {bookmarked && (
                      <Bookmark className="w-3 h-3 absolute -top-1 -right-1 text-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-green-500 rounded"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-yellow-400 rounded"></div>
                <span>Bookmarked</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gray-200 rounded"></div>
                <span>Not Answered</span>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="mt-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl p-6 shadow-lg">
            <h4 className="font-bold text-lg">Summary</h4>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between">
                <span>Total Questions</span>
                <span className="font-bold">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Answered</span>
                <span className="font-bold">{answeredQuestions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Bookmarked</span>
                <span className="font-bold">{bookmarkedQuestions.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Warning Modal */}
      {showSubmitWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-center mb-4">
              Are you sure?
            </h3>
            <p className="text-gray-600 text-center mb-6">
              You have answered only {answeredQuestions.length} out of{" "}
              {questions.length} questions. Once submitted, you cannot change
              your answers.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowSubmitWarning(false)}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Continue Answering
              </button>
              <button
                onClick={() => submitExamMutation.mutate()}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
