import Issue from "../issues/issue.model.js";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-70b-versatile";
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const fallbackRecommendation = [
  "Inspect the issue location and gather a clear photo or note.",
  "Report it to the relevant authority or responsible community contact.",
  "Monitor follow-up progress and update the status once action is taken.",
];

const topicGuides = {
  "water-saving": {
    label: "water saving",
    angle: "focus on reducing waste at home, at the tap, and in daily routines",
    priorities: [
      "Stop leaks first because they are the fastest hidden waste source.",
      "Use bucket, aerator, and full-load habits before buying bigger solutions.",
      "Reuse clean greywater for non-drinking tasks where safe.",
    ],
  },
  "reuse-and-recycling": {
    label: "reuse and recycling",
    angle: "focus on turning safe wastewater into a second use stream",
    priorities: [
      "Separate greywater from contaminated water whenever possible.",
      "Reuse RO reject water, AC condensate, and wash water for utility tasks.",
      "Keep soaps and cleaners eco-friendly if water will be reused on plants or floors.",
    ],
  },
  "issue-writing": {
    label: "issue reporting",
    angle: "focus on writing a report that gets action quickly",
    priorities: [
      "State what is happening, where it is happening, and how severe it is.",
      "Add a photo, exact location, and a direct impact note.",
      "Use clear, factual language so the issue is easy to route and verify.",
    ],
  },
  "community-actions": {
    label: "community action",
    angle: "focus on habits, outreach, and shared responsibility",
    priorities: [
      "Make the action visible and easy for neighbors to repeat.",
      "Combine education with one small measurable task.",
      "Track outcomes publicly so people feel progress, not just advice.",
    ],
  },
};

const buildFallbackAssistantAnswer = (topic, prompt, tone = "detailed") => {
  const topicLabel = String(topic || "general").replaceAll("-", " ");
  const guide = topicGuides[topic] || topicGuides["water-saving"] || {
    angle: "focus on practical water use",
    priorities: [],
  };
  const intro =
    tone === "short"
      ? `For ${topicLabel}, start with the most practical step that ${guide.angle}.`
      : `For ${topicLabel}, the most useful approach is to ${guide.angle}.`;

  return [
    `Topic: ${topicLabel}`,
    "",
    intro,
    "",
    "Suggested answer:",
    tone === "short"
      ? `- ${prompt}`
      : `- Start with the clearest practical step related to: ${prompt}`,
    ...guide.priorities.map((item) => `- ${item}`),
  ].join("\n");
};

const generateLocalEmbedding = (text, dimensions = 32) => {
  const values = new Array(dimensions).fill(0);
  const normalized = String(text || "").toLowerCase();

  for (let i = 0; i < normalized.length; i += 1) {
    const code = normalized.charCodeAt(i);
    values[i % dimensions] += code / 255;
  }

  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0)) || 1;
  return values.map((value) => Number((value / magnitude).toFixed(6)));
};

const safeJsonParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const callGroq = async ({ system, user, temperature = 0.3, responseFormat = "text" }) => {
  if (!GROQ_API_KEY) {
    return null;
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format:
        responseFormat === "json"
          ? { type: "json_object" }
          : undefined,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || "";
};

export const generateEmbedding = async (text) => generateLocalEmbedding(text);

const normalizeTitle = (title = "") => String(title).trim().toLowerCase();

const issueDistanceScore = (a, b) => {
  if (!a?.location?.coordinates || !b?.location?.coordinates) return 0;
  const [lng1, lat1] = a.location.coordinates;
  const [lng2, lat2] = b.location.coordinates;
  const dx = lng1 - lng2;
  const dy = lat1 - lat2;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance === 0 ? 1 : Math.max(0, 1 / (1 + distance));
};

export const getRecommendations = async (issueId, tenantId) => {
  const issue = await Issue.findOne({ _id: issueId, tenantId }).lean();
  if (!issue) throw new Error("Issue not found");

  const prompt = `Issue title: ${issue.title}
Issue description: ${issue.description}
Severity: ${issue.severity}
Region: ${issue.region || "global"}

Return a JSON object with:
- recommendations: array of exactly 3 short, actionable steps
- summary: one sentence explaining the issue
- priority: one of LOW, MEDIUM, HIGH, CRITICAL`;

  try {
    const raw = await callGroq({
      system:
        "You are AquaVeda AI, a water-resilience assistant. Keep answers concise, practical, and community-friendly. Always return valid JSON when asked.",
      user: prompt,
      temperature: 0.2,
      responseFormat: "json",
    });

    if (!raw) {
      return {
        summary: "AI generated a fallback summary.",
        priority: issue.severity,
        recommendations: [
          `Focus on the most visible problem in: ${issue.title}`,
          "Record a photo, location, and time before reporting or repairing.",
          "Follow up with the responsible authority or community contact.",
        ],
      };
    }

    const parsed = safeJsonParse(raw, {});
    return {
      summary: parsed.summary || "No summary available.",
      priority: parsed.priority || issue.severity,
      recommendations: Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0
        ? parsed.recommendations.slice(0, 3)
        : [
            `Focus on the most visible problem in: ${issue.title}`,
            "Record a photo, location, and time before reporting or repairing.",
            "Follow up with the responsible authority or community contact.",
          ],
    };
  } catch (err) {
    console.error("Groq recommendation failed", err);
    return {
      summary: "AI generated a fallback summary.",
      priority: issue.severity,
      recommendations: [
        `Focus on the most visible problem in: ${issue.title}`,
        "Record a photo, location, and time before reporting or repairing.",
        "Follow up with the responsible authority or community contact.",
      ],
    };
  }
};

export const classifyIssue = async (title, description) => {
  const prompt = `Title: ${title}
Description: ${description}

Classify this water/community issue and return JSON with:
- isSpam: boolean
- category: one of WATER_LEAK, CONTAMINATION, INFRASTRUCTURE, GENERAL
- estimatedSeverity: one of LOW, MEDIUM, HIGH, CRITICAL
- reason: short explanation in one sentence`;

  try {
    const raw = await callGroq({
      system:
        "You classify civic and water-management issues. Be strict, accurate, and return only valid JSON.",
      user: prompt,
      temperature: 0,
      responseFormat: "json",
    });

    if (!raw) {
      return { isSpam: false, category: "GENERAL", estimatedSeverity: "LOW", reason: "Fallback classification used." };
    }

    return safeJsonParse(raw, { isSpam: false, category: "GENERAL", estimatedSeverity: "LOW", reason: "Fallback classification." });
  } catch (err) {
    console.error("Groq classification failed", err);
    return { isSpam: false, category: "GENERAL", estimatedSeverity: "LOW", reason: "Fallback classification used." };
  }
};

export const detectDuplicates = async (title, lng, lat, tenantId) => {
  try {
    const issueTitle = normalizeTitle(title);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const nearbyIssues = await Issue.find({
      tenantId,
      createdAt: { $gte: sevenDaysAgo },
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: 5000,
        },
      },
    })
      .select("title severity status location createdAt")
      .lean();

    const duplicates = nearbyIssues
      .map((issue) => {
        const normalized = normalizeTitle(issue.title);
        const titleSimilarity =
          normalized === issueTitle
            ? 1
            : Math.max(0, 1 - Math.min(1, Math.abs(normalized.length - issueTitle.length) / Math.max(1, Math.max(normalized.length, issueTitle.length))));
        const proximityScore = issueDistanceScore({ location: { coordinates: [lng, lat] } }, issue);
        const score = Math.round((titleSimilarity * 70) + (proximityScore * 30));

        return {
          issueId: issue._id,
          title: issue.title,
          similarity: score,
          severity: issue.severity,
          status: issue.status,
        };
      })
      .filter((item) => item.similarity >= 55)
      .sort((a, b) => b.similarity - a.similarity);

    return duplicates;
  } catch (err) {
    console.error("Duplicate detection failed", err);
    return [];
  }
};

const buildToneInstructions = (tone) => {
  if (tone === "short") {
    return {
      style: "short and direct",
      answerLength: "1-2 short paragraphs",
      stepCount: 3,
      extraNote: "Lead with the best answer immediately and avoid extra commentary.",
    };
  }

  if (tone === "step-by-step") {
    return {
      style: "step-by-step and practical",
      answerLength: "2 short paragraphs followed by concrete steps",
      stepCount: 5,
      extraNote: "Organize the answer as an action sequence with clear sequencing.",
    };
  }

  return {
    style: "detailed but concise",
    answerLength: "2-4 paragraphs with useful detail",
    stepCount: 4,
    extraNote: "Balance explanation with practical next steps.",
  };
};

export const answerAssistantQuestion = async (topic, prompt, tone = "detailed") => {
  const topicLabel = String(topic || "general").replaceAll("-", " ");
  const toneConfig = buildToneInstructions(tone);
  const guide = topicGuides[topic] || topicGuides["water-saving"] || {
    label: topicLabel,
    angle: "focus on practical water use",
    priorities: [],
  };
  const userPrompt = `Topic: ${topicLabel}
Tone: ${tone}
Question or request: ${prompt}

Return valid JSON with:
- answer: one concise, direct answer in 2-4 short paragraphs
- steps: array of exactly ${toneConfig.stepCount} practical steps
- quick_tip: one small tip the user can do today
- avoid: array of up to 3 common mistakes to avoid
- title: a short title for the response

Make the response specific, practical, and water-focused. The tone is ${toneConfig.style}. The answer length should be ${toneConfig.answerLength}. ${toneConfig.extraNote}

Topic guidance:
- Water saving: prioritize reducing waste, leaks, and routine savings.
- Reuse and recycling: prioritize safe greywater reuse and second-use planning.
- Issue reporting: prioritize clear facts, impact, location, and verification details.
- Community actions: prioritize outreach, participation, and measurable local change.

If the prompt is vague, interpret it in the most useful way for a water conservation/community platform. Avoid filler and generic advice.`;

  try {
    const raw = await callGroq({
      system:
        `You are AquaVeda AI, a supportive expert for ${guide.label}. Give optimized, specific, practical advice. Use simple language. Return only valid JSON. Always obey the selected tone: ${toneConfig.style}.`,
      user: userPrompt,
      temperature: tone === "short" ? 0.15 : tone === "step-by-step" ? 0.25 : 0.2,
      responseFormat: "json",
    });

    if (!raw) {
      return {
        title: `Practical guidance for ${topicLabel}`,
        answer: buildFallbackAssistantAnswer(topicLabel, prompt, tone),
        steps: tone === "step-by-step"
          ? [
              "Define the exact goal or problem.",
              "Choose the smallest fix that can work.",
              "Do the fix and confirm it is in place.",
              "Check the result after one day.",
              "Share the outcome with the community.",
            ]
          : [
              "Define the exact goal or problem.",
              "Choose the smallest practical fix.",
              "Measure the result after one day.",
              "Share what worked with others.",
            ],
        quick_tip: tone === "short"
          ? "Act on one small fix today."
          : "Use one small action today instead of waiting for a perfect plan.",
        avoid: ["Overcomplicating the fix", "Ignoring leaks or wastage", "Acting without measuring impact"],
      };
    }

    const parsed = safeJsonParse(raw, null);
    if (!parsed) {
      return {
        title: `Practical guidance for ${topicLabel}`,
        answer: raw,
        steps: [],
        quick_tip: tone === "short" ? "Choose the fastest useful action." : "Try the simplest fix first.",
        avoid: [],
      };
    }

    return {
      title: parsed.title || `Practical guidance for ${topicLabel}`,
      answer: parsed.answer || raw,
      steps: Array.isArray(parsed.steps) ? parsed.steps.slice(0, 4) : [],
      quick_tip: parsed.quick_tip || "Try the simplest fix first.",
      avoid: Array.isArray(parsed.avoid) ? parsed.avoid.slice(0, 3) : [],
    };
  } catch (err) {
    console.error("Groq assistant failed", err);
    return {
      title: `Practical guidance for ${topicLabel}`,
      answer: buildFallbackAssistantAnswer(topicLabel, prompt, tone),
      steps: tone === "step-by-step"
        ? [
            "Define the exact goal or problem.",
            "Choose the smallest fix that can work.",
            "Do the fix and confirm it is in place.",
            "Check the result after one day.",
            "Share the outcome with the community.",
          ]
        : [
            "Define the exact goal or problem.",
            "Choose the smallest practical fix.",
            "Measure the result after one day.",
            "Share what worked with others.",
          ],
      quick_tip: tone === "short"
        ? "Act on one small fix today."
        : "Use one small action today instead of waiting for a perfect plan.",
      avoid: ["Overcomplicating the fix", "Ignoring leaks or wastage", "Acting without measuring impact"],
    };
  }
};
