import { useEffect, useState } from "react";
import { getAirports, getArrivals } from "../api/aviationApi";
import AirportSelector from "../components/AirportSelector";
import FlightTable from "../components/FlightTable";

export default function Arrivals() {
  const [airports, setAirports] = useState([]);
  const [selectedAirport, setSelectedAirport] = useState("");
  const [flights, setFlights] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAirports()
      .then((data) => {
        setAirports(data);
        if (data.length > 0) setSelectedAirport(data[0].id);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!selectedAirport) return;

    setLoading(true);
    setError("");

    getArrivals(selectedAirport)
      .then(setFlights)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedAirport]);

  return (
    <div>
      <h1>Arrivals</h1>

      <AirportSelector
        airports={airports}
        value={selectedAirport}
        onChange={setSelectedAirport}
      />

      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}

      {!loading && !error && <FlightTable flights={flights} mode="ARRIVAL" />}
    </div>
  );
}
