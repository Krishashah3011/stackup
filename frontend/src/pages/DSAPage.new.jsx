import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import TopicCard from '../components/dsa/TopicCard';
import QuestionCard from '../components/dsa/QuestionCard';
import CodingWorkspace from '../components/dsa/CodingWorkspace';
import Spinner from '../components/common/Spinner';
import { dsaService } from '../services/api';

const TOPICS = [
  'Basics & Math',
  'Arrays & Hashing',
  'Two Pointers',
  'Strings',
  'Recursion',
  'Sorting',
  'Binary Search',
  'Prefix & Suffix Sum',
  'Sliding Window',
  'Linked List',
  'Stack',
  'Queue',
  'Trees',
  'Binary Trees',
  'Binary Search Trees',
  'Heap / Priority Queue',
  'Greedy',
  'Backtracking',
  'Dynamic Programming',
  'Graphs',
  'Tries',
  'Bit Manipulation',
  'Segment Tree',
  'Disjoint Set Union',
  'Advanced Graphs',
];

const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3 };

const DSAPage = () => {
  const [practiceState, setPracticeState] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('Arrays & Hashing');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [language, setLanguage] = useState('Python');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stateResp, questionsResp] = await Promise.all([
          dsaService.getPracticeState(),
          dsaService.getPracticeQuestions(selectedTopic),
        ]);
        setPracticeState(stateResp.data.data);
        setQuestions(questionsResp.data.data);
        if (questionsResp.data.data.length) {
          setSelectedQuestion(questionsResp.data.data[0]);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to load DSA workspace');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedTopic]);

  const filteredQuestions = useMemo(() => {
    const normalizedSearch = search.toLowerCase();
    const filtered = questions.filter((question) => {
      const matchesSearch = !normalizedSearch || question.title.toLowerCase().includes(normalizedSearch) || question.description.toLowerCase().includes(normalizedSearch);
      const matchesDifficulty = difficulty === 'All' || question.difficulty === difficulty;
      return matchesSearch && matchesDifficulty;
    });

    const sorted = [...filtered];
    if (sortBy === 'difficulty') {
      sorted.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
    }
    if (sortBy === 'points') {
      sorted.sort((a, b) => b.points - a.points);
    }
    return sorted;
  }, [difficulty, questions, search, sortBy]);

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    setSearch('');
    setDifficulty('All');
    setSortBy('default');
  };

  const handleBookmarkToggle = async (questionId) => {
    const bookmarks = new Set(practiceState?.bookmarks || []);
    if (bookmarks.has(questionId)) {
      bookmarks.delete(questionId);
    } else {
      bookmarks.add(questionId);
    }

    const nextBookmarks = [...bookmarks];
    try {
      const updated = await dsaService.updatePracticeState({ bookmarks: nextBookmarks });
      setPracticeState(updated.data.data);
      toast.success('Bookmarks updated');
    } catch {
      toast.error('Unable to update bookmarks');
    }
  };

  const handlePracticeStateUpdate = (state) => {
    setPracticeState(state);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-3xl border p-6" style={{ borderColor: 'var(--border)', background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 10%, var(--surface)) 0%, var(--surface) 100%)' }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--primary)' }}>DSA Practice Hub</p>
            <h1 className="mt-2 text-3xl font-black" style={{ color: 'var(--text)' }}>Practice structured problem solving</h1>
            <p className="mt-2 max-w-2xl text-sm" style={{ color: 'var(--text-2)' }}>Explore a curated DSA journey with placeholder questions that can later be swapped for your full question bank without changing the UI.</p>
          </div>
          <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-3)' }}>Completion</p>
            <p className="text-2xl font-black" style={{ color: 'var(--primary)' }}>{practiceState?.completion || 0}%</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {TOPICS.map((topic) => {
          const progress = (practiceState?.topicProgress || []).find((entry) => entry.topic === topic) || { solvedCount: 0, totalCount: 40, completion: 0 };
          return <TopicCard key={topic} topic={topic} progress={progress} onSelect={handleTopicSelect} />;
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <div className="rounded-3xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{selectedTopic}</p>
                <p className="text-sm" style={{ color: 'var(--text-3)' }}>Choose a question and start solving.</p>
              </div>
              <div className="flex flex-col gap-2 md:flex-row">
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search questions" className="input-field" />
                <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="input-field">
                  <option value="All">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="input-field">
                  <option value="default">Default</option>
                  <option value="difficulty">By Difficulty</option>
                  <option value="points">By Points</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {filteredQuestions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                solved={(practiceState?.solvedQuestions || []).includes(question.id)}
                bookmarked={(practiceState?.bookmarks || []).includes(question.id)}
                onSelect={setSelectedQuestion}
                onToggleBookmark={handleBookmarkToggle}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {selectedQuestion ? (
            <>
              <div className="rounded-3xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--primary)' }}>{selectedQuestion.topic}</p>
                    <h2 className="mt-2 text-2xl font-black" style={{ color: 'var(--text)' }}>{selectedQuestion.title}</h2>
                  </div>
                  <div className="rounded-full px-3 py-1 text-sm font-semibold" style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)' }}>{selectedQuestion.points} pts</div>
                </div>
                <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--border)' }}>
                    <p className="font-semibold" style={{ color: 'var(--text)' }}>Difficulty</p>
                    <p style={{ color: 'var(--text-2)' }}>{selectedQuestion.difficulty}</p>
                  </div>
                  <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--border)' }}>
                    <p className="font-semibold" style={{ color: 'var(--text)' }}>Constraints</p>
                    <p style={{ color: 'var(--text-2)' }}>{selectedQuestion.constraints}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3 text-sm" style={{ color: 'var(--text-2)' }}>
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--text)' }}>Description</p>
                    <p className="mt-1">{selectedQuestion.description}</p>
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--text)' }}>Input Format</p>
                    <p className="mt-1 whitespace-pre-wrap">{selectedQuestion.inputFormat}</p>
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--text)' }}>Output Format</p>
                    <p className="mt-1">{selectedQuestion.outputFormat}</p>
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--text)' }}>Sample Input</p>
                    <pre className="mt-1 whitespace-pre-wrap rounded-2xl border p-3" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>{selectedQuestion.sampleInput}</pre>
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--text)' }}>Sample Output</p>
                    <pre className="mt-1 whitespace-pre-wrap rounded-2xl border p-3" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>{selectedQuestion.sampleOutput}</pre>
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--text)' }}>Explanation</p>
                    <p className="mt-1">{selectedQuestion.explanation}</p>
                  </div>
                </div>
              </div>
              <CodingWorkspace
                question={selectedQuestion}
                language={language}
                onLanguageChange={setLanguage}
                initialCode={practiceState?.submittedCode?.[selectedQuestion.id] || selectedQuestion.starterCode?.[language] || ''}
                onSubmitSuccess={handlePracticeStateUpdate}
              />
            </>
          ) : (
            <div className="rounded-3xl border p-8 text-center" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>Select a question to start coding.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DSAPage;
