// components/BulkAssignStudentSelect.jsx
import React from "react";
import Select from "react-select";
import { UserCheck, Users, X } from "lucide-react";

const customStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "56px",
    borderRadius: "16px",
    border: "2px solid transparent",
    background: state.isFocused
      ? "rgba(255, 255, 255, 0.9)"
      : "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(12px)",
    boxShadow: state.isFocused
      ? "0 0 0 4px rgba(59, 130, 246, 0.2), 0 8px 25px rgba(0, 0, 0, 0.08)"
      : "0 4px 15px rgba(0, 0, 0, 0.06)",
    transition: "all 0.3s ease",
    "&:hover": {
      borderColor: "transparent",
    },
  }),
  menu: (base) => ({
    ...base,
    marginTop: "8px",
    borderRadius: "16px",
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(16px)",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.12)",
    overflow: "hidden",
    border: "1px solid rgba(255, 255, 255, 0.3)",
  }),
  menuList: (base) => ({
    ...base,
    padding: "8px",
    maxHeight: "300px",
  }),
  option: (base, state) => ({
    ...base,
    borderRadius: "12px",
    padding: "12px 16px",
    margin: "4px 8px",
    backgroundColor: state.isSelected
      ? "rgba(59, 130, 246, 0.15)"
      : state.isFocused
      ? "rgba(59, 130, 246, 0.08)"
      : "transparent",
    color: "#1f2937",
    fontWeight: state.isSelected ? "600" : "500",
    transition: "all 0.2s ease",
    cursor: "pointer",
    "&:active": {
      backgroundColor: "rgba(59, 130, 246, 0.2)",
    },
  }),
  multiValue: (base) => ({
    ...base,
    background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
    borderRadius: "12px",
    padding: "2px 8px",
    color: "white",
    fontWeight: "600",
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "white",
    fontSize: "14px",
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: "white",
    marginLeft: "8px",
    borderRadius: "50%",
    width: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.3)",
    },
  }),
  placeholder: (base) => ({
    ...base,
    color: "#9ca3af",
    fontSize: "15px",
  }),
  input: (base) => ({
    ...base,
    color: "#1f2937",
    fontSize: "15px",
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "#3b82f6",
    "&:hover": { color: "#2563eb" },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: "#ef4444",
    "&:hover": { color: "#dc2626" },
  }),
};

const BulkAssignStudentSelect = ({
  unassignedStudents = [],
  selectedStudents = [],
  setSelectedStudents,
}) => {
  const options = unassignedStudents.map((student) => ({
    value: student.id,
    label: student.name,
    email: student.email,
  }));

  const selectedOptions = options.filter((opt) =>
    selectedStudents.includes(opt.value)
  );

  const handleChange = (selected) => {
    setSelectedStudents(selected ? selected.map((opt) => opt.value) : []);
  };

  const selectAll = () => {
    setSelectedStudents(unassignedStudents.map((s) => s.id));
  };

  const clearAll = () => {
    setSelectedStudents([]);
  };

  if (unassignedStudents.length === 0) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
        <Users size={64} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 font-medium">
          All students are already assigned to this exam.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={selectAll}
            className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            <UserCheck size={18} />
            Select All ({unassignedStudents.length})
          </button>
          {selectedStudents.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition"
            >
              <X size={18} />
              Clear Selection
            </button>
          )}
        </div>

        {selectedStudents.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-full text-sm shadow-lg">
            {selectedStudents.length} Student
            {selectedStudents.length > 1 ? "s" : ""} Selected
          </div>
        )}
      </div>

      {/* React Select */}
      <Select
        isMulti
        options={options}
        value={selectedOptions}
        onChange={handleChange}
        placeholder="Search students by name or email..."
        noOptionsMessage={() => "No unassigned students found"}
        isSearchable
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        formatOptionLabel={({ label, email }) => (
          <div className="flex items-center justify-between">
            <span className="font-medium">{label}</span>
            <span className="text-sm text-gray-500 ml-4">{email}</span>
          </div>
        )}
        styles={customStyles}
        className="react-select-container"
        classNamePrefix="react-select"
      />
    </div>
  );
};

export default BulkAssignStudentSelect;
