const labelMap = {
  ON_TIME: "On Time",
  DELAYED: "Delayed",
  BOARDING: "Boarding",
  CANCELLED: "Cancelled",
  LANDED: "Landed",
};

export default function StatusPill({ status }) {
  const text = labelMap[status] || status || "—";
  const strong = status === "DELAYED" || status === "CANCELLED";

  return (
    <span className={`status-pill ${strong ? "strong" : ""}`}>{text}</span>
  );
}
