import { fallbackArticleNews, fallbackVideoNews } from "../data/fallbackData";
import {
  estimateReadTime,
  formatPublishedDate,
  inferLeaning,
  inferPace,
  inferTopic,
  titleCase
} from "../utils/newsUtils";

const GNEWS_URL = "https://gnews.io/api/v4/search";
const YOUTUBE_URL = "https://www.googleapis.com/youtube/v3/search";

function buildQuery(topics) {
  return topics.length ? topics.join(" OR ") : "latest news";
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

function normalizeGithubArticles(items) {
  return items.map((item, index) => ({
    id: item.id || `gh-article-${index}`,
    title: item.title || "Untitled article",
    source: item.source || item.publisher || "GitHub Source",
    topic: item.topic || inferTopic(`${item.title || ""} ${item.summary || item.description || ""}`),
    leaning: item.leaning || inferLeaning(item.source, item.title, item.summary || item.description),
    pace: item.pace || inferPace(`${item.title || ""} ${item.summary || item.description || ""}`),
    readTime: item.readTime || estimateReadTime(item.summary || item.description || item.title),
    summary: item.summary || item.description || "Imported from a GitHub JSON dataset.",
    image: item.image || item.imageUrl || item.thumbnail || null,
    link: item.link || item.url || "#",
    isInternal: Boolean(item.isInternal),
    type: item.type || "GitHub Feed",
    publishedAt: item.publishedAt || item.date || null
  }));
}

function normalizeGithubVideos(items) {
  return items.map((item, index) => ({
    id: item.id || `gh-video-${index}`,
    title: item.title || "Untitled video",
    source: item.source || item.channel || "GitHub Source",
    topic: item.topic || inferTopic(`${item.title || ""} ${item.summary || item.description || ""}`),
    leaning: item.leaning || inferLeaning(item.source || item.channel, item.title, item.summary || item.description),
    pace: item.pace || inferPace(`${item.title || ""} ${item.summary || item.description || ""}`),
    duration: item.duration || "Watch",
    summary: item.summary || item.description || "Imported from a GitHub JSON dataset.",
    link: item.link || item.url || "#",
    embedUrl: item.embedUrl || null,
    videoId: item.videoId || null,
    isInternal: Boolean(item.isInternal),
    type: item.type || "GitHub Video",
    publishedAt: item.publishedAt || item.date || null
  }));
}

async function fetchGNewsArticles(topics) {
  const apiKey = import.meta.env.VITE_GNEWS_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GNews key");
  }

  const query = encodeURIComponent(buildQuery(topics));
  const url = `${GNEWS_URL}?q=${query}&lang=en&max=12&token=${apiKey}`;
  const data = await fetchJson(url);

  return (data.articles || []).map((article, index) => ({
    id: article.url || `gnews-${index}`,
    title: article.title,
    source: article.source?.name || "GNews",
    topic: inferTopic(`${article.title} ${article.description || ""}`),
    leaning: inferLeaning(article.source?.name, article.title, article.description),
    pace: inferPace(`${article.title} ${article.description || ""}`),
    readTime: estimateReadTime(article.description || article.content || article.title),
    summary: article.description || "Live news fetched from GNews.",
    image: article.image || null,
    link: article.url,
    isInternal: false,
    type: "Live Article",
    publishedAt: article.publishedAt,
    publishedLabel: formatPublishedDate(article.publishedAt)
  }));
}

async function fetchYouTubeVideos(topics) {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing YouTube key");
  }

  const query = encodeURIComponent(`${buildQuery(topics)} news`);
  const url = `${YOUTUBE_URL}?part=snippet&type=video&maxResults=12&q=${query}&key=${apiKey}`;
  const data = await fetchJson(url);

  return (data.items || []).map((video, index) => ({
    id: video.id?.videoId || `yt-${index}`,
    title: video.snippet?.title || "Video briefing",
    source: video.snippet?.channelTitle || "YouTube",
    topic: inferTopic(`${video.snippet?.title || ""} ${video.snippet?.description || ""}`),
    leaning: inferLeaning(video.snippet?.channelTitle, video.snippet?.title, video.snippet?.description),
    pace: inferPace(`${video.snippet?.title || ""} ${video.snippet?.description || ""}`),
    duration: "YouTube",
    summary: video.snippet?.description || "Live video news fetched from YouTube.",
    link: `https://www.youtube.com/watch?v=${video.id?.videoId}`,
    embedUrl: video.id?.videoId ? `https://www.youtube-nocookie.com/embed/${video.id.videoId}` : null,
    videoId: video.id?.videoId || null,
    isInternal: false,
    type: "Live Video",
    publishedAt: video.snippet?.publishedAt,
    publishedLabel: formatPublishedDate(video.snippet?.publishedAt)
  }));
}

export async function getArticleFeed(selectedTopics) {
  const githubUrl = import.meta.env.VITE_GITHUB_NEWS_JSON_URL;

  try {
    if (githubUrl) {
      const githubItems = await fetchGithubJson(githubUrl);
      return normalizeGithubArticles(githubItems);
    }

    return await fetchGNewsArticles(selectedTopics);
  } catch {
    return fallbackArticleNews.map((item) => ({
      ...item,
      publishedLabel: formatPublishedDate(item.publishedAt)
    }));
  }
}

export async function getVideoFeed(selectedTopics) {
  const githubUrl = import.meta.env.VITE_GITHUB_VIDEOS_JSON_URL;

  try {
    if (githubUrl) {
      const githubItems = await fetchGithubJson(githubUrl);
      return normalizeGithubVideos(githubItems);
    }

    return await fetchYouTubeVideos(selectedTopics);
  } catch {
    return fallbackVideoNews.map((item) => ({
      ...item,
      publishedLabel: formatPublishedDate(item.publishedAt)
    }));
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
  return "Demo fallback data";
}

export function prettyTopicList(items) {
  return items.map((topic) => titleCase(topic)).join(", ");
}
