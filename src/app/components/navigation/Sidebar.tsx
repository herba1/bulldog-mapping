"use client";

import { useSidebar } from "@/context/SidebarContext";
import { useMapContext } from "@/context/MapContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import BuildingCard from "../sidebar/BuildingCard";
import EventCard from "../sidebar/EventCard";
import SearchBar from "../SearchBar";
import EventCreator from "../EventCreator";
import EventList from "../EventList";
import ScheduleUpload from "../schedule/ScheduleUpload";
import ConstructionZoneManager from "../construction/ConstructionZoneManager";
import ChatBot from "../chat/ChatBot";
import { User } from "@supabase/supabase-js";
import { SavedRoute } from "@/types/savedRoute";
import Image from "next/image";

type SidebarProps = {
  user: User | null;
  isAdmin: boolean;
  savedRoutes: SavedRoute[];
};

export default function Sidebar({ user, isAdmin, savedRoutes }: SidebarProps) {
  const { isOpen, setIsOpen, view, setView } = useSidebar();
  const { mapPointerEvents } = useMapContext();
  const isDropPinMode = mapPointerEvents === "dropPin";

  return (
    <aside
      className={`absolute p-0 mt-19 sm:mt-0 h-[calc(100dvh-78px)] sm:py-4 sm:pl-4 sm:top-0 transition-transform duration-300 ease-out-3 w-full sm:w-fit z-40 left-0 sm:h-full top-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <button
        disabled={isDropPinMode}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        className={`hidden slide-in-left button-depth z-50 pointer-events-auto sm:block !absolute hover:scale-105 active:scale-95 transition-[transform_opacity] duration-150 ease-out-2 overflow-clip top-2/4 w-fit h-fit left-full bg-highlight hover:bg-highlight-hover border-1 rounded-tr-md rounded br-md border-highlight-hover ${isDropPinMode ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}
      >
        <span className=" text-white opacity-100 grid items-center w-7 h-10 justify-center grid-cols-1 grid-rows-1 ">
          <ChevronRight
            className={` transition-[transform_filter] duration-200 ease-out-2 ${
              isOpen ? " blur-xs opacity-0" : " blur-none opacity-100"
            } inline-block w-full h-full col-start-1 row-start-1`}
          ></ChevronRight>
          <ChevronLeft
            className={` transition-[transform_filter] duration-200 ease-out-2 ${
              !isOpen ? " blur-xs opacity-0" : " blur-none opacity-100"
            } inline-block w-full h-full col-start-1 row-start-1`}
          ></ChevronLeft>
        </span>
      </button>
      <menu
        className={`bg-white p-4 rounded-2xl overflow-y-auto sm:rounded-xl ${
          isOpen ? "w-full" : "pointer-events-none"
        } overflow-clip w-[calc(100%-2rem)] sm:w-sm h-[calc(100%-1rem)] sm:h-full border border-neutral-200 z-20 relative`}
      >
        {/* Background Logo - hidden on eventCreator, eventList, and schedule views */}
        {view !== "eventCreator" && view !== "eventList" && view !== "schedule" && view !== "chatbot" && (
          <div className="absolute select-none pointer-events-none inset-0 flex items-center justify-center z-0 mix-blend-hard-light opacity-5">
            <Image
              src="/logo.png"
              alt=""
              width={300}
              height={300}
              className="object-contain"
            />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 h-full">
          {view === "building" && <BuildingCard></BuildingCard>}
          {view === "event" && <EventCard></EventCard>}
          {view === "search" && <SearchBar></SearchBar>}
          {view === "eventCreator" && <EventCreator></EventCreator>}
          {view === "eventList" && <EventList user={user} isAdmin={isAdmin}></EventList>}
          {view === "schedule" && <ScheduleUpload savedRoutes={savedRoutes} user={user} />}
          {view === "constructionZones" && <ConstructionZoneManager isAdmin={isAdmin} />}
          {view === "chatbot" && <ChatBot />}
        </div>
      </menu>
    </aside>
  );
}
