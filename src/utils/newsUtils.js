export function titleCase(value) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

const topicRules = [
  {
    topic: "Politics",
    pattern: /(election|senate|policy|government|minister|campaign|congress|vote|lawmakers|parliament|white house|president|political)/
  },
  {
    topic: "Technology",
    pattern: /(ai|tech|software|chip|startup|cyber|digital|app|platform|robot|semiconductor|device|internet)/
  },
  {
    topic: "Business",
    pattern: /(market|stock|trade|economy|business|bank|inflation|finance|company|companies|earnings|investor|fed|tariff)/
  },
  {
    topic: "Climate",
    pattern: /(climate|emission|weather|wildfire|sustainability|energy|carbon|heatwave|renewable|flood|drought)/
  },
  {
    topic: "World",
    pattern: /(war|global|international|diplomat|border|world|conflict|foreign|allies|military|trade corridor|summit)/
  },
  {
    topic: "Sports",
    pattern: /(match|league|player|coach|tournament|sports|goal|cup|season|team|score|final|cricket|football|soccer|basketball|tennis|olympic)/
  },
  {
    topic: "Health",
    pattern: /(health|hospital|medical|virus|doctor|screening|disease|patient|wellness|cancer|mental health|treatment|care)/
  },
  {
    topic: "Culture",
    pattern: /(culture|film|music|art|festival|museum|theater|cinema|book|books|fashion|celebrity|streaming|artist|creative)/
  }
];

export function normalizeTopic(value = "") {
  const normalized = titleCase(String(value).trim());
  return topicRules.find((rule) => rule.topic === normalized)?.topic || "";
}

export function inferTopic(text) {
  const value = (text || "").toLowerCase();

  for (const rule of topicRules) {
    if (rule.pattern.test(value)) return rule.topic;
  }

  return "Culture";
}

export function matchesTopic(item, selectedTopic) {
  if (!selectedTopic) return true;

  const explicitTopic = normalizeTopic(item.topic);
  const derivedTopic = inferTopic(
    `${item.topic || ""} ${item.title || ""} ${item.summary || ""} ${item.description || ""} ${item.source || ""}`
  );

  return (explicitTopic || derivedTopic) === selectedTopic;
}

export function topicRelevanceScore(item, selectedTopic) {
  if (!selectedTopic) return 0;

  const explicitTopic = normalizeTopic(item.topic);
  const combinedText = `${item.topic || ""} ${item.title || ""} ${item.summary || ""} ${item.description || ""} ${item.source || ""}`;
  const derivedTopic = inferTopic(combinedText);
  let score = 0;

  if (explicitTopic === selectedTopic) score += 6;
  if (derivedTopic === selectedTopic) score += 4;

  const lowerText = combinedText.toLowerCase();
  const topicRule = topicRules.find((rule) => rule.topic === selectedTopic);
  if (topicRule?.pattern.test(lowerText)) score += 4;

  return score;
}

export function normalizeLeaning(value = "") {
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "left" || normalized === "right" || normalized === "balanced") return normalized;
  return "balanced";
}

export function matchesPreferredLeaning(item, preferredBias) {
  const selectedLeaning = normalizeLeaning(preferredBias);
  return normalizeLeaning(item.leaning) === selectedLeaning;
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
  if (preferences.preferredBias === item.leaning) score += 20;
  if (preferences.preferredPace === item.pace) score += 12;
  if (preferences.preferredPace === "mixed") score += 6;

  return Math.min(score, 99);
}

export function sortByPreference(items, preferences) {
  return [...items]
    .map((item) => ({ ...item, score: scoreItem(item, preferences) }))
    .sort((a, b) => b.score - a.score);
}
