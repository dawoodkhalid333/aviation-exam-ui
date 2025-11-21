import { useQuery } from "@tanstack/react-query";
import { gradesAPI } from "../../lib/api";
import { format } from "date-fns";
import { Link } from "react-router-dom";
export default function Grades() {
  const { data: grades, isLoading } = useQuery({
    queryKey: ["grades"],
    queryFn: () => gradesAPI.getAll().then((res) => res.data),
  });

  if (isLoading)
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );

  return (
    <div>
      <h1
        style={{
          fontSize: "32px",
          fontWeight: "700",
          color: "#1f2937",
          marginBottom: "24px",
        }}
      >
        Grades
      </h1>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Session ID</th>
              <th>Obtained Marks</th>
              <th>Total Marks</th>
              <th>Percentage</th>
              <th>Date</th>
              <th>Review</th>
            </tr>
          </thead>
          <tbody>
            {grades?.grades?.map((grade) => {
              const percentage = (grade.obtainedMarks / grade.totalMarks) * 100;
              return (
                <tr key={grade._id}>
                  <td>{grade.sessionId.substring(0, 8)}...</td>
                  <td style={{ fontWeight: "600" }}>{grade.obtainedMarks}</td>
                  <td>{grade.totalMarks}</td>
                  <td>
                    <span
                      className={`badge ${
                        percentage >= 50 ? "badge-green" : "badge-red"
                      }`}
                    >
                      {percentage.toFixed(1)}%
                    </span>
                  </td>
                  <td>{format(new Date(grade.createdAt), "MMM d, yyyy")}</td>
                  <td>
                    <Link
                      to={`/admin/grades/${grade.sessionId}`}
                      className="btn btn-outline"
                      style={{ padding: "4px 10px" }}
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
