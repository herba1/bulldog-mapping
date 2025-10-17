import { Feature, Polygon } from "geojson";

export interface Building {
  id: number;
  name: string;
  otherNames?: string[];
  metaTags: string[];
  geoJSON: Feature<Polygon>;
  eventIDs: number[];
  hoursOpen?: string;
  daysOpen?: string;
  description?: string;
  address?: string;
  website?: string;
  imageURLs: string[];

  //  possible to add later
  floors?: number;
  rooms?: string[];
  // comments?: Comment[];
}

export interface Event {
  id: number;
  name: string;
  otherNames: string[];
  metaTags: string[];
  // hide non approved
  isApproved: boolean;
  markerCords?: [number, number];
  // buildings associated with event
  buildingIDs: number[];
  datePosted?: string;
  creatorId: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  isCampusAdmin: boolean;
}

// {
//   "type": "Feature",
//   "properties": {},
//   "geometry": {
//     "coordinates": [
//       [
//         [
//           -119.74476906768533,
//           36.81271056420255
//         ],
//         [
//           -119.7449587859498,
//           36.81271629583105
//         ]
//       ]
//     ],
//     "type": "Polygon"
//   }
// }
