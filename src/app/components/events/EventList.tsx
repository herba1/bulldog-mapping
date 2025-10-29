"use client";
import { mockEvents } from "../../data";
import { useSelectionStore } from "../../store/useSelectionStore";
import { useUser } from "../../context/UserContext";

export default function EventList() {
  const { role } = useUser(); // ensure role is defined here
  const { setSelectedEvent } = useSelectionStore();

  return (
    <div className="p-5 overflow-y-auto h-full bg-gray-50">
      <h1 className="text-2xl font-extrabold text-gray-800 mb-5">
        Campus Events
      </h1>

      {role !== "guest" && (
        <button
          className="mb-5 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full shadow-md"
          onClick={() => alert("Open Create Event Modal")}
        >
          + Create Event
        </button>
      )}

      <div className="space-y-4">
        {mockEvents.map((event) => (
          <div
            key={event.id}
            onClick={() => setSelectedEvent(event)}
            className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm cursor-pointer transition hover:shadow-md hover:border-blue-400"
          >
            <h2 className="font-semibold text-lg text-gray-900">
              {event.name}
            </h2>
            <p className="text-sm text-gray-700">{event.location}</p>
            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
