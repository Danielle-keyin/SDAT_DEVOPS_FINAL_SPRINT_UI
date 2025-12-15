import { useEffect, useState } from "react";
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

export default function AdminFlights() {
  const [airports, setAirports] = useState([]);
  const [selectedAirport, setSelectedAirport] = useState("");
  const [flights, setFlights] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  async function refreshFlights(airportId) {
    const arrivals = await getArrivals(airportId);
    const departures = await getDepartures(airportId);
    setFlights([...arrivals, ...departures]);
  }

  useEffect(() => {
    getAirports()
      .then((data) => {
        setAirports(data);
        if (data.length > 0) {
          const first = data[0].id;
          setSelectedAirport(first);
          setForm((f) => ({ ...f, airportId: first }));
          return refreshFlights(first);
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

    try {
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
    }
  }

  async function handleDelete(id) {
    setError("");
    try {
      await deleteFlight(id);
      await refreshFlights(selectedAirport);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Admin • Flights</h1>

      {error && <p>{error}</p>}

      <div style={{ marginBottom: "1rem" }}>
        <label>
          Airport:{" "}
          <select
            value={selectedAirport}
            onChange={(e) => {
              setSelectedAirport(e.target.value);
              setForm((f) => ({ ...f, airportId: e.target.value }));
            }}
          >
            {airports.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <h2>Add Flight</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Type
            <select
              value={form.type}
              onChange={(e) => updateField("type", e.target.value)}
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
            />
          </label>

          <label>
            Airline
            <input
              value={form.airline}
              onChange={(e) => updateField("airline", e.target.value)}
              placeholder="Air Canada"
              required
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
            />
          </label>

          <label>
            Gate
            <input
              value={form.gate}
              onChange={(e) => updateField("gate", e.target.value)}
              placeholder="A3"
            />
          </label>

          <label>
            Scheduled Time
            <input
              type="datetime-local"
              value={form.scheduledTime}
              onChange={(e) => updateField("scheduledTime", e.target.value)}
              required
            />
          </label>

          <label>
            Status
            <select
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
            >
              <option value="ON_TIME">ON_TIME</option>
              <option value="DELAYED">DELAYED</option>
              <option value="BOARDING">BOARDING</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="LANDED">LANDED</option>
            </select>
          </label>
        </div>

        <button type="submit">Add Flight</button>
      </form>

      <h2 style={{ marginTop: "1.5rem" }}>Flights (for this airport)</h2>
      <ul>
        {flights.map((f) => (
          <li key={f.id} style={{ marginBottom: "0.5rem" }}>
            <strong>{f.flightNumber}</strong> • {f.type} • {f.airline} •{" "}
            {f.type === "ARRIVAL" ? `From ${f.origin}` : `To ${f.destination}`}{" "}
            • Gate {f.gate || "—"} • {f.status} •{" "}
            <button onClick={() => handleDelete(f.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
