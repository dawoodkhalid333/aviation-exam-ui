import { useState, useEffect } from "react";
import { X, Plus, Trash2, Upload, Image as ImageIcon } from "lucide-react";
import Dropzone from "react-dropzone";
import { mediaAPI } from "../../lib/api";
import Tiptap from "../TipTap";
import QuillEditor from "../QuillEditor";

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

  // Sync initial data when editing
  useEffect(() => {
    if (isOpen && initialData) {
      // // Determine if options have images
      // const hasOptionImages =
      //   initialData.optionsWithImgs &&
      //   initialData.optionsWithImgs.some((opt) => opt.img);

      // const optionsData =
      //   hasOptionImages && initialData.optionsWithImgs
      //     ? initialData.optionsWithImgs
      //     : (initialData.options || ["", "", "", ""]).map((opt, idx) => ({
      //         option: opt || "",
      //         img: initialData.optionImgs?.[idx] || null, // fallback for old data
      //       }));

      // // Ensure at least 4 options when editing
      // while (optionsData.length < 4) {
      //   optionsData.push({ option: "", img: null });
      // }

      setFormData({
        type: initialData.type || "mcq",
        categoryId: initialData.categoryId?.id || initialData.categoryId || "",
        text: initialData.text || "",
        marks: initialData.marks || 1,
        unit: initialData.unit || "",
        difficulty: initialData.difficulty || "medium",
        feedback: initialData.feedback || "",
        optionsWithImgs: initialData.optionsWithImgs,
        correctAnswer: initialData.correctAnswer,
        plusT: initialData.plusT || 0,
        minusT: initialData.minusT || 0,
      });

      setQuestionImg(initialData.questionImg || "");
    } else if (!isOpen) {
      // Reset on close
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

  const uploadImage = async (file) => {
    const uploadData = new FormData();
    uploadData.append("file", file);
    const res = await mediaAPI.upload(uploadData);
    const media = await mediaAPI.getById(res.data.fileId);
    return media.url || media; // adjust based on your API response
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      uploadingQuestionImg ||
      Object.values(uploadingOptionImg).some(Boolean)
    ) {
      alert("Please wait for all images to finish uploading.");
      return;
    }

    const payload = {
      ...formData,
      categoryId: formData.categoryId,
      questionImg: questionImg || null,
      // Clean up options for submission
      optionsWithImgs: isShortAnswer
        ? undefined
        : formData.optionsWithImgs
            .filter((opt) => opt.option.trim() !== "") // remove empty
            .map((item) => ({
              option: item.option.trim(),
              img: item.img || null,
            })),
      // For backward compatibility or API expectations
      options: isShortAnswer
        ? undefined
        : formData.optionsWithImgs
            .filter((opt) => opt.option.trim())
            .map((item) => item.option.trim()),
    };

    onSubmit(payload);
  };

  const isAnyUploadInProgress =
    uploadingQuestionImg || Object.values(uploadingOptionImg).some(Boolean);

  if (!isOpen) return null;
  console.log(formData.questionText);

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
                  required
                  className="w-full px-5 py-4 rounded-2xl border border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none text-lg"
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
              {/* <textarea
                rows={5}
                value={formData.text}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, text: e.target.value }))
                }
                required
                className="w-full px-5 py-4 rounded-2xl border border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none resize-none text-lg"
                placeholder="Enter the full question here..."
              /> */}
              {/* <Tiptap
                questionText={formData.text || initialData?.text}
                setQuestionText={(content) => {
                  setFormData((prev) => ({ ...prev, text: content }));
                  console.log(content);
                }}
              /> */}
              <QuillEditor
                questionText={formData.text || initialData?.text}
                setQuestionText={(content) => {
                  setFormData((prev) => ({ ...prev, text: content }));
                  console.log(content);
                }}
              />
            </div>

            {/* Question Image Upload */}
            {/* <div>
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
                    console.log(err);
                    alert("Failed to upload image.");
                  } finally {
                    setUploadingQuestionImg(false);
                  }
                }}
                accept={{ "image/*": [] }}
                multiple={false}
              >
                {({ getRootProps, getInputProps }) => (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                      uploadingQuestionImg
                        ? "cursor-not-allowed opacity-70"
                        : "cursor-pointer"
                    } ${
                      questionImg
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-gray-300 hover:border-indigo-400"
                    }`}
                  >
                    <input {...getInputProps()} />
                    {uploadingQuestionImg ? (
                      <div className="space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mx-auto"></div>
                        <p className="text-indigo-700 font-medium">
                          Uploading...
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
                          Drop an image or click to browse
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Dropzone>
            </div> */}

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
                          newOptions[index].option = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            optionsWithImgs: newOptions,
                          }));
                        }}
                        placeholder={`Option ${index + 1} text`}
                        className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none text-lg"
                      />

                      <Dropzone
                        onDrop={async (files) => {
                          if (!files[0] || uploadingOptionImg[index]) return;
                          setUploadingOptionImg((prev) => ({
                            ...prev,
                            [index]: true,
                          }));
                          try {
                            const url = await uploadImage(files[0]);
                            const newOptions = [...formData.optionsWithImgs];
                            newOptions[index].img = url;
                            setFormData((prev) => ({
                              ...prev,
                              optionsWithImgs: newOptions,
                            }));
                          } catch (err) {
                            alert("Upload failed.");
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
                      >
                        {({ getRootProps, getInputProps }) => (
                          <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-xl p-4 text-center ${
                              uploadingOptionImg[index]
                                ? "opacity-70 cursor-not-allowed"
                                : "cursor-pointer"
                            } ${
                              item.img
                                ? "border-green-400 bg-green-50"
                                : "border-gray-300"
                            }`}
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
                                  alt="Option"
                                  className="max-h-40 mx-auto rounded-lg shadow"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newOptions = [
                                      ...formData.optionsWithImgs,
                                    ];
                                    newOptions[index].img = null;
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
                                  Add image (optional)
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </Dropzone>
                    </div>

                    <div className="flex flex-col gap-4 items-center">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            optionsWithImgs: prev.optionsWithImgs.filter(
                              (_, i) => i !== index
                            ),
                            correctAnswer:
                              prev.correctAnswer ===
                              prev.optionsWithImgs[index].option
                                ? ""
                                : prev.correctAnswer,
                          }));
                        }}
                        disabled={formData.optionsWithImgs.length <= 2}
                        className="p-3 text-red-600 hover:bg-red-50 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
                    required={isShortAnswer}
                    className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none text-lg"
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
                    placeholder="e.g., kg, m/s"
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
                      marks: parseInt(e.target.value) || 1,
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
                Explanation / Feedback
              </label>
              <textarea
                rows={4}
                value={formData.feedback}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, feedback: e.target.value }))
                }
                className="w-full px-5 py-4 rounded-2xl border border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none resize-none text-lg"
                placeholder="Provide explanation..."
              />
            </div>

            {/* Submit */}
            <div className="flex gap-5 pt-8">
              <button
                type="submit"
                disabled={isSubmitting || isAnyUploadInProgress}
                className={`flex-1 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xl rounded-2xl shadow-xl transition-all ${
                  isSubmitting || isAnyUploadInProgress
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:shadow-2xl hover:-translate-y-1"
                }`}
              >
                {isAnyUploadInProgress
                  ? "Uploading images..."
                  : isSubmitting
                  ? "Saving..."
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
