"use client";
import { useUser } from "../../context/UserContext";

export default function EventDetailsModal({ event, onClose }: { event: any; onClose: () => void }) {
  const { role } = useUser();

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      // 👆 makes background semi-transparent and shows blurred map
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg relative border border-gray-200"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 text-xl font-semibold"
        >
          ×
        </button>

        {/* Event Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{event.name}</h2>
        <p className="text-gray-700 mb-1">{event.location}</p>
        <p className="text-gray-600 mb-4">{event.description}</p>

        <hr className="my-4" />

        {/* View on Map button */}
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          onClick={() => alert(`Zoom map to ${event.name}`)}
        >
          View on Map
        </button>

        {/* Role-based admin actions */}
        {role === "admin" && (
          <div className="mt-4 flex gap-3">
            <button className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700">
              Approve
            </button>
            <button className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700">
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
