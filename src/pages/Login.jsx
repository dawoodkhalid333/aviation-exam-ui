import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { authAPI } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { LogIn, Plane } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const loginMutation = useMutation({
    mutationFn: authAPI.login,
    onSuccess: (response) => {
      const { user, token } = response.data;
      setAuth(user, token);
      navigate(user.role === "admin" ? "/admin" : "/student");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div
          className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20"
          style={{ padding: "24px" }}
        >
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-[128px] h-[128px] bg-white rounded-full flex items-center justify-center shadow-2xl">
                  <img src="/logo.png" width={"80%"} className="mx-auto" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full animate-ping"></div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full"></div>
              </div>
            </div>

            <h1 className="text-4xl font-bold text-white tracking-tight">
              1 IN <span className="text-yellow-400">60</span>
            </h1>
            <p className="text-blue-200 mt-2 text-sm">Aviation Exam System</p>
            <p className="text-gray-300 mt-1 text-sm">Welcome back, pilot</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 my-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
                placeholder="pilot@example.com"
                style={{ padding: "6px" }}
                required
              />
            </div>

            <div style={{ marginTop: "6px" }}>
              <label className="block text-sm font-medium text-gray-200">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
                placeholder="••••••••"
                style={{ padding: "6px" }}
                required
              />
            </div>

            {/* Error Message */}
            {loginMutation.isError && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm text-center">
                {loginMutation.error?.response?.data?.message ||
                  "Invalid credentials. Please try again."}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              style={{ padding: "6px", marginTop: "16px", marginBottom: "8px" }}
              disabled={loginMutation.isPending}
              className="w-full py-4 px-6 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-black font-bold rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
            >
              <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              {loginMutation.isPending
                ? "Signing In..."
                : "Sign In to Dashboard"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-xs">
              Secured with military-grade encryption • Powered by xAI
            </p>
          </div>
        </div>

        {/* Decorative bottom element */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-gray-500 text-xs">
            <span className="w-24 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></span>
            <span>Ready for takeoff</span>
            <span className="w-24 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></span>
          </div>
        </div>
      </div>
    </div>
  );
}
