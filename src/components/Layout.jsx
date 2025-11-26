import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  LogOut,
  LayoutDashboard,
  FolderOpen,
  FileQuestion,
  ClipboardList,
  Users,
  BookOpen,
  Search,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isAdmin = user?.role === "admin";

  const adminNavItems = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/categories", icon: FolderOpen, label: "Categories" },
    { to: "/admin/questions", icon: FileQuestion, label: "Questions" },
    { to: "/admin/exams", icon: ClipboardList, label: "Exams" },
    { to: "/admin/students", icon: Users, label: "Students" },
  ];

  const studentNavItems = [
    { to: "/student", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/student/exams", icon: BookOpen, label: "My Exams" },
  ];

  const navItems = isAdmin ? adminNavItems : studentNavItems;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-hidden">
      {/* Glassmorphism Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-72" : "w-20"
        } transition-all duration-300 flex flex-col bg-white/70 backdrop-blur-xl border-r border-white/20 shadow-2xl`}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center justify-between w-full">
            <div className={`${sidebarOpen ? "block" : "hidden"} w-full`}>
              <img src="/logo.png" alt="Logo" className="h-16 w-16 mx-auto" />
              <h1 className="text-xl font-bold text-gray-800 mt-3 text-center">
                1 IN 60
              </h1>
              <p className="text-xs text-blue-600 font-medium text-center mt-1">
                {isAdmin ? "Admin Panel" : "Student Portal"}
              </p>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-600 hover:text-blue-600 transition"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative
          ${
            isActive
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
              : "text-gray-700 hover:bg-white/60 hover:shadow-md backdrop-blur-md"
          }`}
              >
                {/* Always visible icon */}
                <Icon
                  size={sidebarOpen ? 22 : 18}
                  className={`flex-shrink-0 transition-colors duration-200
            ${
              isActive
                ? "text-white"
                : "text-blue-600 group-hover:text-blue-800"
            }`}
                />

                {/* Label: visible only when sidebar is open */}
                <span
                  className={`font-medium transition-all duration-300 ease-in-out whitespace-nowrap
            ${
              sidebarOpen
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-[-8px] pointer-events-none"
            }`}
                >
                  {item.label}
                </span>

                {/* Optional: Tooltip when collapsed */}
                {!sidebarOpen && (
                  <span className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-white/20">
          <div
            className={`mb-4 text-center ${sidebarOpen ? "block" : "hidden"}`}
          >
            <div className="w-12 h-12 bg-blue-600 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <p className="font-semibold text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white font-medium hover:shadow-lg hover:shadow-red-500/30 transition-all duration-200"
          >
            <LogOut size={20} />
            <span className={sidebarOpen ? "block" : "hidden"}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
