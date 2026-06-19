import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;

if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log("🤖 Gemini AI initialized with API key");
  } catch (error) {
    console.error("❌ Failed to initialize Gemini AI:", error);
  }
} else {
  console.warn("⚠️ GEMINI_API_KEY not found in environment variables. Running in Mock Fallback mode.");
}

interface CandidateData {
  full_name: string;
  email: string;
  phone?: string;
  education_details?: string;
  skills?: string;
  projects?: string;
  work_experience?: string;
  attempts?: Array<{
    assessment_title: string;
    final_score: number | null;
    result: string | null;
    status: string;
  }>;
}

/**
 * Clean JSON output helper for Gemini API responses
 */
function cleanJsonResponse(text: string): string {
  // Strip markdown code block boundaries if present
  let clean = text.trim();
  if (clean.startsWith("```json")) {
    clean = clean.substring(7);
  } else if (clean.startsWith("```")) {
    clean = clean.substring(3);
  }
  if (clean.endsWith("```")) {
    clean = clean.substring(0, clean.length - 3);
  }
  return clean.trim();
}

/**
 * Generate AI-powered candidate summary
 */
export async function generateAiSummary(data: CandidateData): Promise<string> {
  const candidateSummaryContext = `
Candidate Name: ${data.full_name}
Email: ${data.email}
Education: ${data.education_details || "Not specified"}
Skills: ${data.skills || "Not specified"}
Projects: ${data.projects || "Not specified"}
Work Experience: ${data.work_experience || "Not specified"}
Aptitude Test History: ${
    data.attempts && data.attempts.length > 0
      ? data.attempts
          .map(
            (a) =>
              `- ${a.assessment_title}: Score ${a.final_score ?? "N/A"} (${a.result || a.status})`
          )
          .join("\n")
      : "No test records found"
  }
`;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
You are an expert recruiter and hiring manager assistant. Generate a professional, comprehensive, and objective AI candidate summary based on the following candidate information. 
The summary should be 2 to 3 paragraphs long, highlighting:
1. Academic background and credentials.
2. Technical core strengths, experience level, and key projects mentioned.
3. Performance on their recent aptitude test attempts.
4. An overall assessment of their alignment with engineering roles.

Candidate Information:
${candidateSummaryContext}

Please respond with the raw markdown text summary directly. Do not include introductory comments like "Here is the summary:".
`;
      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text().trim();
    } catch (error) {
      console.error("❌ Gemini generateAiSummary failed, falling back to mock:", error);
    }
  }

  // Fallback Heuristics (Rich mockup generation)
  const skillsList = data.skills
    ? data.skills.split(",").map((s) => s.trim())
    : [];
  const primarySkills = skillsList.slice(0, 4).join(", ");
  const education = data.education_details || "their education";
  const projectHighlights = data.projects ? `specifically involving "${data.projects.substring(0, 60)}..."` : "";
  const testHighlight =
    data.attempts && data.attempts.length > 0
      ? `achieving a score of ${data.attempts[0].final_score ?? "N/A"} in the "${data.attempts[0].assessment_title}" assessment`
      : "with no aptitude attempts currently registered";

  return `### Candidate Overview
**${data.full_name}** presents a profile focused on software engineering, supported by a background in **${education}**. Their key skillset includes technologies such as **${primarySkills || "General Software Engineering"}**, which they have applied across their projects and work experience.

### Technical Assessment & Projects
On the technical front, ${data.full_name} has documented experience working on projects ${projectHighlights || "spanning modern application stacks"}. They demonstrated solid problem-solving skills in their aptitude test phase, ${testHighlight}. Their work experience records show a practical understanding of lifecycle workflows and development practices.

### Overall Hiring Recommendation
Based on the available profile data, the candidate demonstrates potential for technical roles. Their combination of skills in **${primarySkills || "development"}** and successful completion of the initial aptitude verification suggests they are ready for the core technical interviewing loop. We recommend assessing their live system design capabilities and technical depth in their upcoming interview.`;
}

/**
 * Generate AI-powered interview questions
 */
export async function generateAiQuestions(
  data: CandidateData
): Promise<Array<{ category: string; question: string }>> {
  const candidateQuestionsContext = `
Candidate Name: ${data.full_name}
Education: ${data.education_details || "Not specified"}
Skills: ${data.skills || "Not specified"}
Projects: ${data.projects || "Not specified"}
Work Experience: ${data.work_experience || "Not specified"}
`;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
You are a senior technical interviewer. Based on the candidate's profile, generate a list of 8 tailored interview questions, categorized into these 4 specific categories:
- Technical Questions (2 questions)
- Project-Based Questions (2 questions)
- Problem-Solving Questions (2 questions)
- HR Questions (2 questions)

The questions must be highly customized to their skills, projects, and work experience. If details are missing, construct relevant industry-standard software engineering questions.

Candidate Information:
${candidateQuestionsContext}

Return the response in a JSON array format. Do not use markdown wraps in your text except the standard JSON structure.
Format:
[
  { "category": "Technical Questions", "question": "Question text here?" },
  ...
]
`;
      const result = await model.generateContent(prompt);
      const response = result.response;
      const jsonText = cleanJsonResponse(response.text());
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      console.error("❌ Gemini generateAiQuestions failed, falling back to mock:", error);
    }
  }

  // Fallback Heuristics for Questions
  const skillsList = data.skills
    ? data.skills.split(",").map((s) => s.trim())
    : ["JavaScript", "React", "Node.js", "MongoDB"];
  const tech1 = skillsList[0] || "JavaScript";
  const tech2 = skillsList[1] || "React";

  return [
    {
      category: "Technical Questions",
      question: `Can you explain the difference between synchronous and asynchronous executions, and how you would handle asynchronous patterns in ${tech1}?`,
    },
    {
      category: "Technical Questions",
      question: `In ${tech2}, what are some performance optimization techniques you apply in production to keep components fast?`,
    },
    {
      category: "Project-Based Questions",
      question: data.projects
        ? `Regarding your project ("${data.projects.substring(0, 50)}..."), what was the single biggest technical challenge you faced, and how did you resolve it?`
        : "Can you walk us through the architecture of your most challenging software project and explain why you made those architectural choices?",
    },
    {
      category: "Project-Based Questions",
      question: `If you had to rebuild your key project from scratch, what tools or frameworks would you change and why?`,
    },
    {
      category: "Problem-Solving Questions",
      question: "How do you approach debugging a memory leak or database performance bottleneck in a running node production environment?",
    },
    {
      category: "Problem-Solving Questions",
      question: "Describe a scenario where you had to quickly learn a new technology or framework for a job or project. What steps did you take?",
    },
    {
      category: "HR Questions",
      question: `Why are you interested in joining Planitt, and how does your background in ${tech1} align with our vision?`,
    },
    {
      category: "HR Questions",
      question: "Tell us about a time you had a technical disagreement with a team member. How did you communicate and resolve it?",
    },
  ];
}
