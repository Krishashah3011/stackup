const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-7 h-7 border-2', lg: 'w-11 h-11 border-[3px]' };
  return (
    <div
      className={`${sizes[size]} rounded-full animate-spin ${className}`}
      style={{
        borderColor: 'color-mix(in srgb, var(--primary) 20%, transparent)',
        borderTopColor: 'var(--primary)',
      }}
    />
  );
};
export default Spinner;