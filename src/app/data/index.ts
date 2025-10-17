import { Building, Event } from "@/types";

// Mock Buildings
export const mockBuildings: Building[] = [
  {
    id: 1,
    name: "Henry Madden Library",
    otherNames: ["The Library", "Madden Library"],
    metaTags: ["library", "study", "books", "quiet"],
    geoJSON: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-119.74476906768533, 36.81271056420255],
            [-119.7449587859498, 36.81271629583105],
            [-119.74495, 36.81250],
            [-119.74476, 36.81250],
            [-119.74476906768533, 36.81271056420255],
          ],
        ],
      },
    },
    eventIDs: [2],
    hoursOpen: "7:00 AM - 12:00 AM",
    daysOpen: "Monday - Sunday",
    description:
      "The main library on campus with study spaces, computer labs, and extensive book collections.",
    address: "5200 N Barton Ave, Fresno, CA 93740",
    website: "https://library.fresno.edu",
    imageURLs: [
      "https://example.com/library1.jpg",
      "https://example.com/library2.jpg",
    ],
    floors: 5,
    rooms: ["Study Room A", "Computer Lab", "Group Study Room"],
  },
  {
    id: 2,
    name: "Student Union",
    otherNames: ["USU", "The Union"],
    metaTags: ["food", "events", "dining", "social"],
    geoJSON: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-119.74650, 36.81300],
            [-119.74670, 36.81300],
            [-119.74670, 36.81280],
            [-119.74650, 36.81280],
            [-119.74650, 36.81300],
          ],
        ],
      },
    },
    eventIDs: [1],
    hoursOpen: "8:00 AM - 10:00 PM",
    daysOpen: "Monday - Saturday",
    description:
      "Hub for student activities featuring restaurants, game room, and event spaces.",
    address: "5244 N Jackson Ave, Fresno, CA 93740",
    website: "https://union.fresno.edu",
    imageURLs: ["https://example.com/union1.jpg"],
    floors: 2,
    rooms: ["Food Court", "Game Room", "Meeting Rooms"],
  },
  {
    id: 3,
    name: "Science 1 Building",
    otherNames: ["S1", "Science Building"],
    metaTags: ["science", "lab", "classroom", "stem"],
    geoJSON: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-119.74800, 36.81350],
            [-119.74820, 36.81350],
            [-119.74820, 36.81330],
            [-119.74800, 36.81330],
            [-119.74800, 36.81350],
          ],
        ],
      },
    },
    eventIDs: [],
    hoursOpen: "7:00 AM - 9:00 PM",
    daysOpen: "Monday - Friday",
    description:
      "Science classrooms and research labs for biology, chemistry, and physics.",
    address: "2555 E San Ramon Ave, Fresno, CA 93740",
    website: "https://science.fresno.edu",
    imageURLs: ["https://example.com/science1.jpg"],
    floors: 3,
    rooms: ["Lab 101", "Lab 102", "Lecture Hall 201"],
  },
];

// Mock Events
export const mockEvents: Event[] = [
  {
    id: 1,
    name: "Career Fair 2025",
    otherNames: ["Job Fair", "Career Expo"],
    metaTags: ["career", "jobs", "networking", "professional"],
    isApproved: true,
    markerCords: [-119.74660, 36.81290],
    buildingIDs: [2],
    datePosted: "2025-01-15",
    creatorId: 101,
  },
  {
    id: 2,
    name: "Study Night - Finals Week",
    otherNames: ["Finals Study Session", "Late Night Study"],
    metaTags: ["study", "finals", "academic", "tutoring"],
    isApproved: true,
    markerCords: [-119.74486, 36.81260],
    buildingIDs: [1],
    datePosted: "2025-05-01",
    creatorId: 102,
  },
];
