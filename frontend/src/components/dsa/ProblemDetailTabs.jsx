import { useState } from 'react';

const ProblemDetailTabs = ({ question }) => {
  const [activeTab, setActiveTab] = useState('Description');

  const tabs = ['Description', 'Submissions', 'Discussion'];

  return (
    <div className="flex flex-col h-full rounded-3xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <div className="flex gap-1 border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className="rounded-full px-4 py-2 text-sm font-semibold"
            style={{
              background: activeTab === tab ? 'var(--primary)' : 'transparent',
              color: activeTab === tab ? 'white' : 'var(--text-2)',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm" style={{ color: 'var(--text-2)' }}>
        {activeTab === 'Description' && (
          <>
            <div>
              <p className="font-semibold" style={{ color: 'var(--text)' }}>Description</p>
              <p className="mt-2">{question.description}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                <p className="font-semibold" style={{ color: 'var(--text)' }}>Difficulty</p>
                <p style={{ color: 'var(--text-2)' }}>{question.difficulty}</p>
              </div>
              <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                <p className="font-semibold" style={{ color: 'var(--text)' }}>Points</p>
                <p style={{ color: 'var(--text-2)' }}>{question.points}</p>
              </div>
            </div>

            <div>
              <p className="font-semibold" style={{ color: 'var(--text)' }}>Constraints</p>
              <p className="mt-1">{question.constraints}</p>
            </div>

            <div>
              <p className="font-semibold" style={{ color: 'var(--text)' }}>Input Format</p>
              <pre className="mt-1 whitespace-pre-wrap rounded-2xl border p-3" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>{question.inputFormat}</pre>
            </div>

            <div>
              <p className="font-semibold" style={{ color: 'var(--text)' }}>Output Format</p>
              <pre className="mt-1 whitespace-pre-wrap rounded-2xl border p-3" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>{question.outputFormat}</pre>
            </div>

            <div>
              <p className="font-semibold" style={{ color: 'var(--text)' }}>Example 1</p>
              <div className="mt-2 grid gap-2">
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Input</p>
                  <pre className="rounded-2xl border p-3" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', fontSize: '0.875rem' }}>{question.sampleInput}</pre>
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Output</p>
                  <pre className="rounded-2xl border p-3" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', fontSize: '0.875rem' }}>{question.sampleOutput}</pre>
                </div>
              </div>
            </div>

            <div>
              <p className="font-semibold" style={{ color: 'var(--text)' }}>Explanation</p>
              <p className="mt-1">{question.explanation}</p>
            </div>
          </>
        )}

        {activeTab === 'Submissions' && (
          <div className="flex items-center justify-center min-h-[200px]">
            <p style={{ color: 'var(--text-3)' }}>No submissions yet. Start coding!</p>
          </div>
        )}

        {activeTab === 'Discussion' && (
          <div className="flex items-center justify-center min-h-[200px]">
            <p style={{ color: 'var(--text-3)' }}>Discussions coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemDetailTabs;
