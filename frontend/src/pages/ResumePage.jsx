import { useState, useRef } from 'react';
import { aiService } from '../services/api';
import ProgressBar from '../components/common/ProgressBar';
import toast from 'react-hot-toast';

const DocumentIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ScoreRing = ({ score }) => {
  const color =
    score >= 75 ? '#10b981' :
    score >= 50 ? '#f59e0b' : '#ef4444';

  const label =
    score >= 75 ? '🟢 Strong' :
    score >= 50 ? '🟡 Needs Work' : '🔴 Needs Improvement';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#1e293b" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="50" fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={`${score * 3.14} 314`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{score}</span>
          <span className="text-slate-500 text-xs">/100</span>
        </div>
      </div>
      <p className="text-sm font-medium mt-2" style={{ color }}>{label}</p>
    </div>
  );
};

const Section = ({ title, emoji, items, color = 'slate' }) => {
  if (!items?.length) return null;

  const colorMap = {
    green:  'bg-green-500/10 border-green-500/20 text-green-300',
    red:    'bg-red-500/10 border-red-500/20 text-red-300',
    blue:   'bg-blue-500/10 border-blue-500/20 text-blue-300',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300',
    slate:  'bg-slate-800 border-slate-700 text-slate-300',
  };

  return (
    <div className="card">
      <h3 className="text-slate-200 font-semibold mb-3 flex items-center gap-2">
        <span>{emoji}</span> {title}
        <span className="text-xs text-slate-500 font-normal ml-1">({items.length})</span>
      </h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className={`flex gap-2.5 p-3 rounded-lg border text-sm ${colorMap[color]}`}>
            <span className="flex-shrink-0 mt-0.5">
              {color === 'green' ? '✅' : color === 'red' ? '❌' : color === 'yellow' ? '⚡' : color === 'blue' ? '🎯' : '•'}
            </span>
            <span className="leading-relaxed">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ResumePage = () => {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf') { toast.error('Only PDF files are allowed'); return; }
    if (f.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return; }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!file) { toast.error('Please upload a PDF resume first'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const { data } = await aiService.analyzeResume(formData);
      setResult(data.data);
      toast.success('Resume analyzed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Upload card */}
      {!result && (
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-accent-500/20 border border-accent-500/30 rounded-xl flex items-center justify-center">
              <DocumentIcon className="w-4 h-4 text-accent-400" />
            </div>
            <div>
              <h2 className="text-slate-200 font-semibold">AI Resume Analyzer</h2>
              <p className="text-slate-500 text-xs">Powered by Google Gemini — get ATS score + suggestions</p>
            </div>
          </div>

          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
              dragging
                ? 'border-primary-500 bg-primary-500/10'
                : file
                ? 'border-accent-500/50 bg-accent-500/5'
                : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/30'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />

            {file ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-accent-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📄</span>
                </div>
                <p className="text-slate-200 font-medium">{file.name}</p>
                <p className="text-slate-500 text-sm">{(file.size / 1024).toFixed(1)} KB · PDF</p>
                <button
                  className="text-red-400 text-xs hover:text-red-300 mt-1 transition-colors"
                  onClick={(e) => { e.stopPropagation(); resetAll(); }}
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-slate-300 font-medium">Drop your resume here</p>
                  <p className="text-slate-500 text-sm mt-0.5">or click to browse · PDF only · Max 5MB</p>
                </div>
              </div>
            )}
          </div>

          {file && (
            <button
              className="btn-primary w-full mt-4"
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing your resume...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>✨</span>
                  Analyze Resume with AI
                </span>
              )}
            </button>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-accent-500/20 border border-accent-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-slow">
            <span className="text-3xl">🤖</span>
          </div>
          <p className="text-slate-300 font-medium text-lg">Analyzing your resume...</p>
          <p className="text-slate-500 text-sm mt-2">Gemini AI is reviewing your resume for ATS compatibility, keywords, and improvements</p>
          <div className="mt-6 max-w-xs mx-auto">
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-5 animate-fade-in">
          {/* Score header */}
          <div className="card bg-gradient-to-br from-slate-900 to-slate-800/50">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <ScoreRing score={result.score} />
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl font-bold text-white mb-1">Resume Analysis Complete</h2>
                <p className="text-slate-400 text-sm mb-4">
                  Your resume scored <strong className="text-white">{result.score}/100</strong> on ATS compatibility.
                  {result.score < 70 && ' Focus on the suggestions below to improve your score.'}
                </p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-400">{result.missingKeywords?.length || 0}</p>
                    <p className="text-slate-500 text-xs">Missing Keywords</p>
                  </div>
                  <div className="w-px bg-slate-700 hidden sm:block" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400">{result.improvementSuggestions?.length || 0}</p>
                    <p className="text-slate-500 text-xs">Suggestions</p>
                  </div>
                  <div className="w-px bg-slate-700 hidden sm:block" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{result.strengths?.length || 0}</p>
                    <p className="text-slate-500 text-xs">Strengths</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 flex gap-3 justify-end">
              <button className="btn-secondary text-sm" onClick={resetAll}>
                Analyze Another Resume
              </button>
            </div>
          </div>

          {/* Strengths */}
          <Section title="Strengths" emoji="✅" items={result.strengths} color="green" />

          {/* Missing keywords */}
          {result.missingKeywords?.length > 0 && (
            <div className="card">
              <h3 className="text-slate-200 font-semibold mb-3 flex items-center gap-2">
                <span>🔍</span> Missing Keywords
                <span className="text-xs text-slate-500 font-normal ml-1">({result.missingKeywords.length})</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.missingKeywords.map((kw, i) => (
                  <span key={i} className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-sm">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Improvement suggestions */}
          <Section title="Improvement Suggestions" emoji="💡" items={result.improvementSuggestions} color="yellow" />

          {/* ATS tips */}
          <Section title="ATS Optimization Tips" emoji="🎯" items={result.atsTips} color="blue" />
        </div>
      )}
    </div>
  );
};

export default ResumePage;
