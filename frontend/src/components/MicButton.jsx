import { useMemo } from 'react'

export default function MicButton({ mode, onStart, onStop, disabled }) {
  const label = useMemo(() => {
    if (mode === 'recording') return 'Stop'
    if (mode === 'processing') return '...'
    return 'Speak'
  }, [mode])

  const isRecording = mode === 'recording'
  const isProcessing = mode === 'processing'

  return (
    <button
      type="button"
      disabled={disabled || isProcessing}
      onClick={isRecording ? onStop : onStart}
      className={[
        'relative h-20 w-20 rounded-full transition',
        'border border-white/10 shadow-xl',
        isRecording ? 'bg-red-500/90' : 'bg-cyan-500/90',
        disabled || isProcessing ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.02]',
      ].join(' ')}
    >
      {isRecording && (
        <span className="absolute -inset-2 rounded-full bg-red-400/20 animate-ping" />
      )}
      <span className="relative text-sm font-semibold">{label}</span>
    </button>
  )
}

