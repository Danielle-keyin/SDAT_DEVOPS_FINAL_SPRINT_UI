export const airports = [
  { id: "YYT", name: "St. John's (YYT)" },
  { id: "YYZ", name: "Toronto Pearson (YYZ)" },
  { id: "YUL", name: "Montréal–Trudeau (YUL)" },
];

export const flights = [
  {
    id: 1,
    airportId: "YYT",
    type: "ARRIVAL",
    flightNumber: "AC123",
    airline: "Air Canada",
    origin: "YYZ",
    destination: "YYT",
    gate: "A3",
    scheduledTime: "2025-12-15T15:10:00",
    status: "ON_TIME",
  },
  {
    id: 2,
    airportId: "YYT",
    type: "DEPARTURE",
    flightNumber: "WS456",
    airline: "WestJet",
    origin: "YYT",
    destination: "YUL",
    gate: "B1",
    scheduledTime: "2025-12-15T16:30:00",
    status: "BOARDING",
  },
];
