import { useState } from 'react';
import { aiService } from '../services/api';
import toast from 'react-hot-toast';

const ChatIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
);

const SECTION_META = {
  hrQuestions:        { label: 'HR Questions',        emoji: '🤝', color: 'primary', desc: 'Behavioral & culture fit' },
  technicalQuestions: { label: 'Technical Questions', emoji: '💻', color: 'accent',  desc: 'Role & skills-based' },
  projectQuestions:   { label: 'Project Questions',   emoji: '🚀', color: 'purple',  desc: 'Practical experience' },
};

const QuestionCard = ({ question, index }) => {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="flex gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors">
      <span className="flex-shrink-0 w-6 h-6 bg-slate-700 text-slate-400 rounded-full flex items-center justify-center text-xs font-medium">
        {index + 1}
      </span>
      <p className="text-slate-300 text-sm leading-relaxed">{question}</p>
    </div>
  );
};

const InterviewPage = () => {
  const [form, setForm] = useState({ company: '', role: '', skills: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('hrQuestions');

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.company.trim() || !form.role.trim()) {
      toast.error('Company and role are required');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const skills = form.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const { data } = await aiService.generateInterview({ ...form, skills });
      setResult(data.data);
      setActiveTab('hrQuestions');
      toast.success('Interview questions generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate questions. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (questions) => {
    const text = questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Questions copied to clipboard!');
  };

  const totalQuestions = result
    ? (result.hrQuestions?.length || 0) + (result.technicalQuestions?.length || 0) + (result.projectQuestions?.length || 0)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Input form */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-primary-600/20 border border-primary-500/30 rounded-xl flex items-center justify-center">
            <ChatIcon className="w-4 h-4 text-primary-400" />
          </div>
          <div>
            <h2 className="text-slate-200 font-semibold">AI Interview Question Generator</h2>
            <p className="text-slate-500 text-xs">Powered by Google Gemini</p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Company Name *</label>
              <input
                className="input-field"
                placeholder="e.g. Google, Infosys, Wipro"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Role / Position *</label>
              <input
                className="input-field"
                placeholder="e.g. Software Engineer, Data Analyst"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Skills / Technologies</label>
            <input
              className="input-field"
              placeholder="e.g. React, Node.js, Python, DSA, SQL (comma separated)"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
            />
            <p className="text-slate-600 text-xs mt-1.5">Separate multiple skills with commas</p>
          </div>

          <button type="submit" className="btn-primary w-full sm:w-auto px-8" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating with AI...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>✨</span>
                Generate Interview Questions
              </span>
            )}
          </button>
        </form>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="card text-center py-12">
          <div className="w-14 h-14 bg-primary-600/20 border border-primary-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-slow">
            <span className="text-2xl">🤖</span>
          </div>
          <p className="text-slate-300 font-medium">Generating tailored questions...</p>
          <p className="text-slate-500 text-sm mt-1">Gemini AI is analyzing the role and preparing your interview set</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4 animate-fade-in">
          {/* Summary */}
          <div className="card bg-gradient-to-r from-primary-900/30 to-slate-900/60 border-primary-800/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-slate-400 text-sm">Interview prep ready for</p>
                <p className="text-white font-bold text-lg">{result.company} — {result.role}</p>
                {result.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {result.skills.map((s) => (
                      <span key={s} className="text-xs bg-primary-500/10 border border-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-3xl font-bold text-primary-400">{totalQuestions}</p>
                <p className="text-slate-500 text-xs">total questions</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="card p-0 overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-slate-800 overflow-x-auto">
              {Object.entries(SECTION_META).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 border-b-2 ${
                    activeTab === key
                      ? 'border-primary-500 text-primary-400 bg-primary-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <span>{meta.emoji}</span>
                  <span>{meta.label}</span>
                  <span className="text-xs bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">
                    {result[key]?.length || 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-500 text-xs">{SECTION_META[activeTab]?.desc}</p>
                <button
                  className="text-xs text-slate-400 hover:text-primary-400 transition-colors flex items-center gap-1"
                  onClick={() => handleCopy(result[activeTab] || [])}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy all
                </button>
              </div>

              <div className="space-y-2.5">
                {(result[activeTab] || []).map((q, i) => (
                  <QuestionCard key={i} question={q} index={i} />
                ))}
                {(!result[activeTab] || result[activeTab].length === 0) && (
                  <p className="text-slate-500 text-sm text-center py-6">No questions in this category</p>
                )}
              </div>
            </div>
          </div>

          {/* Generate again */}
          <div className="text-center">
            <button
              className="btn-secondary text-sm"
              onClick={() => setResult(null)}
            >
              Generate new set
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewPage;
