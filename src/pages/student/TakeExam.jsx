import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsAPI, submittedAnswersAPI } from "../../lib/api";
import {
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Timer,
  Trophy,
  Target,
} from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const formatTime = (seconds) => {
  if (seconds === null || seconds === undefined) return "Untimed";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

export default function TakeExam() {
  // const navigate = useNavigate();
  const { sessionId } = useLocation().state || {};
  const [isSocketOpen, setisSocketOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["exam-session", sessionId],
    queryFn: () => sessionsAPI.getById(sessionId).then((res) => res.data),
    enabled: !!sessionId && isSocketOpen,
  });
  const { data: timeRemainingFromApi } = useQuery({
    queryKey: ["remaining-time", sessionId],
    queryFn: () =>
      sessionsAPI
        .getRemainingTime(sessionId)
        .then((res) => res.data.remainingTime),
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
    enabled:
      !!sessionId &&
      data?.session?.assignmentId?.examId?.type === "timed" &&
      isSocketOpen,
  });
  console.log(data);
  const submitMutation = useMutation({
    mutationFn: ({ questionId, submittedValue }) =>
      submittedAnswersAPI.create({
        sessionId,
        questionId,
        submittedValue,
      }),
  });
  const bookMarkMutation = useMutation({
    mutationFn: (questionId) =>
      sessionsAPI.toggleBookmark(sessionId, questionId),
  });
  const handleSubmitAnswer = async (questionId, submittedValue) => {
    try {
      await submitMutation.mutateAsync({ questionId, submittedValue });
      queryClient.invalidateQueries({ queryKey: ["exam-session", sessionId] });
    } catch (err) {
      toast.error(err?.message || "Failed to submit answer");
    }
  };
  const handleToggleBookmark = async (questionId) => {
    try {
      await bookMarkMutation.mutateAsync(questionId);
      queryClient.invalidateQueries({ queryKey: ["exam-session", sessionId] });
    } catch (err) {
      toast.error(err?.message || "Failed to toggle bookmark");
    }
  };
  useEffect(() => {
    if (!sessionId) return;

    const socket = new WebSocket(
      `ws://localhost:5000/exam-socket?sessionId=${sessionId}`
    );
    socket.onopen = () => {
      console.log("WebSocket connection established");
      setisSocketOpen(true);
      setTimeRemaining(timeRemainingFromApi);
    };
    let interval;
    if (
      timeRemaining > 0 &&
      timeRemainingFromApi &&
      data?.session?.assignmentId?.examId?.type === "timed"
    ) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    }

    return () => {
      socket.close();
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-100">
      <div className="flex gap-8 p-6 max-w-7xl mx-auto">hhhh</div>
    </div>
  );
}
