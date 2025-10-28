import { useUser } from "../context/UserContext";

export default function EventDetailsModal({ event, onClose }) {
  const { role } = useUser();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "12px",
          width: "400px",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            right: "10px",
            top: "5px",
            fontSize: "18px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
        <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "0.5rem" }}>
          {event.name}
        </h2>
        <p>{event.location}</p>
        <p>{event.date} {event.time}</p>
        <p style={{ marginTop: "0.5rem" }}>{event.description}</p>

        <hr style={{ margin: "1rem 0" }} />

        <button
          onClick={() => alert(`Zoom to ${event.name}`)}
          style={{
            backgroundColor: "#2563eb",
            color: "white",
            padding: "8px 12px",
            borderRadius: "6px",
            border: "none",
          }}
        >
          View on Map
        </button>

        {role === "admin" && (
          <div style={{ marginTop: "1rem" }}>
            <button
              style={{
                backgroundColor: "#16a34a",
                color: "white",
                padding: "6px 10px",
                borderRadius: "6px",
                marginRight: "10px",
                border: "none",
              }}
            >
              Approve
            </button>
            <button
              style={{
                backgroundColor: "#dc2626",
                color: "white",
                padding: "6px 10px",
                borderRadius: "6px",
                border: "none",
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
