import { useState } from "react";

const getDefaultFormState = () => ({
  type: "mcq",
  categoryId: "",
  text: "",
  marks: 1,
  difficulty: "medium",
  feedback: "",
  options: ["", "", "", ""],
  correctAnswer: "",
  plusT: 0,
  minusT: 0,
});

export default function QuestionFormModal({
  isOpen,
  onClose,
  categories = [],
  onSubmit,
  isSubmitting = false,
}) {
  const [formData, setFormData] = useState({
    type: "mcq",
    categoryId: "",
    text: "",
    marks: 1,
    difficulty: "medium",
    feedback: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    plusT: 0,
    minusT: 0,
  });
  const isShortAnswer = formData.type === "short";

  if (!isOpen) return null;

  const filledOptions = formData.options.filter((opt) => opt.trim() !== "");

  const handleOptionChange = (value, index) => {
    const updated = [...formData.options];
    updated[index] = value;
    setFormData((prev) => ({ ...prev, options: updated }));
  };

  const addOption = () => {
    setFormData((prev) => ({ ...prev, options: [...prev.options, ""] }));
  };

  const removeOption = (index) => {
    setFormData((prev) => {
      const updated = prev.options.filter((_, i) => i !== index);
      const removed = prev.options[index];
      return {
        ...prev,
        options: updated,
        correctAnswer: prev.correctAnswer === removed ? "" : prev.correctAnswer,
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.categoryId) {
      alert("Please select a category.");
      return;
    }
    if (!formData.text.trim()) {
      alert("Please enter the question text.");
      return;
    }

    if (formData.type === "mcq") {
      if (filledOptions.length < 2) {
        alert("Please provide at least 2 answer options.");
        return;
      }
      if (!formData.correctAnswer.trim()) {
        alert("Please select the correct answer.");
        return;
      }
    }

    if (isShortAnswer) {
      if (formData.correctAnswer === "" || formData.correctAnswer < 0) {
        alert("Please enter a valid numeric answer.");
        return;
      }
    }

    const payload = {
      type: formData.type,
      categoryId: formData.categoryId,
      text: formData.text.trim(),
      marks: Math.max(1, Math.min(5, Number(formData.marks) || 1)),
      difficulty: formData.difficulty,
      feedback: formData.feedback.trim() || null,
      correctAnswer: isShortAnswer
        ? Number(formData.correctAnswer)
        : formData.correctAnswer,
      options: isShortAnswer ? [] : filledOptions.map((text) => ({ text })),
      ...(isShortAnswer && {
        plusT: Number(formData.plusT) || 0,
        minusT: Number(formData.minusT) || 0,
      }),
    };

    onSubmit(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "24px" }}>
          Add New Question
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-2 gap-4 mb-4">
            <div className="form-group">
              <label className="label">Question Type</label>
              <select
                className="input"
                value={formData.type}
                onChange={(e) => {
                  const newType = e.target.value;
                  setFormData({
                    ...getDefaultFormState(),
                    type: newType,
                    categoryId: formData.categoryId,
                    marks: formData.marks,
                    difficulty: formData.difficulty,
                  });
                }}
              >
                <option value="mcq">Multiple Choice (Single Answer)</option>
                <option value="short">Short Answer (Numeric)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="label">Category *</label>
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
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="label">Question Text *</label>
            <textarea
              className="input"
              rows="4"
              placeholder="Enter the full question..."
              value={formData.text}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, text: e.target.value }))
              }
              required
            />
          </div>

          {/* MCQ Options */}
          {formData.type === "mcq" && (
            <div className="form-group">
              <div className="flex-between mb-4">
                <label className="label">
                  Answer Options
                  <span className="text-xs text-gray ml-2">
                    (at least 2 required)
                  </span>
                </label>
                <button
                  type="button"
                  onClick={addOption}
                  className="btn btn-primary"
                  style={{ padding: "6px 12px", fontSize: "13px" }}
                >
                  + Add Option
                </button>
              </div>

              <div className="space-y-3">
                {formData.options.map((option, index) => (
                  <div
                    key={index}
                    className="flex gap-4 items-center p-3 border rounded"
                    style={{ background: "#f9fafb", borderColor: "#e5e7eb" }}
                  >
                    <span
                      className="badge badge-blue"
                      style={{ width: "32px", textAlign: "center" }}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>

                    <input
                      type="text"
                      className="input flex-1"
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) =>
                        handleOptionChange(e.target.value, index)
                      }
                    />

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="correct"
                        checked={formData.correctAnswer === option}
                        disabled={!option.trim()}
                        onChange={() =>
                          setFormData((prev) => ({
                            ...prev,
                            correctAnswer: option,
                          }))
                        }
                      />
                      <span className="text-sm">Correct</span>
                    </label>

                    {formData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="text-red-600 hover:bg-red-50 rounded px-2"
                        style={{ width: "32px", height: "32px" }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {filledOptions.length < 2 && (
                <p className="error-text mt-2">
                  Please add at least 2 options and select one correct answer.
                </p>
              )}
            </div>
          )}

          {/* Short Answer */}
          {isShortAnswer && (
            <div
              className="card"
              style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}
            >
              <p className="label mb-4">Numeric Answer Settings</p>
              <div className="grid grid-2 gap-4">
                <div className="form-group">
                  <label className="label">
                    Correct Answer (whole number) *
                  </label>
                  <input
                    type="number"
                    className="input"
                    min="0"
                    step="1"
                    value={formData.correctAnswer}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        correctAnswer:
                          e.target.value === ""
                            ? ""
                            : Math.max(0, Math.round(Number(e.target.value))),
                      }))
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Plus Tolerance</label>
                  <input
                    type="number"
                    className="input"
                    min="0"
                    step="1"
                    value={formData.plusT}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        plusT: Math.max(
                          0,
                          Math.round(Number(e.target.value) || 0)
                        ),
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="label">Minus Tolerance</label>
                  <input
                    type="number"
                    className="input"
                    min="0"
                    step="1"
                    value={formData.minusT}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        minusT: Math.max(
                          0,
                          Math.round(Number(e.target.value) || 0)
                        ),
                      }))
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-gray mt-3">
                Answers within ± tolerance will be accepted as correct.
              </p>
            </div>
          )}

          <div className="grid grid-2 gap-4 mt-4">
            <div className="form-group">
              <label className="label">Marks (1–5)</label>
              <input
                type="number"
                className="input"
                min="1"
                max="5"
                value={formData.marks}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    marks: Math.max(
                      1,
                      Math.min(5, Number(e.target.value) || 1)
                    ),
                  }))
                }
              />
            </div>
            <div className="form-group">
              <label className="label">Difficulty</label>
              <select
                className="input"
                value={formData.difficulty}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    difficulty: e.target.value,
                  }))
                }
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="label">Feedback / Explanation (optional)</label>
            <textarea
              className="input"
              rows="3"
              placeholder="Shown after submission..."
              value={formData.feedback}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, feedback: e.target.value }))
              }
            />
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                isSubmitting ||
                (formData.type === "mcq" &&
                  (filledOptions.length < 2 || !formData.correctAnswer))
              }
            >
              {isSubmitting ? "Creating..." : "Create Question"}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
