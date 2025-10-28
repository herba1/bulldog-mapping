"use client";
import { useState } from "react";
import EventList from "./events/EventList";

export default function TopNav() {
  const [showEvents, setShowEvents] = useState(false);

  return (
    <>
      {/* Top navigation bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-300 shadow-sm z-40 flex items-center justify-between px-6">
        <h1 className="text-xl font-bold text-blue-700">Bulldog Mapping</h1>

        <div className="flex space-x-4">
          {/* Future features can go here */}
          <button
            onClick={() => alert('Map feature active')}
            className="px-3 py-1 text-gray-700 hover:text-blue-600"
          >
            Map
          </button>

          <button
            onClick={() => setShowEvents(!showEvents)}
            className={`px-3 py-1 rounded ${
              showEvents ? "bg-blue-600 text-white" : "text-gray-700 hover:text-blue-600"
            }`}
          >
            Events
          </button>

          <button
            onClick={() => alert('Schedule feature coming soon')}
            className="px-3 py-1 text-gray-700 hover:text-blue-600"
          >
            Schedule
          </button>

          <button
            onClick={() => alert('Settings feature coming soon')}
            className="px-3 py-1 text-gray-700 hover:text-blue-600"
          >
            Settings
          </button>
        </div>
      </div>

      {/* Slide-in Events sidebar */}
      {showEvents && (
        <div className="fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-[380px] bg-white border-r border-gray-300 z-30 shadow-lg animate-slide-in">
          <EventList />
        </div>
      )}
    </>
  );
}
