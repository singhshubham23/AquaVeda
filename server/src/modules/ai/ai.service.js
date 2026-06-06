import { GoogleGenerativeAI } from "@google/generative-ai";
import Issue from "../issues/issue.model.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy");

// Helper for Cosine Similarity
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const generateEmbedding = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (err) {
    console.error("Embedding generation failed", err);
    return []; // fallback if API key is missing
  }
};

export const getRecommendations = async (issueId, tenantId) => {
  const issue = await Issue.findOne({ _id: issueId, tenantId }).lean();
  if (!issue) {
    throw new Error("Issue not found");
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const prompt = `You are an AI assistant for a civic reporting platform. Provide 3 short, actionable recommendations for resolving the described issue. Return as a JSON array of strings in a 'recommendations' field.
Issue Title: ${issue.title}
Description: ${issue.description}
Severity: ${issue.severity}`;

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());
    return parsed.recommendations || ["No specific recommendation available"];
  } catch (err) {
    console.error("AI Recommendation failed", err);
    return ["Engage local authorities", "Monitor the situation", "Rely on community reports"];
  }
};

export const classifyIssue = async (title, description) => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const prompt = `You are an AI for a civic reporting platform. Classify the issue. Return JSON with 'isSpam' (boolean), 'category' (string: WATER_LEAK, CONTAMINATION, INFRASTRUCTURE, GENERAL), and 'estimatedSeverity' (string: LOW, MEDIUM, HIGH, CRITICAL).
Title: ${title}
Description: ${description}`;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (err) {
    console.error("AI Classification failed", err);
    return { isSpam: false, category: "GENERAL", estimatedSeverity: "LOW" };
  }
};

export const detectDuplicates = async (title, lng, lat, tenantId) => {
  try {
    const newEmbedding = await generateEmbedding(title);
    if (!newEmbedding || newEmbedding.length === 0) return []; // Fallback if API fails

    // Find issues within 5km from the last 7 days
    const maxDistance = 5000;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const nearbyIssues = await Issue.find({
      tenantId,
      createdAt: { $gte: sevenDaysAgo },
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: maxDistance
        }
      }
    }).select("title severity status location embedding").lean();

    const duplicates = [];
    
    for (const issue of nearbyIssues) {
      if (issue.embedding && issue.embedding.length > 0) {
        // Skip issues that have old 1536-dimensional embeddings to avoid crash
        if (issue.embedding.length !== newEmbedding.length) continue;

        const similarity = cosineSimilarity(newEmbedding, issue.embedding);
        // 0.85 threshold for embeddings
        if (similarity > 0.85) {
          duplicates.push({
            issueId: issue._id,
            title: issue.title,
            similarity: Math.round(similarity * 100),
            severity: issue.severity,
            status: issue.status
          });
        }
      }
    }

    return duplicates.sort((a, b) => b.similarity - a.similarity);
  } catch (err) {
    console.error("Duplicate detection failed", err);
    return [];
  }
};
