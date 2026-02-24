import {
  getBuildingPolygons,
  getBuildings,
  getEvents,
  getUserAdminStatus,
  getParkingLots,
  getParkingPolygons,
  getActiveConstructionZones,
  getAllConstructionZones,
  getSavedRoutes,
} from "@/data";
import Map from "./components/Map";
import { MapProvider } from "@/context/MapContext";
import MapTest from "./components/MapTest";
import { SidebarProvider } from "@/context/SidebarContext";
import Sidebar from "./components/navigation/Sidebar";
import Navbar from "./components/navigation/Navbar";
import { createClient } from "@/utils/supabase/server";
import Image from "next/image";
import { Loader, LoaderCircle } from "lucide-react";

export default async function Home() {
  const adminStatus = await getUserAdminStatus();
  const supabase = await createClient();
  const userData = supabase.auth.getUser();
  const buildingData = getBuildings();
  const eventData = getEvents();
  const buildingPolygonData = getBuildingPolygons();
  const parkingData = getParkingLots();
  const parkingPolygonData = getParkingPolygons();
  // Load all zones for admins, active zones for everyone else
  const constructionZoneData = adminStatus
    ? getAllConstructionZones()
    : getActiveConstructionZones();
  const savedRoutesData = getSavedRoutes();
  const [
    buildings,
    events,
    buildingPolygons,
    parkingLots,
    parkingPolygons,
    constructionZones,
    {
      data: { user },
    },
    savedRoutes,
  ] = await Promise.all([
    buildingData,
    eventData,
    buildingPolygonData,
    parkingData,
    parkingPolygonData,
    constructionZoneData,
    userData,
    savedRoutesData,
  ]);
  return (
    <div className="max-h-dvh h-dvh relative w-full">
      <MapProvider
        buildings={buildings}
        events={events}
        buildingPolygons={buildingPolygons}
        parkingLots={parkingLots}
        parkingPolygons={parkingPolygons}
        constructionZones={constructionZones}
      >
        <SidebarProvider>
          <Navbar user={user} isAdmin={adminStatus}></Navbar>
          <main className="h-full bg-neutral-200 overflow-clip w-full relative">
            <div className="absolute z-0 animate-loader-in pointer-events-none w-10 right-0 bottom-0 m-4 aspect-square ">
              <Loader className="w-full h-full text-neutral-500 m-2 animate-loader-spin" />
            </div>
            <Sidebar user={user} isAdmin={adminStatus} savedRoutes={savedRoutes}></Sidebar>
            <MapTest></MapTest>
          </main>
        </SidebarProvider>
        {/* <Map></Map> */}
      </MapProvider>
    </div>
  );
}
