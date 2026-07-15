const Breadcrumb = ({ items = [] }) => {
  return (
    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-3)' }}>
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          {idx > 0 && <span>/</span>}
          {item.onClick ? (
            <button type="button" onClick={item.onClick} className="font-semibold" style={{ color: 'var(--primary)' }}>
              {item.label}
            </button>
          ) : (
            <span className={idx === items.length - 1 ? 'font-semibold' : ''}>{item.label}</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default Breadcrumb;
