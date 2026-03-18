export function titleCase(value) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function inferTopic(text) {
  const value = (text || "").toLowerCase();

  if (/(election|senate|policy|government|minister|campaign|congress|vote)/.test(value)) return "Politics";
  if (/(ai|tech|software|chip|startup|cyber|digital|app|platform)/.test(value)) return "Technology";
  if (/(market|stock|trade|economy|business|bank|inflation|finance)/.test(value)) return "Business";
  if (/(climate|emission|weather|wildfire|sustainability|energy)/.test(value)) return "Climate";
  if (/(war|global|international|diplomat|border|world|conflict)/.test(value)) return "World";
  if (/(match|league|player|coach|tournament|sports|goal)/.test(value)) return "Sports";
  if (/(health|hospital|medical|virus|doctor|screening|disease)/.test(value)) return "Health";
  return "Culture";
}

export function inferPace(text) {
  return /(live|just in|breaking|update|today|latest)/i.test(text || "") ? "breaking" : "analysis";
}

const leftSources = ["guardian", "npr", "vox", "msnbc", "huffpost", "cnn", "new york times"];
const rightSources = ["fox", "washington examiner", "new york post", "daily caller", "wsj", "wall street journal"];

export function inferLeaning(source = "", title = "", summary = "") {
  const combined = `${source} ${title} ${summary}`.toLowerCase();

  if (leftSources.some((item) => combined.includes(item))) return "left";
  if (rightSources.some((item) => combined.includes(item))) return "right";
  if (/(equity|activist|labor|climate justice|progressive)/.test(combined)) return "left";
  if (/(tax cuts|border security|conservative|deregulation|traditional values)/.test(combined)) return "right";
  return "balanced";
}

export function formatPublishedDate(dateValue) {
  if (!dateValue) return "Recent";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Recent";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

export function estimateReadTime(text) {
  const words = (text || "").split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(3, Math.round(words / 180) || 3);
  return `${minutes} min read`;
}

export function scoreItem(item, preferences) {
  let score = 50;

  if (preferences.selectedTopics.includes(item.topic)) score += 28;
  if (preferences.preferredBias === item.leaning) score += 16;
  if (preferences.preferredBias === "balanced" && item.leaning === "balanced") score += 12;
  if (preferences.preferredPace === item.pace) score += 12;
  if (preferences.preferredPace === "mixed") score += 6;

  return Math.min(score, 99);
}

export function sortByPreference(items, preferences) {
  return [...items]
    .map((item) => ({ ...item, score: scoreItem(item, preferences) }))
    .sort((a, b) => b.score - a.score);
}
