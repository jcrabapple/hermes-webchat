export default function StreamingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="rounded-full animate-bounce"
          style={{
            width: 6,
            height: 6,
            background: 'var(--accent)',
            animationDelay: `${i * 0.15}s`,
            animationDuration: '0.9s',
          }}
        />
      ))}
    </div>
  )
}
