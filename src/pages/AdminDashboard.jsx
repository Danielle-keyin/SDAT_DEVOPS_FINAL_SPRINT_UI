import { Link } from "react-router-dom";

export default function AdminDashboard() {
  return (
    <div>
      <h1>Admin</h1>
      <p>Manage your airports and flights.</p>

      <ul>
        <li>
          <Link to="/admin/flights">Manage Flights</Link>
        </li>
        <li>
          <Link to="/admin/airports">Manage Airports</Link>
        </li>
      </ul>
    </div>
  );
}
