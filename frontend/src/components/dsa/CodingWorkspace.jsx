import { useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import { dsaService } from '../../services/api';

const LANGUAGE_MAP = {
  C: 'c',
  'C++': 'cpp',
  Java: 'java',
  Python: 'python',
};

const LANGUAGE_TEMPLATES = {
  C: '#include <stdio.h>\n\nint main() {\n  return 0;\n}\n',
  'C++': '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  return 0;\n}\n',
  Java: 'class Solution {\n  public static void main(String[] args) {}\n}\n',
  Python: 'def solve():\n    pass\n\nif __name__ == "__main__":\n    solve()\n',
};

const CodingWorkspace = ({ question, language, onLanguageChange, onSubmitSuccess }) => {
  const editorRef = useRef(null);
  const [code, setCode] = useState(LANGUAGE_TEMPLATES[language] || '');
  const [fontSize, setFontSize] = useState(14);
  const [activeTab, setActiveTab] = useState('Testcases');
  const [consoleOutput, setConsoleOutput] = useState('');
  const [result, setResult] = useState({ status: 'Idle', runtime: null, memory: null, passed: 0, failed: 0 });
  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setCode(LANGUAGE_TEMPLATES[language] || '');
  }, [language]);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Code copied');
    } catch {
      toast.error('Unable to copy code');
    }
  };

  const handleReset = () => {
    setCode(LANGUAGE_TEMPLATES[language] || '');
    setConsoleOutput('');
    setResult({ status: 'Idle', runtime: null, memory: null, passed: 0, failed: 0 });
    toast.success('Code reset');
  };

  const handleRun = async () => {
    setLoading(true);
    try {
      const response = await dsaService.submitPracticeCode({
        questionId: question.id,
        topic: question.topic,
        language: LANGUAGE_MAP[language] || 'python',
        code,
        input: question.sampleInput,
      });
      const { submission, state } = response.data.data;
      setConsoleOutput(`Status: ${submission.status}\nRuntime: ${submission.runtime || 0}ms\nMemory: ${submission.memory || 0}MB`);
      setResult({ status: submission.status, runtime: submission.runtime, memory: submission.memory, passed: submission.passed, failed: submission.failed });
      setActiveTab('Console');
      onSubmitSuccess?.(state);
      toast.success('Code execution complete');
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to run code';
      setConsoleOutput(message);
      setActiveTab('Console');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await dsaService.submitPracticeCode({
        questionId: question.id,
        topic: question.topic,
        language: LANGUAGE_MAP[language] || 'python',
        code,
        input: question.sampleInput,
      });
      const { submission, state } = response.data.data;
      if (submission.status === 'Accepted') {
        setResult({ status: 'Accepted', runtime: submission.runtime, memory: submission.memory, passed: 1, failed: 0 });
      } else {
        setResult({ status: submission.status, runtime: submission.runtime, memory: submission.memory, passed: submission.passed, failed: submission.failed });
      }
      setActiveTab('Test Result');
      onSubmitSuccess?.(state);
      toast.success('Submission recorded');
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to submit code';
      setConsoleOutput(message);
      setActiveTab('Console');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const statusTone = useMemo(() => {
    if (result.status === 'Accepted') return { color: 'var(--success)' };
    if (result.status === 'Wrong Answer') return { color: 'var(--warning)' };
    if (['Compilation Error', 'Runtime Error', 'Time Limit Exceeded', 'Memory Limit Exceeded'].includes(result.status)) return { color: 'var(--danger)' };
    return { color: 'var(--text-3)' };
  }, [result.status]);

  return (
    <div className="flex h-full flex-col rounded-3xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <select value={language} onChange={(event) => onLanguageChange(event.target.value)} className="rounded-xl border px-3 py-2 text-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}>
              {Object.keys(LANGUAGE_MAP).map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-3)' }}>
            Font
            <input type="range" min="12" max="22" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} className="w-20" />
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleCopy} className="btn-secondary btn-sm">Copy</button>
          <button type="button" onClick={handleReset} className="btn-secondary btn-sm">Reset</button>
          <button type="button" onClick={() => setIsFullscreen((prev) => !prev)} className="btn-secondary btn-sm">{isFullscreen ? '↙' : '↗'}</button>
        </div>
      </div>
      <div className="flex-1 p-3" style={{ minHeight: isFullscreen ? '80vh' : '400px' }}>
        <Editor
          height="100%"
          defaultLanguage={LANGUAGE_MAP[language] || 'python'}
          language={LANGUAGE_MAP[language] || 'python'}
          value={code}
          onChange={(value) => setCode(value || '')}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize,
            lineNumbers: 'on',
            automaticLayout: true,
            autoIndent: 'full',
            autoClosingBrackets: 'always',
            bracketPairColorization: { enabled: true },
            scrollBeyondLastLine: false,
          }}
        />
      </div>
      <div className="border-t px-4 py-3" style={{ borderColor: 'var(--border)' }}>
        <div className="mb-3 flex gap-2">
          {['Testcases', 'Console', 'Test Result'].map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)} className="rounded-lg px-3 py-1.5 text-sm font-semibold" style={{ background: activeTab === tab ? 'var(--primary)' : 'var(--surface-2)', color: activeTab === tab ? 'white' : 'var(--text-2)' }}>
              {tab}
            </button>
          ))}
        </div>
        <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', minHeight: '80px', maxHeight: '200px', overflowY: 'auto' }}>
          {activeTab === 'Testcases' && (
            <div>
              <p className="mb-2 text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Sample Input:</p>
              <pre className="text-sm" style={{ color: 'var(--text-2)' }}>{question.sampleInput}</pre>
              <p className="mt-3 mb-2 text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Expected Output:</p>
              <pre className="text-sm" style={{ color: 'var(--text-2)' }}>{question.sampleOutput}</pre>
            </div>
          )}
          {activeTab === 'Console' && <pre className="whitespace-pre-wrap text-sm" style={{ color: 'var(--text-2)' }}>{consoleOutput || 'Run your code to see output here'}</pre>}
          {activeTab === 'Test Result' && (
            <div className="space-y-2 text-sm" style={{ color: 'var(--text-2)' }}>
              <div><span className="font-semibold">Status:</span> <span style={statusTone}>{result.status}</span></div>
              <div><span className="font-semibold">Runtime:</span> {result.runtime ?? '—'}ms</div>
              <div><span className="font-semibold">Memory:</span> {result.memory ?? '—'}MB</div>
              {result.status !== 'Idle' && (
                <>
                  <div><span className="font-semibold">Passed:</span> {result.passed}</div>
                  <div><span className="font-semibold">Failed:</span> {result.failed}</div>
                </>
              )}
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={handleRun} disabled={loading} className="btn-primary">{loading ? 'Running…' : 'Run'}</button>
          <button type="button" onClick={handleSubmit} disabled={loading} className="btn-secondary">{loading ? 'Submitting…' : 'Submit'}</button>
        </div>
      </div>
    </div>
  );
};

export default CodingWorkspace;
