import { useEffect, useMemo, useState } from "react";
import {
  getAirports,
  getArrivals,
  getDepartures,
  createFlight,
  updateFlight,
  deleteFlight,
  getAirlines,
  getAircraft,
  getGates,
} from "../api/aviationApi";

const emptyForm = {
  type: "ARRIVAL",
  flightNumber: "",
  origin: "",
  destination: "",
  scheduledTime: "",
  status: "ON_TIME",
  airportId: null,
  airlineId: null,
  aircraftId: null,
  gateId: null,
};

function toDateTimeLocal(value) {
  if (!value) return "";
  const s = String(value);
  return s.length >= 16 ? s.slice(0, 16) : s;
}

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

export default function AdminFlights() {
  const [airports, setAirports] = useState([]);
  const [selectedAirportId, setSelectedAirportId] = useState(null);

  const [airlines, setAirlines] = useState([]);
  const [aircraft, setAircraft] = useState([]);
  const [gates, setGates] = useState([]);

  const [flights, setFlights] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const [editingId, setEditingId] = useState(null);
  const isEditing = editingId != null;

  const [error, setError] = useState("");
  const [loadingFlights, setLoadingFlights] = useState(false);
  const [loadingAirports, setLoadingAirports] = useState(false);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedAirport = useMemo(
    () =>
      airports.find((a) => Number(a.id) === Number(selectedAirportId)) || null,
    [airports, selectedAirportId]
  );

  const gatesForSelectedAirport = useMemo(() => gates, [gates]);

  const canSubmit = useMemo(() => {
    if (!selectedAirport) return false;

    const hasBasics =
      form.flightNumber.trim() &&
      form.scheduledTime &&
      form.type &&
      form.status;

    const hasRoute =
      form.type === "ARRIVAL" ? form.origin.trim() : form.destination.trim();

    const hasRequiredDropdowns =
      form.airportId && form.airlineId && form.aircraftId && form.gateId;

    return Boolean(hasBasics && hasRoute && hasRequiredDropdowns);
  }, [form, selectedAirport]);

  async function refreshFlightsByAirportCode(airportCode) {
    setLoadingFlights(true);
    try {
      const [arrivals, departures] = await Promise.all([
        getArrivals(airportCode),
        getDepartures(airportCode),
      ]);
      setFlights([...arrivals, ...departures]);
    } catch (e) {
      setError(getNiceError(e));
    } finally {
      setLoadingFlights(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        setError("");
        setLoadingAirports(true);
        setLoadingLookups(true);

        const [airportData, airlineData, aircraftData, gateData] =
          await Promise.all([
            getAirports(),
            getAirlines(),
            getAircraft(),
            getGates(),
          ]);

        setAirports(airportData);
        setAirlines(airlineData);
        setAircraft(aircraftData);
        setGates(gateData);

        if (airportData.length > 0) {
          const first = airportData[0];
          setSelectedAirportId(first.id);

          setForm((prev) => ({
            ...prev,
            airportId: first.id,
          }));

          await refreshFlightsByAirportCode(first.code);
        }
      } catch (e) {
        setError(getNiceError(e));
      } finally {
        setLoadingAirports(false);
        setLoadingLookups(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedAirport) return;

    setError("");
    setEditingId(null);

    setForm((prev) => ({
      ...prev,
      airportId: selectedAirport.id,
      gateId: null,
    }));

    refreshFlightsByAirportCode(selectedAirport.code);
  }, [selectedAirportId]);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function resetToAddMode() {
    setEditingId(null);
    setForm((prev) => ({
      ...emptyForm,
      type: prev.type,
      status: prev.status,
      airportId: selectedAirport?.id ?? prev.airportId,
    }));
  }

  function startEdit(f) {
    setError("");
    setEditingId(f.id);

    const airportId = selectedAirport?.id ?? f.airportId ?? null;

    setForm({
      type: f.type || "ARRIVAL",
      flightNumber: f.flightNumber || "",
      origin: f.origin || "",
      destination: f.destination || "",
      scheduledTime: toDateTimeLocal(f.scheduledTime),
      status: f.status || "ON_TIME",
      airportId: airportId,
      airlineId: f.airlineId ?? null,
      aircraftId: f.aircraftId ?? null,
      gateId: f.gateId ?? null,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!selectedAirport) {
      setError("Select an airport first.");
      return;
    }

    if (
      !form.airportId ||
      !form.airlineId ||
      !form.aircraftId ||
      !form.gateId
    ) {
      setError("Pick Airline, Aircraft, and Gate (all required).");
      return;
    }

    try {
      setSaving(true);

      const airportCode = selectedAirport.code;

      const payload = {
        flightNumber: form.flightNumber,
        type: form.type,
        status: form.status,
        scheduledTime: form.scheduledTime,

        origin: form.type === "ARRIVAL" ? form.origin : airportCode,
        destination: form.type === "ARRIVAL" ? airportCode : form.destination,

        airportId: Number(form.airportId),
        airlineId: Number(form.airlineId),
        aircraftId: Number(form.aircraftId),
        gateId: Number(form.gateId),
      };

      if (isEditing) {
        await updateFlight(editingId, payload);
      } else {
        await createFlight(payload);
      }

      await refreshFlightsByAirportCode(airportCode);
      resetToAddMode();
    } catch (err) {
      setError(getNiceError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, flightNumber) {
    setError("");
    if (!selectedAirport) return;

    const ok = window.confirm(`Delete flight ${flightNumber || id}?`);
    if (!ok) return;

    try {
      if (Number(id) === Number(editingId)) resetToAddMode();

      await deleteFlight(id);
      await refreshFlightsByAirportCode(selectedAirport.code);
    } catch (err) {
      setError(getNiceError(err));
    }
  }

  return (
    <div className="admin-flights">
      <h1>Admin • Flights</h1>

      {error && <p className="error-banner">{error}</p>}

      <div className="admin-controls">
        <label className="field">
          <span>Airport</span>
          <select
            value={selectedAirportId || ""}
            onChange={(e) => setSelectedAirportId(e.target.value)}
            disabled={loadingAirports}
          >
            {airports.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.code})
              </option>
            ))}
          </select>
        </label>

        {loadingAirports && <p className="muted">Loading airports…</p>}

        {selectedAirport && !loadingAirports && (
          <p className="muted">
            Showing flights for: <strong>{selectedAirport.name}</strong>
          </p>
        )}
      </div>

      <h2>{isEditing ? "Edit Flight" : "Add Flight"}</h2>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="field">
            <span>Type</span>
            <select
              value={form.type}
              onChange={(e) => updateField("type", e.target.value)}
            >
              <option value="ARRIVAL">ARRIVAL</option>
              <option value="DEPARTURE">DEPARTURE</option>
            </select>
          </label>

          <label className="field">
            <span>Flight #</span>
            <input
              value={form.flightNumber}
              onChange={(e) => updateField("flightNumber", e.target.value)}
              placeholder="AC123"
              required
            />
          </label>

          <label className="field">
            <span>Airline</span>
            <select
              value={form.airlineId ?? ""}
              onChange={(e) => updateField("airlineId", e.target.value)}
              required
              disabled={loadingLookups}
            >
              <option value="" disabled>
                Select airline…
              </option>
              {airlines.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.code})
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>{form.type === "ARRIVAL" ? "Origin" : "Destination"}</span>
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

          <label className="field">
            <span>Aircraft</span>
            <select
              value={form.aircraftId ?? ""}
              onChange={(e) => updateField("aircraftId", e.target.value)}
              required
              disabled={loadingLookups}
            >
              <option value="" disabled>
                Select aircraft…
              </option>
              {aircraft.map((ac) => (
                <option key={ac.id} value={ac.id}>
                  {ac.model} {ac.registration ? `(${ac.registration})` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Gate</span>
            <select
              value={form.gateId ?? ""}
              onChange={(e) => updateField("gateId", e.target.value)}
              required
              disabled={loadingLookups || gatesForSelectedAirport.length === 0}
            >
              <option value="" disabled>
                {loadingLookups ? "Loading gates…" : "Select gate…"}
              </option>
              {gatesForSelectedAirport.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.gateNumber}
                </option>
              ))}
            </select>

            {/* Empty state for gates */}
            {form.airportId &&
              !loadingLookups &&
              gatesForSelectedAirport.length === 0 && (
                <p className="muted">No gates available for this airport.</p>
              )}
          </label>

          <label className="field">
            <span>Scheduled Time</span>
            <input
              type="datetime-local"
              value={form.scheduledTime}
              onChange={(e) => updateField("scheduledTime", e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Status</span>
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

        <div className="admin-actions">
          <button type="submit" disabled={saving || !canSubmit}>
            {saving ? "Saving..." : isEditing ? "Update Flight" : "Add Flight"}
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

        {!canSubmit && <p className="muted" style={{ marginTop: 8 }}></p>}
      </form>

      <h2 className="section-title">Flights (for this airport)</h2>

      {loadingFlights && <p>Loading flights…</p>}

      {/* Empty state for flights */}
      {!loadingFlights && flights.length === 0 && (
        <p className="muted">No flights found for this airport yet.</p>
      )}

      <ul className="flight-list">
        {flights.map((f) => (
          <li key={f.id} className="flight-row">
            <strong>{f.flightNumber}</strong> • {f.type} • {f.airline} •{" "}
            {f.type === "ARRIVAL" ? `From ${f.origin}` : `To ${f.destination}`}{" "}
            • Gate {f.gate || "—"} • {f.status}{" "}
            <button className="secondary" onClick={() => startEdit(f)}>
              Edit
            </button>{" "}
            <button
              className="danger"
              onClick={() => handleDelete(f.id, f.flightNumber)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
