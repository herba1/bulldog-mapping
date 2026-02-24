import Groq from "groq-sdk";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

const BASE_SYSTEM_PROMPT = `You are a helpful campus assistant for California State University, Fresno (Fresno State). You help students, faculty, and visitors with questions about the campus.

You should be knowledgeable about:
- Building locations and what departments/services are in them
- Parking lots and parking permits
- Campus dining options
- Library (Henry Madden Library) hours and services
- Student services (financial aid, admissions, registration)
- Campus recreation and athletics
- General campus navigation and directions
- Campus events and student life
- Academic resources and tutoring

IMPORTANT: When describing building locations, ONLY use the actual building data provided below. Do NOT guess or make up where buildings are relative to each other. Use the "Nearby" field to accurately describe what is close to each building. If you don't have location data for a building, say so.

Keep responses concise and helpful. If you don't know specific details (like exact hours that may change), say so and suggest the student check the Fresno State website or call the relevant office. Stay on topic - only answer questions related to Fresno State campus and student life.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function getPolygonCenter(geojson: { geometry: { coordinates: number[][][] } }): [number, number] {
  const coords = geojson.geometry.coordinates[0];
  let sumLng = 0, sumLat = 0;
  for (const [lng, lat] of coords) {
    sumLng += lng;
    sumLat += lat;
  }
  return [sumLng / coords.length, sumLat / coords.length];
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

let buildingContextCache: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getBuildingContext(): Promise<string> {
  if (buildingContextCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return buildingContextCache;
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
    const [{ data: buildings }, { data: polygons }] = await Promise.all([
      supabase.from("building").select("*"),
      supabase.from("building_polygons").select("id, geojson, building_id"),
    ]);

    if (!buildings || !polygons) return "";

    const centerMap = new Map<string, [number, number]>();
    for (const p of polygons) {
      if (p.geojson && p.building_id) {
        const geojson = typeof p.geojson === "string" ? JSON.parse(p.geojson) : p.geojson;
        if (geojson?.geometry?.coordinates) {
          centerMap.set(p.building_id, getPolygonCenter(geojson));
        }
      }
    }

    // Only include non-parking buildings for compact context
    const buildingInfos = buildings
      .filter((b) => centerMap.has(b.id) && !b.name.toLowerCase().includes("parking"))
      .map((b) => {
        const [lng, lat] = centerMap.get(b.id)!;
        return { id: b.id, name: b.name, lng, lat };
      });

    const lines: string[] = [];
    for (const b of buildingInfos) {
      const nearby = buildingInfos
        .filter((other) => other.id !== b.id)
        .map((other) => ({ name: other.name, dist: haversine(b.lat, b.lng, other.lat, other.lng) }))
        .sort((a, c) => a.dist - c.dist)
        .slice(0, 3);

      const nearbyStr = nearby.map((n) => `${n.name}(${Math.round(n.dist)}m)`).join(", ");
      lines.push(`${b.name} -> near: ${nearbyStr}`);
    }

    buildingContextCache = `\n\nBUILDING LOCATIONS (name -> nearest buildings with distance in meters):\n${lines.join("\n")}`;
    cacheTimestamp = Date.now();
    return buildingContextCache;
  } catch (error) {
    console.error("Failed to load building data:", error);
    return "";
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = (await request.json()) as { messages: ChatMessage[] };

    if (!messages || messages.length === 0) {
      return new Response("Messages are required", { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return new Response("Groq API key not configured", { status: 500 });
    }

    const buildingContext = await getBuildingContext();
    const systemPrompt = BASE_SYSTEM_PROMPT + buildingContext;

    const stream = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
      ],
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Failed to generate response", { status: 500 });
  }
}
