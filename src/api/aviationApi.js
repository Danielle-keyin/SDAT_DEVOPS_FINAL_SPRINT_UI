import {
  airports as mockAirports,
  flights as mockFlights,
} from "../mock/flights";

const USE_BACKEND = true;

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const delay = (ms = 150) => new Promise((res) => setTimeout(res, ms));

const normalizeAirportCode = (code) =>
  String(code || "")
    .trim()
    .toUpperCase();

const sortByTimeAsc = (a, b) =>
  new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();

async function httpJson(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      message = body?.message || JSON.stringify(body) || message;
    } catch {}
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

async function mockGetAirports() {
  await delay();
  return [...mockAirports];
}

async function mockGetFlightsByAirportAndType(airportCode, type) {
  await delay();
  const code = normalizeAirportCode(airportCode);

  return mockFlights
    .filter((f) => f.airportId === code && f.type === type)
    .slice()
    .sort(sortByTimeAsc);
}

async function mockCreateFlight(flight) {
  await delay();
  const nextId =
    mockFlights.reduce((max, f) => Math.max(max, Number(f.id) || 0), 0) + 1;

  const newFlight = { ...flight, id: nextId };
  mockFlights.push(newFlight);
  return newFlight;
}

async function mockUpdateFlight(flightId, updates) {
  await delay();
  const idx = mockFlights.findIndex((f) => String(f.id) === String(flightId));
  if (idx === -1) throw new Error("Flight not found");

  mockFlights[idx] = { ...mockFlights[idx], ...updates };
  return mockFlights[idx];
}

async function mockDeleteFlight(flightId) {
  await delay();
  const idx = mockFlights.findIndex((f) => String(f.id) === String(flightId));
  if (idx === -1) throw new Error("Flight not found");

  mockFlights.splice(idx, 1);
  return true;
}

export async function getAirports() {
  if (!USE_BACKEND) return mockGetAirports();
  return httpJson("/airports");
}

export async function getArrivals(airportCode) {
  if (!USE_BACKEND)
    return mockGetFlightsByAirportAndType(airportCode, "ARRIVAL");

  const code = normalizeAirportCode(airportCode);
  return httpJson(`/airports/${code}/arrivals`);
}

export async function getDepartures(airportCode) {
  if (!USE_BACKEND)
    return mockGetFlightsByAirportAndType(airportCode, "DEPARTURE");

  const code = normalizeAirportCode(airportCode);
  return httpJson(`/airports/${code}/departures`);
}

export async function createFlight(flightRequestDto) {
  if (!USE_BACKEND) return mockCreateFlight(flightRequestDto);

  return httpJson("/flights", {
    method: "POST",
    body: JSON.stringify(flightRequestDto),
  });
}

export async function updateFlight(flightId, updates) {
  if (!USE_BACKEND) return mockUpdateFlight(flightId, updates);

  return httpJson(`/flights/${flightId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function deleteFlight(flightId) {
  if (!USE_BACKEND) return mockDeleteFlight(flightId);

  return httpJson(`/flights/${flightId}`, { method: "DELETE" });
}
