import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/admin/Dashboard";
import Categories from "./pages/admin/Categories";
import Questions from "./pages/admin/Questions";
import QuestionSearch from "./pages/admin/QuestionSearch";
import Exams from "./pages/admin/Exams";
import CreateExam from "./pages/admin/CreateExam";
import ExamDetails from "./pages/admin/ExamDetails";
import Students from "./pages/admin/Students";
import StudentProfile from "./pages/admin/StudentProfile";
import Grades from "./pages/admin/Grades";
import ReviewControls from "./pages/admin/ReviewControls";
import SessionReview from "./pages/admin/SessionReview";
import StudentDashboard from "./pages/student/Dashboard";
import StudentExams from "./pages/student/Exams";
import TakeExam from "./pages/student/TakeExam";
import ExamResults from "./pages/student/ExamResults";

function PrivateRoute({ children, adminOnly = false }) {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/student" replace />;
  }

  return children;
}

function App() {
  const { user } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={user.role === "admin" ? "/admin" : "/student"} />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/register"
          element={
            user ? (
              <Navigate to={user.role === "admin" ? "/admin" : "/student"} />
            ) : (
              <Register />
            )
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <PrivateRoute adminOnly>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="categories" element={<Categories />} />
          <Route path="questions" element={<Questions />} />
          <Route path="questions/search" element={<QuestionSearch />} />
          <Route path="exams" element={<Exams />} />
          <Route path="exams/create" element={<CreateExam />} />
          <Route path="exams/:id" element={<ExamDetails />} />
          {/* <Route path="review" element={<ReviewControls />} /> */}
          <Route path="students" element={<Students />} />
          <Route path="students/:studentId" element={<StudentProfile />} />
          <Route path="grades" element={<Grades />} />
          <Route path="grades/:sessionId" element={<SessionReview />} />
        </Route>

        {/* Student Routes */}
        <Route
          path="/student"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="exams" element={<StudentExams />} />
          <Route path="exams/:id/take" element={<TakeExam />} />
          <Route path="results/:sessionId" element={<ExamResults />} />
        </Route>

        <Route
          path="/"
          element={
            <Navigate
              to={
                user
                  ? user.role === "admin"
                    ? "/admin"
                    : "/student"
                  : "/login"
              }
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
