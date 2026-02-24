"use client";

import { ConstructionZone } from "@/types/constructionZone";
import ConstructionZoneCard from "./ConstructionZoneCard";

type Props = {
  zones: ConstructionZone[];
  onEdit: (zone: ConstructionZone) => void;
  isAdmin?: boolean;
};

export default function ConstructionZoneList({ zones, onEdit, isAdmin = false }: Props) {
  const pendingZones = zones.filter((z) => !z.isApproved);
  const activeZones = zones.filter((z) => z.isApproved && z.isActive);
  const inactiveZones = zones.filter((z) => z.isApproved && !z.isActive);

  return (
    <div className="flex-1 overflow-y-auto">
      {pendingZones.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full"></span>
            <span className="font-semibold text-sm text-yellow-600">
              Pending Approval
            </span>
          </div>
          <ul className="flex flex-col gap-2">
            {pendingZones.map((zone) => (
              <li key={zone.id}>
                <ConstructionZoneCard zone={zone} onEdit={onEdit} isAdmin={isAdmin} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeZones.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
            <span className="font-semibold text-sm text-red-600">Active</span>
          </div>
          <ul className="flex flex-col gap-2">
            {activeZones.map((zone) => (
              <li key={zone.id}>
                <ConstructionZoneCard zone={zone} onEdit={onEdit} isAdmin={isAdmin} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {inactiveZones.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-2 h-2 bg-gray-400 rounded-full"></span>
            <span className="font-semibold text-sm text-gray-600">
              Inactive
            </span>
          </div>
          <ul className="flex flex-col gap-2">
            {inactiveZones.map((zone) => (
              <li key={zone.id}>
                <ConstructionZoneCard zone={zone} onEdit={onEdit} isAdmin={isAdmin} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {zones.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          <p className="mb-2">No construction zones</p>
          <p className="text-xs">
            Click the + button above to create your first zone
          </p>
        </div>
      )}
    </div>
  );
}
