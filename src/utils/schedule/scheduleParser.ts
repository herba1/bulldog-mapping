import { OCRResult, ParsedClass, ParsedSchedule } from "@/types/schedule";

// Known Fresno State building names (for better matching)
const FRESNO_STATE_BUILDINGS = [
  "Professional Human Services",
  "Professional Human Svcs",
  "Prof Human Services",
  "Prof Human Srvce",
  "Prof Human Srvce Bldg",
  "McKee-Fisk Bldg",
  "McKee-Fisk Building",
  "McKee-Fisk",
  "McKee Fisk",
  "McKeeFisk",
  "Family & Food Sciences Bldg",
  "Family & Food Sciences Building",
  "Family & Food Sciences",
  "Family and Food Sciences",
  "Family Food & Sci Bldg",
  "Family Food & Sci",
  "Food Sciences",
  "Grosse Industrial Technology B",
  "Grosse Industrial Technology",
  "Industrial Technology",
  "Industrial Tech Bldg",
  "Industrial Tech",
  "Grosse Industrial Tech",
  "Science 1",
  "Science 2",
  "Science I",
  "Science II",
  "Sci 1",
  "Sci 2",
  "Engineering East",
  "Engineering West",
  "Engineering E",
  "Engineering W",
  "Eng East",
  "Eng West",
  "Peters Business Building",
  "Peters Business Bldg",
  "Peters Business",
  "Peters Bldg",
  "Kremen Education",
  "Kremen Education Building",
  "Education Building",
  "Education Bldg",
  "Henry Madden Library",
  "Madden Library",
  "Library",
  "University Student Union",
  "Student Union",
  "USU",
  "Satellite Student Union",
  "Satellite Union",
  "SSU",
  "North Gym",
  "South Gym",
  "Music Building",
  "Music Bldg",
  "Speech Arts",
  "Thomas Building",
  "Thomas Bldg",
  "McLane Hall",
  "Social Sciences",
  "Social Science",
  "Agricultural Sciences",
  "Ag Sciences",
  "Conley Art Building",
  "Conley Art",
  "Art Building",
  "University Center",
  "Save Mart Center",
  "Bulldog Stadium",
  // Additional buildings that might appear
  "Lab School",
  "Music A",
  "Music B",
  "Theater Arts",
  "Joyal Admin",
  "Joyal Administration",
  "Kennel Bookstore",
];

// Time patterns
const TIME_PATTERNS = [
  // "8:00AM - 9:15AM" or "8:00 AM - 9:15 AM" (with or without space)
  /(\d{1,2}:\d{2}\s*(?:AM|PM))\s*[-–—]\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/gi,
  // 24-hour: "14:00-15:30"
  /(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})(?!\s*(?:AM|PM))/g,
];

// Day patterns
const DAY_FULL_PATTERN =
  /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/gi;
const DAY_SHORT_PATTERN = /\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/gi;
const DAY_COMPRESSED_PATTERN = /\b([MTWRF]{1,5})\b/g;
// MyFresnoState format: "MoWeFr", "TuTh", "MoTuWeThFr"
const DAY_MYFRESNOSTATE_PATTERN = /\b((?:Mo|Tu|We|Th|Fr|Sa|Su)+)\b/g;

// Course code patterns: "CSCI 126 - 02", "CSCI 164 - 01", "ASAM 20 - 05"
const COURSE_CODE_PATTERN = /\b([A-Z]{2,4})\s*(\d{1,3}[A-Z]?)(?:\s*[-–]\s*\d+)?\b/g;

// Room number pattern (just a number, possibly with letter)
const ROOM_NUMBER_PATTERN = /^(\d{1,4}[A-Z]?)$/;

// Building with room pattern (e.g., "McKee-Fisk Bldg 123" or "Science 1 Room 205")
const BUILDING_ROOM_PATTERN = /^(.+?)\s+(?:Room\s*)?(\d{1,4}[A-Z]?)$/i;

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function extractTimes(
  text: string
): { startTime: string; endTime: string } | null {
  for (const pattern of TIME_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      // Normalize: ensure space before AM/PM
      const normalizeTime = (t: string) => {
        return t.replace(/(\d)(AM|PM)/gi, "$1 $2").toUpperCase();
      };
      return {
        startTime: normalizeTime(match[1].trim()),
        endTime: normalizeTime(match[2].trim()),
      };
    }
  }
  return null;
}

function extractDays(text: string): string[] {
  // Try full day names
  const fullMatches = text.match(DAY_FULL_PATTERN);
  if (fullMatches) {
    return fullMatches.map((d) => d.substring(0, 3));
  }

  // Try short day names
  const shortMatches = text.match(DAY_SHORT_PATTERN);
  if (shortMatches) {
    return shortMatches;
  }

  // Try MyFresnoState format (MoWeFr, TuTh, MoTuWeThFr)
  const fresnoMatch = text.match(DAY_MYFRESNOSTATE_PATTERN);
  if (fresnoMatch) {
    const fresnoStr = fresnoMatch[0];
    const dayMap: Record<string, string> = {
      Mo: "Mon",
      Tu: "Tue",
      We: "Wed",
      Th: "Thu",
      Fr: "Fri",
      Sa: "Sat",
      Su: "Sun",
    };
    const days: string[] = [];
    // Extract two-letter day codes
    for (let i = 0; i < fresnoStr.length; i += 2) {
      const twoChar = fresnoStr.substring(i, i + 2);
      if (dayMap[twoChar]) {
        days.push(dayMap[twoChar]);
      }
    }
    if (days.length > 0) {
      return days;
    }
  }

  // Try compressed format (MWF, TR)
  const compressedMatch = text.match(DAY_COMPRESSED_PATTERN);
  if (compressedMatch) {
    const compressed = compressedMatch[0];
    const dayMap: Record<string, string> = {
      M: "Mon",
      T: "Tue",
      W: "Wed",
      R: "Thu",
      F: "Fri",
    };
    const days: string[] = [];
    for (const char of compressed) {
      if (dayMap[char]) {
        days.push(dayMap[char]);
      }
    }
    return days;
  }

  return [];
}

function extractCourseCode(text: string): string | null {
  COURSE_CODE_PATTERN.lastIndex = 0;
  const match = COURSE_CODE_PATTERN.exec(text);
  if (match) {
    return `${match[1]} ${match[2]}`;
  }
  return null;
}

function isKnownBuilding(text: string): string | null {
  const normalized = text.trim().toLowerCase();
  for (const building of FRESNO_STATE_BUILDINGS) {
    if (normalized.includes(building.toLowerCase()) ||
        building.toLowerCase().includes(normalized)) {
      return text.trim();
    }
  }
  return null;
}

function looksLikeBuilding(text: string): boolean {
  const trimmed = text.trim();
  // Check if it looks like a building name:
  // - Contains "Bldg", "Building", "Hall", "Center", "Library", "Sciences", etc.
  // - Or is a known building name
  // - Or is multiple capitalized words
  if (isKnownBuilding(trimmed)) return true;

  const buildingKeywords = /\b(Bldg|Building|Hall|Center|Library|Sciences?|Technology|Gym|Union|Stadium|East|West|North|South|Education|Business|Engineering|Industrial|Arts?|Music|Speech|Social|Agricultural|Madden|Peters|Kremen|Grosse|McKee|Fisk|McLane|Thomas|Conley|Satellite)\b/i;
  if (buildingKeywords.test(trimmed)) return true;

  // Check for "Science 1", "Science 2" pattern
  if (/^Science\s*[12IiIl]/i.test(trimmed)) return true;

  // Multiple words that start with capitals (like "Professional Human Services")
  const words = trimmed.split(/\s+/);
  if (words.length >= 2 && words.every(w => /^[A-Z]/.test(w))) {
    return true;
  }

  // Single capitalized word that's long enough (might be a building name)
  if (words.length === 1 && /^[A-Z]/.test(trimmed) && trimmed.length > 5) {
    return true;
  }

  return false;
}

function isRoomNumber(text: string): boolean {
  return ROOM_NUMBER_PATTERN.test(text.trim());
}

function isInstructorLine(text: string): boolean {
  return /instructor/i.test(text);
}

function isClassType(text: string): boolean {
  return /^(Lecture|Laboratory|Lab|Seminar|Discussion|Activity)$/i.test(text.trim());
}

// Parse Fresno State schedule format (block format)
function parseFresnoStateFormat(lines: string[]): ParsedSchedule {
  const classes: ParsedClass[] = [];
  const parseErrors: string[] = [];

  let currentClass: Partial<ParsedClass> | null = null;
  let expectingRoom = false;

  console.log("=== Parser Debug ===");
  console.log("Total lines to parse:", lines.length);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Debug each line
    const lineInfo = {
      lineNum: i,
      text: line,
      isCourseCode: !!extractCourseCode(line),
      hasTime: !!extractTimes(line),
      isBuilding: looksLikeBuilding(line),
      isRoom: isRoomNumber(line),
      days: extractDays(line),
    };
    console.log(`Line ${i}:`, lineInfo);

    // Skip instructor lines and class type lines
    if (isInstructorLine(line) || isClassType(line)) {
      console.log(`  -> Skipped (instructor/class type)`);
      continue;
    }

    // Check for course code (starts a new class block)
    const courseCode = extractCourseCode(line);
    if (courseCode && !extractTimes(line)) {
      // Save previous class if complete
      if (currentClass && currentClass.startTime && currentClass.buildingRaw) {
        classes.push({
          id: generateId(),
          courseCode: currentClass.courseCode,
          courseName: currentClass.courseName,
          daysOfWeek: currentClass.daysOfWeek || [],
          startTime: currentClass.startTime,
          endTime: currentClass.endTime || "",
          buildingRaw: currentClass.buildingRaw,
          roomRaw: currentClass.roomRaw || "",
          rawText: currentClass.rawText || "",
        });
      }

      // Start new class
      currentClass = {
        courseCode,
        rawText: line,
      };
      expectingRoom = false;
      continue;
    }

    // Check for time
    const times = extractTimes(line);
    if (times) {
      if (!currentClass) {
        currentClass = { rawText: line };
      }
      currentClass.startTime = times.startTime;
      currentClass.endTime = times.endTime;
      currentClass.rawText += " " + line;
      continue;
    }

    // Check for building name (possibly with room number on same line)
    if (looksLikeBuilding(line) && !expectingRoom) {
      if (currentClass) {
        // Check if line contains both building and room (e.g., "McKee-Fisk Bldg 123")
        const buildingRoomMatch = BUILDING_ROOM_PATTERN.exec(line);
        if (buildingRoomMatch && looksLikeBuilding(buildingRoomMatch[1])) {
          currentClass.buildingRaw = buildingRoomMatch[1].trim();
          currentClass.roomRaw = buildingRoomMatch[2];
          currentClass.rawText += " " + line;
          expectingRoom = false;
          console.log(`  -> Building+Room: "${currentClass.buildingRaw}" room "${currentClass.roomRaw}"`);
        } else {
          currentClass.buildingRaw = line;
          currentClass.rawText += " " + line;
          expectingRoom = true; // Next line might be room number
          console.log(`  -> Building: "${line}"`);
        }
      }
      continue;
    }

    // Check for room number (usually follows building name)
    if (isRoomNumber(line) && currentClass) {
      currentClass.roomRaw = line;
      currentClass.rawText += " " + line;
      expectingRoom = false;
      continue;
    }

    // If we're expecting room and got text, it might be additional building info
    if (expectingRoom && currentClass) {
      // Could be room number with letter or additional info
      if (/^\d/.test(line)) {
        currentClass.roomRaw = line.split(/\s/)[0]; // Take first part as room
      }
      expectingRoom = false;
    }

    // Check for days
    const days = extractDays(line);
    if (days.length > 0 && currentClass) {
      currentClass.daysOfWeek = days;
    }

    // Otherwise, if we have a current class, might be course name
    if (currentClass && !currentClass.courseName &&
        !times && !isRoomNumber(line) && !looksLikeBuilding(line)) {
      currentClass.courseName = line;
    }
  }

  // Don't forget the last class
  if (currentClass && currentClass.startTime && currentClass.buildingRaw) {
    classes.push({
      id: generateId(),
      courseCode: currentClass.courseCode,
      courseName: currentClass.courseName,
      daysOfWeek: currentClass.daysOfWeek || [],
      startTime: currentClass.startTime,
      endTime: currentClass.endTime || "",
      buildingRaw: currentClass.buildingRaw,
      roomRaw: currentClass.roomRaw || "",
      rawText: currentClass.rawText || "",
    });
  }

  return {
    classes,
    parseErrors,
    rawText: lines.join("\n"),
  };
}

// Legacy line-by-line parser
function parseLineByLine(lines: string[]): ParsedSchedule {
  const classes: ParsedClass[] = [];
  const parseErrors: string[] = [];
  let currentClass: Partial<ParsedClass> | null = null;

  for (const line of lines) {
    const times = extractTimes(line);
    const days = extractDays(line);
    const courseCode = extractCourseCode(line);

    // If we found a time, this might be a new class entry
    if (times) {
      // Save previous class if complete
      if (currentClass && currentClass.startTime && currentClass.buildingRaw) {
        classes.push({
          id: generateId(),
          courseCode: currentClass.courseCode,
          courseName: currentClass.courseName,
          daysOfWeek: currentClass.daysOfWeek || [],
          startTime: currentClass.startTime,
          endTime: currentClass.endTime || "",
          buildingRaw: currentClass.buildingRaw,
          roomRaw: currentClass.roomRaw || "",
          rawText: currentClass.rawText || "",
        });
      }

      // Start new class
      currentClass = {
        startTime: times.startTime,
        endTime: times.endTime,
        daysOfWeek: days.length > 0 ? days : undefined,
        rawText: line,
      };

      if (courseCode) {
        currentClass.courseCode = courseCode;
      }
    } else if (currentClass) {
      // Try to add info to current class
      if (days.length > 0 && !currentClass.daysOfWeek?.length) {
        currentClass.daysOfWeek = days;
      }

      if (looksLikeBuilding(line) && !currentClass.buildingRaw) {
        currentClass.buildingRaw = line.trim();
      } else if (isRoomNumber(line) && !currentClass.roomRaw) {
        currentClass.roomRaw = line.trim();
      }

      if (courseCode && !currentClass.courseCode) {
        currentClass.courseCode = courseCode;
      }

      currentClass.rawText += " " + line;
    }
  }

  // Don't forget the last class
  if (currentClass && currentClass.startTime && currentClass.buildingRaw) {
    classes.push({
      id: generateId(),
      courseCode: currentClass.courseCode,
      courseName: currentClass.courseName,
      daysOfWeek: currentClass.daysOfWeek || [],
      startTime: currentClass.startTime,
      endTime: currentClass.endTime || "",
      buildingRaw: currentClass.buildingRaw,
      roomRaw: currentClass.roomRaw || "",
      rawText: currentClass.rawText || "",
    });
  }

  return {
    classes,
    parseErrors,
    rawText: lines.join("\n"),
  };
}

// Try to parse a single line that might contain all class info (table row format)
function parseTableRow(line: string): Partial<ParsedClass> | null {
  const times = extractTimes(line);
  if (!times) return null;

  const result: Partial<ParsedClass> = {
    startTime: times.startTime,
    endTime: times.endTime,
    rawText: line,
  };

  // Extract course code
  const courseCode = extractCourseCode(line);
  if (courseCode) {
    result.courseCode = courseCode;
  }

  // Extract days
  const days = extractDays(line);
  if (days.length > 0) {
    result.daysOfWeek = days;
  }

  // Try to find building name in the line
  for (const building of FRESNO_STATE_BUILDINGS) {
    if (line.toLowerCase().includes(building.toLowerCase())) {
      result.buildingRaw = building;
      // Try to find room number after building name (handles "Rm 316", "Room 316", or just "316")
      const buildingIndex = line.toLowerCase().indexOf(building.toLowerCase());
      const afterBuilding = line.substring(buildingIndex + building.length);
      const roomMatch = afterBuilding.match(/\s*(?:Rm|Room)?\s*(\d{1,4}[A-Z]?)/i);
      if (roomMatch) {
        result.roomRaw = roomMatch[1];
      }
      break;
    }
  }

  // Also try to find "Bldg Rm XXX" pattern anywhere in line
  if (!result.buildingRaw) {
    const bldgRmPattern = /(.+?(?:Bldg|Building|Hall|Tech|Sciences?|Srvce))\s*(?:Rm|Room)?\s*(\d{1,4}[A-Z]?)/i;
    const bldgMatch = line.match(bldgRmPattern);
    if (bldgMatch) {
      result.buildingRaw = bldgMatch[1].trim();
      result.roomRaw = bldgMatch[2];
    }
  }

  return result;
}

// Parse table-based format (each row contains all class info)
function parseTableFormat(lines: string[]): ParsedSchedule {
  const classes: ParsedClass[] = [];
  const parseErrors: string[] = [];

  console.log("=== Table Parser Debug ===");

  for (const line of lines) {
    const parsed = parseTableRow(line);
    if (parsed && parsed.startTime) {
      console.log("Table row parsed:", parsed);
      // Only add if we have at least time (building can be matched later)
      classes.push({
        id: generateId(),
        courseCode: parsed.courseCode,
        courseName: parsed.courseName,
        daysOfWeek: parsed.daysOfWeek || [],
        startTime: parsed.startTime,
        endTime: parsed.endTime || "",
        buildingRaw: parsed.buildingRaw || "",
        roomRaw: parsed.roomRaw || "",
        rawText: parsed.rawText || line,
      });
    }
  }

  return {
    classes,
    parseErrors,
    rawText: lines.join("\n"),
  };
}

// Smart parser that extracts all building+room occurrences from the entire text
function parseSmartFormat(_lines: string[], fullText: string): ParsedSchedule {
  const classes: ParsedClass[] = [];
  const parseErrors: string[] = [];

  console.log("=== Smart Parser Debug ===");
  console.log("Full text (first 1500 chars):", fullText.substring(0, 1500));

  // Known building keywords to search for (case-insensitive)
  const buildingKeywords = [
    { keyword: "prof human", name: "Professional Human Services" },
    { keyword: "professional human", name: "Professional Human Services" },
    { keyword: "human srvce", name: "Professional Human Services" },
    { keyword: "human services", name: "Professional Human Services" },
    { keyword: "family food", name: "Family & Food Sciences" },
    { keyword: "food sci", name: "Family & Food Sciences" },
    { keyword: "industrial tech", name: "Grosse Industrial Technology" },
    { keyword: "grosse industrial", name: "Grosse Industrial Technology" },
    { keyword: "mckee-fisk", name: "McKee-Fisk" },
    { keyword: "mckee fisk", name: "McKee-Fisk" },
    { keyword: "mckeefisk", name: "McKee-Fisk" },
    { keyword: "mckee", name: "McKee-Fisk" },
    { keyword: "science 1", name: "Science 1" },
    { keyword: "science 2", name: "Science 2" },
    { keyword: "science i", name: "Science 1" },
    { keyword: "science ii", name: "Science 2" },
    { keyword: "engineering east", name: "Engineering East" },
    { keyword: "engineering west", name: "Engineering West" },
    { keyword: "peters business", name: "Peters Business" },
    { keyword: "kremen education", name: "Kremen Education" },
    { keyword: "mclane hall", name: "McLane Hall" },
    { keyword: "social science", name: "Social Sciences" },
    { keyword: "madden library", name: "Madden Library" },
    { keyword: "student union", name: "Student Union" },
    { keyword: "satellite student", name: "Satellite Student Union" },
  ];

  interface FoundClass {
    building: string;
    room: string;
    position: number;
  }

  const foundClasses: FoundClass[] = [];
  const textLower = fullText.toLowerCase();
  const usedPositions = new Set<number>();

  // Search for each building keyword in the text
  for (const { keyword, name } of buildingKeywords) {
    let searchPos = 0;
    while (true) {
      const pos = textLower.indexOf(keyword, searchPos);
      if (pos === -1) break;

      // Check if this position is already used (within 20 chars of another match)
      const isNearby = Array.from(usedPositions).some(p => Math.abs(p - pos) < 20);
      if (!isNearby) {
        usedPositions.add(pos);

        // Try to find room number after the building name
        const afterBuilding = fullText.substring(pos + keyword.length, pos + keyword.length + 30);
        const roomMatch = afterBuilding.match(/(?:Rm|Room|Bldg)?\s*(\d{1,4}[A-Z]?)/i);
        const room = roomMatch ? roomMatch[1] : "";

        foundClasses.push({
          building: name,
          room: room,
          position: pos,
        });
        console.log(`Found building: "${name}" room "${room || "N/A"}" at position ${pos}`);
      }

      searchPos = pos + keyword.length;
    }
  }

  // Sort by position (order they appear in text)
  foundClasses.sort((a, b) => a.position - b.position);

  // Remove duplicates (same building appearing multiple times)
  const uniqueBuildings: FoundClass[] = [];
  const seenBuildings = new Set<string>();
  for (const fc of foundClasses) {
    const key = `${fc.building}-${fc.room}`;
    if (!seenBuildings.has(key)) {
      seenBuildings.add(key);
      uniqueBuildings.push(fc);
    }
  }

  console.log(`Found ${uniqueBuildings.length} unique buildings`);

  // Also find all times to associate with buildings
  const allTimes: { time: string; startTime: string; endTime: string; position: number }[] = [];
  const timeRegex = /(\d{1,2}:\d{2}\s*(?:AM|PM))\s*[-–]\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/gi;
  let timeMatch;
  while ((timeMatch = timeRegex.exec(fullText)) !== null) {
    allTimes.push({
      time: timeMatch[0],
      startTime: timeMatch[1].toUpperCase().replace(/(\d)(AM|PM)/gi, "$1 $2"),
      endTime: timeMatch[2].toUpperCase().replace(/(\d)(AM|PM)/gi, "$1 $2"),
      position: timeMatch.index,
    });
  }

  console.log(`Found ${uniqueBuildings.length} buildings, ${allTimes.length} time ranges`);

  // Find all course codes
  const courseCodes: { code: string; position: number }[] = [];
  const courseRegex = /\b([A-Z]{2,4})\s*(\d{1,3}[A-Z]?)(?:[-–]\d+)?/g;
  let courseMatch;
  while ((courseMatch = courseRegex.exec(fullText)) !== null) {
    courseCodes.push({
      code: `${courseMatch[1]} ${courseMatch[2]}`,
      position: courseMatch.index,
    });
  }

  // Create class entries for each found building
  for (let i = 0; i < uniqueBuildings.length; i++) {
    const fc = uniqueBuildings[i];

    // Find nearest time (prefer one before the building in text)
    let nearestTime = allTimes[i] || allTimes[0];
    for (const t of allTimes) {
      if (t.position < fc.position && (!nearestTime || t.position > nearestTime.position)) {
        nearestTime = t;
      }
    }

    // Find nearest course code
    let nearestCourse = courseCodes[i] || courseCodes[0];
    for (const c of courseCodes) {
      if (c.position < fc.position && (!nearestCourse || c.position > nearestCourse.position)) {
        nearestCourse = c;
      }
    }

    classes.push({
      id: generateId(),
      courseCode: nearestCourse?.code || `Class ${i + 1}`,
      courseName: undefined,
      daysOfWeek: [],
      startTime: nearestTime?.startTime || "",
      endTime: nearestTime?.endTime || "",
      buildingRaw: fc.building,
      roomRaw: fc.room,
      rawText: `${nearestCourse?.code || ""} ${fc.building} ${fc.room}`,
    });
  }

  console.log("Smart parser found classes:", classes.length);

  return {
    classes,
    parseErrors,
    rawText: fullText,
  };
}

// Aggressive parser for calendar grid OCR - searches entire text for building names and times
function parseCalendarGrid(lines: string[], fullText: string): ParsedSchedule {
  const classes: ParsedClass[] = [];
  const parseErrors: string[] = [];
  const foundBuildings: Set<string> = new Set();

  console.log("=== Calendar Grid Parser Debug ===");
  console.log("Full text:", fullText);

  // Search for any building names in the full text
  for (const building of FRESNO_STATE_BUILDINGS) {
    const buildingLower = building.toLowerCase();
    const textLower = fullText.toLowerCase();

    if (textLower.includes(buildingLower)) {
      foundBuildings.add(building);
      console.log(`Found building: "${building}"`);
    }
  }

  // Also search for partial building names with room numbers
  const buildingPatterns = [
    // MyFresnoState abbreviations
    /prof\s*human\s*(?:srvce|svcs?|services?)(?:\s*(?:bldg|building)?)?(?:\s*(?:rm|room)?\s*(\d+))?/gi,
    /family\s*food\s*(?:&|and)?\s*sci(?:ences?)?(?:\s*(?:bldg|building)?)?(?:\s*(?:rm|room)?\s*(\d+))?/gi,
    /industrial\s*tech(?:nology)?(?:\s*(?:bldg|building)?)?(?:\s*(?:rm|room)?\s*(\d+))?/gi,
    // Full names
    /professional\s*human\s*(?:services?|svcs?)(?:\s*(\d+))?/gi,
    /mckee[\s-]*fisk(?:\s*(?:bldg|building)?)?(?:\s*(?:rm|room)?\s*(\d+))?/gi,
    /grosse\s*industrial\s*(?:technology|tech)(?:\s*[bB])?(?:\s*(\d+))?/gi,
    /family\s*(?:&|and)?\s*food\s*sciences?(?:\s*(?:bldg|building)?)?(?:\s*(\d+))?/gi,
    /science\s*[12iI](?:\s*(\d+))?/gi,
    /engineering\s*(?:east|west|[ew])(?:\s*(\d+))?/gi,
    /peters\s*(?:business)?(?:\s*(?:bldg|building)?)?(?:\s*(\d+))?/gi,
    /kremen\s*(?:education)?(?:\s*(?:bldg|building)?)?(?:\s*(\d+))?/gi,
    /madden\s*library(?:\s*(\d+))?/gi,
    /student\s*union(?:\s*(\d+))?/gi,
    /mclane\s*hall(?:\s*(\d+))?/gi,
  ];

  for (const pattern of buildingPatterns) {
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(fullText)) !== null) {
      const buildingName = match[0].replace(/\s+/g, " ").trim();
      const roomNum = match[1] || "";
      console.log(`Pattern match: "${buildingName}" room: "${roomNum}"`);
      foundBuildings.add(buildingName);
    }
  }

  // Search for all times in the text
  const allTimes: string[] = [];
  const timePattern = /(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi;
  let timeMatch;
  while ((timeMatch = timePattern.exec(fullText)) !== null) {
    allTimes.push(timeMatch[1]);
  }
  console.log("Found times:", allTimes);

  // Search for course codes
  const courseCodes: string[] = [];
  const coursePattern = /\b([A-Z]{2,4})\s*(\d{1,3}[A-Z]?)(?:\s*[-–]\s*\d+)?/g;
  let courseMatch;
  while ((courseMatch = coursePattern.exec(fullText)) !== null) {
    courseCodes.push(`${courseMatch[1]} ${courseMatch[2]}`);
  }
  console.log("Found course codes:", courseCodes);

  // Create classes from found buildings
  let classIndex = 0;
  for (const building of foundBuildings) {
    // Try to extract room number from building string
    const roomMatch = building.match(/(\d{1,4}[A-Z]?)$/);
    const roomRaw = roomMatch ? roomMatch[1] : "";
    const buildingClean = roomMatch
      ? building.replace(/\s*\d{1,4}[A-Z]?$/, "").trim()
      : building;

    // Get corresponding time and course if available
    const startTime = allTimes[classIndex * 2] || allTimes[0] || "";
    const endTime = allTimes[classIndex * 2 + 1] || allTimes[1] || "";
    const courseCode = courseCodes[classIndex] || "";

    classes.push({
      id: generateId(),
      courseCode: courseCode,
      courseName: undefined,
      daysOfWeek: [],
      startTime: startTime,
      endTime: endTime,
      buildingRaw: buildingClean,
      roomRaw: roomRaw,
      rawText: `${courseCode} ${building}`,
    });

    classIndex++;
  }

  console.log("Calendar grid parser found classes:", classes);

  return {
    classes,
    parseErrors,
    rawText: lines.join("\n"),
  };
}

export function parseScheduleText(ocrResult: OCRResult): ParsedSchedule {
  const { lines } = ocrResult;
  const fullText = ocrResult.text;

  // Try Fresno State block format first
  const fresnoResult = parseFresnoStateFormat(lines);

  // If we found classes, use it
  if (fresnoResult.classes.length > 0) {
    console.log("Using Fresno State block format parser");
    return fresnoResult;
  }

  // Try table format (single line per class)
  const tableResult = parseTableFormat(lines);
  if (tableResult.classes.length > 0) {
    console.log("Using table format parser");
    return tableResult;
  }

  // Try line-by-line parsing
  const lineResult = parseLineByLine(lines);
  if (lineResult.classes.length > 0) {
    console.log("Using line-by-line parser");
    return lineResult;
  }

  // Try smart format parser (searches entire text for building+room patterns)
  const smartResult = parseSmartFormat(lines, fullText);
  if (smartResult.classes.length > 0) {
    console.log("Using smart format parser");
    return smartResult;
  }

  // Last resort: aggressive calendar grid parser
  console.log("Using calendar grid parser (aggressive)");
  return parseCalendarGrid(lines, fullText);
}

export function normalizeTime(time: string): string {
  // Convert to consistent format: "HH:MM AM/PM"
  const cleaned = time.replace(/\s+/g, " ").trim().toUpperCase();
  return cleaned;
}

export function compareTime(time1: string, time2: string): number {
  // Convert to 24-hour for comparison
  const to24Hour = (t: string): number => {
    const match = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return 0;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3]?.toUpperCase();

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    return hours * 60 + minutes;
  };

  return to24Hour(time1) - to24Hour(time2);
}
