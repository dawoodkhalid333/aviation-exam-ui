import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { sessionsAPI, submittedAnswersAPI } from "../../lib/api";
import {
  ArrowLeft,
  Clock,
  UserCircle,
  BookOpen,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Trophy,
  Target,
  Timer,
  Calendar,
} from "lucide-react";
import { format, formatDuration, intervalToDuration } from "date-fns";

export default function SessionReview() {
  const { sessionId } = useParams();

  const { data: sessionRes, isLoading: sessionLoading } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => sessionsAPI.getById(sessionId).then((res) => res.data),
    enabled: !!sessionId,
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-20 h-20 border-6 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!sessionRes?.session?.id) return null;

  const session = sessionRes.session;
  const exam = session.assignmentId?.examId;
  const student = session.assignmentId?.studentId;
  const questions = exam?.questions || [];
  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  const obtainedMarks = session.grade || 0;
  const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

  const timeTakenSeconds = session.totalTimeConsumed || 0;
  const duration = intervalToDuration({
    start: 0,
    end: timeTakenSeconds * 1000,
  });
  const formattedTime =
    formatDuration(duration, { format: ["hours", "minutes", "seconds"] }) ||
    "0s";

  const answerMap = answers.reduce((map, ans) => {
    map[ans.questionId.id] = ans;
    return map;
  }, {});

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const wrongCount = answers.filter((a) => a.isCorrect === false).length;
  const skippedCount = questions.length - answers.length;

  const getScoreColor = () => {
    if (percentage >= session?.assignmentId?.examId?.passingPercentage)
      return "from-emerald-500 to-teal-600";
    if (percentage < session?.assignmentId?.examId?.passingPercentage)
      return "from-red-500 to-rose-600";
    return "from-red-500 to-rose-600";
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Back Button */}
      <Link
        to={`/admin/students/${student?.id}`}
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium hover:underline transition"
      >
        <ArrowLeft size={22} />
        Back to Student Profile
      </Link>

      {/* Hero Header with Score Ring */}
      <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl overflow-hidden">
        <div className="p-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-3">
                Session Review
              </h1>
              <div className="flex items-center gap-4 text-gray-600">
                <BookOpen size={20} />
                <span className="font-medium">{exam?.name}</span>
                <span>•</span>
                <Calendar size={18} />
                <span>
                  {format(
                    new Date(session.submittedAt),
                    "dd MMM yyyy 'at' HH:mm"
                  )}
                </span>
              </div>
            </div>

            {/* Score Ring */}
            <div className="relative">
              <div
                className={`w-48 h-48 rounded-full bg-gradient-to-br ${getScoreColor()} p-1`}
              >
                <div className="w-full h-full rounded-full bg-white/90 backdrop-blur flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-gray-800">
                      {percentage.toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {obtainedMarks} / {totalMarks} marks
                    </div>
                  </div>
                </div>
              </div>
              <Trophy
                className="absolute -top-3 -right-3 text-yellow-500"
                size={40}
              />
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">
                {correctCount}
              </div>
              <div className="text-sm text-gray-600 mt-1">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {wrongCount}
              </div>
              <div className="text-sm text-gray-600 mt-1">Wrong</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">
                {skippedCount}
              </div>
              <div className="text-sm text-gray-600 mt-1">Skipped</div>
            </div>
            <div className="text-center">
              <Timer size={20} className="mx-auto text-blue-600 mb-2" />
              <div className="text-xl font-bold text-gray-800">
                {formattedTime}
              </div>
              <div className="text-sm text-gray-600">
                {exam?.duration ? `of ${exam.duration / 60} min` : "Untimed"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student & Exam Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {student?.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm text-gray-600">Student</p>
              <p className="font-bold text-gray-800">{student?.name}</p>
              <p className="text-sm text-gray-500">{student?.email}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl p-6">
          <div className="flex items-center gap-4">
            <BookOpen className="text-blue-600" size={40} />
            <div>
              <p className="text-sm text-gray-600">Exam</p>
              <p className="font-bold text-gray-800">{exam?.name}</p>
              <p className="text-sm text-gray-500">
                {exam?.categoryId?.name || "Uncategorized"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Answers */}
      <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Target className="text-blue-600" size={28} />
            Detailed Answers ({questions.length} Questions)
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {questions.map((question, index) => {
            const studentAnswer = answerMap[question.id];
            const submittedValue = studentAnswer?.submittedValue;
            const isCorrect = studentAnswer?.isCorrect === true;
            const wasAttempted = !!studentAnswer;

            const correctAnswerText =
              question.type === "mcq"
                ? question.correctAnswer?.mcq?.[0] || question.correctAnswer
                : question.correctAnswer?.short || question.correctAnswer;

            return (
              <div
                key={question.id}
                className="p-8 hover:bg-blue-50/30 transition"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-gray-700">
                      Q{index + 1}
                    </div>
                    <div className="flex items-center gap-3">
                      {wasAttempted ? (
                        isCorrect ? (
                          <CheckCircle2
                            className="text-emerald-600"
                            size={28}
                          />
                        ) : (
                          <XCircle className="text-red-600" size={28} />
                        )
                      ) : (
                        <HelpCircle className="text-gray-400" size={28} />
                      )}
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                        {question.marks} mark{question.marks > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>

                <p
                  className="text-lg text-gray-800 font-medium mb-6 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: question.text }}
                ></p>

                {question.type === "mcq" && (
                  <>
                    {question.options?.length ? (
                      <div className="space-y-3">
                        {question.options.map((opt, i) => {
                          const isCorrectOption = opt === correctAnswerText;
                          const isSelected = opt === submittedValue;

                          return (
                            <div
                              key={i}
                              className={`
                            p-4 rounded-xl border-2 transition-all
                            ${
                              isCorrectOption
                                ? "border-emerald-500 bg-emerald-50"
                                : isSelected && !isCorrect
                                ? "border-red-500 bg-red-50"
                                : "border-gray-200 bg-gray-50"
                            }
                          `}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`
                              font-medium
                              ${
                                isCorrectOption
                                  ? "text-emerald-800"
                                  : isSelected && !isCorrect
                                  ? "text-red-800"
                                  : "text-gray-700"
                              }
                            `}
                                >
                                  {opt}
                                  {isSelected &&
                                    !isCorrectOption &&
                                    " (Your Answer)"}
                                </span>
                                {isCorrectOption && (
                                  <CheckCircle2
                                    className="text-emerald-600"
                                    size={22}
                                  />
                                )}
                                {isSelected && !isCorrect && (
                                  <XCircle className="text-red-600" size={22} />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {question.optionsWithImgs.map((optWImg, i) => {
                          const opt = optWImg.option;
                          const isCorrectOption = opt === correctAnswerText;
                          const isSelected = opt === submittedValue;

                          return (
                            <div
                              key={i}
                              className={`
                            p-4 rounded-xl border-2 transition-all
                            ${
                              isCorrectOption
                                ? "border-emerald-500 bg-emerald-50"
                                : isSelected && !isCorrect
                                ? "border-red-500 bg-red-50"
                                : "border-gray-200 bg-gray-50"
                            }
                          `}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`
                              font-medium
                              ${
                                isCorrectOption
                                  ? "text-emerald-800"
                                  : isSelected && !isCorrect
                                  ? "text-red-800"
                                  : "text-gray-700"
                              }
                            `}
                                >
                                  {opt}
                                  {isSelected &&
                                    !isCorrectOption &&
                                    " (Your Answer)"}
                                </span>
                                {isCorrectOption && (
                                  <CheckCircle2
                                    className="text-emerald-600"
                                    size={22}
                                  />
                                )}
                                {isSelected && !isCorrect && (
                                  <XCircle className="text-red-600" size={22} />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {question.type === "short" && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Your Answer:</p>
                      <div
                        className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-800"
                        dangerouslySetInnerHTML={{
                          __html:
                            submittedValue || "<em>No answer submitted</em>",
                        }}
                      ></div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Correct Answer:
                      </p>
                      <div
                        className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800"
                        dangerouslySetInnerHTML={{ __html: correctAnswerText }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Feedback Box */}
                {question.feedback && (
                  <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl">
                    <p className="font-semibold text-blue-800 mb-2">
                      Explanation
                    </p>
                    <p className="text-blue-700 leading-relaxed">
                      {question.feedback}
                    </p>
                  </div>
                )}

                {!wasAttempted && (
                  <p className="mt-6 text-amber-700 font-medium italic">
                    Question was not answered
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
