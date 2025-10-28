"use client";
import { useUser } from "../../context/UserContext";

export default function EventDetailsModal({ event, onClose }: { event: any; onClose: () => void }) {
  const { role } = useUser();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-600 hover:text-black text-xl"
        >
          ×
        </button>

        <h2 className="text-2xl font-bold mb-2">{event.name}</h2>
        <p className="text-gray-600 mb-1">{event.date} • {event.time}</p>
        <p className="text-gray-600 mb-3">{event.location}</p>
        <p className="mb-4">{event.description}</p>

        <hr className="my-4" />

        {/* Map button */}
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => alert(`Zoom map to ${event.name}`)}
        >
          View on Map
        </button>

        {/* Role-based actions */}
        <div className="mt-4 flex gap-3">
          {role === "user" && event.createdBy === "me" && (
            <button
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              onClick={() => alert("Delete your event")}
            >
              Delete Event
            </button>
          )}

          {role === "admin" && (
            <>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                onClick={() => alert("Approve event")}
              >
                Approve
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                onClick={() => alert("Delete event")}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
