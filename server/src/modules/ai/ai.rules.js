export const rules = [
  {
    type: "recommendation",
    condition: (issue) =>
      issue.severity === "CRITICAL" &&
      issue.title.toLowerCase().includes("contamination"),
    result: [
      "Isolate water source immediately",
      "Use filtration systems",
      "Notify local health authorities",
      "Issue public advisory"
    ]
  },
  {
    type: "recommendation",
    condition: (issue) =>
      issue.severity === "HIGH" && issue.title.toLowerCase().includes("shortage"),
    result: [
      "Implement rainwater harvesting",
      "Use drip irrigation",
      "Reduce water wastage",
      "Ration distribution"
    ]
  },
  {
    type: "recommendation",
    condition: (issue) => issue.severity === "LOW",
    result: ["Monitor situation", "Promote water-saving habits"]
  },
  {
    type: "classification",
    condition: (title, desc) =>
      /leak|burst|pipe|broken/i.test(title) || /leak|burst|pipe|broken/i.test(desc),
    result: { category: "INFRASTRUCTURE", estimatedSeverity: "MEDIUM" }
  },
  {
    type: "classification",
    condition: (title, desc) =>
      /dry|shortage|drought|empty/i.test(title) || /dry|shortage|drought|empty/i.test(desc),
    result: { category: "SCARCITY", estimatedSeverity: "HIGH" }
  },
  {
    type: "classification",
    condition: (title, desc) =>
      /dirty|color|smell|taste|contaminat/i.test(title) || /dirty|color|smell|taste|contaminat/i.test(desc),
    result: { category: "QUALITY", estimatedSeverity: "CRITICAL" }
  },
  {
    type: "spam",
    condition: (title, desc) =>
      /buy|sell|discount|click here|http|www/i.test(title) || /buy|sell|discount|click here/i.test(desc),
    result: true
  }
];
