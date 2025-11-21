import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesAPI } from "../../lib/api";
import { Plus, Trash2, Edit } from "lucide-react";

export default function Categories() {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState("");
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesAPI.getAll().then((res) => res.data.categories),
  });

  const createMutation = useMutation({
    mutationFn: categoriesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      setShowModal(false);
      setName("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => categoriesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      setShowModal(false);
      setEditingCategory(null);
      setName("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoriesAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: { name } });
    } else {
      createMutation.mutate({ name });
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setName(category.name);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this category?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading)
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );

  return (
    <div>
      <div className="flex-between mb-4">
        <h1 style={{ fontSize: "32px", fontWeight: "700", color: "#1f2937" }}>
          Categories
        </h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingCategory(null);
            setName("");
            setShowModal(true);
          }}
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Created</th>
              <th style={{ width: "120px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories?.map((category) => (
              <tr key={category.id}>
                <td style={{ fontWeight: "500" }}>{category.name}</td>
                <td>{new Date(category.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-outline"
                      style={{ padding: "6px 12px" }}
                      onClick={() => handleEdit(category)}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: "6px 12px" }}
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                marginBottom: "20px",
              }}
            >
              {editingCategory ? "Edit Category" : "Add Category"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label">Category Name</label>
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {editingCategory ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
