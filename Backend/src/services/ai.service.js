const { GoogleGenAI, Type } = require("@google/genai");

function getGenAiClient(customApiKey) {
  const key = customApiKey || process.env.GOOGLE_GENAI_API_KEY;
  return new GoogleGenAI({
    apiKey: key,
  });
}

const defaultAi = getGenAiClient();

const interviewResponseSchema = {
  type: Type.OBJECT,
  properties: {
    matchscore: {
      type: Type.NUMBER,
      description: "A score between 0 and 100",
    },
    technicalQuestions: {
      type: Type.ARRAY,
      description: "List of technical questions",
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
      description: "List of behavioral questions",
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
      description: "List of skill gaps",
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
    title: {
      type: Type.STRING,
      description: "The title of job for which interview report is generated",
    },
  },
  required: [
    "matchscore",
    "technicalQuestions",
    "behavioralQuestions",
    "skillGaps",
    "preparationPlan",
    "title",
  ],
};

async function generateInterviewReport({ resume, self_description, job_description, apiKey }) {
  const ai = apiKey ? getGenAiClient(apiKey) : defaultAi;

  const prompt = `You are an expert technical interviewer. Generate a highly detailed interview report.
    Resume: ${resume || "Not provided"}
    Self-Description: ${self_description || "Not provided"}
    Job Description: ${job_description || "General Software Engineering Position"} 
    
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

  const candidateModels = [
    "gemini-3.8-flash",
    "gemini-3.8-pro",
    "gemini-3.6-flash"
  ];
  let lastError = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: interviewResponseSchema,
        },
      });

      const responseText = response.text.replace(/```json/gi, "").replace(/```/g, "").trim();
      return JSON.parse(responseText);
    } catch (err) {
      console.warn(`Model ${model} failed, trying next:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to generate interview report from Gemini AI");
}

/**
 * Calculate ATS score, missing skills/keywords, and improvement tips
 */
async function calculateAtsScore({ resumeText, jobTitle, jobDescription, apiKey }) {
  const ai = apiKey ? getGenAiClient(apiKey) : defaultAi;

  const prompt = `You are a Senior Technical Recruiter and ATS (Applicant Tracking System) Algorithm Auditor.
Evaluate the provided Resume against the Target Job Title and Job Description with high precision.

TARGET JOB TITLE:
${jobTitle || "Software Engineer / Professional"}

TARGET JOB DESCRIPTION:
${jobDescription || "Standard industry responsibilities and technical proficiencies for the target role."}

CANDIDATE RESUME:
${resumeText || "No resume content provided."}

YOUR TASK:
Calculate an accurate ATS Compatibility Score (0 to 100), analyze keyword matching, identify missing skills & sections, and generate actionable improvement tips with concrete rewrite examples.

CRITICAL INSTRUCTIONS:
- Return ONLY a valid JSON object matching the requested schema.
- Do NOT wrap in markdown backticks or commentary.
- Be objective and thorough.

JSON Schema format to follow:
{
  "overallScore": 82,
  "matchLevel": "High Match",
  "summaryVerdict": "Concise 2-3 sentence executive assessment of the resume's match for this job.",
  "breakdown": {
    "keywordsMatch": {
      "score": 78,
      "weight": "30%",
      "description": "Matches 14 of 18 expected industry and technical keywords."
    },
    "experienceRelevance": {
      "score": 85,
      "weight": "25%",
      "description": "Past roles strongly align with core responsibilities."
    },
    "impactAndMetrics": {
      "score": 70,
      "weight": "20%",
      "description": "Needs more quantified metrics (%, $, numbers) in bullet points."
    },
    "atsFormatting": {
      "score": 92,
      "weight": "15%",
      "description": "Clean structure, standard section headers, ATS-parsable."
    },
    "skillsCoverage": {
      "score": 80,
      "weight": "10%",
      "description": "Good breadth of technical skills, minor gaps in testing tools."
    }
  },
  "missingThings": {
    "missingSkills": [
      { "skill": "Skill Name", "importance": "High", "reason": "Why this skill is needed" },
      { "skill": "Skill Name 2", "importance": "Medium", "reason": "Why this skill is needed" }
    ],
    "missingKeywords": [
      "Keyword 1", "Keyword 2", "Keyword 3", "Keyword 4"
    ],
    "missingSections": [
      "Specific missing section or data element (e.g. quantifiable impact metrics, certifications)"
    ]
  },
  "improvementTips": [
    {
      "category": "Impact & Metrics",
      "priority": "High",
      "title": "Quantify Key Achievements",
      "recommendation": "Explain the change needed clearly.",
      "example": "Change 'Built features' to 'Engineered 4 user-facing features increasing daily engagement by 28%.'"
    },
    {
      "category": "Keywords & Skills",
      "priority": "High",
      "title": "Include In-Demand Tools",
      "recommendation": "Integrate missing keywords into skills and bullet points.",
      "example": "Add 'Docker, CI/CD, Jest' under technical skills and project descriptions."
    },
    {
      "category": "Summary",
      "priority": "Medium",
      "title": "Tailor Headline and Summary",
      "recommendation": "Mention the exact target role and core specializations in the top summary.",
      "example": "Start summary with 'Results-oriented Full Stack Engineer with 4+ years of expertise...'"
    }
  ],
  "keyStrengths": [
    "Identified strength 1",
    "Identified strength 2",
    "Identified strength 3"
  ],
  "matchingKeywords": [
    "Matched Keyword 1", "Matched Keyword 2", "Matched Keyword 3"
  ]
}`;

  const candidateModels = [
    "gemini-3.8-flash",
    "gemini-3.8-pro",
    "gemini-3.6-flash"
  ];
  let lastError = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text.replace(/```json/gi, "").replace(/```/g, "").trim();
      return JSON.parse(responseText);
    } catch (err) {
      console.warn(`calculateAtsScore Model ${model} failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to calculate ATS score from Gemini AI");
}

/**
 * Enhance resume content using AI for higher ATS performance
 */
async function enhanceResume({ resumeData, resumeText, targetRole, jobDescription, enhancementFocus, apiKey }) {
  const ai = apiKey ? getGenAiClient(apiKey) : defaultAi;

  const prompt = `You are an Elite Executive Resume Strategist and ATS Keyword Optimization Specialist.
Transform and enhance the provided resume so that it clears Applicant Tracking Systems with a 95%+ match score and captivates hiring managers.

TARGET ROLE:
${targetRole || "Software Professional"}

TARGET JOB DESCRIPTION:
${jobDescription || "High-growth industry position demanding technical mastery, leadership, and quantifiable business impact."}

CURRENT RESUME DATA / CONTENT:
${JSON.stringify(resumeData || resumeText || {}, null, 2)}

ENHANCEMENT GOALS:
1. Rewrite the Professional Summary to be compelling, action-oriented, and dense with target keywords.
2. Rewrite Work Experience bullet points using the STAR method (Situation, Task, Action, Result) with strong action verbs (e.g. Architected, Spearheaded, Accelerated, Optimized) and realistic quantified impact metrics (%, latency, users, scale).
3. Expand and organize technical and soft skills to cover essential industry standards.
4. Polish project descriptions highlighting system architecture and measurable outcomes.
5. Provide Before & After bullet point comparisons highlighting what was improved.

CRITICAL INSTRUCTIONS:
- Output MUST be valid JSON only.
- Preserve the user's personal details (name, email, phone, links) if provided.
- Ensure the enhancedData follows standard resume schema with { personal, summary, experience, education, projects, skills }.

JSON format to return:
{
  "targetRole": "${targetRole || 'Software Professional'}",
  "atsScoreBoost": "+25% to +35% Estimated ATS Score Increase",
  "keyChangesSummary": "Summary of core improvements made (e.g., converted passive bullets into STAR achievements, added 14 relevant keywords, quantified deliverables).",
  "enhancedData": {
    "personal": {
      "fullName": "...",
      "email": "...",
      "phone": "...",
      "countryCode": "+91",
      "location": "...",
      "profession": "...",
      "linkedin": "...",
      "website": "..."
    },
    "summary": "Impact-driven professional summary...",
    "skills": ["Skill1", "Skill2", "Skill3"],
    "experience": [
      {
        "id": 1,
        "company": "Company Name",
        "role": "Role Title",
        "startDate": "Jan 2023",
        "endDate": "Present",
        "currentlyWorking": true,
        "description": "• Spearheaded ...\\n• Architected ...\\n• Optimized ..."
      }
    ],
    "projects": [
      {
        "id": 1,
        "name": "Project Name",
        "type": "Full Stack",
        "description": "• Built high-performance ...\\n• Integrated ..."
      }
    ],
    "education": [
      {
        "id": 1,
        "institution": "University / College",
        "degree": "Degree",
        "field": "Field",
        "date": "2019 - 2023",
        "gpa": "3.8 / 4.0"
      }
    ]
  },
  "bulletPointComparisons": [
    {
      "section": "Experience - Role 1",
      "original": "Original or weaker bullet point statement",
      "enhanced": "Enhanced bullet with action verbs, metrics, and technical precision",
      "improvement": "Why this enhancement scores higher on ATS"
    }
  ]
}`;

  const candidateModels = [
    "gemini-3.8-flash",
    "gemini-3.8-pro",
    "gemini-3.6-flash"
  ];
  let lastError = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text.replace(/```json/gi, "").replace(/```/g, "").trim();
      return JSON.parse(responseText);
    } catch (err) {
      console.warn(`enhanceResume Model ${model} failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to enhance resume using Gemini AI");
}

/**
 * Generate 5 progressive mock interview questions (Easy 60s, Medium 90s, Hard 120s) + parse projects & skills
 */
async function generateMockInterviewQuestions({ role, experience, interviewType = 'Technical Interview', resumeText = '', apiKey }) {
  const ai = apiKey ? getGenAiClient(apiKey) : defaultAi;

  const prompt = `You are an elite, professional ${interviewType === 'HR Interview' ? 'Senior HR Director and Executive Recruiter' : 'Staff Technical Interviewer and Engineering Lead'}.
A candidate is setting up an AI mock interview practice session.

Role Target: ${role || 'Software Engineer'}
Candidate Experience / Goal: ${experience || 'Not specified'}
Interview Track: ${interviewType}
Resume Context:
"""
${resumeText ? resumeText.slice(0, 3500) : 'No resume uploaded. Infer realistic projects and skills for this role and experience level.'}
"""

TASK:
1. Analyze the resume (or role) and extract:
   - "projects": A list of up to 3 key project names mentioned or inferred (e.g. ["E-Commerce Website", "Calculator Application"]).
   - "skills": A list of 4-8 key skills (e.g. ["HTML", "CSS", "JavaScript", "Responsive Design", "Git & GitHub"]).
2. Generate EXACTLY 5 tailored interview questions following this strict progressive structure:
   - Question 1 (Easy, 60s time limit): Introductory / Project Overview (e.g. "Can you tell me what you enjoyed most about working on the [Project Name] project?").
   - Question 2 (Easy, 60s time limit): Fundamental concepts / core role principles.
   - Question 3 (Medium, 90s time limit): Practical problem-solving / feature implementation / debugging challenge.
   - Question 4 (Medium, 90s time limit): Scenario-based trade-offs / performance optimization / conflict resolution.
   - Question 5 (Hard, 120s time limit): Deep technical architecture / complex edge cases / high-stakes behavioral leadership.

Return ONLY valid JSON:
{
  "parsedProfile": {
    "role": "${role || 'Software Engineer'}",
    "projects": ["E-Commerce Website", "Calculator Application"],
    "skills": ["HTML", "CSS", "JavaScript", "Responsive Design", "Git & GitHub"]
  },
  "questions": [
    {
      "id": 1,
      "difficulty": "Easy",
      "timeLimit": 60,
      "category": "Project Overview",
      "text": "Question 1 text..."
    },
    {
      "id": 2,
      "difficulty": "Easy",
      "timeLimit": 60,
      "category": "Core Fundamentals",
      "text": "Question 2 text..."
    },
    {
      "id": 3,
      "difficulty": "Medium",
      "timeLimit": 90,
      "category": "Practical Implementation",
      "text": "Question 3 text..."
    },
    {
      "id": 4,
      "difficulty": "Medium",
      "timeLimit": 90,
      "category": "Scenario & Trade-offs",
      "text": "Question 4 text..."
    },
    {
      "id": 5,
      "difficulty": "Hard",
      "timeLimit": 120,
      "category": "System Design & Leadership",
      "text": "Question 5 text..."
    }
  ]
}`;

  const candidateModels = [
    "gemini-3.8-flash",
    "gemini-3.8-pro",
    "gemini-3.6-flash"
  ];
  let lastError = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text.replace(/```json/gi, "").replace(/```/g, "").trim();
      return JSON.parse(responseText);
    } catch (err) {
      console.warn(`generateMockInterviewQuestions Model ${model} failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to generate mock interview questions using Gemini AI");
}

/**
 * Evaluate an individual candidate answer during the live interview
 */
async function evaluateMockAnswer({ question, answer, role, interviewType, apiKey }) {
  const ai = apiKey ? getGenAiClient(apiKey) : defaultAi;

  const prompt = `You are evaluating a candidate's response during an AI Mock Interview.
Target Role: ${role || 'Software Engineer'}
Interview Type: ${interviewType || 'Technical Interview'}
Question: "${question}"
Candidate Answer: "${answer || '(Candidate did not provide an answer / submitted blank)'}"

TASK:
1. Provide concise, highly actionable "feedback" (1 to 2 sentences max, e.g. "Try to structure your thoughts more clearly for better impact." or "Good grasp of the basics; elaborate on testing and edge cases.").
2. Give a score from 1.0 to 10.0 (float).
3. Evaluate 3 core dimensions (each from 1.0 to 10.0):
   - "confidence": posture, conviction, assertiveness
   - "communication": clarity, articulation, structure
   - "correctness": accuracy, depth, alignment with question

Return ONLY valid JSON:
{
  "score": 6.8,
  "feedback": "Try to structure your thoughts more clearly for better impact.",
  "confidence": 6.5,
  "communication": 7.0,
  "correctness": 7.0
}`;

  const candidateModels = [
    "gemini-3.8-flash",
    "gemini-3.8-pro",
    "gemini-3.6-flash"
  ];
  let lastError = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text.replace(/```json/gi, "").replace(/```/g, "").trim();
      return JSON.parse(responseText);
    } catch (err) {
      console.warn(`evaluateMockAnswer Model ${model} failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to evaluate mock answer using Gemini AI");
}

/**
 * Generate full analytics dashboard report for the completed 5-question session
 */
async function generateMockInterviewReport({ sessionData, apiKey }) {
  const ai = apiKey ? getGenAiClient(apiKey) : defaultAi;

  const prompt = `You are an elite AI hiring panel summarizing a candidate's completed 5-question mock interview session.
Role: ${sessionData.role || 'Software Engineer'}
Track: ${sessionData.interviewType || 'Technical Interview'}
Completed Q&A Session:
${JSON.stringify(sessionData.sessionResults || [], null, 2)}

TASK:
1. Compute "overallScore": composite rating between 1.0 and 10.0 (one decimal place).
2. Compute "performanceVerdict": e.g. "Significant improvement required.", "Good Performance", "Strong Candidate", "Exceptional Execution".
3. Compute "improvementTip": 1-2 sentences of actionable advice (e.g. "Work on clarity and confidence. Structure examples using the STAR framework.").
4. Compute "trendScores": an array of exactly 5 numbers (floats 1.0 to 10.0) showing the progression of score from Q1 to Q5.
5. Compute "skillEvaluation":
   - "confidence": float 1.0 to 10.0
   - "communication": float 1.0 to 10.0
   - "correctness": float 1.0 to 10.0
6. In "breakdown", list all 5 questions with:
   - "questionId": number 1 to 5
   - "questionText": question prompt
   - "answerText": candidate's answer
   - "score": score out of 10
   - "feedback": 1-2 sentence AI feedback

Return ONLY valid JSON:
{
  "overallScore": 6.8,
  "performanceVerdict": "Good Performance with growth areas",
  "improvementTip": "Work on clarity and confidence.",
  "trendScores": [6.5, 7.0, 6.0, 7.5, 8.0],
  "skillEvaluation": {
    "confidence": 6.8,
    "communication": 7.2,
    "correctness": 7.0
  },
  "breakdown": [
    {
      "questionId": 1,
      "questionText": "...",
      "answerText": "...",
      "score": 6.5,
      "feedback": "..."
    }
  ]
}`;

  const candidateModels = [
    "gemini-3.8-flash",
    "gemini-3.8-pro",
    "gemini-3.6-flash"
  ];
  let lastError = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text.replace(/```json/gi, "").replace(/```/g, "").trim();
      return JSON.parse(responseText);
    } catch (err) {
      console.warn(`generateMockInterviewReport Model ${model} failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to generate mock interview report using Gemini AI");
}

// Backwards-compatible export
generateInterviewReport.generateInterviewReport = generateInterviewReport;
generateInterviewReport.calculateAtsScore = calculateAtsScore;
generateInterviewReport.enhanceResume = enhanceResume;
generateInterviewReport.generateMockInterviewQuestions = generateMockInterviewQuestions;
generateInterviewReport.evaluateMockAnswer = evaluateMockAnswer;
generateInterviewReport.generateMockInterviewReport = generateMockInterviewReport;

module.exports = generateInterviewReport;
