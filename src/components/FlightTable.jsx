import StatusPill from "./StatusPill";

function formatTime(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FlightTable({ flights = [], mode = "ARRIVAL" }) {
  return (
    <div>
      <h2>{mode === "DEPARTURE" ? "Departures" : "Arrivals"}</h2>

      {flights.length === 0 ? (
        <p>No flights found.</p>
      ) : (
        <div className="table-wrap">
          <table className="flight-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Flight</th>
                <th>Airline</th>
                <th>{mode === "ARRIVAL" ? "From" : "To"}</th>
                <th>Gate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {flights.map((f) => (
                <tr key={f.id}>
                  <td>{formatTime(f.scheduledTime)}</td>
                  <td>{f.flightNumber}</td>
                  <td>{f.airline}</td>
                  <td>{mode === "ARRIVAL" ? f.origin : f.destination}</td>
                  <td>{f.gate}</td>
                  <td>
                    <StatusPill status={f.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
