import { useEffect, useMemo, useState } from "react";
import { getArticleFeed, getVideoFeed } from "./services/newsService";
import { sortByPreference } from "./utils/newsUtils";

const REFRESH_INTERVAL_MS = 120000;
const lensOptions = ["left", "balanced", "right"];

const ALL_TOPICS = ["Technology", "Politics", "Business", "Climate", "World", "Sports", "Health", "Culture"];

const initialPreferences = {
  selectedTopics: ["all"],
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedTopic = preferences.selectedTopics[0];
  const selectedLensIndex = lensOptions.indexOf(preferences.preferredBias);

  useEffect(() => {
    let alive = true;

    async function loadFeeds(showLoadingState, isManualRefresh = false) {
      if (showLoadingState) {
        setLoading(true);
      }
      if (isManualRefresh) {
        setIsRefreshing(true);
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
        if (alive && isManualRefresh) {
          setIsRefreshing(false);
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

  function toggleTopic(topic) {
    setPreferences((current) => ({
      ...current,
      selectedTopics: [topic]
    }));
  }

  function resetPreferences() {
    setPreferences(initialPreferences);
  }

  function manualRefresh() {
    if (isRefreshing || loading) return;

    setLoading(true);
    setIsRefreshing(true);

    Promise.all([
      getArticleFeed(preferences),
      getVideoFeed(preferences)
    ]).then(([articleItems, videoItems]) => {
      setArticles(articleItems);
      setVideos(videoItems);
      setLastUpdated(Date.now());
    }).catch((err) => {
      setError(err.message || "Unable to load feeds right now.");
    }).finally(() => {
      setLoading(false);
      setIsRefreshing(false);
    });
  }

  function openArticle(item) {
    if (item.isInternal) {
      setSelectedArticle(item);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.open(item.link, "_blank", "noreferrer");
  }

  function openVideo(item) {
    if (item.isInternal) {
      setSelectedVideo(item);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.open(item.link, "_blank", "noreferrer");
  }

  if (selectedArticle) {
    return <ArticleDetail article={selectedArticle} onBack={() => setSelectedArticle(null)} />;
  }

  if (selectedVideo) {
    return <VideoDetail video={selectedVideo} onBack={() => setSelectedVideo(null)} />;
  }

  return (
    <div className="page-shell">
      <header className="app-header">
        <div className="app-brand">
          <div className="brand-mark">T</div>
          <div>
            <p className="brand-name">True Perspective</p>
            <p className="brand-subtitle">Unbiased news feed</p>
          </div>
        </div>
        <button className="icon-btn" type="button" onClick={resetPreferences} aria-label="Reset">
          &#8645;
        </button>
      </header>

      <div className="topic-bar">
        <button
          type="button"
          className={`topic-pill ${selectedTopic === "all" ? "active" : ""}`}
          onClick={() => toggleTopic("all")}
        >
          All
        </button>
        {ALL_TOPICS.map((topic) => (
          <button
            key={topic}
            type="button"
            className={`topic-pill ${selectedTopic === topic ? "active" : ""}`}
            onClick={() => toggleTopic(topic)}
          >
            {topic}
          </button>
        ))}
      </div>

      <main className="content-shell">
        <section className="control-bar">
          <div className="control-bar-left">
            <div className="bias-rail">
              <span className="bias-track" />
              <span className={`bias-thumb lens-${preferences.preferredBias}`} style={{ left: `${selectedLensIndex * 50}%` }} />
            </div>
            <div className="bias-labels">
              {lensOptions.map((lens) => (
                <button
                  key={lens}
                  type="button"
                  className={`bias-label ${preferences.preferredBias === lens ? "active" : ""}`}
                  onClick={() => setPreferences((current) => ({ ...current, preferredBias: lens }))}
                >
                  {lens === "balanced" ? "Center" : lens === "left" ? "Left" : "Right"}
                </button>
              ))}
            </div>
          </div>
          <div className="control-bar-right">
            <button
              type="button"
              className={`refresh-btn ${isRefreshing ? "spinning" : ""}`}
              onClick={manualRefresh}
              disabled={isRefreshing || loading}
              aria-label="Refresh feed"
            >
              <span className="refresh-icon">{isRefreshing ? "..." : "↻"}</span>
            </button>
          </div>
        </section>

        {lastUpdated && (
          <p className="last-updated">Updated {formatRefreshTime(lastUpdated)}</p>
        )}

        {error ? <p className="status-message error">{error}</p> : null}

        <section className="feed-section">
          <div className="tab-bar">
            <button
              type="button"
              className={`tab-btn ${activeTab === "news" ? "active" : ""}`}
              onClick={() => setActiveTab("news")}
            >
              Feed
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === "videos" ? "active" : ""}`}
              onClick={() => setActiveTab("videos")}
            >
              Explore
            </button>
          </div>

          <div className="tab-panels">
            <div className={`tab-panel ${activeTab === "news" ? "active" : ""}`}>
              {loading ? (
                <div className="skeleton-stack">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton-card">
                      <div className="skeleton-line" style={{ width: "70%" }}></div>
                      <div className="skeleton-line" style={{ width: "40%" }}></div>
                      <div className="skeleton-line" style={{ width: "90%" }}></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="feed-stack">
                  {rankedArticles.map((item) => (
                    <StoryCard key={item.id} item={item} mode="news" onArticleOpen={openArticle} />
                  ))}
                </div>
              )}
            </div>

            <div className={`tab-panel ${activeTab === "videos" ? "active" : ""}`}>
              <div className="feed-stack">
                {rankedVideos.map((item) => (
                  <StoryCard key={item.id} item={item} mode="videos" onArticleOpen={openArticle} onVideoOpen={openVideo} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <nav className="bottom-bar">
        <button
          type="button"
          className={`nav-btn ${activeTab === "news" ? "active" : ""}`}
          onClick={() => setActiveTab("news")}
        >
          <span className="nav-icon">▦</span>
          <span>Feed</span>
        </button>
        <button
          type="button"
          className={`nav-btn ${activeTab === "videos" ? "active" : ""}`}
          onClick={() => setActiveTab("videos")}
        >
          <span className="nav-icon">◌</span>
          <span>Explore</span>
        </button>
      </nav>
    </div>
  );
}

function StoryCard({ item, mode, onArticleOpen, onVideoOpen }) {
  return (
    <article className="story-card" onClick={() => (mode === "videos" ? onVideoOpen(item) : onArticleOpen(item))}>
      <div className="story-header">
        <span className="story-type">{item.type}</span>
        <span className={`leaning-badge ${item.leaning}`}>{formatLeaning(item.leaning)}</span>
      </div>
      <h4>{item.title}</h4>
      <div className="story-meta">
        <span>{item.source}</span>
        <span>{mode === "news" ? item.readTime : item.duration}</span>
      </div>
      <p className="story-summary">{item.summary}</p>
      <div className="story-footer">
        <span className="score-badge">Match {item.score}%</span>
        <span className="read-btn">{mode === "news" ? "Read" : "Watch"}</span>
      </div>
    </article>
  );
}

function ArticleDetail({ article, onBack }) {
  return (
    <div className="page-shell article-shell">
      <div className="detail-header">
        <button type="button" className="back-btn" onClick={onBack}>
          Back
        </button>
        <span className={`leaning-badge ${article.leaning}`}>{formatLeaning(article.leaning)}</span>
      </div>
      <article className="article-content">
        <span className="story-type">{article.type}</span>
        <h1>{article.title}</h1>
        <div className="meta">
          <span>{article.source}</span>
          <span>{article.readTime}</span>
          <span>{article.topic}</span>
        </div>
        <p className="summary">{article.summary}</p>
        {article.keyPoints?.length ? (
          <section className="highlights">
            <h3>Key points</h3>
            <ul>
              {article.keyPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </div>
  );
}

function VideoDetail({ video, onBack }) {
  return (
    <div className="page-shell article-shell">
      <div className="detail-header">
        <button type="button" className="back-btn" onClick={onBack}>
          Back
        </button>
        <span className={`leaning-badge ${video.leaning}`}>{formatLeaning(video.leaning)}</span>
      </div>
      <article className="article-content">
        <span className="story-type">{video.type}</span>
        <h1>{video.title}</h1>
        <div className="meta">
          <span>{video.source}</span>
          <span>{video.duration}</span>
          <span>{video.topic}</span>
        </div>
        <p className="summary">{video.summary}</p>
        {video.keyMoments?.length ? (
          <section className="highlights">
            <h3>Key moments</h3>
            <ul>
              {video.keyMoments.map((moment) => (
                <li key={moment}>{moment}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </div>
  );
}

function formatLeaning(leaning) {
  if (leaning === "left") return "Left";
  if (leaning === "right") return "Right";
  return "Balanced";
}

function formatRefreshTime(value) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export default App;