import { Fragment, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { questionsAPI, categoriesAPI } from "../../lib/api";
import { Plus, Trash2, Edit, Filter } from "lucide-react";
import QuestionFormModal from "../../components/questions/QuestionFormModal";

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

  // Fetch questions - now returns { questions: [...] } → we extract the array
  const { data: questions, isPending: questionsLoading } = useQuery({
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
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => questionsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: questionsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });

  // Filtered questions based on new structure
  const filteredQuestions = useMemo(() => {
    return questions?.questions?.filter((question) => {
      const keywordMatch = filters.keyword
        ? question.text
            ?.toLowerCase()
            .includes(filters.keyword.trim().toLowerCase())
        : true;

      const categoryMatch =
        filters.categoryId === "all" ||
        question.categoryId?.id === filters.categoryId ||
        question.categoryId === filters.categoryId; // fallback if not populated

      const typeMatch =
        filters.type === "all" || question.type === filters.type;

      const marksMatch =
        filters.marks === "all"
          ? true
          : filters.marks === "1-2"
          ? question.marks <= 2
          : filters.marks === "3"
          ? question.marks === 3
          : question.marks >= 4;

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

  const resetFilters = () =>
    setFilters({
      keyword: "",
      categoryId: "all",
      type: "all",
      marks: "all",
    });

  if (questionsLoading || categoriesLoading || !questions?.success) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex-between mb-4">
        <h1 style={{ fontSize: "32px", fontWeight: "700", color: "#1f2937" }}>
          Questions
        </h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Add Question
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: "16px" }}>
        <div className="flex-between mb-3">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={18} color="#2563eb" />
            <p style={{ fontWeight: 600 }}>Search & Filter</p>
          </div>
          <button className="btn btn-outline" onClick={resetFilters}>
            Reset
          </button>
        </div>

        <div className="grid grid-2 gap-4">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Keyword</label>
            <input
              type="text"
              className="input"
              placeholder="Search question text or feedback"
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
              value={filters.categoryId}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, categoryId: e.target.value }))
              }
            >
              <option value="all">All Categories</option>
              {categoriesRes?.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
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
              <option value="all">All Types</option>
              <option value="mcq">Multiple Choice</option>
              <option value="short">Short Answer</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Marks</label>
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
              <option value="4-5">4 - 5+ marks</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions Table */}
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Question</th>
              <th>Type</th>
              <th>Category</th>
              <th>Difficulty</th>
              <th>Marks</th>
              <th style={{ width: "120px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuestions.map((question) => (
              <Fragment key={question.id}>
                <tr>
                  <td style={{ maxWidth: "340px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                    >
                      <span>
                        {question.text.length > 90
                          ? `${question.text.substring(0, 90)}...`
                          : question.text}
                      </span>
                      <button
                        className="btn btn-outline"
                        style={{
                          padding: "4px 10px",
                          fontSize: "12px",
                          minWidth: "74px",
                        }}
                        onClick={() =>
                          setExpandedQuestion((prev) =>
                            prev === question.id ? null : question.id
                          )
                        }
                      >
                        {expandedQuestion === question.id
                          ? "Hide Text"
                          : "View Text"}
                      </button>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        question.type === "mcq" ? "badge-blue" : "badge-green"
                      }`}
                    >
                      {question.type.toUpperCase()}
                    </span>
                  </td>
                  <td>{question.categoryId?.name || "—"}</td>
                  <td>
                    <span
                      className={`badge badge-${
                        question.difficulty === "easy"
                          ? "green"
                          : question.difficulty === "medium"
                          ? "yellow"
                          : "red"
                      }`}
                    >
                      {question.difficulty.charAt(0).toUpperCase() +
                        question.difficulty.slice(1)}
                    </span>
                  </td>
                  <td>{question.marks}</td>
                  <td>
                    <div className="flex gap-2">
                      {/* <button
                        className="btn btn-outline"
                        style={{ padding: "6px 12px" }}
                        onClick={() => handleEdit(question)}
                        disabled={categoriesLoading}
                      >
                        <Edit size={16} />
                      </button> */}
                      <button
                        className="btn btn-danger"
                        style={{ padding: "6px 12px" }}
                        onClick={() => {
                          if (confirm("Delete this question?")) {
                            deleteMutation.mutate(question.id);
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Expanded View */}
                {expandedQuestion === question.id && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ background: "#f9fafb", padding: "16px" }}
                    >
                      <p
                        style={{
                          fontSize: "14px",
                          lineHeight: 1.6,
                          marginBottom: "12px",
                        }}
                      >
                        {question.text}
                      </p>

                      {question.type === "short" &&
                        question.correctAnswer?.short && (
                          <div
                            style={{
                              display: "flex",
                              gap: "12px",
                              flexWrap: "wrap",
                              fontSize: "13px",
                            }}
                          >
                            <span className="badge badge-gray">
                              Correct: {question.correctAnswer.short.value}
                              {question.correctAnswer.short.unit &&
                                ` ${question.correctAnswer.short.unit}`}
                            </span>
                            <span className="badge badge-gray">
                              ± Tolerance: +{question.plusT || 0} / -
                              {question.minusT || 0}
                            </span>
                            {question.feedback && (
                              <span className="badge badge-blue">
                                Feedback enabled
                              </span>
                            )}
                          </div>
                        )}

                      {question.type === "mcq" && question.options && (
                        <div style={{ marginTop: "12px" }}>
                          <p style={{ fontWeight: 600, marginBottom: "8px" }}>
                            Options:
                          </p>
                          <ul style={{ margin: 0, paddingLeft: "20px" }}>
                            {question.options.map((opt, i) => (
                              <li key={i} style={{ marginBottom: "4px" }}>
                                <strong>{String.fromCharCode(65 + i)}.</strong>{" "}
                                {opt.text}
                                {question.correctAnswer?.mcq === i &&
                                  " (Correct)"}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>

        {filteredQuestions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No questions found matching your filters.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <QuestionFormModal
          key={editingQuestion?.id || "new"}
          isOpen={showModal}
          onClose={handleClose}
          initialData={editingQuestion}
          categories={categoriesRes?.categories}
          onSubmit={handleCreateOrUpdate}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}
