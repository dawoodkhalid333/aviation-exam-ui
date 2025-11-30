import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsAPI, submittedAnswersAPI } from "../../lib/api";
import {
  Send,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Timer,
  Trophy,
  Flag,
  FlagOff,
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
  const [_isSocketOpen, setIsSocketOpen] = useState(false);

  const { data: sessionData, isLoading } = useQuery({
    queryKey: ["exam-session", sessionId],
    queryFn: () =>
      sessionsAPI.getById(sessionId).then((res) => res.data.session),
    enabled: !!sessionId,
    refetchInterval: 10000,
  });

  const submitMutation = useMutation({
    mutationFn: ({ questionId, submittedValue }) =>
      submittedAnswersAPI.create({ sessionId, questionId, submittedValue }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-session", sessionId] });
      toast.success("Answer saved!");
      // handleNext();
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
    },
    onError: () => toast.error("Failed to submit exam"),
  });

  // Timer
  useEffect(() => {
    if (!sessionData) return;
    const isTimed = sessionData.assignmentId.examId.type === "timed";
    const duration = sessionData.assignmentId.examId.duration;
    const consumed = sessionData.totalTimeConsumed || 0;

    if (isTimed) {
      const remaining = Math.max(0, duration - consumed);
      if (timeRemaining === null) {
        setTimeRemaining(remaining);
      }
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            submitExamMutation.mutate();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setTimeRemaining(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionData]);

  useEffect(() => {
    if (!sessionId) return;
    let ws = null;

    const connect = () => {
      ws = new WebSocket(
        `wss://api.aviation1in60.cloud/exam-socket?sessionId=${sessionId}`
      );

      ws.onopen = () => {
        console.log("web socket open");
        setIsSocketOpen(true);
      };

      ws.onclose = () => {
        console.log("web socket closed");
      };
    };

    connect();

    return () => {
      ws?.close();
      ws = null;
    };
  }, []);

  useEffect(() => {
    if (
      timeRemaining === 0 &&
      !submitExamMutation.isPending &&
      !exam.submittedAt
    ) {
      submitExamMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining]);

  if (isLoading || !sessionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const exam = sessionData.assignmentId.examId;
  const questions = exam.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const answeredQuestions = sessionData.answeredQuestions || [];
  const bookmarkedQuestions = sessionData.bookmarkedQuestions || [];

  // const isAnswered = answeredQuestions.some(
  //   (a) => a.questionId === currentQuestion.id
  // );
  const isBookmarked = bookmarkedQuestions.some(
    (b) => b.id === currentQuestion.id
  );

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

  const handleAnswerSubmit = (val) => {
    let value = "";
    if (currentQuestion.type === "mcq") {
      if (!val) return toast.error("Please select an option");
      value = val;
    } else if (currentQuestion.type === "short") {
      if (!val || isNaN(val)) return toast.error("Enter a valid number");
      value = parseInt(val, 10).toString();
    }

    submitMutation.mutate({
      questionId: currentQuestion.id,
      submittedValue: value,
    });
  };

  const handleFinalSubmit = () => {
    if (answeredQuestions.length < questions.length * 0.8) {
      setShowSubmitWarning(true);
    } else {
      submitExamMutation.mutate();
    }
  };

  return (
    <div className="bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-300 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{exam.name}</h1>
          <p className="text-sm text-gray-600">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>

        <div className="flex items-center gap-6">
          {exam.type === "timed" && (
            <div className="flex items-center gap-3 bg-orange-100 px-4 py-2 rounded-lg">
              <Timer className="w-5 h-5 text-orange-600" />
              <span className="font-mono text-xl font-bold text-orange-600">
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
          <button
            onClick={handleFinalSubmit}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
          >
            Submit Exam (Auto Save)
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Left Sidebar - Question List */}
        <div className="w-64 bg-white border-r border-gray-300 p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-4">Questions</h3>
            <div className="space-y-2 overflow-y-auto max-h-[50vh] mb-4">
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
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                      idx === currentQuestionIndex
                        ? "bg-blue-600 text-white"
                        : answered
                        ? "bg-green-500 text-white"
                        : bookmarked
                        ? "border border-yellow-400 text-gray-800"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Question {idx + 1}{" "}
                    <strong className="text-red-600">
                      {bookmarked && "⚑"}
                    </strong>{" "}
                    ({q.marks})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-sm space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span>Bookmarked</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span>Unanswered</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            {/* Question Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  Question {currentQuestionIndex + 1}
                </span>
                <h2 className="text-xl font-semibold text-gray-900 mt-4">
                  {currentQuestion.text}
                </h2>
                {currentQuestion?.questionImg && (
                  <img src={currentQuestion?.questionImg} className="w-full" />
                )}
              </div>

              {/* Bookmark Flag */}
              <button
                onClick={() => bookmarkMutation.mutate(currentQuestion.id)}
                className="p-2 cursor-pointer"
                style={{
                  cursor: bookmarkMutation?.isPending
                    ? "not-allowed"
                    : "pointer",
                }}
                disabled={bookmarkMutation.isPending}
              >
                {isBookmarked ? (
                  <Flag className="w-7 h-7 text-orange-500 fill-orange-500" />
                ) : (
                  <FlagOff className="w-7 h-7 text-gray-400" />
                )}
              </button>
            </div>

            {/* Options */}
            <div className="space-y-4">
              {currentQuestion.type === "mcq" ? (
                <>
                  {currentQuestion?.options?.length
                    ? currentQuestion.options.map((option, idx) => {
                        const isSelected =
                          selectedOption === option ||
                          answeredQuestions.some(
                            (a) =>
                              a.submittedValue === option &&
                              a.questionId === currentQuestion.id
                          );

                        return (
                          <label
                            key={idx}
                            className={`flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                              isSelected
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            <input
                              type="radio"
                              name="option"
                              value={option}
                              checked={isSelected}
                              onChange={(e) => {
                                setSelectedOption(e.target.value);
                                handleAnswerSubmit(e.target.value);
                              }}
                              className="w-5 h-5 text-blue-600"
                              // disabled={isAnswered}
                            />
                            <span className="text-lg">{option}</span>
                          </label>
                        );
                      })
                    : currentQuestion.optionsWithImgs.map((option, idx) => {
                        const isSelected =
                          selectedOption === option.option ||
                          answeredQuestions.some(
                            (a) =>
                              a.submittedValue === option.option &&
                              a.questionId === currentQuestion.id
                          );

                        return (
                          <label
                            key={idx}
                            className={`flex items-center gap-4  p-5 rounded-xl border-2 cursor-pointer transition-all ${
                              isSelected
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            <input
                              type="radio"
                              name="option"
                              value={option.option}
                              checked={isSelected}
                              onChange={(e) => {
                                setSelectedOption(e.target.value);
                                handleAnswerSubmit(e.target.value);
                              }}
                              className="w-5 h-5 text-blue-600"
                              // disabled={isAnswered}
                            />
                            <span className="text-lg">{option.option}: </span>
                            <img src={option.img} className="w-[50%]" />
                          </label>
                        );
                      })}
                </>
              ) : (
                <input
                  type="number"
                  value={numericAnswer}
                  onChange={(e) => {
                    setNumericAnswer(e.target.value);
                    handleAnswerSubmit(e.target.value);
                  }}
                  placeholder="Enter numeric answer"
                  className="w-full max-w-md px-6 py-4 text-2xl text-center border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              )}
            </div>

            {/* Save Button */}
            {/* <div className="mt-10 flex justify-end">
              <button
                onClick={handleAnswerSubmit}
                disabled={submitMutation.isPending || isAnswered}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-3"
              >
                {submitMutation.isPending ? "Saving..." : "Save & Next"}
                <Send className="w-5 h-5" />
              </button>
            </div> */}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" /> Previous
            </button>

            <button
              onClick={handleNext}
              disabled={currentQuestionIndex === questions.length - 1}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Next <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Warning Modal */}
      {showSubmitWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-center mb-4">
              Are you sure?
            </h3>
            <p className="text-gray-600 text-center mb-6">
              You have answered only {answeredQuestions.length} out of{" "}
              {questions.length} questions.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowSubmitWarning(false)}
                className="px-6 py-3 bg-gray-200 rounded-lg"
              >
                Continue Answering
              </button>
              <button
                onClick={() => submitExamMutation.mutate()}
                className="px-6 py-3 bg-red-600 text-white rounded-lg"
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
