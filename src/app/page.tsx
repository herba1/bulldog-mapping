import { getBuildings, getEvents } from "@/data";
import Map2 from "./components/Map2";

export default async function Home() {
  const buildingData = getBuildings();
  const eventData = getEvents();
  const [buildings, events] = await Promise.all([buildingData, eventData]);
  console.log(buildings);
  console.log(events);

  return (
    <div className="h-lvh relative w-full">
      <Map2 events={events}></Map2>
    </div>
  );
}
