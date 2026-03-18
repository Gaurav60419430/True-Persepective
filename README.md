# PulsePoint News

Two-tab personalized news website with article recommendations, video recommendations, and a quick left-leaning or right-leaning indicator for each item.

## Features

- React + Vite app
- News Recommendation System tab
- Video News Recommendation tab
- Topic, political lens, and pace preferences
- Live API support for GNews and YouTube Data API
- GitHub JSON dataset support for combining a premade repo into the site
- Automatic fallback data when no API key is set

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill values if you want live data:

```bash
copy .env.example .env
```

3. Start the app:

```bash
npm run dev
```

## Environment Variables

- `VITE_GNEWS_API_KEY`: GNews API key for article news
- `VITE_YOUTUBE_API_KEY`: YouTube Data API key for video news
- `VITE_GITHUB_NEWS_JSON_URL`: raw GitHub JSON URL for article items
- `VITE_GITHUB_VIDEOS_JSON_URL`: raw GitHub JSON URL for video items

## GitHub Repo Integration

If you already have a premade GitHub repo with news/video JSON, convert the raw files into arrays.

### Article item shape

```json
[
  {
    "title": "Sample headline",
    "source": "Example News",
    "topic": "Technology",
    "leaning": "left",
    "pace": "analysis",
    "summary": "Short description",
    "link": "https://example.com/story",
    "type": "Imported Article",
    "publishedAt": "2026-03-18T08:00:00Z"
  }
]
```

### Video item shape

```json
[
  {
    "title": "Sample video",
    "channel": "Example Channel",
    "topic": "Politics",
    "leaning": "right",
    "pace": "breaking",
    "summary": "Short description",
    "link": "https://youtube.com/watch?v=abc123",
    "type": "Imported Video",
    "duration": "10 min",
    "publishedAt": "2026-03-18T08:00:00Z"
  }
]
```

If `topic`, `leaning`, or `pace` are missing, the app infers them from the title, source, and summary.

## Notes

- For a production app, move API calls to a backend so keys are not exposed in the browser.
- The left/right label is a heuristic marker, not a definitive political fact checker.
