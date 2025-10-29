"use client";

export default function BuildingInfo({
  building,
  onClose,
}: {
  building: any;
  onClose: () => void;
}) {
  if (!building) return null;

  // ✅ Get the building name from the first key in properties
  const propertyKeys = Object.keys(building);
  const name =
    propertyKeys.length > 0
      ? propertyKeys[0] // first key (e.g. "Homan Hall")
      : "Unnamed Building";

  return (
    <div className="fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-[380px] bg-white border-r border-gray-300 shadow-lg p-5 overflow-y-auto z-30 animate-slide-in">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-blue-700">{name}</h1>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl font-semibold"
        >
          ×
        </button>
      </div>

      {/* Optional: show any remaining data */}
      <div className="text-gray-700">
        {Object.entries(building).length > 1 && (
          <div className="mt-3">
            <h2 className="text-md font-semibold text-gray-800 mb-1">
              More Info
            </h2>
            <ul className="text-sm text-gray-600 space-y-1">
              {Object.entries(building).map(([key, value]) => {
                // Skip the key we already used for the name
                if (key === name) return null;
                if (typeof value === "object") return null;

                return (
                  <li key={key}>
                    <span className="font-medium capitalize">{key}:</span>{" "}
                    {String(value)}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
