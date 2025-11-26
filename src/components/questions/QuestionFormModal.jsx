import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";

export default function QuestionFormModal({
  isOpen,
  onClose,
  categories = [],
  onSubmit,
  isSubmitting = false,
  initialData = null,
}) {
  const [formData, setFormData] = useState({
    type: "mcq",
    categoryId: "",
    text: "",
    marks: 1,
    unit: "",
    difficulty: "medium",
    feedback: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    plusT: 0,
    minusT: 0,
  });

  const isShortAnswer = formData.type === "short";

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30">
        <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-800">
              {initialData ? "Edit Question" : "Create New Question"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={28} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Question Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                >
                  <option value="mcq">Multiple Choice (MCQ)</option>
                  <option value="short">Short Answer (Numeric)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
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
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Question Text */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Question Text *
              </label>
              <textarea
                rows={4}
                value={formData.text}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, text: e.target.value }))
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none resize-none"
                placeholder="Enter the full question..."
                required
              />
            </div>

            {/* MCQ Options */}
            {!isShortAnswer && (
              <div className="space-y-4 p-6 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-800">
                    Answer Options
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        options: [...prev.options, ""],
                      }))
                    }
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Plus size={18} /> Add Option
                  </button>
                </div>
                {formData.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...formData.options];
                        newOpts[i] = e.target.value;
                        setFormData((prev) => ({ ...prev, options: newOpts }));
                      }}
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none"
                      placeholder={`Option ${i + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          options: prev.options.filter((_, idx) => idx !== i),
                          correctAnswer:
                            prev.correctAnswer === opt
                              ? ""
                              : prev.correctAnswer,
                        }))
                      }
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
                      disabled={formData.options.length <= 2}
                    >
                      <Trash2 size={18} />
                    </button>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="correct"
                        checked={formData.correctAnswer === opt}
                        onChange={() =>
                          setFormData((prev) => ({
                            ...prev,
                            correctAnswer: opt,
                          }))
                        }
                      />
                      <span className="text-sm font-medium">Correct</span>
                    </label>
                  </div>
                ))}
              </div>
            )}

            {/* Short Answer */}
            {isShortAnswer && (
              <div className="grid grid-cols-4 gap-4 p-6 bg-emerald-50 rounded-2xl border border-emerald-200">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Correct Answer *
                  </label>
                  <input
                    type="number"
                    value={formData.correctAnswer}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        correctAnswer: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Plus Tolerance *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.plusT}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        plusT: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Minus Tolerance *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minusT}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        minusT: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Unit *
                  </label>
                  <input
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        unit: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Marks & Difficulty */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Marks
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.marks}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      marks: Number(e.target.value) || 1,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      difficulty: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Feedback */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Feedback (Optional)
              </label>
              <textarea
                rows={3}
                value={formData.feedback}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, feedback: e.target.value }))
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none resize-none"
                placeholder="Explain the correct answer..."
              />
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isSubmitting ? "Saving..." : "Create Question"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
