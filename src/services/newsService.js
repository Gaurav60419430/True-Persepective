import { fallbackArticleNews, fallbackVideoNews } from "../data/fallbackData";
import {
  estimateReadTime,
  formatPublishedDate,
  inferLeaning,
  inferPace,
  inferTopic,
  normalizeLeaning,
  normalizeTopic,
  titleCase,
  topicRelevanceScore
} from "../utils/newsUtils";

const GNEWS_URL = "https://gnews.io/api/v4/search";
const YOUTUBE_URL = "https://www.googleapis.com/youtube/v3/search";
const FEED_SIZE = 12;
const QUERY_LIMIT = 20;
const LENSES = ["left", "balanced", "right"];

const topicQueryMap = {
  Politics: ["politics election government policy", "congress senate white house", "campaign law vote minister"],
  Technology: ["technology ai software startup", "chips semiconductor cyber digital", "platform app innovation tech news"],
  Business: ["business markets economy finance", "stocks earnings companies inflation", "banking trade fed investors"],
  Climate: ["climate energy emissions sustainability", "carbon renewable weather climate policy", "wildfire flood drought environment"],
  World: ["world international global diplomacy", "conflict border summit foreign affairs", "military allies geopolitical world news"],
  Sports: ["sports league match tournament", "football cricket basketball tennis", "team coach player final score"],
  Health: ["health medical hospital treatment", "disease wellness patient doctor", "screening public health research"],
  Culture: ["culture art film music", "festival museum theater books", "cinema artist entertainment creative"]
};

const topicFillerDetails = {
  Politics: {
    articleType: "Policy Watch",
    videoType: "Politics Brief",
    articleSubjects: [
      "Senate budget talks shift after overnight negotiations",
      "Campaign teams redraw strategy around suburban turnout",
      "Committee hearing raises new pressure on agency leadership",
      "State funding fight pulls governors into a national debate",
      "Border policy message changes ahead of a major vote",
      "Primary map tightens as party leaders split on endorsements",
      "Education bill sparks a fresh battle over local control",
      "Tax package negotiations reopen fault lines across the chamber",
      "Foreign policy speech reshapes the week on Capitol Hill",
      "Voting access lawsuit adds tension before the next election test",
      "Cabinet rollout meets resistance from inside the coalition",
      "Ethics probe revives arguments over oversight and transparency"
    ],
    videoSubjects: [
      "Morning politics desk tracks the latest vote count strategy",
      "White House briefing reacts to new pressure from Congress",
      "Capitol recap explains what changed in the committee room",
      "Election map update breaks down where momentum is moving",
      "Policy panel reviews the messaging battle around a new bill",
      "Statehouse report compares how governors are framing the issue",
      "Campaign briefing follows donor reaction and turnout math",
      "Senate update looks at the path forward for a major package",
      "Political roundtable weighs the cost of the latest reversal",
      "Debate clip highlights the strongest attacks from both sides",
      "Washington notebook summarizes the next test for party unity",
      "Politics newsroom update checks the fallout from fresh testimony"
    ]
  },
  Technology: {
    articleType: "Tech Brief",
    videoType: "Tech Video",
    articleSubjects: [
      "AI product rollout forces companies to revisit safety promises",
      "Chip supply strategy changes as new factories race to open",
      "Cybersecurity alert pushes firms to patch core business tools",
      "Cloud pricing update reshapes startup spending plans",
      "Software platform changes create a new fight over developer rules",
      "Antitrust questions return as a major app store expands fees",
      "Robotics investment boom raises questions about labor readiness",
      "Device launch cycle slows while buyers wait for smarter features",
      "Open-source governance debate grows after a surprise model release",
      "Digital identity tools gain support across public services",
      "Data center expansion pressures local grids and water systems",
      "Streaming platform redesign triggers a battle over creator revenue"
    ],
    videoSubjects: [
      "Tech desk explains the latest AI rollout and its tradeoffs",
      "Startup recap follows new money moving into software tools",
      "Cyber update breaks down the newest platform vulnerability",
      "Device review segment tracks the next consumer hardware push",
      "Chip industry briefing looks at the newest supply chain shift",
      "Innovation panel debates how regulation should catch up",
      "Digital market update reviews the latest platform competition",
      "Product watch explores why builders are changing their roadmap",
      "Tech roundtable compares how companies are pricing new features",
      "Internet policy clip follows the newest privacy fight",
      "Business tech update looks at the next wave of automation",
      "Developer briefing follows the reaction to a big software change"
    ]
  },
  Business: {
    articleType: "Market Watch",
    videoType: "Business Video",
    articleSubjects: [
      "Retail earnings shift market expectations for the next quarter",
      "Bond traders react as inflation data lands above forecasts",
      "Small business lenders face a new test after rate pressure",
      "Shipping slowdown changes inventory plans across major retailers",
      "Wage growth debate returns as hiring momentum cools",
      "Energy prices add new uncertainty to factory planning",
      "Consumer confidence dip forces brands to rethink discount timing",
      "Banking guidance changes how investors read the credit outlook",
      "Trade talks give exporters a narrow opening for relief",
      "Corporate restructuring plans trigger fresh layoffs across the sector",
      "Housing finance signals raise questions about borrowing demand",
      "Market strategists split over the timing of the next pivot"
    ],
    videoSubjects: [
      "Markets briefing reviews the biggest earnings surprise of the day",
      "Street update follows the latest inflation shock for investors",
      "Business desk tracks what rate pressure means for borrowers",
      "Retail recap breaks down a major shift in consumer spending",
      "Finance panel debates whether the next quarter will stabilize",
      "Trade report explains who benefits most from the latest talks",
      "Banking segment tracks the new signal coming from credit desks",
      "Jobs watch looks at the sectors adding and cutting roles",
      "Company update explains why executive guidance suddenly changed",
      "Market close segment follows the sharpest move on the board",
      "Business roundtable reviews what the housing numbers imply",
      "Economy briefing checks whether sentiment is turning again"
    ]
  },
  Climate: {
    articleType: "Climate Report",
    videoType: "Climate Video",
    articleSubjects: [
      "Renewable buildout plan meets resistance over grid costs",
      "Heatwave response strategy pushes cities to open more cooling sites",
      "Flood defenses move up the agenda after a damaging storm cycle",
      "Carbon policy review reopens the debate on industrial targets",
      "Water shortage warning changes planting plans across farm regions",
      "Insurance retreat leaves more homeowners exposed to climate risk",
      "Wildfire preparedness gaps widen as the season starts early",
      "Transit electrification plan faces new pressure over charging delays",
      "Coastal retreat debate grows after repeated repair failures",
      "Energy storage push accelerates as utilities brace for summer demand",
      "Climate adaptation budget sparks a fight over local priorities",
      "Emission reporting rules force companies to revise disclosures"
    ],
    videoSubjects: [
      "Climate desk explains how the newest heatwave plan works",
      "Weather update follows the latest flood risk projections",
      "Energy briefing tracks the next test for renewable buildout",
      "Environment panel debates the cost of climate resilience upgrades",
      "Wildfire report reviews what changed in regional preparedness",
      "Water watch checks how shortages are changing farm decisions",
      "Policy clip explores the latest argument over carbon targets",
      "Grid update looks at the push for more storage capacity",
      "Climate notebook summarizes the next big adaptation challenge",
      "Storm recovery segment follows what officials are promising",
      "Clean energy roundtable weighs who pays for faster change",
      "Environment newsroom update checks the newest emission rules"
    ]
  },
  World: {
    articleType: "World Desk",
    videoType: "World Video",
    articleSubjects: [
      "Diplomatic talks restart after a tense week at the border",
      "Trade corridor concerns force allies to review security plans",
      "Regional summit ends with a fragile agreement on coordination",
      "Aid delivery delays sharpen criticism of the current response",
      "Defense ministers push for faster planning after new threats",
      "Currency stress complicates recovery efforts in a key partner state",
      "Sanctions debate grows as negotiators seek a narrower compromise",
      "Shipping risk assessment changes how exporters route cargo",
      "Refugee policy dispute exposes a deeper split among neighbors",
      "Ceasefire proposal faces renewed doubts after overnight strikes",
      "Foreign ministers widen talks to include energy security concerns",
      "Regional election result adds uncertainty to an existing alliance"
    ],
    videoSubjects: [
      "World desk update follows the next move in regional diplomacy",
      "International briefing explains why allies are recalculating strategy",
      "Border report tracks the latest security and trade pressure",
      "Global panel debates whether the current ceasefire can hold",
      "Foreign affairs segment reviews how capitals are responding",
      "Shipping route update follows new warnings for carriers",
      "Crisis notebook explains what aid groups need next",
      "Summit recap looks at the sharpest disagreement behind closed doors",
      "Security report follows the latest military posture change",
      "World newsroom update tracks how markets read the tension",
      "Diplomacy roundtable checks what happens after the next vote",
      "International clip breaks down the strongest message from leaders"
    ]
  },
  Sports: {
    articleType: "Sports Desk",
    videoType: "Sports Video",
    articleSubjects: [
      "Title race tightens after a dramatic weekend swing",
      "Injury setback forces coaches to rethink a key playoff plan",
      "Transfer rumor cycle changes how supporters read the season",
      "Defensive collapse raises new questions about championship hopes",
      "Young star breakthrough shifts the future of the lineup",
      "Schedule congestion becomes the story as fixtures pile up",
      "Manager selection gamble pays off in a must-win match",
      "Late comeback changes the mood around a struggling contender",
      "Captaincy decision sparks debate across the league",
      "Training ground reset points to a tactical change this week",
      "League review highlights the teams closing fastest",
      "Playoff format debate returns after another controversial finish"
    ],
    videoSubjects: [
      "Sports update breaks down the biggest result of the day",
      "Match recap tracks how momentum shifted late in the contest",
      "League briefing explains what the latest table swing means",
      "Coaching panel reviews a tactical move that changed the game",
      "Locker room report follows the fallout from an injury scare",
      "Weekend notebook checks who gained the most ground",
      "Transfer desk update explains the newest squad question",
      "Sports roundtable debates who now controls the title race",
      "Post-game segment looks at what the captain said next",
      "Performance clip highlights the player carrying the biggest load",
      "Fixture watch breaks down the hardest run still ahead",
      "Season review segment checks whether belief is returning"
    ]
  },
  Health: {
    articleType: "Health Update",
    videoType: "Health Video",
    articleSubjects: [
      "Screening guidance changes the conversation around early detection",
      "Hospital staffing strain pushes systems to revise coverage plans",
      "New treatment review gives patients another option to consider",
      "Mental health demand forces clinics to expand waitlist support",
      "Insurance decision shifts access for a fast-growing therapy",
      "Public health warning raises concern ahead of a heavy travel period",
      "Primary care shortage deepens pressure on rural providers",
      "Medical study sparks debate over how quickly advice should change",
      "Pharmacy supply issue disrupts routine treatment schedules",
      "Wellness trend faces scrutiny after a wave of new claims",
      "Aging care plans become a bigger budget issue for families",
      "Hospital technology upgrade changes how triage teams work"
    ],
    videoSubjects: [
      "Health desk explains the latest screening change for patients",
      "Medical briefing tracks what doctors are watching this week",
      "Clinic report reviews the biggest access challenge right now",
      "Research update breaks down the newest treatment findings",
      "Care segment follows how hospitals are adapting to new demand",
      "Public health panel debates whether current guidance goes far enough",
      "Patient update looks at the cost pressure behind the latest shift",
      "Health roundtable reviews how providers are changing routines",
      "Wellness report separates the evidence from the latest trend",
      "Medication watch follows the newest supply concern",
      "Hospital notebook checks what changed in care coordination",
      "Medical newsroom update summarizes the strongest new warning"
    ]
  },
  Culture: {
    articleType: "Culture Report",
    videoType: "Culture Video",
    articleSubjects: [
      "Festival lineup reveal changes the awards season conversation",
      "Museum expansion plan sparks debate about access and identity",
      "Breakout streaming hit shifts what studios want next",
      "Book release season opens with a surprise critical favorite",
      "Theater revival brings an older classic into a new debate",
      "Music industry strategy changes after a major chart upset",
      "Independent film buzz grows around a new directorial voice",
      "Fashion week messaging turns into a broader cultural statement",
      "Audience backlash forces a studio to revisit its rollout plan",
      "Arts funding debate returns as venues confront rising costs",
      "Cultural trend cycle speeds up after a viral crossover moment",
      "Creative labor fight reshapes expectations for the next release wave"
    ],
    videoSubjects: [
      "Culture desk breaks down the newest release drawing attention",
      "Arts update follows why critics are split this week",
      "Festival notebook explains the project gaining fast momentum",
      "Cinema panel reviews the strongest audience reaction so far",
      "Music segment tracks the latest shift in chart strategy",
      "Museum report looks at how curators are changing the experience",
      "Books briefing follows the title dominating cultural conversation",
      "Creative roundtable debates what the latest backlash means",
      "Theater recap checks why a revival is resonating again",
      "Fashion clip reviews the biggest idea behind the current season",
      "Streaming update explains how one hit changed the release calendar",
      "Culture newsroom summary tracks what artists are reacting to now"
    ]
  }
};

const fillerVoice = {
  left: {
    articleSources: ["Civic Lens", "Public Impact Review", "Workers Journal", "Progress Desk"],
    videoSources: ["Public Lens TV", "Civic Watch", "Community Briefing", "Reform Desk Live"],
    articlePrefixes: ["Public impact", "Accountability watch", "Community focus", "Equity tracker"],
    videoPrefixes: ["Public impact briefing", "Accountability update", "Community report", "Equity focus segment"],
    angle: "with emphasis on public services, worker impact, and institutional accountability"
  },
  balanced: {
    articleSources: ["National Desk", "Current Ledger", "Daily Wireline", "Fact Monitor"],
    videoSources: ["Current Live", "Daily Briefing", "Newsroom Wire", "Straight Report"],
    articlePrefixes: ["Topic watch", "Current view", "News brief", "Developing report"],
    videoPrefixes: ["Topic briefing", "Current update", "News desk segment", "Developing report"],
    angle: "with a straight breakdown of the main claims, tradeoffs, and public reaction"
  },
  right: {
    articleSources: ["Capitol Ledger", "Security Review", "Enterprise Current", "National Priority Desk"],
    videoSources: ["National Briefing", "Security Desk Live", "Enterprise Report TV", "Priority Watch"],
    articlePrefixes: ["Security focus", "Market angle", "Priority view", "Stability watch"],
    videoPrefixes: ["Security update", "Market focus segment", "Priority briefing", "Stability report"],
    angle: "with emphasis on security, economic freedom, and long-term institutional stability"
  }
};

function getTopicQueries(selectedTopic) {
  return topicQueryMap[selectedTopic] || ["latest news"];
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return response.json();
}

async function fetchGithubJson(url) {
  const data = await fetchJson(url);
  if (!Array.isArray(data)) {
    throw new Error("GitHub JSON source must return an array");
  }

  return data;
}

function dedupeBy(items, getKey) {
  const seen = new Set();

  return items.filter((item) => {
    const key = String(getKey(item) || "").trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hashValue(input) {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) % 2147483647;
  }

  return Math.abs(hash);
}

function pickSmartBucket(item, selectedTopic) {
  const naturalLeaning = normalizeLeaning(inferLeaning(item.source, item.title, item.summary || item.description || ""));
  const bucketIndex = hashValue(`${selectedTopic}|${item.id || item.title}|${item.source}`) % LENSES.length;

  if (naturalLeaning !== "balanced") {
    const keepNatural = hashValue(`${item.title}|${item.source}`) % 5;
    if (keepNatural !== 0) {
      return naturalLeaning;
    }
  }

  return LENSES[bucketIndex];
}

function getArticleDetails(item, selectedTopic) {
  if (item.keyPoints?.length && item.content?.length) {
    return {
      keyPoints: item.keyPoints,
      content: item.content
    };
  }

  const topicLabel = titleCase(selectedTopic);
  const summary = item.summary || "This story is part of the current topic feed.";

  return {
    keyPoints: [
      `${topicLabel} remains the main subject of this article.`,
      `${item.source} highlights ${summary.toLowerCase()}`,
      `This recommendation is grouped into the ${item.leaning} lane for comparison.`
    ],
    content: [
      `${item.title} is one of the latest stories surfaced inside your ${selectedTopic.toLowerCase()} feed. ${summary}`,
      `The article remains in the ${selectedTopic.toLowerCase()} topic pool and is then grouped into a political lane so you can compare story framing without leaving the topic you selected.`,
      `Use the political lens controls to move between left, balanced, and right sets while keeping the same topic focus and in-app article reading experience.`
    ]
  };
}

function getVideoDetails(item, selectedTopic) {
  if (item.keyMoments?.length && item.transcriptIntro) {
    return {
      keyMoments: item.keyMoments,
      transcriptIntro: item.transcriptIntro
    };
  }

  return {
    keyMoments: [
      `${titleCase(selectedTopic)} is the central subject of this video.`,
      `${item.source} focuses on ${item.summary?.toLowerCase() || "the latest development in the story"}`,
      `The clip appears inside the ${item.leaning} lane for side-by-side comparison.`
    ],
    transcriptIntro: `${item.title} is included in your ${selectedTopic.toLowerCase()} video feed. ${item.summary || "This video is part of the latest topic update."}`
  };
}

function enrichArticle(item, selectedTopic) {
  const normalized = {
    ...item,
    topic: normalizeTopic(item.topic) || inferTopic(`${item.title || ""} ${item.summary || item.description || ""}`),
    leaning: normalizeLeaning(item.leaning || pickSmartBucket(item, selectedTopic)),
    pace: item.pace || inferPace(`${item.title || ""} ${item.summary || item.description || ""}`),
    readTime: item.readTime || estimateReadTime(item.summary || item.description || item.title),
    publishedLabel: item.publishedLabel || formatPublishedDate(item.publishedAt),
    isInternal: true,
    type: item.type || "Live Article"
  };

  return {
    ...normalized,
    ...getArticleDetails(normalized, selectedTopic)
  };
}

function enrichVideo(item, selectedTopic) {
  const normalized = {
    ...item,
    topic: normalizeTopic(item.topic) || inferTopic(`${item.title || ""} ${item.summary || item.description || ""}`),
    leaning: normalizeLeaning(item.leaning || pickSmartBucket(item, selectedTopic)),
    pace: item.pace || inferPace(`${item.title || ""} ${item.summary || item.description || ""}`),
    duration: item.duration || "Watch",
    publishedLabel: item.publishedLabel || formatPublishedDate(item.publishedAt),
    isInternal: true,
    type: item.type || "Live Video"
  };

  return {
    ...normalized,
    ...getVideoDetails(normalized, selectedTopic)
  };
}

function baseCandidateSort(a, b) {
  if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
  return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
}

function prepareCandidates(items, selectedTopic, enrich) {
  return dedupeBy(items.map((item) => enrich(item, selectedTopic)), (item) => item.videoId || item.link || item.id || item.title)
    .map((item) => ({
      ...item,
      topic: normalizeTopic(item.topic) || inferTopic(`${item.title || ""} ${item.summary || item.description || ""}`),
      leaning: normalizeLeaning(item.leaning || pickSmartBucket(item, selectedTopic)),
      relevanceScore: topicRelevanceScore(item, selectedTopic),
      naturalLeaning: normalizeLeaning(inferLeaning(item.source, item.title, item.summary || item.description || "")),
      smartBucket: pickSmartBucket(item, selectedTopic)
    }))
    .filter((item) => item.relevanceScore >= 6)
    .sort(baseCandidateSort);
}

async function classifyCandidates(candidates) {
  if (!candidates.length || typeof window === "undefined") return candidates;

  try {
    const response = await fetch("/api/classify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        items: candidates.slice(0, 36).map((item) => ({
          id: item.id,
          title: item.title,
          source: item.source,
          summary: item.summary
        }))
      })
    });

    if (!response.ok) return candidates;

    const data = await response.json();
    const classificationMap = new Map(
      (data.classifications || []).map((item) => [item.id, normalizeLeaning(item.leaning)])
    );

    return candidates.map((item) => {
      const apiLeaning = classificationMap.get(item.id);
      if (!apiLeaning) return item;

      return {
        ...item,
        leaning: apiLeaning,
        naturalLeaning: apiLeaning,
        smartBucket: apiLeaning
      };
    });
  } catch {
    return candidates;
  }
}

function assignBucketScore(item, lens) {
  let score = item.relevanceScore * 10;

  if (item.naturalLeaning === lens) score += 6;
  if (item.smartBucket === lens) score += 4;
  if (lens === "balanced" && item.naturalLeaning === "balanced") score += 2;

  return score;
}

function buildLensBucket(candidates, lens) {
  const rankedItems = [...candidates]
    .sort((a, b) => assignBucketScore(b, lens) - assignBucketScore(a, lens) || baseCandidateSort(a, b))
    .slice(0, FEED_SIZE);

  return rankedItems.map((item, index) => ({
    ...item,
    id: `${item.id || item.title}-${lens}-${index}`,
    leaning: lens,
    score: 99 - index
  }));
}

function createGeneratedArticleFiller(selectedTopic, lens, index) {
  const detail = topicFillerDetails[selectedTopic] || topicFillerDetails.Politics;
  const voice = fillerVoice[lens];
  const subject = detail.articleSubjects[index % detail.articleSubjects.length];
  const prefix = voice.articlePrefixes[index % voice.articlePrefixes.length];
  const source = voice.articleSources[index % voice.articleSources.length];
  const summary = `${subject} ${voice.angle}.`;

  return {
    id: `generated-article-${selectedTopic}-${lens}-${index + 1}`,
    title: `${prefix}: ${subject}`,
    source,
    topic: selectedTopic,
    leaning: lens,
    pace: index % 2 === 0 ? "breaking" : "analysis",
    readTime: `${4 + (index % 4)} min read`,
    summary,
    image: null,
    link: `/generated/${selectedTopic.toLowerCase()}/${lens}/article-${index + 1}`,
    isInternal: true,
    type: detail.articleType,
    publishedAt: `2026-03-${String(10 + (index % 18)).padStart(2, "0")}T${String(8 + (index % 10)).padStart(2, "0")}:00:00Z`,
    publishedLabel: formatPublishedDate(`2026-03-${String(10 + (index % 18)).padStart(2, "0")}T${String(8 + (index % 10)).padStart(2, "0")}:00:00Z`),
    keyPoints: [
      `${titleCase(selectedTopic)} remains the central topic of this report.`,
      `${source} frames the development ${voice.angle}.`,
      `This generated article fills the ${lens} lane with a unique same-topic perspective.`
    ],
    content: [
      `${subject} is one of the additional same-topic reports created to keep your ${selectedTopic.toLowerCase()} feed full. ${summary}`,
      `The piece stays inside the selected topic and uses a ${lens} framing so you can compare how the same area of news might be organized across different political lanes.`,
      `Because live APIs do not always return enough unique items for every lane, this internal article expands the feed while preserving topic focus and the in-app reading experience you asked for.`
    ]
  };
}

function createGeneratedVideoFiller(selectedTopic, lens, index) {
  const detail = topicFillerDetails[selectedTopic] || topicFillerDetails.Politics;
  const voice = fillerVoice[lens];
  const subject = detail.videoSubjects[index % detail.videoSubjects.length];
  const prefix = voice.videoPrefixes[index % voice.videoPrefixes.length];
  const source = voice.videoSources[index % voice.videoSources.length];
  const summary = `${subject} ${voice.angle}.`;

  return {
    id: `generated-video-${selectedTopic}-${lens}-${index + 1}`,
    title: `${prefix}: ${subject}`,
    source,
    topic: selectedTopic,
    leaning: lens,
    pace: index % 2 === 0 ? "breaking" : "analysis",
    duration: `${3 + (index % 5)} min`,
    summary,
    link: `/generated/${selectedTopic.toLowerCase()}/${lens}/video-${index + 1}`,
    embedUrl: null,
    videoId: `generated-${selectedTopic.toLowerCase()}-${lens}-${index + 1}`,
    isInternal: true,
    type: detail.videoType,
    publishedAt: `2026-03-${String(10 + (index % 18)).padStart(2, "0")}T${String(10 + (index % 10)).padStart(2, "0")}:30:00Z`,
    publishedLabel: formatPublishedDate(`2026-03-${String(10 + (index % 18)).padStart(2, "0")}T${String(10 + (index % 10)).padStart(2, "0")}:30:00Z`),
    keyMoments: [
      `${titleCase(selectedTopic)} remains the central focus of the video update.`,
      `${source} frames the latest development ${voice.angle}.`,
      `This generated video fills the ${lens} lane with a unique same-topic entry.`
    ],
    transcriptIntro: `${subject} is included as an internal ${selectedTopic.toLowerCase()} video summary so the ${lens} lane stays full even when live APIs run short.`
  };
}

function completeLensBucket(items, selectedTopic, lens, mode) {
  const completedItems = [...items];
  const existingTitles = new Set(completedItems.map((item) => item.title.trim().toLowerCase()));
  let fillerIndex = 0;

  while (completedItems.length < FEED_SIZE) {
    const filler = mode === "article"
      ? createGeneratedArticleFiller(selectedTopic, lens, fillerIndex)
      : createGeneratedVideoFiller(selectedTopic, lens, fillerIndex);
    fillerIndex += 1;

    if (existingTitles.has(filler.title.trim().toLowerCase())) {
      continue;
    }

    existingTitles.add(filler.title.trim().toLowerCase());
    completedItems.push({
      ...filler,
      score: 99 - completedItems.length
    });
  }

  return completedItems;
}

function buildLensBuckets(candidates, selectedTopic, mode) {
  return {
    left: completeLensBucket(buildLensBucket(candidates, "left"), selectedTopic, "left", mode),
    balanced: completeLensBucket(buildLensBucket(candidates, "balanced"), selectedTopic, "balanced", mode),
    right: completeLensBucket(buildLensBucket(candidates, "right"), selectedTopic, "right", mode)
  };
}

function mapGNewsArticles(rawArticles, selectedTopic) {
  return rawArticles.map((article, index) => ({
    id: article.url || `gnews-${index}`,
    title: article.title,
    source: article.source?.name || "GNews",
    topic: inferTopic(`${selectedTopic} ${article.title} ${article.description || ""}`),
    summary: article.description || "Live news fetched from GNews.",
    image: article.image || null,
    link: article.url,
    publishedAt: article.publishedAt,
    type: "Live Article"
  }));
}

function mapYouTubeVideos(rawVideos, selectedTopic) {
  return rawVideos.map((video, index) => ({
    id: video.id?.videoId || `yt-${index}`,
    title: video.snippet?.title || "Video briefing",
    source: video.snippet?.channelTitle || "YouTube",
    topic: inferTopic(`${selectedTopic} ${video.snippet?.title || ""} ${video.snippet?.description || ""}`),
    summary: video.snippet?.description || "Live video news fetched from YouTube.",
    link: `https://www.youtube.com/watch?v=${video.id?.videoId}`,
    embedUrl: video.id?.videoId ? `https://www.youtube-nocookie.com/embed/${video.id.videoId}` : null,
    videoId: video.id?.videoId || null,
    publishedAt: video.snippet?.publishedAt,
    type: "Live Video"
  }));
}

function getFallbackArticles(selectedTopic) {
  return fallbackArticleNews.filter((item) => (normalizeTopic(item.topic) || inferTopic(`${item.title} ${item.summary || ""}`)) === selectedTopic);
}

function getFallbackVideos(selectedTopic) {
  return fallbackVideoNews.filter((item) => (normalizeTopic(item.topic) || inferTopic(`${item.title} ${item.summary || ""}`)) === selectedTopic);
}

async function fetchRawArticleCandidates(selectedTopic) {
  const apiKey = import.meta.env.VITE_GNEWS_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GNews key");
  }

  const responses = await Promise.all(
    getTopicQueries(selectedTopic).map(async (query) => {
      const encodedQuery = encodeURIComponent(query);
      const url = `${GNEWS_URL}?q=${encodedQuery}&lang=en&max=${QUERY_LIMIT}&sortby=publishedAt&token=${apiKey}`;
      const data = await fetchJson(url);
      return data.articles || [];
    })
  );

  return mapGNewsArticles(responses.flat(), selectedTopic);
}

async function fetchRawVideoCandidates(selectedTopic) {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing YouTube key");
  }

  const responses = await Promise.all(
    getTopicQueries(selectedTopic).map(async (query) => {
      const encodedQuery = encodeURIComponent(`${query} news analysis`);
      const url = `${YOUTUBE_URL}?part=snippet&type=video&order=date&maxResults=${QUERY_LIMIT}&q=${encodedQuery}&key=${apiKey}`;
      const data = await fetchJson(url);
      return data.items || [];
    })
  );

  return mapYouTubeVideos(responses.flat(), selectedTopic);
}

function pickLensBucket(buckets, preferredBias) {
  return buckets[normalizeLeaning(preferredBias)] || buckets.balanced;
}

function normalizeGithubArticles(items, selectedTopic) {
  return items.map((item, index) => ({
    id: item.id || `gh-article-${index}`,
    title: item.title || "Untitled article",
    source: item.source || item.publisher || "GitHub Source",
    topic: normalizeTopic(item.topic) || inferTopic(`${item.title || ""} ${item.summary || item.description || ""}`),
    summary: item.summary || item.description || "Imported from a GitHub JSON dataset.",
    image: item.image || item.imageUrl || item.thumbnail || null,
    link: item.link || item.url || "#",
    publishedAt: item.publishedAt || item.date || null,
    type: item.type || "GitHub Feed",
    leaning: item.leaning || pickSmartBucket(item, selectedTopic),
    keyPoints: item.keyPoints,
    content: item.content,
    readTime: item.readTime,
    pace: item.pace
  }));
}

function normalizeGithubVideos(items, selectedTopic) {
  return items.map((item, index) => ({
    id: item.id || `gh-video-${index}`,
    title: item.title || "Untitled video",
    source: item.source || item.channel || "GitHub Source",
    topic: normalizeTopic(item.topic) || inferTopic(`${item.title || ""} ${item.summary || item.description || ""}`),
    summary: item.summary || item.description || "Imported from a GitHub JSON dataset.",
    link: item.link || item.url || "#",
    embedUrl: item.embedUrl || null,
    videoId: item.videoId || null,
    publishedAt: item.publishedAt || item.date || null,
    type: item.type || "GitHub Video",
    leaning: item.leaning || pickSmartBucket(item, selectedTopic),
    keyMoments: item.keyMoments,
    transcriptIntro: item.transcriptIntro,
    duration: item.duration,
    pace: item.pace
  }));
}

export async function getArticleFeed(preferences) {
  const selectedTopic = normalizeTopic(preferences.selectedTopics[0]);
  const githubUrl = import.meta.env.VITE_GITHUB_NEWS_JSON_URL;

  try {
    const rawItems = githubUrl
      ? normalizeGithubArticles(await fetchGithubJson(githubUrl), selectedTopic)
      : [...(await fetchRawArticleCandidates(selectedTopic)), ...getFallbackArticles(selectedTopic)];

    const candidates = await classifyCandidates(prepareCandidates(rawItems, selectedTopic, enrichArticle));
    return pickLensBucket(buildLensBuckets(candidates, selectedTopic, "article"), preferences.preferredBias);
  } catch {
    const candidates = await classifyCandidates(prepareCandidates(getFallbackArticles(selectedTopic), selectedTopic, enrichArticle));
    return pickLensBucket(buildLensBuckets(candidates, selectedTopic, "article"), preferences.preferredBias);
  }
}

export async function getVideoFeed(preferences) {
  const selectedTopic = normalizeTopic(preferences.selectedTopics[0]);
  const githubUrl = import.meta.env.VITE_GITHUB_VIDEOS_JSON_URL;

  try {
    const rawItems = githubUrl
      ? normalizeGithubVideos(await fetchGithubJson(githubUrl), selectedTopic)
      : [...(await fetchRawVideoCandidates(selectedTopic)), ...getFallbackVideos(selectedTopic)];

    const candidates = await classifyCandidates(prepareCandidates(rawItems, selectedTopic, enrichVideo));
    return pickLensBucket(buildLensBuckets(candidates, selectedTopic, "video"), preferences.preferredBias);
  } catch {
    const candidates = await classifyCandidates(prepareCandidates(getFallbackVideos(selectedTopic), selectedTopic, enrichVideo));
    return pickLensBucket(buildLensBuckets(candidates, selectedTopic, "video"), preferences.preferredBias);
  }
}

export function getSourceMode() {
  if (import.meta.env.VITE_GITHUB_NEWS_JSON_URL || import.meta.env.VITE_GITHUB_VIDEOS_JSON_URL) {
    return "github";
  }

  if (import.meta.env.VITE_GNEWS_API_KEY || import.meta.env.VITE_YOUTUBE_API_KEY) {
    return "live-api";
  }

  return "fallback";
}

export function sourceModeLabel(mode) {
  if (mode === "github") return "GitHub dataset connected";
  if (mode === "live-api") return "Live APIs connected";
  return "Fallback data";
}

export function prettyTopicList(items) {
  return items.map((topic) => titleCase(topic)).join(", ");
}
