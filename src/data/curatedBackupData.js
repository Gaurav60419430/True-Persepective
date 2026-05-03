const topics = ["Politics", "Technology", "Business", "Climate", "World", "Sports", "Health", "Culture"];
const leanings = ["left", "balanced", "right"];

const articleTopicDetails = {
  Politics: {
    source: { left: "Civic Mirror", balanced: "Public Ledger", right: "Capitol Brief" },
    title: "policy shift reshapes the political agenda",
    summary: "Editors track how the latest moves are affecting lawmakers, voters, and campaign strategy.",
    type: "Policy Watch"
  },
  Technology: {
    source: { left: "Open Future", balanced: "Signal Desk", right: "Market Circuit" },
    title: "new technology rollout sparks debate across the sector",
    summary: "Coverage follows the product, regulation, and business consequences of the latest digital push.",
    type: "Tech Brief"
  },
  Business: {
    source: { left: "Labor Market Journal", balanced: "Street Monitor", right: "Enterprise Wire" },
    title: "fresh market moves put business leaders under pressure",
    summary: "Analysts unpack how investors, employers, and consumers are reacting to the latest economic signals.",
    type: "Market Watch"
  },
  Climate: {
    source: { left: "Earthline", balanced: "Weather Current", right: "Energy Ledger" },
    title: "new climate decisions are changing the energy conversation",
    summary: "The report follows adaptation plans, infrastructure strain, and the pace of environmental policy changes.",
    type: "Climate Report"
  },
  World: {
    source: { left: "Global Forum", balanced: "World Current", right: "Strategic Dispatch" },
    title: "regional tensions are forcing leaders to redraw priorities",
    summary: "Correspondents examine diplomacy, security, and trade as global relationships shift again.",
    type: "World Desk"
  },
  Sports: {
    source: { left: "Sideline Review", balanced: "Matchday Wire", right: "Victory Post" },
    title: "latest results are rewriting the sports conversation",
    summary: "The coverage looks at coaches, players, and momentum swings that are defining the current season.",
    type: "Sports Desk"
  },
  Health: {
    source: { left: "Care Journal", balanced: "Health Current", right: "Medical Ledger" },
    title: "new health findings are shifting patient care decisions",
    summary: "Editors break down what the latest studies and treatment updates could mean for providers and families.",
    type: "Health Update"
  },
  Culture: {
    source: { left: "Culture Ledger", balanced: "Arts Current", right: "Heritage Review" },
    title: "new releases are reshaping the culture conversation",
    summary: "Writers track how artists, audiences, and institutions are responding to the latest cultural moment.",
    type: "Culture Report"
  }
};

const videoTopicDetails = {
  Politics: {
    source: { left: "Civic Now", balanced: "Newsroom Live", right: "Statehouse Report" },
    title: "breaking politics briefing follows the latest moves",
    summary: "Anchors review the newest decisions, messaging battles, and what they could mean next.",
    type: "Politics Brief"
  },
  Technology: {
    source: { left: "Future Desk", balanced: "Tech Live", right: "Digital Market TV" },
    title: "technology update tracks the newest industry shift",
    summary: "Hosts cover the latest launches, regulation, and competitive pressure across the sector.",
    type: "Tech Video"
  },
  Business: {
    source: { left: "Labor Business Now", balanced: "Market Live", right: "Enterprise TV" },
    title: "business briefing explains today\'s market pressure",
    summary: "Presenters explain what the latest numbers mean for jobs, prices, and company strategy.",
    type: "Business Video"
  },
  Climate: {
    source: { left: "Climate Desk TV", balanced: "Weather Live", right: "Energy Watch" },
    title: "climate segment breaks down the newest environmental shift",
    summary: "The video looks at infrastructure, weather impacts, and new policy tradeoffs.",
    type: "Climate Video"
  },
  World: {
    source: { left: "Global Watch", balanced: "World Live", right: "Security Report TV" },
    title: "world update covers the newest international flashpoint",
    summary: "Hosts review diplomacy, security, and trade reactions from key capitals.",
    type: "World Video"
  },
  Sports: {
    source: { left: "Supporters Channel", balanced: "Sports Live", right: "Winning Edge TV" },
    title: "sports update follows the biggest result of the day",
    summary: "Analysts review the latest match, coaching decisions, and what changes in the standings.",
    type: "Sports Video"
  },
  Health: {
    source: { left: "Public Health Now", balanced: "Health Live", right: "Care Report TV" },
    title: "health briefing explains the latest medical update",
    summary: "The segment focuses on treatment guidance, research findings, and practical patient impact.",
    type: "Health Video"
  },
  Culture: {
    source: { left: "Arts Wire", balanced: "Culture Live", right: "Heritage TV" },
    title: "culture segment follows the newest release and reaction",
    summary: "Presenters discuss audience response, creative trends, and why the latest work is drawing attention.",
    type: "Culture Video"
  }
};

const leaningAngles = {
  left: [
    "with emphasis on labor rights and public accountability",
    "through a progressive lens focused on equity and oversight",
    "with attention to public services, worker impact, and reform",
    "highlighting community outcomes and institutional accountability"
  ],
  balanced: [
    "with a neutral breakdown of competing arguments",
    "through a straight news lens centered on facts and tradeoffs",
    "with a measured review of costs, benefits, and public reaction",
    "balancing expert analysis, official statements, and audience concerns"
  ],
  right: [
    "with emphasis on growth, security, and limited government",
    "through a conservative lens focused on market freedom and order",
    "highlighting deregulation, personal responsibility, and stability",
    "with attention to taxpayer impact, national strength, and tradition"
  ]
};

function makeArticle(topic, leaning, index) {
  const detail = articleTopicDetails[topic];
  const angle = leaningAngles[leaning][index % leaningAngles[leaning].length];
  const source = detail.source[leaning];

  return {
    id: `backup-article-${topic.toLowerCase()}-${leaning}-${index + 1}`,
    slug: `backup-${topic.toLowerCase()}-${leaning}-${index + 1}`,
    title: `${topic} outlook ${index + 1}: ${detail.title}`,
    source,
    topic,
    leaning,
    pace: index % 2 === 0 ? "breaking" : "analysis",
    readTime: `${4 + (index % 4)} min read`,
    summary: `${detail.summary} ${angle}.`,
    image: null,
    link: `https://example.com/${topic.toLowerCase()}/${leaning}/article-${index + 1}`,
    isInternal: false,
    type: detail.type,
    publishedAt: `2026-03-${String(10 + index).padStart(2, "0")}T0${index % 9}:00:00Z`
  };
}

function makeVideo(topic, leaning, index) {
  const detail = videoTopicDetails[topic];
  const angle = leaningAngles[leaning][index % leaningAngles[leaning].length];
  const source = detail.source[leaning];

  return {
    id: `backup-video-${topic.toLowerCase()}-${leaning}-${index + 1}`,
    title: `${topic} briefing ${index + 1}: ${detail.title}`,
    source,
    topic,
    leaning,
    pace: index % 2 === 0 ? "breaking" : "analysis",
    duration: `${3 + (index % 5)} min`,
    summary: `${detail.summary} ${angle}.`,
    link: `https://example.com/${topic.toLowerCase()}/${leaning}/video-${index + 1}`,
    embedUrl: null,
    videoId: `backup-${topic.toLowerCase()}-${leaning}-${index + 1}`,
    isInternal: false,
    type: detail.type,
    publishedAt: `2026-03-${String(10 + index).padStart(2, "0")}T1${index % 9}:30:00Z`
  };
}

export const curatedBackupArticles = topics.flatMap((topic) =>
  leanings.flatMap((leaning) => Array.from({ length: 12 }, (_, index) => makeArticle(topic, leaning, index)))
);

export const curatedBackupVideos = topics.flatMap((topic) =>
  leanings.flatMap((leaning) => Array.from({ length: 12 }, (_, index) => makeVideo(topic, leaning, index)))
);
