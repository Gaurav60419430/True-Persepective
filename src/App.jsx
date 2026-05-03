import { useEffect, useMemo, useState } from "react";
import { topics } from "./data/fallbackData";
import { getArticleFeed, getSourceMode, getVideoFeed, sourceModeLabel } from "./services/newsService";
import { sortByPreference } from "./utils/newsUtils";

const initialPreferences = {
  selectedTopics: ["Technology", "World", "Politics"],
  preferredBias: "balanced",
  preferredPace: "mixed"
};
const SESSION_KEY = "tp_session_user";

function App() {
  const [user, setUser] = useState(() => window.localStorage.getItem(SESSION_KEY) || "");
  const [authError, setAuthError] = useState("");
  const [preferences, setPreferences] = useState(initialPreferences);
  const [activeTab, setActiveTab] = useState("news");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [trendingIndex, setTrendingIndex] = useState(0);
  const [articles, setArticles] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sourceMode = getSourceMode();

  function login(credentials) {
    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password.trim();

    if (!email || !password) {
      setAuthError("Email and password are required.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setAuthError("Please enter a valid email address.");
      return;
    }

    setAuthError("");
    setUser(email);
    window.localStorage.setItem(SESSION_KEY, email);
  }

  function logout() {
    setUser("");
    window.localStorage.removeItem(SESSION_KEY);
  }

  useEffect(() => {
    let alive = true;

    async function loadFeeds() {
      setLoading(true);
      setError("");

      try {
        const [articleItems, videoItems] = await Promise.all([
          getArticleFeed(preferences),
          getVideoFeed(preferences)
        ]);

        if (!alive) return;

        setArticles(articleItems);
        setVideos(videoItems);
      } catch (err) {
        if (!alive) return;
        setError(err.message || "Unable to load feeds right now.");
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    loadFeeds();
    return () => {
      alive = false;
    };
  }, [preferences]);

  const rankedArticles = useMemo(() => sortByPreference(articles, preferences), [articles, preferences]);
  const rankedVideos = useMemo(() => sortByPreference(videos, preferences), [videos, preferences]);
  const featuredArticle = rankedArticles[0];
  const featuredVideo = rankedVideos[0];
  const trendingSlides = useMemo(() => chunkItems(rankedArticles.slice(0, 9), 3), [rankedArticles]);
  const activeTrendingSlide = trendingSlides[trendingIndex] || [];
  const hasNews = rankedArticles.length > 0;
  const hasVideos = rankedVideos.length > 0;

  useEffect(() => {
    setTrendingIndex(0);
  }, [trendingSlides.length]);

  useEffect(() => {
    if (trendingSlides.length <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      setTrendingIndex((current) => (current + 1) % trendingSlides.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [trendingSlides]);

  function toggleTopic(topic) {
    setPreferences((current) => {
      const selected = current.selectedTopics.includes(topic)
        ? current.selectedTopics.filter((item) => item !== topic)
        : [...current.selectedTopics, topic];

      return {
        ...current,
        selectedTopics: selected.length ? selected : [topic]
      };
    });
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

  function showPreviousTrending() {
    if (!trendingSlides.length) return;
    setTrendingIndex((current) => (current - 1 + trendingSlides.length) % trendingSlides.length);
  }

  function showNextTrending() {
    if (!trendingSlides.length) return;
    setTrendingIndex((current) => (current + 1) % trendingSlides.length);
  }

  if (selectedArticle) {
    return <ArticleDetail article={selectedArticle} onBack={closeArticle} />;
  }

  if (selectedVideo) {
    return <VideoDetail video={selectedVideo} onBack={closeVideo} />;
  }

  if (!user) {
    return <LoginPage onLogin={login} error={authError} />;
  }

  return (
    <div className="page-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">D</div>
          <div>
            <p className="brand-name">True Perspective</p>
            <p className="brand-tag">Personalized signals across article and video news</p>
          </div>
        </div>
        <div className="topbar-account">
          <span className="mini-pill">{user}</span>
          <button className="ghost-btn" type="button" onClick={logout}>
            Log out
          </button>
        </div>
      </div>

      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">CURATED SIGNALS</p>
          <h1>Your personalized news project for articles, videos, and political leaning insights.</h1>
          <p className="hero-text">
            This platform recommends article news and video news based on user interests, then labels each story as left-leaning, right-leaning, or balanced for quick comparison.
          </p>
          <div className="hero-metrics">
            <div className="metric-tile">
              <strong>{rankedArticles.length || 0}</strong>
              <span>article picks</span>
            </div>
            <div className="metric-tile">
              <strong>{rankedVideos.length || 0}</strong>
              <span>video picks</span>
            </div>
            <div className="metric-tile">
              <strong>{preferences.preferredBias}</strong>
              <span>current lens</span>
            </div>
          </div>
        </div>

        <div className="hero-panel">
          <div className="hero-panel-head">
            <div>
              <p className="panel-label">Trending now</p>
              <h2>Live perspective board</h2>
            </div>
            <span className="mini-pill">{sourceModeLabel(sourceMode)}</span>
          </div>

          {trendingSlides.length ? (
            <>
              <div className="trending-carousel">
                <button className="trending-arrow" type="button" aria-label="Previous trending stories" onClick={showPreviousTrending}>
                  &#8249;
                </button>

                <div key={`slide-${trendingIndex}`} className="trending-board trending-board-animated">
                  {activeTrendingSlide.map((item, index) => (
                    <button
                      key={`${item.id}-${index}`}
                      className="trending-story"
                      type="button"
                      style={getTrendingCardStyle(item)}
                      onClick={() => openArticle(item)}
                      aria-label={`Open trending story: ${item.title}`}
                    >
                      <span className="trending-rank">0{trendingIndex * 3 + index + 1}</span>
                      <div className="trending-copy">
                        <span className="trending-source">{item.source}</span>
                        <h3>{item.title}</h3>
                        <p>{item.summary}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <button className="trending-arrow" type="button" aria-label="Next trending stories" onClick={showNextTrending}>
                  &#8250;
                </button>
              </div>

              <div className="trending-indicators" aria-label="Trending slide indicators">
                {trendingSlides.map((_, index) => (
                  <button
                    key={`indicator-${index}`}
                    className={`trending-dot ${index === trendingIndex ? "active" : ""}`}
                    type="button"
                    aria-label={`Show trending slide ${index + 1}`}
                    onClick={() => setTrendingIndex(index)}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="status-message">Trending stories will appear here once recommendations load.</p>
          )}
        </div>
      </header>

      {!loading && featuredArticle && featuredVideo ? (
        <section className="spotlight-grid">
          <FeaturePanel
            kicker="Editor's Pick"
            title={featuredArticle.title}
            text={featuredArticle.summary}
            meta={`${featuredArticle.source} - ${featuredArticle.topic} - ${featuredArticle.publishedLabel || "Recent"}`}
            leaning={featuredArticle.leaning}
            ctaLabel={featuredArticle.isInternal ? "Read article" : "Open article"}
            onClick={() => openArticle(featuredArticle)}
          />
          <FeaturePanel
            kicker="Video Spotlight"
            title={featuredVideo.title}
            text={featuredVideo.summary}
            meta={`${featuredVideo.source} - ${featuredVideo.topic} - ${featuredVideo.publishedLabel || "Recent"}`}
            leaning={featuredVideo.leaning}
            ctaLabel={featuredVideo.isInternal ? "Watch video" : "Open video"}
            onClick={() => openVideo(featuredVideo)}
          />
        </section>
      ) : null}

      <main className="dashboard" id="main-content">
        <section className="preferences card">
          <div className="section-head">
            <div>
              <p className="section-kicker">Preference Engine</p>
              <h2>Shape your recommendations</h2>
            </div>
            <button className="ghost-btn" type="button" onClick={resetPreferences}>
              Reset taste profile
            </button>
          </div>

          <div className="control-grid">
            <div>
              <label className="control-title">Topics</label>
              <div className="chip-group">
                {topics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    className={`chip ${preferences.selectedTopics.includes(topic) ? "active" : ""}`}
                    onClick={() => toggleTopic(topic)}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="control-title" htmlFor="biasSelect">
                Political lens
              </label>
              <select
                id="biasSelect"
                className="select-control"
                value={preferences.preferredBias}
                onChange={(event) => setPreferences((current) => ({ ...current, preferredBias: event.target.value }))}
              >
                <option value="balanced">Balanced</option>
                <option value="left">Prefer left-leaning coverage</option>
                <option value="right">Prefer right-leaning coverage</option>
              </select>
            </div>

            <div>
              <label className="control-title" htmlFor="paceSelect">
                News pace
              </label>
              <select
                id="paceSelect"
                className="select-control"
                value={preferences.preferredPace}
                onChange={(event) => setPreferences((current) => ({ ...current, preferredPace: event.target.value }))}
              >
                <option value="mixed">Mixed</option>
                <option value="breaking">Mostly breaking stories</option>
                <option value="analysis">Mostly deep analysis</option>
              </select>
            </div>
          </div>
        </section>

        <section className="content card">
          <div className="tabs" role="tablist" aria-label="News modes">
            <button
              className={`tab ${activeTab === "news" ? "active" : ""}`}
              type="button"
              role="tab"
              id="tab-news"
              aria-controls="panel-news"
              aria-selected={activeTab === "news"}
              onClick={() => setActiveTab("news")}
            >
              News Recommendation System
            </button>
            <button
              className={`tab ${activeTab === "videos" ? "active" : ""}`}
              type="button"
              role="tab"
              id="tab-videos"
              aria-controls="panel-videos"
              aria-selected={activeTab === "videos"}
              onClick={() => setActiveTab("videos")}
            >
              Video News Recommendation
            </button>
          </div>

          {error ? <p className="status-message error" aria-live="polite">{error}</p> : null}
          {loading ? <p className="status-message" aria-live="polite">Loading recommendations...</p> : null}

          {!loading && (
            <div className="tab-panels">
              <section
                className={`tab-panel ${activeTab === "news" ? "active" : ""}`}
                role="tabpanel"
                id="panel-news"
                aria-labelledby="tab-news"
                hidden={activeTab !== "news"}
              >
                <div className="panel-header">
                  <div>
                    <p className="section-kicker">Articles</p>
                    <h3>Recommended news for your profile</h3>
                  </div>
                  <p className="panel-note">Each card shows a quick political-leaning marker.</p>
                </div>
                <div className="card-grid">
                  {hasNews ? rankedArticles.map((item) => (
                    <StoryCard key={item.id} item={item} mode="news" onArticleOpen={openArticle} />
                  )) : <p className="status-message">No article recommendations matched this filter yet.</p>}
                </div>
              </section>

              <section
                className={`tab-panel ${activeTab === "videos" ? "active" : ""}`}
                role="tabpanel"
                id="panel-videos"
                aria-labelledby="tab-videos"
                hidden={activeTab !== "videos"}
              >
                <div className="panel-header">
                  <div>
                    <p className="section-kicker">Videos</p>
                    <h3>Video news suggestions matched to your taste</h3>
                  </div>
                  <p className="panel-note">Short explainers, live coverage, and deeper breakdowns.</p>
                </div>
                <div className="card-grid">
                  {hasVideos ? rankedVideos.map((item) => (
                    <StoryCard key={item.id} item={item} mode="videos" onArticleOpen={openArticle} onVideoOpen={openVideo} />
                  )) : <p className="status-message">No video recommendations matched this filter yet.</p>}
                </div>
              </section>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function LoginPage({ onLogin, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onLogin({ email, password });
  }

  return (
    <div className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <p className="eyebrow">WELCOME</p>
        <h1 id="login-title">Sign in to True Perspective</h1>
        <p className="hero-text">Access your personalized news and video recommendations with your account.</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="control-title" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="input-control"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
          <label className="control-title" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="input-control"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
          />
          {error ? <p className="status-message error" aria-live="polite">{error}</p> : null}
          <button className="watch-btn login-btn" type="submit">
            Sign in
          </button>
        </form>
      </section>
    </div>
  );
}

function StoryCard({ item, mode, onArticleOpen, onVideoOpen }) {
  return (
    <article className="story-card">
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

function FeaturePanel({ kicker, title, text, meta, leaning, ctaLabel, onClick }) {
  return (
    <article className="feature-panel">
      <div className="feature-topline">
        <span className="story-type">{kicker}</span>
        <span className={`leaning-badge ${leaning}`}>{formatLeaning(leaning)}</span>
      </div>
      <h3>{title}</h3>
      <p className="summary">{text}</p>
      <p className="feature-meta">{meta}</p>
      <button className="watch-btn" type="button" onClick={onClick}>
        {ctaLabel}
      </button>
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
              This recommendation uses an internal summary page so you can review the story, key moments, and topic framing even when a direct
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
          <p>This internal page keeps the selected topic and political lane intact for the recommendation you clicked.</p>
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

function chunkItems(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

const fallbackTrendingImages = [
  "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"
];

function getTrendingCardStyle(item) {
  const fallbackIndex = hashStringToIndex(String(item.id || item.title || item.source), fallbackTrendingImages.length);
  const cardImage = item.image || fallbackTrendingImages[fallbackIndex];
  return {
    backgroundImage: `linear-gradient(90deg, rgba(11, 12, 14, 0.88), rgba(11, 12, 14, 0.62)), url("${cardImage}")`
  };
}

function hashStringToIndex(value, length) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2147483647;
  }

  return Math.abs(hash) % length;
}

export default App;
