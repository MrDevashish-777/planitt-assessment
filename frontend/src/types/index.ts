export type Question = {
  id: string;
  question_text: string;
  question_type: "MCQ" | "DESCRIPTIVE";
  options?: { id: string; text: string }[];
  correct_answer?: string;
  marks: number;
  section: string;
};

export type Assessment = {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  code?: string;
  duration_minutes: number;
  total_marks: number;
  pass_percentage: number;
  status?: string | boolean;
  created_at?: string;
};

export type Candidate = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  resume_url?: string;
  about?: string;
  source?: "ADMIN" | "CSV" | "GOOGLE_FORM";
  form_submitted_at?: string;
  education_details?: string;
  application_status?: "Applied" | "Shortlisted" | "Interviewing" | "Rejected" | "Selected" | string;
  previous_round_results?: string;
  skills?: string;
  projects?: string;
  work_experience?: string;
  ai_summary?: string;
  ai_questions?: Array<{ category: string; question: string }>;
  ai_questions_history?: Array<Array<{ category: string; question: string }>>;
  created_at?: string;
  attempts?: {
    id: string;
    assessment_id: string;
    assessment_title: string;
    final_score: number | null;
    result: string | null;
    status: string;
    started_at: string;
    submitted_at: string | null;
  }[];
};

export type Interview = {
  candidate_id: string;
  interviewer_id: string;
  ratings: {
    technical_knowledge: number;
    communication_skills: number;
    problem_solving: number;
    confidence: number;
    overall_performance: number;
  };
  overall_score: number;
  decision_status: "Selected" | "Rejected" | "Hold";
  feedback_notes: string;
  interviewer_comments: string;
  interview_timestamp: string;
  history?: Array<{
    ratings: {
      technical_knowledge: number;
      communication_skills: number;
      problem_solving: number;
      confidence: number;
      overall_performance: number;
    };
    overall_score: number;
    decision_status: "Selected" | "Rejected" | "Hold";
    feedback_notes: string;
    interviewer_comments: string;
    timestamp: string;
  }>;
};

export type AuthUser = {
  id?: string;
  userId?: string;
  full_name?: string;
  email: string;
  role: "ADMIN" | "CANDIDATE" | string;
};

export type AuthLoginResponse = {
  role: AuthUser["role"];
  token?: string;
  email?: string;
  full_name?: string;
};

export type Attempt = {
  id: string;
  user_id: string;
  assessment_id: string;
  score: number | null;
  status: "IN_PROGRESS" | "COMPLETED";
  start_time: string;
  end_time: string | null;
  user?: Candidate;
  assessment?: Assessment;
};

export type AnswerPayload = {
  questionId: string;
  answer: string;
};

export type AttemptStartResponse = {
  attemptId: string;
  durationMinutes: number;
  questions?: Question[];
  message?: string;
};

export type AttemptQuestionsResponse = {
  questions: Question[];
  durationMinutes: number;
};
