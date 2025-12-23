import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { mediaAPI } from "../lib/api";

const QuillEditor = ({
  questionText,
  setQuestionText,
}: {
  questionText: string;
  setQuestionText: (content: string) => void;
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const toolbarOptions = [
    ["bold", "italic", "underline", "strike"], // toggled buttons
    ["blockquote", "code-block"],
    ["link", "image"],

    [{ header: 1 }, { header: 2 }], // custom button values
    [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
    [{ script: "sub" }, { script: "super" }], // superscript/subscript
    [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
    [{ direction: "rtl" }], // text direction

    [{ size: ["small", false, "large", "huge"] }], // custom dropdown
    [{ header: [1, 2, 3, 4, 5, 6, false] }],

    [{ color: [] }, { background: [] }], // dropdown with defaults from theme
    [{ font: [] }],
    [{ align: [] }],

    ["clean"], // remove formatting button
  ];
  let quill: Quill;
  const handleImageUpload = async (dataUri: string) => {
    const response = await fetch(dataUri);
    const blob = await response.blob();

    const formData = new FormData();
    formData.append("file", blob, "image.png");
    const res = await mediaAPI.upload(formData);
    return res.data.url;
  };

  useEffect(() => {
    if (!editorRef.current || quillRef.current) return;
    quill = new Quill(editorRef.current, {
      modules: {
        toolbar: toolbarOptions,
      },
      placeholder: "Write your question here...",
      theme: "snow",
    });

    quillRef.current = quill;
    quill.on("text-change", async (delta, oldDelta, source) => {
      // Update the HTML state
      setQuestionText(quill.root.innerHTML);

      // Only process user-initiated changes (not API/programmatic)
      if (source !== "user") return;

      // Find all <img> tags with data: URI
      const images: any = quill.root.querySelectorAll(
        "img[src^='data:image/png;base64']"
      );

      for (const img of images) {
        const dataUri = img.currentSrc;
        if (!dataUri) continue;

        // Upload the image
        const uploadedUrl = await handleImageUpload(dataUri);
        if (uploadedUrl) {
          // Replace data URI with the permanent URL
          img.setAttribute(
            "src",
            `https://api.aviation1in60.cloud${uploadedUrl}`
          );
          // Optional: Add loading state or remove temporary attributes
        } else {
          // Handle failure (e.g. keep data URI or remove image)
          console.warn("Failed to upload image");
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={editorRef}>
      <span dangerouslySetInnerHTML={{ __html: questionText }}></span>
    </div>
  );
};

export default QuillEditor;
