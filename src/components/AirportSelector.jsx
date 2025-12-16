export default function AirportSelector({ airports = [], value, onChange }) {
  return (
    <div className="airport-selector">
      <label htmlFor="airport">Airport:</label>

      <select
        id="airport"
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
      >
        <option value="" disabled>
          Select an airport...
        </option>

        {airports.map((a) => (
          <option key={a.id} value={a.code}>
            {a.name} ({a.code})
          </option>
        ))}
      </select>
    </div>
  );
}
