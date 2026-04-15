const LANGS = [
  { key: 'french', label: 'French', flag: '🇫🇷' },
  { key: 'spanish', label: 'Spanish', flag: '🇪🇸' },
  { key: 'japanese', label: 'Japanese', flag: '🇯🇵' },
]

export default function LanguageSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {LANGS.map((l) => {
        const active = value === l.key
        return (
          <button
            key={l.key}
            type="button"
            onClick={() => onChange(l.key)}
            className={[
              'glass px-4 py-4 text-left transition',
              active ? 'ring-2 ring-cyan-400/70' : 'hover:bg-white/10',
            ].join(' ')}
          >
            <div className="text-2xl">{l.flag}</div>
            <div className="mt-2 font-semibold">{l.label}</div>
            <div className="text-xs text-slate-300">Immersive tutoring</div>
          </button>
        )
      })}
    </div>
  )
}

