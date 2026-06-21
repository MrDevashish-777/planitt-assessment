"use client";

import { useEffect, useState } from "react";
import { getCandidates, getInterviewDetails } from "@/services/admin.service";
import { Candidate, Interview } from "@/types";
import { notifyError } from "@/lib/notify";

export default function SelectedDashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter & Sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sectionFilter, setSectionFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"name" | "score-desc" | "score-asc" | "date">("score-desc");

  // Modal details states
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [interviewDetails, setInterviewDetails] = useState<Interview | null>(null);
  const [loadingInterview, setLoadingInterview] = useState(false);

  const loadCandidates = async () => {
    try {
      const data = await getCandidates();
      
      // Filter candidates who cleared the test (result = PASS) and are in shortlisted funnel
      const shortlistedCandidates = data.filter((c: Candidate) => {
        const hasPassedAptitude = c.attempts && c.attempts.some((att) => att.result === "PASS");
        const isShortlistedStatus = ["Shortlisted", "Interviewing", "Selected", "Hold"].includes(
          c.application_status || "Applied"
        );
        return hasPassedAptitude && isShortlistedStatus;
      });

      setCandidates(shortlistedCandidates);
    } catch (err) {
      console.error(err);
      notifyError("Failed to load selected candidates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  // Fetch interview scorecard for modal
  const openCandidateDetails = async (c: Candidate) => {
    setSelectedCandidate(c);
    setLoadingInterview(true);
    setInterviewDetails(null);
    try {
      const details = await getInterviewDetails(c.id);
      if (details) {
        setInterviewDetails(details);
      }
    } catch (err) {
      console.error("Failed to load interview scorecard", err);
    } finally {
      setLoadingInterview(false);
    }
  };

  // Helper: get the best test score
  const getPassedScore = (c: Candidate): number => {
    if (!c.attempts) return 0;
    const passedAttempts = c.attempts.filter((a) => a.result === "PASS");
    if (passedAttempts.length === 0) return 0;
    // Return the highest score among passed attempts
    return Math.max(...passedAttempts.map((a) => a.final_score || 0));
  };

  // Filter & Sort Candidate items
  const processedCandidates = candidates
    .filter((c) => {
      // Search matches
      const matchesSearch =
        (c.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filters
      const matchesStatus =
        statusFilter === "All" || c.application_status === statusFilter;

      // Section filters (based on attempt sections if applicable, or we can check if they have any attempts)
      // For simplicity, we can inspect attempts to see if they match the section filter
      // If we don't store section metadata on attempt, we can mock/filter by first letter or similar,
      // but let's check if attempts contain assessment info. Yes, attempt has title.
      // Let's filter by the candidate's skills or assessment names!
      const matchesSection =
        sectionFilter === "All" ||
        (c.skills || "").toLowerCase().includes(sectionFilter.toLowerCase()) ||
        (c.attempts && c.attempts.some((a) => a.assessment_title.toLowerCase().includes(sectionFilter.toLowerCase())));

      return matchesSearch && matchesStatus && matchesSection;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return (a.full_name || "").localeCompare(b.full_name || "");
      }
      if (sortBy === "score-desc") {
        return getPassedScore(b) - getPassedScore(a);
      }
      if (sortBy === "score-asc") {
        return getPassedScore(a) - getPassedScore(b);
      }
      if (sortBy === "date") {
        const dateA = new Date(a.form_submitted_at || a.created_at || 0).getTime();
        const dateB = new Date(b.form_submitted_at || b.created_at || 0).getTime();
        return dateB - dateA;
      }
      return 0;
    });

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <p className="text-gray-900 text-lg animate-pulse">Loading shortlisted board...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Selected Candidates</h1>
          <p className="text-gray-500 mt-1">Shortlisted candidates who cleared the initial aptitude benchmark.</p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-sm font-extrabold px-4 py-2 rounded-2xl flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
          {candidates.length} Shortlisted Candidates
        </div>
      </div>

      {/* Controls: Search, Filter & Sort */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Search</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400 font-semibold"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hiring Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-gray-700"
          >
            <option value="All">All Funnel Statuses</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Interviewing">Interviewing</option>
            <option value="Selected">Selected</option>
            <option value="Hold">Hold</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assessment/Technology</label>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-gray-700"
          >
            <option value="All">All Technologies</option>
            <option value="React">React / Frontend</option>
            <option value="Node">Node / Backend</option>
            <option value="Python">Python</option>
            <option value="Java">Java</option>
            <option value="Aptitude">Aptitude Tests</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-gray-700"
          >
            <option value="score-desc">Aptitude Score (High to Low)</option>
            <option value="score-asc">Aptitude Score (Low to High)</option>
            <option value="name">Candidate Name (A-Z)</option>
            <option value="date">Date Shortlisted (Newest)</option>
          </select>
        </div>
      </div>

      {/* Grid of Candidate Cards */}
      {processedCandidates.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center text-slate-400">
          <svg className="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-lg font-bold text-slate-800">No candidates match current criteria</p>
          <p className="text-sm mt-1">Try resetting the filters or modifying your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedCandidates.map((c) => {
            const aptitudeScore = getPassedScore(c);
            return (
              <div
                key={c.id}
                onClick={() => openCandidateDetails(c)}
                className="bg-white border border-gray-200 hover:border-emerald-500 hover:shadow-lg transition-all rounded-3xl p-6 shadow-sm flex flex-col justify-between cursor-pointer group"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black">
                        {(c.full_name || "U")[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-gray-900 group-hover:text-emerald-700 transition-colors">
                          {c.full_name || "Unnamed"}
                        </h3>
                        <p className="text-xs text-gray-500 truncate max-w-[150px]">{c.email}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${getStatusBadgeClass(c.application_status || "Applied")}`}>
                      {c.application_status}
                    </span>
                  </div>

                  {c.about && <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{c.about}</p>}

                  {c.skills && (
                    <div className="flex flex-wrap gap-1">
                      {c.skills.split(",").slice(0, 3).map((skill, sidx) => (
                        <span key={sidx} className="bg-slate-50 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-100">
                          {skill.trim()}
                        </span>
                      ))}
                      {c.skills.split(",").length > 3 && (
                        <span className="text-[9px] text-gray-400 font-bold self-center ml-1">
                          +{c.skills.split(",").length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-gray-400 font-bold">Aptitude Benchmark:</span>
                    <p className="font-black text-slate-800 text-sm font-mono mt-0.5">
                      {aptitudeScore} Marks
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-gray-400 font-bold">Evaluation status:</span>
                    <div className="mt-0.5 flex items-center gap-1 justify-end text-emerald-600 font-bold">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Verified PASS
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Candidate Evaluation Modal Card */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center text-lg font-black">
                  {(selectedCandidate.full_name || "U")[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">{selectedCandidate.full_name || "Unnamed"}</h2>
                  <p className="text-xs text-gray-500">{selectedCandidate.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-gray-400 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-8 space-y-6 flex-1">
              {loadingInterview ? (
                <div className="flex flex-col items-center justify-center p-12 space-y-2">
                  <svg className="w-8 h-8 text-emerald-600 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm text-slate-500 font-semibold animate-pulse">Fetching interview scorecard...</p>
                </div>
              ) : interviewDetails ? (
                <div className="space-y-6">
                  {/* Score Header */}
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Final Status decision</span>
                      <p className="text-xl font-black text-emerald-800 mt-1">
                        {interviewDetails.decision_status || "Hold"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Rating Score</span>
                      <span className="text-2xl font-black text-slate-900 font-mono">
                        {interviewDetails.overall_score || 0} / 10
                      </span>
                    </div>
                  </div>

                  {/* Rating Breakdown */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2">Interviewer Ratings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(interviewDetails.ratings || {}).map(([key, value]) => (
                        <div key={key} className="bg-slate-50 rounded-xl p-3 flex justify-between items-center text-xs border border-slate-100/50">
                          <span className="font-bold text-slate-600 capitalize">{key.replace("_", " ")}</span>
                          <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-mono">{value} / 10</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interviewer Comments */}
                  {interviewDetails.interviewer_comments && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider block border-b border-gray-50 pb-1">Interviewer Comments</h3>
                      <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-2xl italic">
                        &quot;{interviewDetails.interviewer_comments}&quot;
                      </p>
                    </div>
                  )}

                  {/* Feedback Notes */}
                  {interviewDetails.feedback_notes && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider block border-b border-gray-50 pb-1">Feedback Notes</h3>
                      <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl">
                        {interviewDetails.feedback_notes}
                      </p>
                    </div>
                  )}

                  <div className="text-[10px] text-gray-400 font-semibold text-right">
                    Interview logged on {new Date(interviewDetails.interview_timestamp).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-sm">
                  No interview evaluation scorecard has been logged for this candidate yet.
                  <p className="text-xs text-slate-400 mt-1 font-normal">Go to &quot;Interviews&quot; tab to grade candidate performance.</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold transition-all text-sm"
              >
                Close Scorecard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
