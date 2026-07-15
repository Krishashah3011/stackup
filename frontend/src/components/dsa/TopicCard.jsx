const topicMeta = {
  'Basics & Math': { icon: '➕', accent: '#EC4899' },
  'Arrays & Hashing': { icon: '🧮', accent: '#3B82F6' },
  'Two Pointers': { icon: '↔️', accent: '#8B5CF6' },
  'Strings': { icon: '🔤', accent: '#F59E0B' },
  'Recursion': { icon: '🔁', accent: '#10B981' },
  'Sorting': { icon: '📊', accent: '#EF4444' },
  'Binary Search': { icon: '🔍', accent: '#0EA5E9' },
  'Prefix & Suffix Sum': { icon: '➗', accent: '#A855F7' },
  'Sliding Window': { icon: '🪟', accent: '#14B8A6' },
  'Linked List': { icon: '🔗', accent: '#F472B6' },
  'Stack': { icon: '🧱', accent: '#6366F1' },
  'Queue': { icon: '🧺', accent: '#06B6D4' },
  'Trees': { icon: '🌳', accent: '#84CC16' },
  'Binary Trees': { icon: '🌲', accent: '#65A30D' },
  'Binary Search Trees': { icon: '🌲', accent: '#CA8A04' },
  'Heap / Priority Queue': { icon: '🪙', accent: '#FB923C' },
  'Greedy': { icon: '🎯', accent: '#DC2626' },
  'Backtracking': { icon: '🧭', accent: '#0F766E' },
  'Dynamic Programming': { icon: '⚡', accent: '#7C3AED' },
  'Graphs': { icon: '🕸️', accent: '#4F46E5' },
  'Tries': { icon: '🌿', accent: '#F43F5E' },
  'Bit Manipulation': { icon: '⚙️', accent: '#475569' },
  'Segment Tree': { icon: '🌲', accent: '#2DD4BF' },
  'Disjoint Set Union': { icon: '🔗', accent: '#7E22CE' },
  'Advanced Graphs': { icon: '🧠', accent: '#2563EB' },
};

const TopicCard = ({ topic, progress, onSelect }) => {
  const meta = topicMeta[topic] || { icon: '📘', accent: 'var(--primary)' };
  const solved = progress?.solvedCount || 0;
  const total = progress?.totalCount || 40;
  const completion = progress?.completion || 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(topic)}
      className="card-interactive text-left"
      style={{ borderColor: completion === 100 ? 'color-mix(in srgb, var(--success) 25%, transparent)' : 'var(--border)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-xl" style={{ background: `color-mix(in srgb, ${meta.accent} 14%, transparent)`, color: meta.accent }}>
            {meta.icon}
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--text)' }}>{topic}</p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>{solved}/{total} solved</p>
          </div>
        </div>
        <div className="rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: `color-mix(in srgb, ${meta.accent} 12%, transparent)`, color: meta.accent }}>
          {completion}%
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${completion}%`, background: `linear-gradient(90deg, ${meta.accent} 0%, var(--primary) 100%)` }} />
      </div>
      <div className="mt-3 flex items-center justify-between text-sm" style={{ color: 'var(--text-3)' }}>
        <span>Progress</span>
        <span className="font-semibold" style={{ color: 'var(--text)' }}>{completion}% complete</span>
      </div>
    </button>
  );
};

export default TopicCard;
