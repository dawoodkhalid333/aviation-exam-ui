import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { examsAPI, questionsAPI, categoriesAPI } from "../../lib/api";
import {
  Save,
  Filter,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Info,
  Clock,
  Calendar,
  FileText,
  Search,
} from "lucide-react";

const initialFilters = {
  keyword: "",
  category: "all",
  type: "all",
  marks: "all",
};

export default function CreateExam() {
  const { id } = useParams(); // If id exists → edit mode
  const isEditMode = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "timed",
    duration: 60,
    categoryId: "",
    opensAt: "",
    closesAt: "",
    defaultAttempts: 1,
    defaultExpiry: 7,
    reviewMode: "practice",
    questions: [],
  });

  const [questionFilters, setQuestionFilters] = useState(initialFilters);

  // Fetch categories
  const { data: categoriesRes = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesAPI.getAll().then((res) => res.data || []),
  });

  // Fetch question bank
  const { data: questionBankRes, isLoading: questionsLoading } = useQuery({
    queryKey: ["questions"],
    queryFn: () => questionsAPI.getAll().then((res) => res.data || []),
  });

  // Fetch exam if in edit mode
  const { data: examData, isLoading: examLoading } = useQuery({
    queryKey: ["exam", id],
    queryFn: () => examsAPI.getById(id).then((res) => res.data),
    enabled: isEditMode,
  });

  // Pre-fill form when editing
  useEffect(() => {
    if (isEditMode && examData?.success) {
      const exam = examData.exam;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: exam.name || "",
        description: exam.description || "",
        type: exam.type || "timed",
        duration: exam.duration ? exam.duration / 60 : 60,
        categoryId: exam.categoryId?._id || exam.categoryId || "",
        opensAt: exam.opensAt
          ? new Date(exam.opensAt).toISOString().slice(0, 16)
          : "",
        closesAt: exam.closesAt
          ? new Date(exam.closesAt).toISOString().slice(0, 16)
          : "",
        defaultAttempts: exam.defaultAttempts || 1,
        defaultExpiry: exam.defaultExpiry || 7,
        reviewMode: exam.reviewMode || "practice",
        questions: exam.questions?.map((q) => q._id || q.id) || [],
      });
    }
  }, [examData, isEditMode]);

  const availableQuestions = useMemo(
    () => questionBankRes?.questions || [],
    [questionBankRes]
  );

  const createMutation = useMutation({
    mutationFn: examsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      navigate("/admin/exams");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => examsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      queryClient.invalidateQueries({ queryKey: ["exam", id] });
      navigate("/admin/exams");
    },
  });

  const filteredQuestions = useMemo(() => {
    return availableQuestions.filter((question) => {
      const keywordMatch = questionFilters.keyword
        ? question.text
            .toLowerCase()
            .includes(questionFilters.keyword.toLowerCase())
        : true;

      const questionCategoryName =
        question.categoryId?.name || question.category || "Uncategorized";

      const categoryMatch =
        questionFilters.category === "all" ||
        questionCategoryName === questionFilters.category;

      const typeMatch =
        questionFilters.type === "all" ||
        question.type === questionFilters.type;

      const marksMatch =
        questionFilters.marks === "all"
          ? true
          : questionFilters.marks === "1-2"
          ? question.marks <= 2
          : questionFilters.marks === "3"
          ? question.marks === 3
          : question.marks >= 4;

      return keywordMatch && categoryMatch && typeMatch && marksMatch;
    });
  }, [availableQuestions, questionFilters]);

  const selectedQuestionDetails = useMemo(() => {
    const map = new Map(availableQuestions.map((q) => [q.id || q._id, q]));
    return formData.questions.map((id) => map.get(id)).filter(Boolean);
  }, [formData.questions, availableQuestions]);

  const handleAddQuestion = (questionId) => {
    if (formData.questions.includes(questionId)) return;
    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, questionId],
    }));
  };

  const handleRemoveQuestion = (questionId) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((id) => id !== questionId),
    }));
  };

  const moveQuestion = (index, direction) => {
    setFormData((prev) => {
      const updated = [...prev.questions];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= updated.length) return prev;
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return { ...prev, questions: updated };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.questions.length) {
      alert("Please select at least one question.");
      return;
    }
    if (!formData.name.trim()) {
      alert("Please enter an exam name.");
      return;
    }
    if (!formData.categoryId) {
      alert("Please select a category.");
      return;
    }
    if (!formData.opensAt || !formData.closesAt) {
      alert("Please set both opening and closing dates.");
      return;
    }
    if (new Date(formData.opensAt) >= new Date(formData.closesAt)) {
      alert("Closing date must be after opening date.");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || "",
      type: formData.type,
      categoryId: formData.categoryId,
      duration:
        formData.type === "timed" ? Number(formData.duration) * 60 : null,
      questions: formData.questions,
      defaultAttempts: Number(formData.defaultAttempts),
      defaultExpiry: Number(formData.defaultExpiry),
      reviewMode: formData.reviewMode,
      opensAt: new Date(formData.opensAt).toISOString(),
      closesAt: new Date(formData.closesAt).toISOString(),
    };

    if (isEditMode) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isEditMode && examLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
            <FileText className="text-blue-600" size={40} />
            {isEditMode ? "Edit Exam" : "Create New Exam"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEditMode
              ? "Update exam settings and questions"
              : "Configure exam settings and select questions"}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Exam Settings */}
        <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Exam Details
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Same form fields as before... */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Exam Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                placeholder="e.g., EASA ATPL Air Law - Module 1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none resize-none"
                placeholder="Optional instructions for students..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Exam Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                >
                  <option value="timed">Timed (Auto-submit)</option>
                  <option value="untimed">Untimed (Manual submit)</option>
                </select>
              </div>
              {formData.type === "timed" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Duration (minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        duration: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                    required
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    categoryId: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                required
              >
                <option value="">Select category</option>
                {categoriesRes?.categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Opens At <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.opensAt}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      opensAt: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Closes At <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.closesAt}
                  min={formData.opensAt || undefined}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      closesAt: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Default Attempts
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.defaultAttempts}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      defaultAttempts: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Default Expiry (days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.defaultExpiry}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      defaultExpiry: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Review Mode
              </label>
              <select
                value={formData.reviewMode}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    reviewMode: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
              >
                <option value="practice">
                  Practice (review + feedback allowed)
                </option>
                <option value="assessment">
                  Assessment (no review, no feedback)
                </option>
              </select>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Save size={20} />
                {updateMutation.isPending || createMutation.isPending
                  ? "Saving..."
                  : isEditMode
                  ? "Update Exam"
                  : "Create Exam"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/admin/exams")}
                className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Right: Question Bank & Selected Questions */}
        <div className="space-y-6">
          {/* Question Bank */}
          <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Filter className="text-blue-600" size={22} />
                <h3 className="text-xl font-bold text-gray-800">
                  Question Bank
                </h3>
              </div>
              <span className="text-sm font-medium text-gray-600">
                Selected:{" "}
                <strong className="text-blue-600">
                  {formData.questions.length}
                </strong>
              </span>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              <div className="relative">
                <Search
                  className="absolute left-3 top-3.5 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search..."
                  value={questionFilters.keyword}
                  onChange={(e) =>
                    setQuestionFilters((prev) => ({
                      ...prev,
                      keyword: e.target.value,
                    }))
                  }
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none text-sm"
                />
              </div>
              <select
                value={questionFilters.category}
                onChange={(e) =>
                  setQuestionFilters((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                className="px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none text-sm"
              >
                <option value="all">All Categories</option>
                {categoriesRes?.categories?.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <select
                value={questionFilters.type}
                onChange={(e) =>
                  setQuestionFilters((prev) => ({
                    ...prev,
                    type: e.target.value,
                  }))
                }
                className="px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none text-sm"
              >
                <option value="all">All Types</option>
                <option value="mcq">MCQ</option>
                <option value="short">Short Answer</option>
              </select>
              <select
                value={questionFilters.marks}
                onChange={(e) =>
                  setQuestionFilters((prev) => ({
                    ...prev,
                    marks: e.target.value,
                  }))
                }
                className="px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none text-sm"
              >
                <option value="all">All Marks</option>
                <option value="1-2">1–2 marks</option>
                <option value="3">3 marks</option>
                <option value="4-5">4+ marks</option>
              </select>
            </div>

            {/* Question List */}
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-xl">
              {questionsLoading ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : filteredQuestions.length === 0 ? (
                <p className="p-12 text-center text-gray-500">
                  No questions match your filters.
                </p>
              ) : (
                filteredQuestions.map((question) => {
                  const isSelected = formData.questions.includes(question.id);
                  const catName =
                    question.categoryId?.name ||
                    question.category ||
                    "Uncategorized";

                  return (
                    <div
                      key={question.id}
                      className={`p-4 border-b border-gray-200 hover:bg-blue-50/50 transition-all ${
                        isSelected
                          ? "bg-blue-50 border-l-4 border-l-blue-500"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 text-sm line-clamp-2">
                            {question.text}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2 text-xs">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                              {question.type?.toUpperCase() || "MCQ"}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                              {question.marks} marks
                            </span>
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                              {catName}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            isSelected
                              ? handleRemoveQuestion(question.id)
                              : handleAddQuestion(question.id)
                          }
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                            isSelected
                              ? "bg-red-500 hover:bg-red-600 text-white"
                              : "bg-blue-500 hover:bg-blue-600 text-white"
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Trash2 size={16} className="inline mr-1" />{" "}
                              Remove
                            </>
                          ) : (
                            <>
                              <Plus size={16} className="inline mr-1" /> Add
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Questions */}
          <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Selected Questions ({selectedQuestionDetails.length})
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Info size={16} />
                <span>Drag order using arrows</span>
              </div>
            </div>

            {selectedQuestionDetails.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No questions selected yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedQuestionDetails.map((question, index) => {
                  const catName =
                    question.categoryId?.name ||
                    question.category ||
                    "Uncategorized";
                  return (
                    <div
                      key={question.id || question._id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition"
                    >
                      <div className="text-lg font-bold text-blue-600 w-10">
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {question.text.substring(0, 80)}...
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {question.marks} marks • {catName}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => moveQuestion(index, -1)}
                          disabled={index === 0}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowUp size={18} />
                        </button>
                        <button
                          onClick={() => moveQuestion(index, 1)}
                          disabled={
                            index === selectedQuestionDetails.length - 1
                          }
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowDown size={18} />
                        </button>
                        <button
                          onClick={() =>
                            handleRemoveQuestion(question.id || question._id)
                          }
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
