import { useEffect, useMemo, useState } from "react";
import { topics } from "./data/fallbackData";
import { getArticleFeed, getSourceMode, getVideoFeed, sourceModeLabel } from "./services/newsService";
import { sortByPreference } from "./utils/newsUtils";

const REFRESH_INTERVAL_MS = 120000;
const lensOptions = ["left", "balanced", "right"];
const topicPreviewMap = {
  Politics: "Policy Briefing",
  Technology: "Tech Policy",
  Business: "Market Signal",
  Climate: "Climate Watch",
  World: "World Brief",
  Sports: "Sports Desk",
  Health: "Health Note",
  Culture: "Culture Scan"
};

const initialPreferences = {
  selectedTopics: ["Technology"],
  preferredBias: "balanced",
  preferredPace: "mixed"
};

function App() {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [activeTab, setActiveTab] = useState("news");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [articles, setArticles] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const sourceMode = getSourceMode();
  const selectedTopic = preferences.selectedTopics[0];

  useEffect(() => {
    let alive = true;

    async function loadFeeds(showLoadingState) {
      if (showLoadingState) {
        setLoading(true);
      }

      setError("");

      try {
        const [articleItems, videoItems] = await Promise.all([
          getArticleFeed(preferences),
          getVideoFeed(preferences)
        ]);

        if (!alive) return;

        setArticles(articleItems);
        setVideos(videoItems);
        setLastUpdated(Date.now());
      } catch (err) {
        if (!alive) return;
        setError(err.message || "Unable to load feeds right now.");
      } finally {
        if (alive && showLoadingState) {
          setLoading(false);
        }
      }
    }

    loadFeeds(true);

    const refreshId = window.setInterval(() => {
      loadFeeds(false);
    }, REFRESH_INTERVAL_MS);

    return () => {
      alive = false;
      window.clearInterval(refreshId);
    };
  }, [preferences]);

  const rankedArticles = useMemo(() => sortByPreference(articles, preferences), [articles, preferences]);
  const rankedVideos = useMemo(() => sortByPreference(videos, preferences), [videos, preferences]);
  const featuredArticle = rankedArticles[0];
  const featuredVideo = rankedVideos[0];
  const secondaryArticle = rankedArticles[1];
  const selectedLensIndex = lensOptions.indexOf(preferences.preferredBias);

  function toggleTopic(topic) {
    setPreferences((current) => ({
      ...current,
      selectedTopics: [topic]
    }));
  }

  function resetPreferences() {
    setPreferences(initialPreferences);
  }

  function openArticle(item) {
    if (item.isInternal) {
      setSelectedArticle(item);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.open(item.link, "_blank", "noreferrer");
  }

  function closeArticle() {
    setSelectedArticle(null);
  }

  function openVideo(item) {
    if (item.isInternal) {
      setSelectedVideo(item);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.open(item.link, "_blank", "noreferrer");
  }

  function closeVideo() {
    setSelectedVideo(null);
  }

  if (selectedArticle) {
    return <ArticleDetail article={selectedArticle} onBack={closeArticle} />;
  }

  if (selectedVideo) {
    return <VideoDetail video={selectedVideo} onBack={closeVideo} />;
  }

  return (
    <div className="page-shell">
      <header className="editorial-header">
        <div className="editorial-brand">
          <div className="brand-mark">T</div>
          <div>
            <p className="brand-name">Editorial Focus</p>
            <p className="brand-subtitle">Intellectual workspace</p>
          </div>
        </div>
        <button className="icon-btn" type="button" onClick={resetPreferences} aria-label="Reset taste profile">
          &#9881;
        </button>
      </header>

      <main className="editorial-shell">
        <section className="editorial-section intro-section">
          <p className="eyebrow">Tailor Your Feed</p>
          <h1 className="editorial-title">Tailor Your Feed</h1>
          <p className="editorial-copy">Configure your intellectual workspace to match your reading preferences.</p>
        </section>

        <section className="editorial-section control-section">
          <div className="section-line">
            <span className="control-heading">Political Lens</span>
            <span className="control-aside">Bias Calibration</span>
          </div>

          <div className="bias-card">
            <div className="bias-rail">
              <span className="bias-track" />
              <span className={`bias-thumb lens-${preferences.preferredBias}`} style={{ left: `${selectedLensIndex * 50}%` }} />
            </div>
            <div className="bias-scale-labels">
              {lensOptions.map((lens) => (
                <button
                  key={lens}
                  type="button"
                  className={`bias-label ${preferences.preferredBias === lens ? "active" : ""}`}
                  onClick={() => setPreferences((current) => ({ ...current, preferredBias: lens }))}
                >
                  {lens === "balanced" ? "Center" : titleCaseLabel(lens)}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="editorial-section control-section">
          <div className="section-line">
            <span className="control-heading">Core Topics</span>
            <span className="info-badge">i</span>
          </div>

          <div className="topic-pill-grid">
            {topics.map((topic) => (
              <button
                key={topic}
                type="button"
                className={`topic-pill ${selectedTopic === topic ? "active" : ""}`}
                onClick={() => toggleTopic(topic)}
              >
                <span className="topic-pill-mark">{selectedTopic === topic ? "✓" : "+"}</span>
                {topic === "Business" ? "Finance" : topic}
              </button>
            ))}
          </div>
        </section>

        <section className="editorial-section control-section">
          <div className="section-line">
            <span className="control-heading">News Intensity</span>
          </div>

          <div className="intensity-switch" role="tablist" aria-label="News pace">
            <button
              type="button"
              className={`intensity-option ${preferences.preferredPace !== "breaking" ? "active" : ""}`}
              onClick={() => setPreferences((current) => ({ ...current, preferredPace: "analysis" }))}
            >
              <span className="intensity-icon">&#9783;</span>
              <span className="intensity-copy">
                <strong>Deep Dives</strong>
                <small>Longer context</small>
              </span>
            </button>
            <button
              type="button"
              className={`intensity-option ${preferences.preferredPace === "breaking" ? "active" : ""}`}
              onClick={() => setPreferences((current) => ({ ...current, preferredPace: "breaking" }))}
            >
              <span className="intensity-icon">&#9889;</span>
              <span className="intensity-copy">
                <strong>Quick Hits</strong>
                <small>Fast updates</small>
              </span>
            </button>
          </div>
        </section>

        <section className="editorial-section preview-section">
          <div className="section-line">
            <span className="control-heading">Live Preview</span>
            <span className="live-note">{loading ? "Updating live" : lastUpdated ? `Updated ${formatRefreshTime(lastUpdated)}` : sourceModeLabel(sourceMode)}</span>
          </div>

          {error ? <p className="status-message error">{error}</p> : null}
          {loading ? <p className="status-message">Loading recommendations...</p> : null}

          {!loading && featuredArticle ? (
            <button className="preview-hero-card" type="button" onClick={() => openArticle(featuredArticle)}>
              <div className="preview-hero-media" style={getPreviewCardStyle(featuredArticle)}>
                <span className="preview-tag">{topicPreviewMap[selectedTopic] || selectedTopic}</span>
              </div>
              <div className="preview-hero-body">
                <h2>{featuredArticle.title}</h2>
                <p>{featuredArticle.summary}</p>
                <div className="preview-meta-row">
                  <span className="preview-source">{featuredArticle.source}</span>
                  <span>{featuredArticle.readTime}</span>
                </div>
              </div>
            </button>
          ) : null}

          {!loading && secondaryArticle ? (
            <button className="preview-secondary-card" type="button" onClick={() => openArticle(secondaryArticle)}>
              <div className="preview-secondary-head">
                <span className="mini-outline">Analysis</span>
                <span className="preview-day">Today</span>
              </div>
              <h3>{secondaryArticle.title}</h3>
              <div className="preview-secondary-foot">
                <span className="preview-insight">Policy Insight</span>
              </div>
            </button>
          ) : null}
        </section>

        <section className="editorial-section feed-section">
          <div className="feed-switch" role="tablist" aria-label="News modes">
            <button
              className={`feed-switch-btn ${activeTab === "news" ? "active" : ""}`}
              type="button"
              role="tab"
              aria-selected={activeTab === "news"}
              onClick={() => setActiveTab("news")}
            >
              Feed
            </button>
            <button
              className={`feed-switch-btn ${activeTab === "videos" ? "active" : ""}`}
              type="button"
              role="tab"
              aria-selected={activeTab === "videos"}
              onClick={() => setActiveTab("videos")}
            >
              Explore
            </button>
          </div>

          {!loading && (
            <div className="tab-panels">
              <section className={`tab-panel ${activeTab === "news" ? "active" : ""}`} role="tabpanel">
                <div className="feed-stack">
                  {rankedArticles.map((item) => (
                    <StoryCard key={item.id} item={item} mode="news" onArticleOpen={openArticle} compact />
                  ))}
                </div>
              </section>

              <section className={`tab-panel ${activeTab === "videos" ? "active" : ""}`} role="tabpanel">
                <div className="feed-stack">
                  {rankedVideos.map((item) => (
                    <StoryCard key={item.id} item={item} mode="videos" onArticleOpen={openArticle} onVideoOpen={openVideo} compact />
                  ))}
                </div>
              </section>
            </div>
          )}
        </section>
      </main>

      <nav className="bottom-nav" aria-label="Primary navigation">
        <button type="button" className="bottom-nav-item">
          <span className="bottom-nav-icon">▦</span>
          <span>Feed</span>
        </button>
        <button type="button" className="bottom-nav-item">
          <span className="bottom-nav-icon">◌</span>
          <span>Explore</span>
        </button>
        <button type="button" className="bottom-nav-item active">
          <span className="bottom-nav-icon">▣</span>
          <span>Balance</span>
        </button>
        <button type="button" className="bottom-nav-item">
          <span className="bottom-nav-icon">◔</span>
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}

function StoryCard({ item, mode, onArticleOpen, onVideoOpen, compact = false }) {
  return (
    <article className={`story-card ${compact ? "compact" : ""}`}>
      <div className="story-top">
        <span className="story-type">{item.type}</span>
        <span className={`leaning-badge ${item.leaning}`}>{formatLeaning(item.leaning)}</span>
      </div>

      <div>
        <h4>{item.title}</h4>
        <div className="meta">
          <span>{item.source}</span>
          <span>{item.topic}</span>
          <span>{mode === "news" ? item.readTime : item.duration}</span>
          <span>{item.publishedLabel || "Recent"}</span>
        </div>
      </div>

      <p className="summary">{item.summary}</p>

      <div className="story-footer">
        <span className="score-badge">Match {item.score}%</span>
        {mode === "news" && item.isInternal ? (
          <button className="watch-btn" type="button" onClick={() => onArticleOpen(item)}>
            Read story
          </button>
        ) : mode === "videos" && item.isInternal ? (
          <button className="watch-btn" type="button" onClick={() => onVideoOpen(item)}>
            Watch video
          </button>
        ) : (
          <a className="watch-btn" href={item.link} target="_blank" rel="noreferrer">
            {mode === "news" ? "Read story" : "Watch video"}
          </a>
        )}
      </div>
    </article>
  );
}

function ArticleDetail({ article, onBack }) {
  return (
    <div className="page-shell article-shell">
      <div className="article-topbar">
        <button className="ghost-btn" type="button" onClick={onBack}>
          Back to recommendations
        </button>
        <span className={`leaning-badge ${article.leaning}`}>{formatLeaning(article.leaning)}</span>
      </div>

      <article className="article-detail">
        <div className="article-detail-header">
          <span className="story-type">{article.type}</span>
          <p className="eyebrow">Article page</p>
          <h1>{article.title}</h1>
          <div className="meta article-meta">
            <span>{article.source}</span>
            <span>{article.topic}</span>
            <span>{article.readTime}</span>
            <span>{article.publishedLabel || "Recent"}</span>
            {article.author ? <span>By {article.author}</span> : null}
          </div>
          <p className="article-intro">{article.summary}</p>
        </div>

        {article.keyPoints?.length ? (
          <section className="article-section article-highlights">
            <h3>Key points</h3>
            <ul>
              {article.keyPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="article-section article-body">
          {article.content?.map((paragraph, index) => (
            <p key={`${article.id}-${index}`}>{paragraph}</p>
          ))}
        </section>
      </article>
    </div>
  );
}

function VideoDetail({ video, onBack }) {
  return (
    <div className="page-shell article-shell">
      <div className="article-topbar">
        <button className="ghost-btn" type="button" onClick={onBack}>
          Back to videos
        </button>
        <span className={`leaning-badge ${video.leaning}`}>{formatLeaning(video.leaning)}</span>
      </div>

      <article className="article-detail video-detail">
        <div className="article-detail-header">
          <span className="story-type">{video.type}</span>
          <p className="eyebrow">Video page</p>
          <h1>{video.title}</h1>
          <div className="meta article-meta">
            <span>{video.source}</span>
            <span>{video.topic}</span>
            <span>{video.duration}</span>
            <span>{video.publishedLabel || "Recent"}</span>
            {video.host ? <span>Host {video.host}</span> : null}
          </div>
          <p className="article-intro">{video.summary}</p>
        </div>

        {video.embedUrl ? (
          <div className="video-frame-wrap">
            <iframe
              className="video-frame"
              src={video.embedUrl}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        ) : (
          <section className="article-section article-highlights">
            <h3>Video summary</h3>
            <p>
              This recommendation uses an internal summary page so you can still review the story, key moments, and topic framing even when a direct
              embedded video is not available.
            </p>
          </section>
        )}

        {video.keyMoments?.length ? (
          <section className="article-section article-highlights">
            <h3>Key moments</h3>
            <ul>
              {video.keyMoments.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="article-section article-body">
          <p>{video.transcriptIntro || video.summary}</p>
          <p>
            This internal page keeps the selected topic and political lane intact, so you can review the recommendation details even when the item is
            a generated same-topic filler used to keep the lane complete.
          </p>
        </section>
      </article>
    </div>
  );
}

function formatLeaning(leaning) {
  if (leaning === "left") return "Left-leaning";
  if (leaning === "right") return "Right-leaning";
  return "Balanced";
}

function getPreviewCardStyle(item) {
  if (!item.image) return undefined;

  return {
    backgroundImage: `linear-gradient(180deg, rgba(10, 10, 11, 0.15), rgba(10, 10, 11, 0.75)), url("${item.image}")`
  };
}

function titleCaseLabel(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatRefreshTime(value) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}

export default App;
