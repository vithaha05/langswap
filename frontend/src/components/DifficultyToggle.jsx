const DIFFS = [
  { key: 'beginner', label: 'Beginner', cls: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' },
  { key: 'intermediate', label: 'Intermediate', cls: 'bg-yellow-500/20 text-yellow-200 border-yellow-400/30' },
  { key: 'advanced', label: 'Advanced', cls: 'bg-rose-500/20 text-rose-200 border-rose-400/30' },
]

export default function DifficultyToggle({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {DIFFS.map((d) => {
        const active = value === d.key
        return (
          <button
            key={d.key}
            type="button"
            onClick={() => onChange(d.key)}
            className={[
              'px-3 py-2 rounded-xl border text-sm font-semibold transition',
              d.cls,
              active ? 'ring-2 ring-white/30' : 'opacity-70 hover:opacity-100',
            ].join(' ')}
          >
            {d.label}
          </button>
        )
      })}
    </div>
  )
}

