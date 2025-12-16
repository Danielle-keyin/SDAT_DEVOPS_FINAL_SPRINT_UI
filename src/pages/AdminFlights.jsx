// src/pages/AdminFlights.jsx
import { useEffect, useMemo, useState } from "react";
import {
  getAirports,
  getArrivals,
  getDepartures,
  createFlight,
  deleteFlight,
} from "../api/aviationApi";

const emptyForm = {
  airportId: "",
  type: "ARRIVAL",
  flightNumber: "",
  airline: "",
  origin: "",
  destination: "",
  gate: "",
  scheduledTime: "",
  status: "ON_TIME",
};

const sortByTimeAsc = (a, b) =>
  new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();

export default function AdminFlights() {
  const [airports, setAirports] = useState([]);
  const [selectedAirport, setSelectedAirport] = useState("");
  const [flights, setFlights] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function refreshFlights(airportId) {
    const arrivals = await getArrivals(airportId);
    const departures = await getDepartures(airportId);
    setFlights([...arrivals, ...departures].slice().sort(sortByTimeAsc));
  }

  useEffect(() => {
    setError("");
    getAirports()
      .then(async (data) => {
        setAirports(data);
        if (data.length > 0) {
          const first = data[0].id;
          setSelectedAirport(first);
          setForm((f) => ({ ...f, airportId: first }));
          await refreshFlights(first);
        }
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!selectedAirport) return;
    setError("");
    refreshFlights(selectedAirport).catch((e) => setError(e.message));
  }, [selectedAirport]);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      // ARRIVAL -> destination becomes airportId
      // DEPARTURE -> origin becomes airportId
      const payload =
        form.type === "ARRIVAL"
          ? { ...form, destination: form.airportId }
          : { ...form, origin: form.airportId };

      await createFlight(payload);
      await refreshFlights(selectedAirport);

      setForm((prev) => ({
        ...emptyForm,
        airportId: prev.airportId,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    setError("");
    setBusy(true);

    try {
      await deleteFlight(id);
      await refreshFlights(selectedAirport);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const airportName = useMemo(() => {
    const a = airports.find((x) => String(x.id) === String(selectedAirport));
    return a?.name || "";
  }, [airports, selectedAirport]);

  return (
    <div className="admin-page">
      <h1>Admin • Flights</h1>

      {error && <p className="error">{error}</p>}

      <div className="admin-airport-select">
        <label htmlFor="admin-airport">
          Airport:
          <select
            id="admin-airport"
            value={selectedAirport}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedAirport(v);
              setForm((f) => ({ ...f, airportId: v }));
            }}
            disabled={busy}
          >
            {airports.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>

        {airportName && (
          <p className="muted" style={{ marginTop: "0.25rem" }}>
            Managing flights for: <strong>{airportName}</strong>
          </p>
        )}
      </div>

      <h2>Add Flight</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Type
            <select
              value={form.type}
              onChange={(e) => updateField("type", e.target.value)}
              disabled={busy}
            >
              <option value="ARRIVAL">ARRIVAL</option>
              <option value="DEPARTURE">DEPARTURE</option>
            </select>
          </label>

          <label>
            Flight #
            <input
              value={form.flightNumber}
              onChange={(e) => updateField("flightNumber", e.target.value)}
              placeholder="AC123"
              required
              disabled={busy}
            />
          </label>

          <label>
            Airline
            <input
              value={form.airline}
              onChange={(e) => updateField("airline", e.target.value)}
              placeholder="Air Canada"
              required
              disabled={busy}
            />
          </label>

          <label>
            {form.type === "ARRIVAL" ? "Origin" : "Destination"}
            <input
              value={form.type === "ARRIVAL" ? form.origin : form.destination}
              onChange={(e) =>
                updateField(
                  form.type === "ARRIVAL" ? "origin" : "destination",
                  e.target.value
                )
              }
              placeholder={form.type === "ARRIVAL" ? "YYZ" : "YUL"}
              required
              disabled={busy}
            />
          </label>

          <label>
            Gate
            <input
              value={form.gate}
              onChange={(e) => updateField("gate", e.target.value)}
              placeholder="A3"
              disabled={busy}
            />
          </label>

          <label>
            Scheduled Time
            <input
              type="datetime-local"
              value={form.scheduledTime}
              onChange={(e) => updateField("scheduledTime", e.target.value)}
              required
              disabled={busy}
            />
          </label>

          <label>
            Status
            <select
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
              disabled={busy}
            >
              <option value="ON_TIME">ON_TIME</option>
              <option value="DELAYED">DELAYED</option>
              <option value="BOARDING">BOARDING</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="LANDED">LANDED</option>
            </select>
          </label>
        </div>

        <div className="admin-form-actions">
          <button type="submit" disabled={busy}>
            {busy ? "Saving..." : "Add Flight"}
          </button>
        </div>
      </form>

      <h2 className="admin-section-title">Flights (for this airport)</h2>

      {flights.length === 0 ? (
        <p className="muted">No flights found for this airport.</p>
      ) : (
        <ul className="admin-flight-list">
          {flights.map((f) => (
            <li key={f.id} className="admin-flight-item">
              <span className="admin-flight-text">
                <strong>{f.flightNumber}</strong> • {f.type} • {f.airline} •{" "}
                {f.type === "ARRIVAL"
                  ? `From ${f.origin}`
                  : `To ${f.destination}`}{" "}
                • Gate {f.gate || "—"} • {f.status}
              </span>

              <button
                className="danger"
                onClick={() => handleDelete(f.id)}
                disabled={busy}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
