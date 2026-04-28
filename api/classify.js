const HF_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli";
const LABELS = ["left-leaning", "right-leaning", "neutral"];

function mapLabel(label = "") {
  const normalized = label.toLowerCase();

  if (normalized.includes("left")) return "left";
  if (normalized.includes("right")) return "right";
  return "balanced";
}

async function classifyText(item, token) {
  const text = [item.source, item.title, item.summary]
    .filter(Boolean)
    .join(". ")
    .slice(0, 1200);

  const response = await fetch(HF_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inputs: text,
      parameters: {
        candidate_labels: LABELS,
        multi_label: false
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Hugging Face request failed with ${response.status}`);
  }

  const data = await response.json();
  const label = data.labels?.[0] || "neutral";
  const score = data.scores?.[0] || 0;

  return {
    id: item.id,
    leaning: mapLabel(label),
    label,
    confidence: score
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.HUGGINGFACE_API_TOKEN;
  if (!token) {
    return res.status(200).json({ classifications: [] });
  }

  try {
    const items = Array.isArray(req.body?.items) ? req.body.items.slice(0, 36) : [];
    const classifications = [];

    for (const item of items) {
      classifications.push(await classifyText(item, token));
    }

    return res.status(200).json({ classifications });
  } catch (error) {
    return res.status(200).json({ classifications: [], error: error.message });
  }
}
