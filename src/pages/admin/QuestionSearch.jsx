import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { questionsAPI, categoriesAPI } from "../../lib/api";
import {
  Search,
  Filter,
  Edit,
  Copy,
  Info,
  RefreshCw,
} from "lucide-react";
import QuestionFormModal from "../../components/questions/QuestionFormModal";

const difficultyLabels = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export default function QuestionSearch() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    keyword: "",
    category: "all",
    type: "all",
    marks: "all",
    difficulty: "all",
    showFeedbackOnly: false,
  });
  const [sortBy, setSortBy] = useState("recent");
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const { data: questions, isLoading } = useQuery({
    queryKey: ["questions"],
    queryFn: () => questionsAPI.getAll().then((res) => res.data),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesAPI.getAll().then((res) => res.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => questionsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["questions"]);
      handleCloseModal();
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => questionsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["questions"]);
      handleCloseModal();
    },
  });

  const filteredQuestions = useMemo(() => {
    let list = questions?.questions || [];
    list = list.filter((question) => {
      const keywordMatch = filters.keyword
        ? question.text
            ?.toLowerCase()
            .includes(filters.keyword.trim().toLowerCase())
        : true;
      const categoryMatch =
        filters.category === "all" || question.category === filters.category;
      const typeMatch =
        filters.type === "all" || question.questionType === filters.type;
      const marksMatch =
        filters.marks === "all"
          ? true
          : filters.marks === "1-2"
          ? question.marks <= 2
          : filters.marks === "3"
          ? question.marks === 3
          : question.marks >= 4;
      const difficultyMatch =
        filters.difficulty === "all" ||
        question.difficulty === filters.difficulty;
      const feedbackMatch = filters.showFeedbackOnly
        ? Boolean(question.feedback)
        : true;
      return (
        keywordMatch &&
        categoryMatch &&
        typeMatch &&
        marksMatch &&
        difficultyMatch &&
        feedbackMatch
      );
    });

    const sorted = [...list];
    switch (sortBy) {
      case "marks-desc":
        sorted.sort((a, b) => b.marks - a.marks);
        break;
      case "marks-asc":
        sorted.sort((a, b) => a.marks - b.marks);
        break;
      case "difficulty":
        sorted.sort((a, b) => a.difficulty.localeCompare(b.difficulty));
        break;
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt || 0) -
            new Date(a.updatedAt || a.createdAt || 0)
        );
    }
    return sorted;
  }, [questions, filters, sortBy]);

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingQuestion(null);
  };

  const handleQuickDuplicate = (question) => {
    const payload = {
      ...question,
      text: `${question.text} (Copy)`,
      _id: undefined,
    };
    createMutation.mutate(payload);
  };

  const pending = updateMutation.isPending || createMutation.isPending;

  return (
    <div>
      <div className="flex-between mb-4">
        <h1 style={{ fontSize: "32px", fontWeight: "700", color: "#1f2937" }}>
          Question Search & Filtering
        </h1>
        <button
          className="btn btn-outline"
          onClick={() => queryClient.invalidateQueries(["questions"])}
        >
          <RefreshCw size={16} />
          Refresh Bank
        </button>
      </div>

      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="flex-between mb-3">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Search size={18} color="#2563eb" />
            <p style={{ fontWeight: 600 }}>Find the right question</p>
          </div>
          <button
            className="btn btn-outline"
            onClick={() =>
              setFilters({
                keyword: "",
                category: "all",
                type: "all",
                marks: "all",
                difficulty: "all",
                showFeedbackOnly: false,
              })
            }
          >
            Clear filters
          </button>
        </div>
        <div className="grid grid-2 gap-4">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Keyword</label>
            <input
              type="text"
              className="input"
              placeholder="Search text, tags, or feedback"
              value={filters.keyword}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, keyword: e.target.value }))
              }
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Category</label>
            <select
              className="input"
              value={filters.category}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, category: e.target.value }))
              }
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id || cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Question Type</label>
            <select
              className="input"
              value={filters.type}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, type: e.target.value }))
              }
            >
              <option value="all">All</option>
              <option value="mcq">Multiple Choice</option>
              <option value="short">Short Answer</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Marks Range</label>
            <select
              className="input"
              value={filters.marks}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, marks: e.target.value }))
              }
            >
              <option value="all">All</option>
              <option value="1-2">1 - 2 marks</option>
              <option value="3">3 marks</option>
              <option value="4-5">4 - 5 marks</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Difficulty</label>
            <select
              className="input"
              value={filters.difficulty}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, difficulty: e.target.value }))
              }
            >
              <option value="all">All</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Quick Options</label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 0",
              }}
            >
              <label
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <input
                  type="checkbox"
                  checked={filters.showFeedbackOnly}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      showFeedbackOnly: e.target.checked,
                    }))
                  }
                />
                Has feedback/explanation
              </label>
            </div>
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="label">Sort Results</label>
          <select
            className="input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="recent">Most recent</option>
            <option value="marks-desc">Marks (high - low)</option>
            <option value="marks-asc">Marks (low - high)</option>
            <option value="difficulty">Difficulty</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="flex-between" style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Filter size={16} />
            <p className="text-sm text-gray">
              Showing {filteredQuestions.length} of{" "}
              {questions?.questions?.length || 0} questions
            </p>
          </div>
          <p className="text-sm text-gray">
            Click any card to review or edit in-place.
          </p>
        </div>
        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <p style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>
            No questions match the selected filters.
          </p>
        ) : (
          <div className="grid gap-4">
            {filteredQuestions.map((question) => (
              <div
                key={question._id}
                className="card"
                style={{
                  border: "1px solid #e5e7eb",
                  boxShadow: "none",
                  padding: "16px",
                }}
              >
                <div className="flex-between mb-2">
                  <span className="badge badge-blue">
                    {question.questionType.toUpperCase()}
                  </span>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-outline"
                      style={{ padding: "4px 10px", fontSize: "12px" }}
                      onClick={() => {
                        setEditingQuestion(question);
                        setShowModal(true);
                      }}
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ padding: "4px 10px", fontSize: "12px" }}
                      onClick={() => handleQuickDuplicate(question)}
                      disabled={pending}
                    >
                      <Copy size={14} />
                      Duplicate
                    </button>
                  </div>
                </div>
                <p
                  style={{
                    fontWeight: 600,
                    marginBottom: "8px",
                    color: "#1f2937",
                  }}
                >
                  {question.text}
                </p>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    fontSize: "13px",
                  }}
                >
                  <span className="badge badge-gray">
                    {question.category || "Uncategorized"}
                  </span>
                  <span className="badge badge-green">{question.marks} marks</span>
                  <span className="badge badge-yellow">
                    {difficultyLabels[question.difficulty] || "Medium"}
                  </span>
                  {question.feedback && (
                    <span className="badge badge-blue">Feedback attached</span>
                  )}
                </div>
                {question.questionType === "short" && (
                  <div
                    style={{
                      marginTop: "12px",
                      background: "#f9fafb",
                      borderRadius: "6px",
                      padding: "12px",
                      fontSize: "13px",
                      display: "flex",
                      gap: "12px",
                      alignItems: "center",
                    }}
                  >
                    <Info size={16} color="#2563eb" />
                    <span>
                      Accepts{" "}
                      {question.correctAnswer?.short?.value ??
                        "—"}{" "}
                      {question.correctAnswer?.short?.unit || ""} (+/-
                      {question.correctAnswer?.short?.plus ?? 0}/
                      {question.correctAnswer?.short?.minus ?? 0})
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <QuestionFormModal
          key={editingQuestion?._id || "new"}
          isOpen={showModal}
          onClose={handleCloseModal}
          initialData={editingQuestion}
          categories={categories}
          onSubmit={(payload) =>
            editingQuestion
              ? updateMutation.mutate({
                  id: editingQuestion._id,
                  data: payload,
                })
              : createMutation.mutate(payload)
          }
          isSubmitting={pending}
        />
      )}
    </div>
  );
}

