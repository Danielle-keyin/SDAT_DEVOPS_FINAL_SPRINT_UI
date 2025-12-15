import { useEffect, useState } from "react";
import { getAirports } from "../api/aviationApi";

export default function AdminAirports() {
  const [airports, setAirports] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getAirports()
      .then(setAirports)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1>Admin • Airports</h1>

      {error && <p>{error}</p>}

      <ul>
        {airports.map((a) => (
          <li key={a.id}>
            <strong>{a.id}</strong> — {a.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
