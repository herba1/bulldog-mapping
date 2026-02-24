/**
 * Fresno State parking lot locations
 * Coordinates are approximate center points of each parking area
 */

export interface ParkingLot {
  id: string;
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  description?: string;
}

export const FRESNO_STATE_PARKING_LOTS: ParkingLot[] = [
  {
    id: "p1",
    name: "Parking Lot P1 (West)",
    coordinates: [-119.7505, 36.8140], // West side near Cedar Ave
    description: "West side of campus near Cedar Ave",
  },
  {
    id: "p2",
    name: "Parking Lot P2 (North)",
    coordinates: [-119.7465, 36.8165], // North side near Barstow
    description: "North side near Barstow Ave",
  },
  {
    id: "p3",
    name: "Parking Lot P3 (East)",
    coordinates: [-119.7415, 36.8145], // East side
    description: "East side of campus",
  },
  {
    id: "p4",
    name: "Parking Lot P4 (South)",
    coordinates: [-119.7460, 36.8105], // South side near Shaw
    description: "South side near Shaw Ave",
  },
  {
    id: "p5",
    name: "Parking Lot P5 (Student Union)",
    coordinates: [-119.7455, 36.8135], // Near Student Union
    description: "Near University Student Union",
  },
  {
    id: "p6",
    name: "Parking Lot P6 (Save Mart Center)",
    coordinates: [-119.7425, 36.8160], // Near Save Mart Center
    description: "Near Save Mart Center",
  },
  {
    id: "ps1",
    name: "Parking Structure PS1",
    coordinates: [-119.7480, 36.8150], // Multi-level structure
    description: "Multi-level parking structure",
  },
  {
    id: "ps2",
    name: "Parking Structure PS2",
    coordinates: [-119.7435, 36.8130], // Multi-level structure
    description: "Multi-level parking structure",
  },
];

/**
 * Find a parking lot by name (case-insensitive, partial match)
 */
export function findParkingLot(name: string): ParkingLot | null {
  const normalized = name.toLowerCase();
  return (
    FRESNO_STATE_PARKING_LOTS.find((lot) =>
      lot.name.toLowerCase().includes(normalized)
    ) || null
  );
}

/**
 * Get all parking lot names
 */
export function getParkingLotNames(): string[] {
  return FRESNO_STATE_PARKING_LOTS.map((lot) => lot.name);
}
