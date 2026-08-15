const { GoogleGenAI, Type } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});


const responseSchema = {
  type: Type.OBJECT,
  properties: {
    matchscore: {
      type: Type.NUMBER,
      description: "A score between 0 and 100",
    },
    technicalQuestions: {
      type: Type.ARRAY,
      description: "List of at least 5 technical questions",
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          intention: { type: Type.STRING },
          answer: { type: Type.STRING },
        },
        required: ["question", "intention", "answer"],
      },
    },
    behavioralQuestions: {
      type: Type.ARRAY,
      description: "List of at least 5 behavioral questions",
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          intention: { type: Type.STRING },
          answer: { type: Type.STRING },
        },
        required: ["question", "intention", "answer"],
      },
    },
    skillGaps: {
      type: Type.ARRAY,
      description: "List of at least 5 skill gaps",
      items: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ["low", "medium", "high"] },
        },
        required: ["skill", "severity"],
      },
    },
    preparationPlan: {
      type: Type.ARRAY,
      description: "Preparation plan spanning 5 to 7 days",
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.NUMBER },
          focus: { type: Type.STRING },
          tasks: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["day", "focus", "tasks"],
      },
    },
    title : {
      type : Type.STRING,
      description : "The title of job for which interview report is generated"
    }
  },
  required: [
    "matchscore",
    "technicalQuestions",
    "behavioralQuestions",
    "skillGaps",
    "preparationPlan",
    "title"
  ],
};

async function generateInterviewReport({ resume, self_description, job_description }) {
  const prompt = `You are an expert technical interviewer. Generate a highly detailed interview report.
    Resume: ${resume}
    Self-Description: ${self_description}
    Job Description: ${job_description} 
    
    CRITICAL INSTRUCTIONS:
    - You must output valid JSON.
    - DO NOT output arrays of strings for the questions or skill gaps.
    - "technicalQuestions", "behavioralQuestions", "skillGaps", and "preparationPlan" MUST contain AT LEAST 5 OBJECTS EACH.
    
    EXPECTED FORMAT EXAMPLE:
    {
      "matchscore": 85,
      "technicalQuestions": [
        { "question": "...", "intention": "...", "answer": "..." },
        { "question": "...", "intention": "...", "answer": "..." }
      ],
      "behavioralQuestions": [
        { "question": "...", "intention": "...", "answer": "..." }
      ],
      "skillGaps": [
        { "skill": "...", "severity": "medium" }
      ],
      "preparationPlan": [
        { "day": 1, "focus": "...", "tasks": ["...", "..."] }
      ],
      "title" : "..."
    }`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  });

  const responseText = response.text.replace(/```json/gi, "").replace(/```/g, "").trim();

  return JSON.parse(responseText);
}

module.exports = generateInterviewReport;