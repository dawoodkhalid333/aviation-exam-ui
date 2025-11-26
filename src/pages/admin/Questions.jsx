import { Fragment, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { questionsAPI, categoriesAPI } from "../../lib/api";
import {
  Plus,
  Trash2,
  Edit,
  Filter,
  Search,
  FileText,
  Hash,
  Award,
} from "lucide-react";
import QuestionFormModal from "../../components/questions/QuestionFormModal";
import toast from "react-hot-toast";

export default function Questions() {
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [filters, setFilters] = useState({
    keyword: "",
    categoryId: "all",
    type: "all",
    marks: "all",
  });

  const queryClient = useQueryClient();

  const { data: questionsRes, isPending: questionsLoading } = useQuery({
    queryKey: ["questions"],
    queryFn: () => questionsAPI.getAll().then((res) => res.data),
  });

  const { data: categoriesRes, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesAPI.getAll().then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: questionsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(["questions"]);
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => questionsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["questions"]);
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: questionsAPI.delete,
    onSuccess: () => queryClient.invalidateQueries(["questions"]),
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to delete question. Please try again."
      );
    },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const questions = questionsRes?.questions || [];
  const categories = categoriesRes?.categories || [];

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const keywordMatch = filters.keyword
        ? q.text.toLowerCase().includes(filters.keyword.toLowerCase())
        : true;

      const categoryMatch =
        filters.categoryId === "all" ||
        q.categoryId?.id === filters.categoryId ||
        q.categoryId === filters.categoryId;

      const typeMatch = filters.type === "all" || q.type === filters.type;

      const marksMatch =
        filters.marks === "all" ||
        (filters.marks === "1-2" && q.marks <= 2) ||
        (filters.marks === "3" && q.marks === 3) ||
        (filters.marks === "4-5" && q.marks >= 4);

      return keywordMatch && categoryMatch && typeMatch && marksMatch;
    });
  }, [questions, filters]);

  const handleClose = () => {
    setShowModal(false);
    setEditingQuestion(null);
  };

  // const handleEdit = (question) => {
  //   setEditingQuestion(question);
  //   setShowModal(true);
  // };

  const handleCreateOrUpdate = (payload) => {
    if (editingQuestion) {
      updateMutation.mutate({ id: editingQuestion.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (questionsLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
            <FileText className="text-blue-600" size={40} />
            Question Bank
          </h1>
          <p className="text-gray-600 mt-2">
            Create, edit, and manage all exam questions
          </p>
        </div>
        <button
          onClick={() => {
            setEditingQuestion(null);
            setShowModal(true);
          }}
          className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
        >
          <Plus size={22} />
          Add Question
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Filter className="text-blue-600" size={22} />
            <h3 className="text-lg font-semibold text-gray-800">
              Search & Filters
            </h3>
          </div>
          <button
            onClick={() =>
              setFilters({
                keyword: "",
                categoryId: "all",
                type: "all",
                marks: "all",
              })
            }
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-3.5 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search question..."
              value={filters.keyword}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, keyword: e.target.value }))
              }
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
            />
          </div>

          <select
            value={filters.categoryId}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, categoryId: e.target.value }))
            }
            className="px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={filters.type}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, type: e.target.value }))
            }
            className="px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
          >
            <option value="all">All Types</option>
            <option value="mcq">Multiple Choice</option>
            <option value="short">Short Answer</option>
          </select>

          <select
            value={filters.marks}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, marks: e.target.value }))
            }
            className="px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
          >
            <option value="all">All Marks</option>
            <option value="1-2">1–2 Marks</option>
            <option value="3">3 Marks</option>
            <option value="4-5">4–5+ Marks</option>
          </select>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing <strong>{filteredQuestions.length}</strong> of{" "}
          <strong>{questions.length}</strong> questions
        </div>
      </div>

      {/* Questions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredQuestions.map((question) => (
          <div
            key={question.id}
            className="group relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 pr-4">
                  <p className="text-lg font-semibold text-gray-800 line-clamp-2">
                    {question.text}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full font-medium ${
                        question.type === "mcq"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {question.type.toUpperCase()}
                    </span>
                    <span className="text-gray-600">
                      {question.categoryId?.name || "Uncategorized"}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        question.difficulty === "easy"
                          ? "bg-green-100 text-green-700"
                          : question.difficulty === "medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {question.difficulty.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      <Award size={14} />
                      {question.marks} marks
                    </div>
                  </div>
                </div>
              </div>

              {/* Expandable Details */}
              {expandedQuestion === question.id && (
                <div className="mt-5 pt-5 border-t border-gray-200 space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    {question.text}
                  </p>

                  {question.type === "mcq" && question.options && (
                    <div className="space-y-2">
                      <p className="font-medium text-gray-700">Options:</p>
                      {question?.options
                        ?.filter((op) => op)
                        ?.map((opt, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="font-medium text-gray-500 w-6">
                              {String.fromCharCode(65 + i)}.
                            </span>
                            <span
                              className={
                                question.correctAnswer === opt
                                  ? "text-green-600 font-medium"
                                  : "text-gray-700"
                              }
                            >
                              {opt}
                              {question.correctAnswer === opt && " (Correct)"}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}

                  {question.type === "short" && (
                    <div className="bg-emerald-50 rounded-xl p-4">
                      <p className="font-medium text-gray-800 flex items-center gap-2">
                        <Hash size={16} /> Correct Answer:{" "}
                        <strong>{`${question?.correctAnswer}${
                          question?.unit || ""
                        }`}</strong>
                      </p>
                      {(question.plusT || question.minusT) && (
                        <p className="text-sm text-gray-600 mt-1">
                          Tolerance: ±{question.plusT || question.minusT}
                        </p>
                      )}
                    </div>
                  )}

                  {question.feedback && (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <p className="text-sm text-blue-800 italic">
                        "{question.feedback}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() =>
                    setExpandedQuestion(
                      expandedQuestion === question.id ? null : question.id
                    )
                  }
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  {expandedQuestion === question.id ? "Hide" : "View"} Details
                </button>

                <div className="flex items-center gap-3">
                  {/* <button
                    onClick={() => handleEdit(question)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Edit size={20} />
                  </button> */}
                  <button
                    onClick={() => {
                      if (window.confirm("Delete this question permanently?")) {
                        deleteMutation.mutate(question.id);
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredQuestions.length === 0 && (
        <div className="text-center py-20">
          <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText size={64} className="text-gray-400" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-700 mb-2">
            No questions found
          </h3>
          <p className="text-gray-500">
            Try adjusting filters or create your first question
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <QuestionFormModal
          isOpen={showModal}
          onClose={handleClose}
          initialData={editingQuestion}
          categories={categories}
          onSubmit={handleCreateOrUpdate}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}
