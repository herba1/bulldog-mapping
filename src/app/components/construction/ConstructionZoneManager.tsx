"use client";

import { useState } from "react";
import { useMapContext } from "@/context/MapContext";
import { Construction, Plus } from "lucide-react";
import ConstructionZoneList from "./ConstructionZoneList";
import ConstructionZoneForm from "./ConstructionZoneForm";
import { ConstructionZone } from "@/types/constructionZone";

type Props = {
  isAdmin: boolean;
};

export default function ConstructionZoneManager({ isAdmin }: Props) {
  const { constructionZones } = useMapContext();
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editingZone, setEditingZone] = useState<ConstructionZone | null>(
    null
  );

  console.log("🔐 ConstructionZoneManager - isAdmin:", isAdmin);
  console.log("📍 Construction zones:", constructionZones);

  if (!isAdmin) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500">
          <Construction className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="font-semibold">Admin Access Required</p>
          <p className="text-sm mt-1">
            Only admins can manage construction zones
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Construction className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Construction Zones</h2>
        </div>
        {mode === "list" && (
          <button
            onClick={() => setMode("create")}
            className="button-depth group p-2 rounded-lg border border-transparent hover:border-highlight-hover hover:bg-highlight transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95"
            aria-label="Create new zone"
          >
            <Plus className="w-5 h-5 group-hover:text-white transition-colors" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {mode === "list" && (
          <ConstructionZoneList
            zones={constructionZones}
            onEdit={(zone) => {
              setEditingZone(zone);
              setMode("edit");
            }}
            isAdmin={isAdmin}
          />
        )}

        {(mode === "create" || mode === "edit") && (
          <ConstructionZoneForm
            zone={editingZone}
            onCancel={() => {
              setMode("list");
              setEditingZone(null);
            }}
            onSuccess={() => {
              setMode("list");
              setEditingZone(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
