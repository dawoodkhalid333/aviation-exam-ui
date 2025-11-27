import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { sessionsAPI, submittedAnswersAPI } from "../../lib/api";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft,
  Trophy,
  Target,
  Clock,
  Calendar,
  Star,
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
    enabled: !!sessionId,
  });

  if (sessionLoading || answersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="w-20 h-20 border-8 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!sessionRes?.session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center p-12 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl">
          <HelpCircle size={80} className="mx-auto text-gray-400 mb-6" />
          <h2 className="text-3xl font-bold text-gray-700 mb-4">
            Results Not Available
          </h2>
          <p className="text-gray-600 mb-8">
            This session may not allow review.
          </p>
          <Link
            to="/student"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </Link>
        </div>
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
  const isPassed = percentage >= 70;

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const wrongCount = answers.filter((a) => a.isCorrect === false).length;
  const unansweredCount = questions.length - answers.length;

  const timeTakenSeconds = session.timeConsumedBeforeResume || 0;
  const duration = intervalToDuration({
    start: 0,
    end: timeTakenSeconds * 1000,
  });
  const formattedTime =
    formatDuration(duration, {
      format: ["hours", "minutes", "seconds"],
    }) || "Less than a minute";

  const answerMap = answers.reduce((map, ans) => {
    map[ans.questionId.id] = ans;
    return map;
  }, {});

  const getScoreGradient = () => {
    if (percentage >= 90) return "from-emerald-500 to-teal-600";
    if (percentage >= 70) return "from-green-500 to-emerald-600";
    if (percentage >= 50) return "from-amber-500 to-orange-600";
    return "from-red-500 to-rose-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-100 py-10">
      <div className="max-w-5xl mx-auto px-6">
        {/* Back Button */}
        <Link
          to="/student"
          className="inline-flex items-center gap-3 text-blue-600 hover:text-blue-700 font-medium mb-10 transition"
        >
          <ArrowLeft size={24} />
          Back to My Exams
        </Link>

        {/* Hero Result Section */}
        <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl overflow-hidden mb-12">
          <div className="p-12 text-center">
            <div className="relative inline-block mb-8">
              <Trophy
                size={120}
                className={`mx-auto transition-all duration-1000 ${
                  isPassed ? "text-yellow-500 drop-shadow-2xl" : "text-gray-400"
                }`}
              />
              {isPassed && (
                <div className="absolute inset-0 animate-ping">
                  <Star size={140} className="text-yellow-400 opacity-60" />
                </div>
              )}
            </div>

            <h1
              className={`text-6xl font-bold mb-6 ${
                isPassed ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {isPassed ? "Congratulations!" : "Good Effort!"}
            </h1>
            <p className="text-2xl text-gray-700 mb-8">
              {isPassed
                ? "You passed the exam!"
                : "Keep studying — you’ll get there!"}
            </p>

            {/* Score Ring */}
            <div className="relative inline-block">
              <div
                className={`w-64 h-64 rounded-full bg-gradient-to-br ${getScoreGradient()} p-3 shadow-2xl`}
              >
                <div className="w-full h-full rounded-full bg-white/95 backdrop-blur flex items-center justify-center">
                  <div className="text-center">
                    <div
                      className={`text-8xl font-black ${
                        isPassed ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {percentage}%
                    </div>
                    <div className="text-xl text-gray-600 mt-2">
                      {obtainedMarks} / {totalMarks} marks
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="text-center p-8 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
            <CheckCircle2 size={60} className="mx-auto text-emerald-600 mb-4" />
            <div className="text-5xl font-bold text-emerald-700">
              {correctCount}
            </div>
            <p className="text-gray-700 mt-2">Correct</p>
          </div>

          <div className="text-center p-8 rounded-3xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200">
            <XCircle size={60} className="mx-auto text-rose-600 mb-4" />
            <div className="text-5xl font-bold text-rose-700">{wrongCount}</div>
            <p className="text-gray-700 mt-2">Incorrect</p>
          </div>

          <div className="text-center p-8 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300">
            <HelpCircle size={60} className="mx-auto text-gray-500 mb-4" />
            <div className="text-5xl font-bold text-gray-700">
              {unansweredCount}
            </div>
            <p className="text-gray-700 mt-2">Unanswered</p>
          </div>
        </div>

        {/* Exam Details */}
        <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
            <Target className="text-blue-600" size={36} />
            Exam Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <span className="text-gray-600">Exam Name</span>
              <span className="font-bold text-gray-800">{exam?.name}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <span className="text-gray-600">Category</span>
              <span className="font-bold text-gray-800">
                {exam?.categoryId?.name || "General"}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
              <Clock className="text-amber-600" />
              <span className="text-gray-600">Time Taken</span>
              <span className="font-bold text-gray-800">{formattedTime}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
              <Calendar className="text-purple-600" />
              <span className="text-gray-600">Submitted</span>
              <span className="font-bold text-gray-800">
                {format(new Date(session.submittedAt), "dd MMM yyyy, HH:mm")}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Answers */}
        <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-gray-200">
            <h2 className="text-3xl font-bold text-gray-800">Your Answers</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {questions.map((question, index) => {
              const studentAns = answerMap[question.id];
              const submittedValue = studentAns?.submittedValue;
              const isCorrect = studentAns?.isCorrect === true;
              const wasAttempted = !!studentAns;

              const correctAnswerText =
                question.type === "mcq"
                  ? question.correctAnswer?.mcq?.[0] || question.correctAnswer
                  : question.correctAnswer;

              return (
                <div
                  key={question.id}
                  className="p-8 hover:bg-blue-50/30 transition"
                >
                  <div className="flex items-start gap-6">
                    <div className="text-3xl font-bold text-gray-600">
                      Q{index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        {wasAttempted ? (
                          isCorrect ? (
                            <CheckCircle2
                              size={32}
                              className="text-emerald-600"
                            />
                          ) : (
                            <XCircle size={32} className="text-rose-600" />
                          )
                        ) : (
                          <HelpCircle size={32} className="text-gray-400" />
                        )}
                        <span className="px-4 py-2 bg-gray-100 rounded-full font-bold text-sm">
                          {question.marks} mark{question.marks > 1 ? "s" : ""}
                        </span>
                      </div>

                      <p className="text-xl font-medium text-gray-800 mb-6 leading-relaxed">
                        {question.text}
                      </p>

                      {question.type === "mcq" && question.options && (
                        <div className="space-y-3">
                          {question.options.map((opt, i) => {
                            const isCorrectOpt = opt === correctAnswerText;
                            const isSelected = opt === submittedValue;

                            return (
                              <div
                                key={i}
                                className={`p-5 rounded-2xl border-2 transition-all ${
                                  isCorrectOpt
                                    ? "border-emerald-500 bg-emerald-50"
                                    : isSelected && !isCorrect
                                    ? "border-rose-500 bg-rose-50"
                                    : "border-gray-200 bg-gray-50"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span
                                    className={`font-medium text-lg ${
                                      isCorrectOpt
                                        ? "text-emerald-800"
                                        : isSelected && !isCorrect
                                        ? "text-rose-800"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {opt}
                                    {isSelected &&
                                      !isCorrectOpt &&
                                      " (Your Answer)"}
                                  </span>
                                  {isCorrectOpt && (
                                    <CheckCircle2
                                      size={28}
                                      className="text-emerald-600"
                                    />
                                  )}
                                  {isSelected && !isCorrect && (
                                    <XCircle
                                      size={28}
                                      className="text-rose-600"
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {question.feedback && (
                        <div className="mt-8 p-6 bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-2xl">
                          <p className="font-bold text-sky-800 mb-2">
                            Explanation
                          </p>
                          <p className="text-sky-700 leading-relaxed">
                            {question.feedback}
                          </p>
                        </div>
                      )}

                      {!wasAttempted && (
                        <p className="mt-6 text-amber-700 font-medium italic">
                          You skipped this question
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Final Message */}
        <div className="text-center mt-16">
          <p className="text-2xl text-gray-700 font-medium">
            {isPassed
              ? "Outstanding work! You're ready for the next challenge."
              : "Every attempt makes you stronger. Keep going!"}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes ping {
          75%,
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
