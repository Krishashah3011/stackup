import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import TopicCard from '../components/dsa/TopicCard';
import QuestionCard from '../components/dsa/QuestionCard';
import CodingWorkspace from '../components/dsa/CodingWorkspace';
import ProblemDetailTabs from '../components/dsa/ProblemDetailTabs';
import Breadcrumb from '../components/dsa/Breadcrumb';
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
  const [showQuestions, setShowQuestions] = useState(false);
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
        setSelectedQuestion(null);
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
    setSelectedQuestion(null);
    setSearch('');
    setDifficulty('All');
    setSortBy('default');
    setShowQuestions(true);
  };

  const handleBackToTopics = () => {
    setShowQuestions(false);
    setSelectedQuestion(null);
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
      {!showQuestions ? (
        <>
          <Breadcrumb
            items={[
              { label: 'DSA Practice Hub' },
              { label: 'Topics' },
            ]}
          />
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
        </>
      ) : (
        <>
          <Breadcrumb
            items={[
              { label: 'DSA Practice Hub', onClick: handleBackToTopics },
              { label: 'Topics', onClick: handleBackToTopics },
              { label: selectedTopic },
            ]}
          />
          <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
            <div className="space-y-4">
              <div className="rounded-3xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                <div className="flex flex-col gap-2">
                  <button type="button" onClick={handleBackToTopics} className="mb-2 text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                    ← Back to topics
                  </button>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{selectedTopic} Problems</p>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>{filteredQuestions.length} problems</p>
                </div>
                <div className="mt-3 flex flex-col gap-2 md:flex-row">
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..." className="input-field text-sm" />
                  <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="input-field text-sm">
                    <option value="All">All</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
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
                  <div className="rounded-3xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--surface)', height: '600px', display: 'flex', flexDirection: 'column' }}>
                    <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-black" style={{ color: 'var(--text)' }}>{selectedQuestion.title}</p>
                          <p className="text-xs" style={{ color: 'var(--text-3)' }}>{selectedQuestion.difficulty} • {selectedQuestion.points} pts</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <ProblemDetailTabs question={selectedQuestion} />
                    </div>
                  </div>
                  <CodingWorkspace
                    question={selectedQuestion}
                    language={language}
                    onLanguageChange={setLanguage}
                    onSubmitSuccess={handlePracticeStateUpdate}
                  />
                </>
              ) : (
                <div className="rounded-3xl border p-8 text-center" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>Select a problem to start coding.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DSAPage;