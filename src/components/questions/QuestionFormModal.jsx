import { useMemo, useState, useEffect } from "react";

const defaultShortAnswer = {
  value: "",
  plus: 0,
  minus: 0,
  unit: "",
};

const getDefaultFormState = () => ({
  type: "mcq",
  categoryId: "",
  text: "",
  marks: 1,
  difficulty: "medium",
  feedback: "",
  options: ["", "", "", ""],
  correctAnswer: {
    mcq: [],
    short: { ...defaultShortAnswer },
  },
  plusT: 0,
  minusT: 0,
});

const sanitizeShortAnswer = (shortAnswer) => {
  if (!shortAnswer) return { ...defaultShortAnswer };
  return {
    value:
      shortAnswer.value === 0 || shortAnswer.value
        ? Math.round(Number(shortAnswer.value))
        : "",
    plus:
      shortAnswer.plus === 0 || shortAnswer.plus
        ? Math.round(Number(shortAnswer.plus))
        : 0,
    minus:
      shortAnswer.minus === 0 || shortAnswer.minus
        ? Math.round(Number(shortAnswer.minus))
        : 0,
    unit: shortAnswer.unit || "",
  };
};

const buildFormStateFromInitial = (initialData) => {
  if (!initialData) {
    return getDefaultFormState();
  }

  // Handle options – ensure at least 4
  const baseOptions =
    initialData.options && initialData.options.length >= 4
      ? initialData.options
      : [
          ...(initialData.options || []),
          ...Array(Math.max(0, 4 - (initialData.options?.length || 0))).fill(
            ""
          ),
        ];

  return {
    type: initialData.type || "mcq",
    categoryId: initialData.categoryId?.id || initialData.categoryId || "",
    text: initialData.text || "",
    marks: initialData.marks || 1,
    difficulty: initialData.difficulty || "medium",
    feedback: initialData.feedback || "",
    options: baseOptions,
    correctAnswer: {
      mcq: initialData.correctAnswer?.mcq || [],
      short: sanitizeShortAnswer(initialData.correctAnswer?.short),
    },
    plusT: initialData.plusT ?? 0,
    minusT: initialData.minusT ?? 0,
  };
};

export default function QuestionFormModal({
  isOpen,
  onClose,
  initialData,
  categories = [],
  onSubmit,
  isSubmitting,
}) {
  const [formData, setFormData] = useState(() =>
    buildFormStateFromInitial(initialData)
  );

  // Reset form when initialData changes (e.g., editing a new question)
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(buildFormStateFromInitial(initialData));
    }
  }, [initialData, isOpen]);

  const isShortAnswer = formData.type === "short";

  const filledOptions = useMemo(
    () => formData.options.filter((opt) => opt.trim()),
    [formData.options]
  );

  const handleOptionChange = (value, index) => {
    const updated = [...formData.options];
    updated[index] = value;
    setFormData((prev) => ({ ...prev, options: updated }));
  };

  const toggleCorrectMcq = (optionText) => {
    setFormData((prev) => {
      const current = prev.correctAnswer.mcq || [];
      return {
        ...prev,
        correctAnswer: {
          ...prev.correctAnswer,
          mcq: current.includes(optionText)
            ? current.filter((t) => t !== optionText)
            : [...current.concat(optionText)],
        },
      };
    });
  };

  const updateShortAnswer = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      correctAnswer: {
        ...prev.correctAnswer,
        short: {
          ...prev.correctAnswer.short,
          [field]:
            value === ""
              ? ""
              : field === "unit"
              ? value
              : Math.max(0, Math.round(Number(value) || 0)),
        },
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      text: formData.text.trim(),
      categoryId: formData.categoryId,
      type: formData.type,
      marks: Math.min(5, Math.max(1, Number(formData.marks) || 1)),
      difficulty: formData.difficulty,
      feedback: formData.feedback.trim() || null,
      correctAnswer:
        formData.type === "mcq"
          ? { mcq: formData.correctAnswer.mcq, short: null }
          : {
              mcq: null,
              short: sanitizeShortAnswer(formData.correctAnswer.short),
            },
      options:
        formData.type === "mcq" ? filledOptions.map((o) => ({ text: o })) : [],
      plusT: isShortAnswer
        ? Number(formData.correctAnswer.short.plus)
        : undefined,
      minusT: isShortAnswer
        ? Number(formData.correctAnswer.short.minus)
        : undefined,
    };

    // Clean up undefined fields
    if (!isShortAnswer) {
      delete payload.plusT;
      delete payload.minusT;
    }

    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "20px" }}>
          {initialData ? "Edit Question" : "Add New Question"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-2 gap-4">
            <div className="form-group">
              <label className="label">Question Type</label>
              <select
                className="input"
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value,
                    // Reset type-specific fields
                    correctAnswer:
                      e.target.value === "mcq"
                        ? { mcq: [], short: null }
                        : { mcq: null, short: { ...defaultShortAnswer } },
                    options: e.target.value === "mcq" ? ["", "", "", ""] : [],
                  }))
                }
              >
                <option value="mcq">Multiple Choice</option>
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
              <label className="label">
                Answer Options (at least 2 required)
              </label>
              {formData.options.map((option, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <span style={{ minWidth: "20px", fontWeight: 600 }}>
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(e.target.value, index)}
                  />
                  <label style={{ whiteSpace: "nowrap", fontSize: "13px" }}>
                    <input
                      type="checkbox"
                      checked={formData.correctAnswer.mcq?.includes(option)}
                      disabled={!option.trim()}
                      onChange={() => toggleCorrectMcq(option)}
                    />{" "}
                    Correct
                  </label>
                </div>
              ))}
              {filledOptions.length < 2 && (
                <p className="text-xs text-red-600">
                  Please fill at least 2 options and mark correct answer(s).
                </p>
              )}
            </div>
          )}

          {/* Short Answer Config */}
          {isShortAnswer && (
            <div className="card p-4 mb-5 bg-gray-50">
              <p className="font-semibold mb-3">Short Answer Settings</p>
              <div className="grid grid-2 gap-4">
                <div className="form-group">
                  <label className="label">Correct Value (number) *</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.correctAnswer.short?.value ?? ""}
                    onChange={(e) => updateShortAnswer("value", e.target.value)}
                    required
                    min="0"
                    step="1"
                  />
                </div>
                <div className="form-group">
                  <label className="label">Unit (optional)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., kg, m/s, °C"
                    value={formData.correctAnswer.short?.unit || ""}
                    onChange={(e) => updateShortAnswer("unit", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Plus Tolerance</label>
                  <input
                    type="number"
                    className="input"
                    min="0"
                    step="1"
                    value={formData.correctAnswer.short?.plus ?? 0}
                    onChange={(e) => updateShortAnswer("plus", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Minus Tolerance</label>
                  <input
                    type="number"
                    className="input"
                    min="0"
                    step="1"
                    value={formData.correctAnswer.short?.minus ?? 0}
                    onChange={(e) => updateShortAnswer("minus", e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                Students must enter a whole number. Answers within ± tolerance
                are auto-accepted.
              </p>
            </div>
          )}

          <div className="grid grid-2 gap-4">
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
                required
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
              placeholder="Shown to students after attempting the question..."
              value={formData.feedback}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, feedback: e.target.value }))
              }
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                isSubmitting ||
                (formData.type === "mcq" && filledOptions.length < 2)
              }
            >
              {isSubmitting
                ? "Saving..."
                : initialData
                ? "Update Question"
                : "Create Question"}
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
