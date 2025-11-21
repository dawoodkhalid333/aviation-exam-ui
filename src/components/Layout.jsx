import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  LogOut,
  LayoutDashboard,
  FolderOpen,
  FileQuestion,
  ClipboardList,
  Users,
  Award,
  BookOpen,
  Search,
  Shield,
} from "lucide-react";

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isAdmin = user?.role === "admin";

  const adminNavItems = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/categories", icon: FolderOpen, label: "Categories" },
    { to: "/admin/questions", icon: FileQuestion, label: "Questions" },
    // { to: "/admin/questions/search", icon: Search, label: "Question Search" },
    { to: "/admin/exams", icon: ClipboardList, label: "Exams" },
    // { to: "/admin/review", icon: Shield, label: "Review Settings" },
    { to: "/admin/students", icon: Users, label: "Students" },
    { to: "/admin/grades", icon: Award, label: "Grades" },
  ];

  const studentNavItems = [
    { to: "/student", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/student/exams", icon: BookOpen, label: "My Exams" },
  ];

  const navItems = isAdmin ? adminNavItems : studentNavItems;

  return (
    <div style={{ display: "flex", minHeight: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "250px",
          background: "white",
          borderRight: "1px solid #e5e7eb",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ marginBottom: "32px" }}>
          <img
            src="/logo.png"
            alt="logo"
            style={{
              width: "100px",
              height: "100px",
              margin: "auto",
              display: "block",
            }}
          />
          {/* <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#1f2937" }}>
            Aviation Exam
          </h1> */}
          <p
            style={{
              fontSize: "12px",
              color: "#6b7280",
              marginTop: "4px",
              textAlign: "center",
            }}
          >
            {isAdmin ? "Admin Panel" : "Student Portal"}
          </p>
        </div>

        <nav style={{ flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "6px",
                  marginBottom: "4px",
                  textDecoration: "none",
                  color: isActive ? "#2563eb" : "#4b5563",
                  background: isActive ? "#eff6ff" : "transparent",
                  fontWeight: isActive ? "600" : "400",
                  fontSize: "14px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "16px" }}>
          <div style={{ marginBottom: "12px" }}>
            <p
              style={{ fontSize: "14px", fontWeight: "600", color: "#1f2937" }}
            >
              {user?.name}
            </p>
            <p style={{ fontSize: "12px", color: "#6b7280" }}>{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-outline"
            style={{ width: "100%", justifyContent: "center" }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        style={{ flex: 1, padding: "32px", overflowY: "auto", height: "100vh" }}
      >
        <Outlet />
      </main>
    </div>
  );
}
