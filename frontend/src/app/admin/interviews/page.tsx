"use client";

import { useEffect, useState } from "react";
import {
  getCandidates,
  updateCandidate,
  generateCandidateSummary,
  generateInterviewQuestions,
  getInterviewDetails,
  saveInterviewEvaluation,
} from "@/services/admin.service";
import { Candidate, Interview } from "@/types";
import { notifyError, notifySuccess } from "@/lib/notify";

export default function InterviewDashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Edit states for candidate profile details
  const [editStatus, setEditStatus] = useState("Applied");
  const [editEducation, setEditEducation] = useState("");
  const [editRounds, setEditRounds] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editResume, setEditResume] = useState("");
  const [editAbout, setEditAbout] = useState("");
  const [editSkills, setEditSkills] = useState("");
  const [editProjects, setEditProjects] = useState("");
  const [editWorkExperience, setEditWorkExperience] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // AI states
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [activeQuestionTab, setActiveQuestionTab] = useState<"technical" | "project" | "problem" | "hr">("technical");
  const [showHistory, setShowHistory] = useState(false);

  // Evaluation & Ratings states
  const [ratings, setRatings] = useState({
    technical_knowledge: 5,
    communication_skills: 5,
    problem_solving: 5,
    confidence: 5,
    overall_performance: 5,
  });
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [interviewerComments, setInterviewerComments] = useState("");
  const [decision, setDecision] = useState<"Selected" | "Rejected" | "Hold">("Hold");
  const [interviewHistory, setInterviewHistory] = useState<any[]>([]);
  const [isSavingEvaluation, setIsSavingEvaluation] = useState(false);

  const loadCandidates = async (autoSelectId?: string) => {
    try {
      const data = await getCandidates();
      setCandidates(data);

      if (autoSelectId) {
        const found = data.find((c: Candidate) => c.id === autoSelectId);
        if (found) {
          selectCandidate(found);
        }
      } else if (selectedCandidate) {
        const found = data.find((c: Candidate) => c.id === selectedCandidate.id);
        if (found) {
          selectCandidate(found);
        }
      }
    } catch (err) {
      console.error("Failed to load candidates", err);
      notifyError("Failed to fetch candidate data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  const selectCandidate = async (c: Candidate) => {
    setSelectedCandidate(c);
    setEditStatus(c.application_status || "Applied");
    setEditEducation(c.education_details || "");
    setEditRounds(c.previous_round_results || "");
    setEditPhone(c.phone || "");
    setEditResume(c.resume_url || "");
    setEditAbout(c.about || "");
    setEditSkills(c.skills || "");
    setEditProjects(c.projects || "");
    setEditWorkExperience(c.work_experience || "");

    // Reset AI loaders
    setGeneratingSummary(false);
    setGeneratingQuestions(false);

    // Fetch Interview details
    try {
      const interview = await getInterviewDetails(c.id);
      if (interview) {
        setRatings(
          interview.ratings || {
            technical_knowledge: 5,
            communication_skills: 5,
            problem_solving: 5,
            confidence: 5,
            overall_performance: 5,
          }
        );
        setFeedbackNotes(interview.feedback_notes || "");
        setInterviewerComments(interview.interviewer_comments || "");
        setDecision(interview.decision_status || "Hold");
        setInterviewHistory(interview.history || []);
      } else {
        // Defaults
        setRatings({
          technical_knowledge: 5,
          communication_skills: 5,
          problem_solving: 5,
          confidence: 5,
          overall_performance: 5,
        });
        setFeedbackNotes("");
        setInterviewerComments("");
        setDecision("Hold");
        setInterviewHistory([]);
      }
    } catch (err) {
      console.error("Failed to fetch interview ratings", err);
    }
  };

  // Filter candidates by name
  const filteredCandidates = candidates.filter((c) =>
    (c.full_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim()) {
      const match =
        candidates.find((c) => (c.full_name || "").toLowerCase().trim() === value.toLowerCase().trim()) ||
        candidates.find((c) => (c.full_name || "").toLowerCase().includes(value.toLowerCase()));

      if (match && (!selectedCandidate || selectedCandidate.id !== match.id)) {
        selectCandidate(match);
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    setIsSavingProfile(true);
    try {
      await updateCandidate(selectedCandidate.id, {
        phone: editPhone,
        resume_url: editResume,
        about: editAbout,
        education_details: editEducation,
        application_status: editStatus,
        previous_round_results: editRounds,
        skills: editSkills,
        projects: editProjects,
        work_experience: editWorkExperience,
      });

      notifySuccess("Candidate profile updated");
      await loadCandidates(selectedCandidate.id);
    } catch (err) {
      console.error("Failed to update profile", err);
      notifyError("Failed to update profile details");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // AI Summary Trigger
  const handleGenerateSummary = async () => {
    if (!selectedCandidate) return;
    setGeneratingSummary(true);
    try {
      const res = await generateCandidateSummary(selectedCandidate.id);
      notifySuccess("AI Summary updated");
      await loadCandidates(selectedCandidate.id);
    } catch (err) {
      console.error(err);
      notifyError("Failed to generate AI Summary");
    } finally {
      setGeneratingSummary(false);
    }
  };

  // AI Questions Trigger
  const handleGenerateQuestions = async () => {
    if (!selectedCandidate) return;
    setGeneratingQuestions(true);
    try {
      const res = await generateInterviewQuestions(selectedCandidate.id);
      notifySuccess("AI Interview Questions refreshed");
      await loadCandidates(selectedCandidate.id);
    } catch (err) {
      console.error(err);
      notifyError("Failed to generate AI Questions");
    } finally {
      setGeneratingQuestions(false);
    }
  };

  // Rating Change Helper
  const handleRatingChange = (key: keyof typeof ratings, val: number) => {
    setRatings({
      ...ratings,
      [key]: val,
    });
  };

  // Live average score calculation
  const calculatedAverage = Number(
    (
      (ratings.technical_knowledge +
        ratings.communication_skills +
        ratings.problem_solving +
        ratings.confidence +
        ratings.overall_performance) /
      5
    ).toFixed(1)
  );

  // Submit Evaluation Form
  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    setIsSavingEvaluation(true);
    try {
      const res = await saveInterviewEvaluation(selectedCandidate.id, {
        ratings,
        decision_status: decision,
        feedback_notes: feedbackNotes,
        interviewer_comments: interviewerComments,
      });

      notifySuccess("Interview evaluation saved successfully!");
      // Reload candidate list (since application_status might change)
      await loadCandidates(selectedCandidate.id);
    } catch (err) {
      console.error("Failed to save evaluation", err);
      notifyError("Failed to save evaluation sheet");
    } finally {
      setIsSavingEvaluation(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Selected":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Interviewing":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Shortlisted":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Rejected":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  // Filtering questions by tab
  const getCategorizedQuestions = (categoryKey: typeof activeQuestionTab) => {
    if (!selectedCandidate || !selectedCandidate.ai_questions) return [];
    
    let categoryName = "Technical Questions";
    if (categoryKey === "project") categoryName = "Project-Based Questions";
    if (categoryKey === "problem") categoryName = "Problem-Solving Questions";
    if (categoryKey === "hr") categoryName = "HR Questions";

    return selectedCandidate.ai_questions.filter((q) => q.category === categoryName);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <p className="text-gray-900 text-lg animate-pulse">Loading Interview Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Interview & Hiring Board</h1>
        <p className="text-gray-500 mt-1">Update profiles, trigger AI diagnostics, and log ratings.</p>
      </div>

      {/* Top Search bar */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
          Search Candidate by Name (Auto-Opens Profile)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Type candidate name (e.g., John Doe)..."
            className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
          />
          {searchQuery && filteredCandidates.length > 0 && (
            <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-gray-100">
              {filteredCandidates.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    selectCandidate(c);
                    setSearchQuery(c.full_name || "");
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-gray-900">{c.full_name || "Unnamed Candidate"}</p>
                    <p className="text-xs text-gray-500">{c.email}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusBadgeClass(c.application_status || "Applied")}`}>
                    {c.application_status || "Applied"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Candidate List */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col h-[750px]">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-between">
            <span>Candidates List</span>
            <span className="bg-blue-100 text-blue-700 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
              {filteredCandidates.length}
            </span>
          </h2>

          <div className="overflow-y-auto flex-1 space-y-3 pr-1 scrollbar-thin">
            {filteredCandidates.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p>No candidates found.</p>
              </div>
            ) : (
              filteredCandidates.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectCandidate(c)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    selectedCandidate?.id === c.id
                      ? "border-blue-500 bg-blue-50/50 shadow-sm"
                      : "border-gray-100 bg-gray-50 hover:bg-gray-100/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="truncate">
                      <p className="font-bold text-gray-900 truncate">{c.full_name || "Unnamed"}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{c.email}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-tight ${getStatusBadgeClass(c.application_status || "Applied")}`}>
                      {c.application_status || "Applied"}
                    </span>
                  </div>
                  {c.attempts && c.attempts.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-200/50 flex items-center justify-between text-[11px] text-gray-500">
                      <span className="truncate max-w-[120px] font-medium">{c.attempts[0].assessment_title}</span>
                      <span className="font-bold text-gray-800">Score: {c.attempts[0].final_score ?? "Grading"}</span>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Profile Details, AI Summary, AI Questions, Evaluations */}
        <div className="lg:col-span-8 space-y-8">
          {selectedCandidate ? (
            <>
              {/* Profile Details Form */}
              <form onSubmit={handleSaveProfile} className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 border-b border-gray-100 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-md shadow-blue-500/20">
                      {(selectedCandidate.full_name || "U")[0].toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-extrabold text-gray-900">{selectedCandidate.full_name || "Unnamed"}</h2>
                      <p className="text-gray-500 text-sm">{selectedCandidate.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status Funnel</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className={`border rounded-xl px-3 py-2 text-sm font-bold focus:outline-none transition-all ${getStatusBadgeClass(editStatus)}`}
                    >
                      <option value="Applied">Applied</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Interviewing">Interviewing</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Selected">Selected</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2">Candidate Details</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone</label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="e.g. +1 555-0199"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Education Details</label>
                        <input
                          type="text"
                          value={editEducation}
                          onChange={(e) => setEditEducation(e.target.value)}
                          placeholder="e.g. B.Tech CS, Stanford"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Resume Link</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editResume}
                            onChange={(e) => setEditResume(e.target.value)}
                            placeholder="https://drive.google.com/..."
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          {editResume && (
                            <a
                              href={editResume}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl flex items-center justify-center transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2">Skills & Projects</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Technical Skills (Comma separated)</label>
                        <input
                          type="text"
                          value={editSkills}
                          onChange={(e) => setEditSkills(e.target.value)}
                          placeholder="e.g. React, Node.js, Python, AWS"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Projects Summary</label>
                        <textarea
                          value={editProjects}
                          onChange={(e) => setEditProjects(e.target.value)}
                          placeholder="Briefly describe key projects..."
                          rows={2}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Work Experience</label>
                        <textarea
                          value={editWorkExperience}
                          onChange={(e) => setEditWorkExperience(e.target.value)}
                          placeholder="e.g. Software Engineer Intern at Acme (6 months)"
                          rows={2}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-400">Save details before triggering AI.</div>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-2 rounded-xl font-bold transition-all disabled:opacity-50 text-sm"
                  >
                    {isSavingProfile ? "Saving Profile..." : "Save Profile Info"}
                  </button>
                </div>
              </form>

              {/* Aptitude scores list */}
              <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2">Aptitude Test Score</h3>
                {selectedCandidate.attempts && selectedCandidate.attempts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCandidate.attempts.map((attempt) => (
                      <div key={attempt.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800 text-sm truncate max-w-[200px]">{attempt.assessment_title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Attempted: {new Date(attempt.started_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-slate-900 font-mono">{attempt.final_score !== null ? attempt.final_score : "Grading"}</span>
                          <span className={`block text-[9px] font-black uppercase mt-0.5 ${attempt.result === "PASS" ? "text-emerald-600" : "text-rose-600"}`}>
                            {attempt.result || attempt.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400 text-sm">No aptitude test data found.</div>
                )}
              </div>

              {/* Task 3: AI Candidate Summary */}
              <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">AI Candidate Summary</h3>
                  <button
                    onClick={handleGenerateSummary}
                    disabled={generatingSummary}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    {generatingSummary ? (
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    )}
                    {selectedCandidate.ai_summary ? "Regenerate Summary" : "Generate Summary"}
                  </button>
                </div>

                {selectedCandidate.ai_summary ? (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm text-slate-700 leading-relaxed whitespace-pre-line prose max-w-none">
                    {selectedCandidate.ai_summary}
                  </div>
                ) : (
                  <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-sm">
                    Generate an AI-powered evaluation summary of this candidate's resume, credentials, and aptitude metrics.
                  </div>
                )}
              </div>

              {/* Task 4: AI Interview Questions */}
              <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">AI Interview Question Suggestions</h3>
                  <button
                    onClick={handleGenerateQuestions}
                    disabled={generatingQuestions}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    {generatingQuestions ? (
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" /></svg>
                    )}
                    {selectedCandidate.ai_questions && selectedCandidate.ai_questions.length > 0 ? "Refresh Questions" : "Generate Questions"}
                  </button>
                </div>

                {selectedCandidate.ai_questions && selectedCandidate.ai_questions.length > 0 ? (
                  <div className="space-y-4">
                    {/* Category Tabs */}
                    <div className="flex gap-1 border-b border-gray-100 pb-1 overflow-x-auto">
                      {(["technical", "project", "problem", "hr"] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setActiveQuestionTab(tab)}
                          className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                            activeQuestionTab === tab
                              ? "bg-indigo-600 text-white"
                              : "text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3 pt-2">
                      {getCategorizedQuestions(activeQuestionTab).map((q, idx) => (
                        <div key={idx} className="bg-indigo-50/40 border border-indigo-50 rounded-2xl p-4 flex items-start gap-3">
                          <span className="font-mono text-indigo-500 text-xs font-black mt-0.5">Q{idx + 1}.</span>
                          <p className="text-gray-800 text-sm font-semibold">{q.question}</p>
                        </div>
                      ))}
                    </div>

                    {/* Question history collapsible log */}
                    {selectedCandidate.ai_questions_history && selectedCandidate.ai_questions_history.length > 0 && (
                      <div className="border-t border-gray-100 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowHistory(!showHistory)}
                          className="text-xs text-gray-500 hover:text-indigo-600 font-bold flex items-center gap-1 focus:outline-none"
                        >
                          {showHistory ? "Hide Question History" : `Show Question History (${selectedCandidate.ai_questions_history.length})`}
                        </button>

                        {showHistory && (
                          <div className="mt-3 space-y-4 max-h-48 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-xl p-3 bg-gray-50">
                            {selectedCandidate.ai_questions_history.map((histSet, setIdx) => (
                              <div key={setIdx} className="pt-3 first:pt-0">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Set #{setIdx + 1}</p>
                                <div className="space-y-2">
                                  {histSet.map((q, qIdx) => (
                                    <p key={qIdx} className="text-xs text-gray-600 leading-relaxed">
                                      <span className="font-bold text-indigo-400">[{q.category.split(" ")[0]}]:</span> {q.question}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-sm">
                    Generate tailored interview questions matching technical stack and experience level.
                  </div>
                )}
              </div>

              {/* Tasks 5 & 6: Evaluation Form & Ratings */}
              <form onSubmit={handleSaveEvaluation} className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Interviewer Evaluation Card</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-bold">Overall Score:</span>
                    <span className="bg-blue-600 text-white text-base font-black px-3 py-1 rounded-xl font-mono shadow-sm shadow-blue-500/10">
                      {calculatedAverage} / 10
                    </span>
                  </div>
                </div>

                {/* Slider Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(
                    [
                      { key: "technical_knowledge", label: "Technical Knowledge" },
                      { key: "communication_skills", label: "Communication Skills" },
                      { key: "problem_solving", label: "Problem Solving" },
                      { key: "confidence", label: "Confidence" },
                      { key: "overall_performance", label: "Overall Performance" },
                    ] as const
                  ).map((metric) => (
                    <div key={metric.key} className="space-y-2 bg-slate-50 border border-slate-100/50 rounded-2xl p-4">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-gray-700">{metric.label}</label>
                        <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-mono">{ratings[metric.key]}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={ratings[metric.key]}
                        onChange={(e) => handleRatingChange(metric.key, Number(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Comments & Notes */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Interviewer Comments</label>
                    <textarea
                      value={interviewerComments}
                      onChange={(e) => setInterviewerComments(e.target.value)}
                      placeholder="e.g., Candidates showed great depth in React. Communication was outstanding."
                      rows={2}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Feedback Notes / Suggestions for candidate</label>
                    <textarea
                      value={feedbackNotes}
                      onChange={(e) => setFeedbackNotes(e.target.value)}
                      placeholder="Notes for follow up round or rejection feedback..."
                      rows={2}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Final Decision Selector */}
                <div className="space-y-3 bg-slate-50/60 border border-dashed border-slate-200 rounded-2xl p-5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Hiring Decision</label>
                  <div className="flex gap-4">
                    {(["Selected", "Rejected", "Hold"] as const).map((option) => (
                      <label
                        key={option}
                        className={`flex-1 flex items-center justify-center gap-2 border px-4 py-3 rounded-2xl text-sm font-bold cursor-pointer transition-all ${
                          decision === option
                            ? option === "Selected"
                              ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20"
                              : option === "Rejected"
                              ? "border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20"
                              : "border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500/20"
                            : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
                        }`}
                      >
                        <input
                          type="radio"
                          name="interview-decision"
                          value={option}
                          checked={decision === option}
                          onChange={() => setDecision(option)}
                          className="sr-only"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Save Evaluator */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={isSavingEvaluation}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-500/10 active:scale-[0.98] flex items-center gap-2"
                  >
                    {isSavingEvaluation ? (
                      <>
                        <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Saving Scorecard...
                      </>
                    ) : (
                      "Save Interview Evaluation"
                    )}
                  </button>
                </div>

                {/* Historical logs */}
                {interviewHistory && interviewHistory.length > 0 && (
                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Decision & Evaluation History</h4>
                    <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                      {interviewHistory.map((hist, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-600 flex justify-between items-start">
                          <div>
                            <p className="font-bold">
                              Decision:{" "}
                              <span className={hist.decision_status === "Selected" ? "text-emerald-600" : hist.decision_status === "Rejected" ? "text-rose-600" : "text-amber-600"}>
                                {hist.decision_status}
                              </span>
                            </p>
                            <p className="mt-1 font-medium italic">"{hist.interviewer_comments || "No comments"}"</p>
                            <p className="text-[10px] text-slate-400 mt-1">Logged on: {new Date(hist.timestamp).toLocaleString()}</p>
                          </div>
                          <span className="font-bold text-slate-800 bg-slate-200 px-2 py-0.5 rounded font-mono">
                            Avg: {hist.overall_score}/10
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl h-[650px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800">No Candidate Selected</h3>
              <p className="text-slate-400 text-sm mt-2 max-w-sm">
                Select a candidate from the left side list or use the search bar to automatically view their profile card.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
