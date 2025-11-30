import { useState, useEffect } from "react";
import { X, Plus, Trash2, Upload, Image as ImageIcon } from "lucide-react";
import Dropzone from "react-dropzone";
import { mediaAPI } from "../../lib/api";

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
    optionsWithImgs: [
      { option: "", img: null },
      { option: "", img: null },
      { option: "", img: null },
      { option: "", img: null },
    ],
    correctAnswer: "",
    plusT: 0,
    minusT: 0,
  });

  const [questionImg, setQuestionImg] = useState("");

  // Upload states
  const [uploadingQuestionImg, setUploadingQuestionImg] = useState(false);
  const [uploadingOptionImg, setUploadingOptionImg] = useState({}); // { index: true }

  const isShortAnswer = formData.type === "short";

  // Sync initial data when editing or reset on close
  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        type: initialData.type || "mcq",
        categoryId: initialData.categoryId || "",
        text: initialData.text || "",
        marks: initialData.marks || 1,
        unit: initialData.unit || "",
        difficulty: initialData.difficulty || "medium",
        feedback: initialData.feedback || "",
        optionsWithImgs: (initialData.options || ["", "", "", ""]).map(
          (opt, idx) => ({
            option: opt,
            img: initialData.optionImgs?.[idx] || null,
          })
        ),
        correctAnswer: initialData.correctAnswer || "",
        plusT: initialData.plusT || 0,
        minusT: initialData.minusT || 0,
      });
      setQuestionImg(initialData.questionImg || "");
    } else if (!isOpen) {
      // Reset everything when modal closes
      setFormData({
        type: "mcq",
        categoryId: "",
        text: "",
        marks: 1,
        unit: "",
        difficulty: "medium",
        feedback: "",
        optionsWithImgs: [
          { option: "", img: null },
          { option: "", img: null },
          { option: "", img: null },
          { option: "", img: null },
        ],
        correctAnswer: "",
        plusT: 0,
        minusT: 0,
      });
      setQuestionImg("");
      setUploadingQuestionImg(false);
      setUploadingOptionImg({});
    }
  }, [initialData, isOpen]);

  // Keep optionsWithImgs array in sync with length (min 2)
  useEffect(() => {
    setFormData((prev) => {
      const currentLength = prev.optionsWithImgs.length;
      if (currentLength < 2) {
        return {
          ...prev,
          optionsWithImgs: [
            ...prev.optionsWithImgs,
            ...Array.from({ length: 2 - currentLength }, () => ({
              option: "",
              img: null,
            })),
          ],
        };
      }
      return prev;
    });
  }, [formData.optionsWithImgs.length]);

  const uploadImage = async (file) => {
    const uploadData = new FormData();
    uploadData.append("file", file);

    const res = await mediaAPI.upload(uploadData);
    return mediaAPI.getById(res.data.fileId);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Final safety check
    if (
      uploadingQuestionImg ||
      Object.values(uploadingOptionImg).some(Boolean)
    ) {
      alert("Please wait for all images to finish uploading.");
      return;
    }

    onSubmit({
      ...formData,
      questionImg: questionImg || null,
      optionsWithImgs: formData.optionsWithImgs.map((item) => ({
        option: item.option,
        img: item.img || null,
      })),
    });
  };

  const isAnyUploadInProgress =
    uploadingQuestionImg || Object.values(uploadingOptionImg).some(Boolean);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-gray-200">
        <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-3xl"></div>

        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-800">
              {initialData ? "Edit Question" : "Create New Question"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X size={32} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Type & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Question Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className="w-full px-5 py-4 rounded-2xl border border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none text-lg"
                >
                  <option value="mcq">Multiple Choice (MCQ)</option>
                  <option value="short">Short Answer (Numeric)</option>
                </select>
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
                  className="w-full px-5 py-4 rounded-2xl border border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none text-lg"
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
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Question Text <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={5}
                value={formData.text}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, text: e.target.value }))
                }
                className="w-full px-5 py-4 rounded-2xl border border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none resize-none text-lg"
                placeholder="Enter the full question here..."
                required
              />
            </div>

            {/* Question Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Question Image (Optional)
              </label>
              <Dropzone
                onDrop={async (acceptedFiles) => {
                  if (acceptedFiles.length === 0 || uploadingQuestionImg)
                    return;

                  setUploadingQuestionImg(true);
                  try {
                    const url = await uploadImage(acceptedFiles[0]);
                    setQuestionImg(url);
                  } catch (err) {
                    alert("Failed to upload question image. Please try again.");
                    console.error(err);
                  } finally {
                    setUploadingQuestionImg(false);
                  }
                }}
                accept={{ "image/*": [] }}
                multiple={false}
                disabled={uploadingQuestionImg}
              >
                {({ getRootProps, getInputProps }) => (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all relative
                      ${
                        uploadingQuestionImg
                          ? "cursor-not-allowed opacity-70"
                          : "cursor-pointer"
                      }
                      ${
                        questionImg
                          ? "border-indigo-300 bg-indigo-50"
                          : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
                      }
                    `}
                  >
                    <input {...getInputProps()} />

                    {uploadingQuestionImg ? (
                      <div className="space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mx-auto"></div>
                        <p className="text-indigo-700 font-medium">
                          Uploading question image...
                        </p>
                      </div>
                    ) : questionImg ? (
                      <div className="space-y-4">
                        <img
                          src={questionImg}
                          alt="Question"
                          className="max-w-md max-h-64 mx-auto rounded-xl shadow-lg object-contain"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuestionImg("");
                          }}
                          className="text-red-600 hover:text-red-700 font-medium flex items-center gap-2 mx-auto"
                        >
                          <Trash2 size={18} /> Remove Image
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="mx-auto text-gray-400" size={48} />
                        <p className="text-gray-600 font-medium">
                          Drop an image here or click to browse
                        </p>
                        <p className="text-sm text-gray-500">
                          Supports JPG, PNG, GIF up to 10MB
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Dropzone>
            </div>

            {/* MCQ Options */}
            {!isShortAnswer && (
              <div className="space-y-6 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border border-blue-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">
                    Answer Options
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        optionsWithImgs: [
                          ...prev.optionsWithImgs,
                          { option: "", img: null },
                        ],
                      }))
                    }
                    className="flex items-center gap-3 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-md"
                  >
                    <Plus size={20} /> Add Option
                  </button>
                </div>

                {formData.optionsWithImgs.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col lg:flex-row gap-4 p-6 bg-white rounded-2xl shadow-md border border-gray-200"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                      {String.fromCharCode(65 + index)}
                    </div>

                    <div className="flex-1 space-y-4">
                      <input
                        type="text"
                        value={item.option}
                        onChange={(e) => {
                          const newOptions = [...formData.optionsWithImgs];
                          newOptions[index] = {
                            ...newOptions[index],
                            option: e.target.value,
                          };
                          setFormData((prev) => ({
                            ...prev,
                            optionsWithImgs: newOptions,
                          }));
                        }}
                        placeholder={`Option ${index + 1} text`}
                        className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none text-lg"
                      />

                      {/* Option Image Dropzone */}
                      <Dropzone
                        onDrop={async (files) => {
                          if (files.length === 0 || uploadingOptionImg[index])
                            return;

                          setUploadingOptionImg((prev) => ({
                            ...prev,
                            [index]: true,
                          }));
                          try {
                            const url = await uploadImage(files[0]);
                            setFormData((prev) => {
                              const newOptions = [...prev.optionsWithImgs];
                              newOptions[index] = {
                                ...newOptions[index],
                                img: url,
                              };
                              return { ...prev, optionsWithImgs: newOptions };
                            });
                          } catch (err) {
                            console.log(err);
                          } finally {
                            setUploadingOptionImg((prev) => ({
                              ...prev,
                              [index]: false,
                            }));
                          }
                        }}
                        accept={{ "image/*": [] }}
                        multiple={false}
                        disabled={!!uploadingOptionImg[index]}
                      >
                        {({ getRootProps, getInputProps }) => (
                          <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-xl p-4 text-center transition relative
                              ${
                                uploadingOptionImg[index]
                                  ? "opacity-70 cursor-not-allowed"
                                  : "cursor-pointer"
                              }
                              ${
                                item.img
                                  ? "border-green-400 bg-green-50"
                                  : "border-gray-300 hover:border-indigo-400"
                              }
                            `}
                          >
                            <input {...getInputProps()} />

                            {uploadingOptionImg[index] ? (
                              <div className="py-8">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-indigo-600 mx-auto mb-3"></div>
                                <p className="text-sm text-indigo-700">
                                  Uploading...
                                </p>
                              </div>
                            ) : item.img ? (
                              <div className="space-y-3">
                                <img
                                  src={item.img}
                                  alt={`Option ${index + 1}`}
                                  className="max-h-40 mx-auto rounded-lg shadow"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newOptions = [
                                      ...formData.optionsWithImgs,
                                    ];
                                    newOptions[index] = {
                                      ...newOptions[index],
                                      img: null,
                                    };
                                    setFormData((prev) => ({
                                      ...prev,
                                      optionsWithImgs: newOptions,
                                    }));
                                  }}
                                  className="text-sm text-red-600 hover:underline"
                                >
                                  Remove Image
                                </button>
                              </div>
                            ) : (
                              <div className="py-6">
                                <ImageIcon
                                  className="mx-auto text-gray-400 mb-2"
                                  size={36}
                                />
                                <p className="text-sm text-gray-600">
                                  Click or drop image for this option
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </Dropzone>
                    </div>

                    <div className="flex flex-col gap-3 items-center">
                      <button
                        type="button"
                        onClick={() => {
                          const removedOption =
                            formData.optionsWithImgs[index].option;
                          setFormData((prev) => ({
                            ...prev,
                            optionsWithImgs: prev.optionsWithImgs.filter(
                              (_, i) => i !== index
                            ),
                            correctAnswer:
                              prev.correctAnswer === removedOption
                                ? ""
                                : prev.correctAnswer,
                          }));
                          setUploadingOptionImg((prev) => {
                            const { [index]: _, ...rest } = prev;
                            return rest;
                          });
                        }}
                        disabled={formData.optionsWithImgs.length <= 2}
                        className="p-3 text-red-600 hover:bg-red-50 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <Trash2 size={22} />
                      </button>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="correct"
                          checked={formData.correctAnswer === item.option}
                          onChange={() =>
                            setFormData((prev) => ({
                              ...prev,
                              correctAnswer: item.option,
                            }))
                          }
                          className="w-5 h-5 text-indigo-600"
                        />
                        <span className="font-semibold text-gray-700">
                          Correct
                        </span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Short Answer Fields */}
            {isShortAnswer && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-8 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl border border-emerald-200">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Correct Answer <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.correctAnswer}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        correctAnswer: e.target.value,
                      }))
                    }
                    className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none text-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Plus Tolerance
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.plusT}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        plusT: e.target.value,
                      }))
                    }
                    className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Minus Tolerance
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.minusT}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        minusT: e.target.value,
                      }))
                    }
                    className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Unit
                  </label>
                  <input
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, unit: e.target.value }))
                    }
                    placeholder="e.g., kg, m/s, °C"
                    className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none text-lg"
                  />
                </div>
              </div>
            )}

            {/* Marks & Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Marks
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.marks}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      marks: Number(e.target.value) || 1,
                    }))
                  }
                  className="w-full px-5 py-4 rounded-2xl border border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none text-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      difficulty: e.target.value,
                    }))
                  }
                  className="w-full px-5 py-4 rounded-2xl border border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none text-lg"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Feedback */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Explanation / Feedback (Shown after answer)
              </label>
              <textarea
                rows={4}
                value={formData.feedback}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, feedback: e.target.value }))
                }
                className="w-full px-5 py-4 rounded-2xl border border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none resize-none text-lg"
                placeholder="Provide detailed explanation for students..."
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-5 pt-8">
              <button
                type="submit"
                disabled={isSubmitting || isAnyUploadInProgress}
                className={`flex-1 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xl rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1
                  ${
                    isSubmitting || isAnyUploadInProgress
                      ? "opacity-60 cursor-not-allowed"
                      : ""
                  }
                `}
              >
                {isAnyUploadInProgress
                  ? "Uploading images, please wait..."
                  : isSubmitting
                  ? "Saving Question..."
                  : initialData
                  ? "Update Question"
                  : "Create Question"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-10 py-5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-xl rounded-2xl transition"
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
