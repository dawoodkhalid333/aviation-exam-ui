import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { examsAPI, questionsAPI, categoriesAPI } from "../../lib/api";
import {
  Save,
  Filter,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Info,
} from "lucide-react";

const initialFilters = {
  keyword: "",
  category: "all",
  type: "all",
  marks: "all",
};

export default function CreateExam() {
  const navigate = useNavigate();
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

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      categoriesAPI.getAll().then((res) => res.data.categories || []),
  });

  const { data: questionBank, isLoading: questionsLoading } = useQuery({
    queryKey: ["questions"],
    queryFn: () =>
      questionsAPI.getAll().then((res) => res.data.questions || []),
  });

  const availableQuestions = useMemo(() => questionBank || [], [questionBank]);

  const createMutation = useMutation({
    mutationFn: examsAPI.create,
    onSuccess: () => navigate("/admin/exams"),
  });

  // Updated filtering to handle new question structure
  const filteredQuestions = useMemo(() => {
    return availableQuestions.filter((question) => {
      const keywordMatch = questionFilters.keyword
        ? question.text
            ?.toLowerCase()
            .includes(questionFilters.keyword.trim().toLowerCase())
        : true;

      // Handle populated categoryId -> categoryId.name
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
    const map = new Map(availableQuestions.map((q) => [q.id, q]));
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
      duration: formData.type === "timed" ? Number(formData.duration) : null,
      questions: formData.questions,
      defaultAttempts: Number(formData.defaultAttempts),
      defaultExpiry: Number(formData.defaultExpiry),
      reviewMode: formData.reviewMode,
      opensAt: new Date(formData.opensAt).toISOString(),
      closesAt: new Date(formData.closesAt).toISOString(),
    };

    createMutation.mutate(payload);
  };

  return (
    <div>
      <h1
        style={{
          fontSize: "32px",
          fontWeight: "700",
          color: "#1f2937",
          marginBottom: "24px",
        }}
      >
        Create Exam
      </h1>

      <div className="grid grid-2 gap-4">
        {/* Left: Form */}
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">
                Exam Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="label">Description</label>
              <textarea
                className="input"
                rows="3"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Optional: Add instructions for students"
              />
            </div>

            <div className="grid grid-2 gap-4">
              <div className="form-group">
                <label className="label">Exam Type</label>
                <select
                  className="input"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, type: e.target.value }))
                  }
                >
                  <option value="timed">Timed (auto-submit)</option>
                  <option value="untimed">Untimed (manual submit)</option>
                </select>
              </div>
              {formData.type === "timed" && (
                <div className="form-group">
                  <label className="label">
                    Duration (minutes){" "}
                    <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        duration: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="label">
                Category <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                className="input"
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    categoryId: e.target.value,
                  }))
                }
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-2 gap-4">
              <div className="form-group">
                <label className="label">
                  Opens At <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="datetime-local"
                  className="input"
                  value={formData.opensAt}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      opensAt: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">
                  Closes At <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="datetime-local"
                  className="input"
                  value={formData.closesAt}
                  min={formData.opensAt || undefined}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      closesAt: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-2 gap-4">
              <div className="form-group">
                <label className="label">Default Attempts</label>
                <input
                  type="number"
                  min="1"
                  className="input"
                  value={formData.defaultAttempts}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      defaultAttempts: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="label">Default Expiry (days)</label>
                <input
                  type="number"
                  min="1"
                  className="input"
                  value={formData.defaultExpiry}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      defaultExpiry: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Review Mode</label>
              <select
                className="input"
                value={formData.reviewMode}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    reviewMode: e.target.value,
                  }))
                }
              >
                <option value="practice">
                  Practice (review + feedback allowed)
                </option>
                <option value="assessment">
                  Assessment (no review, no feedback)
                </option>
              </select>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createMutation.isPending}
              >
                <Save size={18} />
                {createMutation.isPending ? "Creating..." : "Create Exam"}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate("/admin/exams")}
                disabled={createMutation.isPending}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Right: Question Bank & Selection */}
        <div className="card">
          <div className="flex-between mb-3">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Filter size={18} color="#2563eb" />
              <p style={{ fontWeight: 600 }}>Question Bank</p>
            </div>
            <span className="text-sm text-gray">
              Selected: {formData.questions.length}
            </span>
          </div>

          {/* Filters - Updated category filter */}
          <div className="grid grid-2 gap-4 mb-4">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input
                type="text"
                className="input"
                placeholder="Search questions..."
                value={questionFilters.keyword}
                onChange={(e) =>
                  setQuestionFilters((prev) => ({
                    ...prev,
                    keyword: e.target.value,
                  }))
                }
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <select
                className="input"
                value={questionFilters.category}
                onChange={(e) =>
                  setQuestionFilters((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <select
                className="input"
                value={questionFilters.type}
                onChange={(e) =>
                  setQuestionFilters((prev) => ({
                    ...prev,
                    type: e.target.value,
                  }))
                }
              >
                <option value="all">All Types</option>
                <option value="mcq">MCQ</option>
                <option value="short">Short Answer</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <select
                className="input"
                value={questionFilters.marks}
                onChange={(e) =>
                  setQuestionFilters((prev) => ({
                    ...prev,
                    marks: e.target.value,
                  }))
                }
              >
                <option value="all">All Marks</option>
                <option value="1-2">1-2 marks</option>
                <option value="3">3 marks</option>
                <option value="4-5">4+ marks</option>
              </select>
            </div>
          </div>

          {/* Question List */}
          <div
            style={{
              maxHeight: "300px",
              overflowY: "auto",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          >
            {questionsLoading ? (
              <div className="loading" style={{ padding: "24px" }}>
                <div className="spinner"></div>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <p
                style={{
                  padding: "24px",
                  color: "#6b7280",
                  textAlign: "center",
                }}
              >
                No questions match your filters.
              </p>
            ) : (
              filteredQuestions.map((question) => {
                const isSelected = formData.questions.includes(question.id);
                const questionCategory =
                  question.categoryId?.name ||
                  question.category ||
                  "Uncategorized";

                return (
                  <div
                    key={question.id}
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #e5e7eb",
                      background: isSelected ? "#f5f3ff" : "white",
                    }}
                  >
                    <div
                      className="flex-between"
                      style={{ marginBottom: "6px" }}
                    >
                      <p style={{ fontWeight: "500", fontSize: "14px" }}>
                        {question.text.substring(0, 80)}
                        {question.text.length > 80 ? "..." : ""}
                      </p>
                      <button
                        className={`btn ${
                          isSelected ? "btn-danger" : "btn-outline"
                        }`}
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                        onClick={() =>
                          isSelected
                            ? handleRemoveQuestion(question.id)
                            : handleAddQuestion(question.id)
                        }
                      >
                        {isSelected ? (
                          <>
                            <Trash2 size={14} />
                            Remove
                          </>
                        ) : (
                          <>
                            <Plus size={14} />
                            Add
                          </>
                        )}
                      </button>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        fontSize: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span className="badge badge-gray">
                        {question.type?.toUpperCase() || "MCQ"}
                      </span>
                      <span className="badge badge-blue">
                        {question.marks || 0} marks
                      </span>
                      <span className="badge badge-green">
                        {questionCategory}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Selected Questions */}
          <div style={{ marginTop: "24px" }}>
            <div
              className="flex-between"
              style={{ marginBottom: "12px", alignItems: "center" }}
            >
              <p style={{ fontWeight: 600 }}>Selected Questions</p>
              <span className="text-xs text-gray">
                Order = Student exam order
              </span>
            </div>
            {selectedQuestionDetails.length === 0 ? (
              <div
                style={{
                  border: "1px dashed #d1d5db",
                  borderRadius: "8px",
                  padding: "24px",
                  textAlign: "center",
                  color: "#6b7280",
                }}
              >
                No questions selected yet.
              </div>
            ) : (
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  maxHeight: "220px",
                  overflowY: "auto",
                }}
              >
                {selectedQuestionDetails.map((question, index) => {
                  const questionCategory =
                    question.categoryId?.name ||
                    question.category ||
                    "Uncategorized";
                  return (
                    <div
                      key={question.id}
                      style={{
                        padding: "12px",
                        borderBottom: "1px solid #f3f4f6",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: "500", marginBottom: "4px" }}>
                          {index + 1}. {question.text.substring(0, 70)}
                          {question.text.length > 70 ? "..." : ""}
                        </p>
                        <span className="text-xs text-gray">
                          {question.marks || 0} marks • {questionCategory}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-outline"
                          style={{ padding: "6px 8px" }}
                          onClick={() => moveQuestion(index, -1)}
                          disabled={index === 0}
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{ padding: "6px 8px" }}
                          onClick={() => moveQuestion(index, 1)}
                          disabled={
                            index === selectedQuestionDetails.length - 1
                          }
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: "6px 8px" }}
                          onClick={() => handleRemoveQuestion(question.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "12px",
                fontSize: "12px",
                color: "#6b7280",
              }}
            >
              <Info size={14} />
              <span>
                Use arrow buttons to set exact order students will see
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
