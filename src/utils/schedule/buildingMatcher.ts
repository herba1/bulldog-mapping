import {
  BuildingData,
  BuildingMatch,
  MatchResult,
  ParsedClass,
} from "@/types/schedule";

// Common building name variations/aliases for Fresno State
const BUILDING_ALIASES: Record<string, string[]> = {
  "mckee-fisk": ["mckee fisk", "mckeefisk", "mckee-fisk bldg", "mckee-fisk building", "mckee fisk building"],
  "family & food sciences": [
    "family and food sciences", "family food sciences", "family & food sciences bldg",
    "family food & sci bldg", "family food & sci", "family food sci bldg", "family food sci"
  ],
  "grosse industrial technology": [
    "grosse industrial technology b", "industrial technology", "grosse industrial tech",
    "industrial tech bldg", "industrial tech", "indust tech bldg"
  ],
  "professional human services": [
    "professional human svcs", "prof human services", "prof human srvce bldg",
    "prof human srvce", "prof human svcs bldg"
  ],
  "engineering east": ["engineering e", "eng east"],
  "engineering west": ["engineering w", "eng west"],
  "science 1": ["science i", "science one", "sci 1"],
  "science 2": ["science ii", "science two", "sci 2"],
  "peters business": ["peters business building", "peters business bldg", "peters bldg"],
  "kremen education": ["kremen education building", "education building", "education bldg"],
  "henry madden library": ["madden library", "library"],
  "university student union": ["student union", "usu"],
  "satellite student union": ["satellite union", "ssu"],
  "digital campus": ["online", "digital"],
};

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Check if input matches any known alias and return the canonical name
function resolveAlias(input: string): string | null {
  const normalized = normalizeString(input);

  for (const [canonical, aliases] of Object.entries(BUILDING_ALIASES)) {
    // Check if input matches canonical name or any alias
    if (normalized.includes(normalizeString(canonical))) {
      return canonical;
    }
    for (const alias of aliases) {
      if (normalized.includes(normalizeString(alias)) ||
          normalizeString(alias).includes(normalized)) {
        return canonical;
      }
    }
  }
  return null;
}

function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

function calculateFuzzyScore(input: string, target: string): number {
  const normalizedInput = normalizeString(input);
  const normalizedTarget = normalizeString(target);

  if (normalizedInput === normalizedTarget) return 100;

  const distance = levenshteinDistance(normalizedInput, normalizedTarget);
  const maxLen = Math.max(normalizedInput.length, normalizedTarget.length);

  if (maxLen === 0) return 0;

  return Math.round((1 - distance / maxLen) * 100);
}

function extractKeywords(str: string): string[] {
  const normalized = normalizeString(str);
  // Remove common words
  const stopWords = [
    "the",
    "of",
    "and",
    "a",
    "an",
    "in",
    "at",
    "for",
    "building",
    "hall",
    "center",
  ];
  return normalized.split(" ").filter((word) => !stopWords.includes(word));
}

export function matchBuildingToSchedule(
  buildingRaw: string,
  roomRaw: string,
  buildings: BuildingData[]
): MatchResult {
  const matches: BuildingMatch[] = [];
  const normalizedInput = normalizeString(buildingRaw);

  if (!normalizedInput) {
    return {
      parsedClass: {} as ParsedClass,
      match: null,
      suggestions: [],
    };
  }

  // Check if input matches a known alias
  const resolvedAlias = resolveAlias(buildingRaw);

  for (const building of buildings) {
    const normalizedBuildingName = normalizeString(building.name);

    // 1. Exact name match (100% confidence)
    if (normalizedBuildingName === normalizedInput) {
      matches.push({
        building,
        confidence: 100,
        matchType: "exact",
        matchedOn: "name",
      });
      continue;
    }

    // 2. Alias match - if input resolves to an alias that matches building name (98%)
    if (resolvedAlias && normalizedBuildingName.includes(normalizeString(resolvedAlias))) {
      matches.push({
        building,
        confidence: 98,
        matchType: "exact",
        matchedOn: "alias",
      });
      continue;
    }

    // 3. Check otherNames for abbreviations (95% confidence)
    if (building.otherNames && Array.isArray(building.otherNames)) {
      const hasAbbrevMatch = building.otherNames.some(
        (abbr) => normalizeString(abbr) === normalizedInput
      );
      if (hasAbbrevMatch) {
        matches.push({
          building,
          confidence: 95,
          matchType: "exact",
          matchedOn: "otherNames",
        });
        continue;
      }
    }

    // 4. Partial match - input contains building name or vice versa (85%)
    if (
      normalizedBuildingName.includes(normalizedInput) ||
      normalizedInput.includes(normalizedBuildingName)
    ) {
      matches.push({
        building,
        confidence: 85,
        matchType: "partial",
        matchedOn: "name",
      });
      continue;
    }

    // 5. Keyword matching (80%)
    const inputKeywords = extractKeywords(buildingRaw);
    const buildingKeywords = extractKeywords(building.name);
    const matchingKeywords = inputKeywords.filter((kw) =>
      buildingKeywords.some(
        (bkw) => bkw.includes(kw) || kw.includes(bkw) || kw === bkw
      )
    );
    if (matchingKeywords.length > 0) {
      const keywordScore = Math.min(
        80,
        60 + (matchingKeywords.length / inputKeywords.length) * 20
      );
      matches.push({
        building,
        confidence: keywordScore,
        matchType: "partial",
        matchedOn: "keywords",
      });
      continue;
    }

    // 6. Fuzzy match using Levenshtein distance (only if >60%)
    const fuzzyScore = calculateFuzzyScore(buildingRaw, building.name);
    if (fuzzyScore > 60) {
      matches.push({
        building,
        confidence: fuzzyScore,
        matchType: "fuzzy",
        matchedOn: "name",
      });
    }
  }

  // Sort by confidence (highest first)
  matches.sort((a, b) => b.confidence - a.confidence);

  // Return best match and top 3 suggestions
  return {
    parsedClass: {} as ParsedClass,
    match: matches[0] || null,
    suggestions: matches.slice(1, 4),
  };
}

export function matchAllClasses(
  parsedClasses: ParsedClass[],
  buildings: BuildingData[]
): MatchResult[] {
  return parsedClasses.map((parsedClass) => {
    const result = matchBuildingToSchedule(
      parsedClass.buildingRaw,
      parsedClass.roomRaw,
      buildings
    );
    return {
      ...result,
      parsedClass,
    };
  });
}
