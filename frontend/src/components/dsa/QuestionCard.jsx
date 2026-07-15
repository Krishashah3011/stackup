const difficultyStyles = {
  Easy: { bg: 'color-mix(in srgb, var(--success) 12%, transparent)', color: 'var(--success)', border: 'color-mix(in srgb, var(--success) 30%, transparent)' },
  Medium: { bg: 'color-mix(in srgb, var(--warning) 12%, transparent)', color: 'var(--warning)', border: 'color-mix(in srgb, var(--warning) 30%, transparent)' },
  Hard: { bg: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)', border: 'color-mix(in srgb, var(--danger) 30%, transparent)' },
};

const QuestionCard = ({ question, solved, bookmarked, onSelect, onToggleBookmark }) => {
  const difficulty = difficultyStyles[question.difficulty] || difficultyStyles.Medium;

  return (
    <div className="card-interactive text-left w-full">
      <button type="button" onClick={() => onSelect(question)} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-3)' }}>#{question.id}</span>
              <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: difficulty.bg, color: difficulty.color, border: `1px solid ${difficulty.border}` }}>
                {question.difficulty}
              </span>
            </div>
            <h3 className="mt-2 font-semibold" style={{ color: 'var(--text)' }}>{question.title}</h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-3)' }}>{question.description}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm" style={{ color: 'var(--text-3)' }}>
          <span>{question.points} Points</span>
          <span className="font-semibold" style={{ color: solved ? 'var(--success)' : 'var(--text-2)' }}>
            {solved ? 'Solved' : 'Unsolved'}
          </span>
        </div>
      </button>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => onToggleBookmark(question.id)}
          className="rounded-full p-2"
          style={{ background: 'var(--surface-2)', color: bookmarked ? 'var(--primary)' : 'var(--text-3)' }}
        >
          {bookmarked ? '★' : '☆'}
        </button>
      </div>
    </div>
  );
};

export default QuestionCard;
