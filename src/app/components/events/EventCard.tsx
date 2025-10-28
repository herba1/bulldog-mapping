"use client";
import { useUser } from "../../context/UserContext";

export default function EventCard({ event, onClick }: { event: any; onClick: () => void }) {
  const { role } = useUser();

  return (
    <div
      onClick={onClick}
      className="border rounded-xl p-4 shadow hover:shadow-md transition cursor-pointer bg-white"
    >
      <h2 className="text-lg font-semibold">{event.name}</h2>
      <p>{event.date} • {event.time}</p>
      <p className="text-sm text-gray-600">{event.location}</p>
    </div>
  );
}
