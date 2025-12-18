import { useEffect, useMemo, useState } from "react";
import {
  getAirports,
  createAirport,
  updateAirport,
  deleteAirport,
} from "../api/aviationApi";

const emptyForm = {
  name: "",
  code: "",
};

function getNiceError(err) {
  const data = err?.response?.data;

  if (typeof data === "string") return data;

  if (data?.message) return data.message;
  if (data?.error) return `${data.error}${data?.path ? ` (${data.path})` : ""}`;

  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors
      .map((e) => e.defaultMessage || e.message || String(e))
      .join(" • ");
  }

  if (data && typeof data === "object") {
    const firstKey = Object.keys(data)[0];
    if (firstKey) return `${firstKey}: ${String(data[firstKey])}`;
  }

  return err?.message || "Something went wrong. Please try again.";
}

export default function AdminAirports() {
  const [airports, setAirports] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const [editingId, setEditingId] = useState(null);
  const isEditing = editingId != null;

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSubmit = useMemo(() => {
    return form.name.trim().length > 0 && form.code.trim().length >= 3;
  }, [form]);

  async function loadAirports() {
    setLoading(true);
    try {
      setError("");
      const data = await getAirports();
      setAirports(data);
    } catch (e) {
      setError(getNiceError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAirports();
  }, []);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function resetToAddMode() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  function startEdit(a) {
    setError("");
    setEditingId(a.id);
    setForm({
      name: a.name ?? "",
      code: a.code ?? "",
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
    };

    try {
      setSaving(true);

      if (isEditing) {
        await updateAirport(editingId, payload);
      } else {
        await createAirport(payload);
      }

      await loadAirports();
      resetToAddMode();
    } catch (e2) {
      setError(getNiceError(e2));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(a) {
    setError("");

    const ok = window.confirm(`Delete airport ${a.name} (${a.code})?`);
    if (!ok) return;

    try {
      if (Number(a.id) === Number(editingId)) resetToAddMode();

      await deleteAirport(a.id);
      await loadAirports();
    } catch (e) {
      setError(getNiceError(e));
    }
  }

  return (
    <div className="admin-airports">
      <h1>Admin • Airports</h1>

      {error && <p className="error-banner">{error}</p>}

      <h2>{isEditing ? "Edit Airport" : "Add Airport"}</h2>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="field">
            <span>Name</span>
            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="St. John's"
              required
            />
          </label>

          <label className="field">
            <span>Code</span>
            <input
              value={form.code}
              onChange={(e) => updateField("code", e.target.value)}
              placeholder="YYT"
              maxLength={4}
              required
            />
          </label>
        </div>

        <div className="admin-actions">
          <button type="submit" disabled={!canSubmit || saving}>
            {saving
              ? "Saving..."
              : isEditing
              ? "Update Airport"
              : "Add Airport"}
          </button>

          {isEditing && (
            <button
              type="button"
              className="secondary"
              onClick={resetToAddMode}
              disabled={saving}
            >
              Cancel
            </button>
          )}
        </div>

        {!canSubmit && (
          <p className="muted" style={{ marginTop: 8, color: "black" }}>
            Enter a name and a 3-letter airport code (ex: YYT).
          </p>
        )}
      </form>

      <h2 className="section-title">Airports</h2>

      {loading && <p>Loading airports…</p>}

      {!loading && airports.length === 0 && (
        <p className="muted">No airports found.</p>
      )}

      <ul className="flight-list">
        {airports.map((a) => (
          <li key={a.id} className="flight-row">
            <strong>{a.id}</strong> {a.name}{" "}
            <button className="secondary" onClick={() => startEdit(a)}>
              Edit
            </button>{" "}
            <button className="danger" onClick={() => handleDelete(a)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
