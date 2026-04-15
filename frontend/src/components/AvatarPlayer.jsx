import { useEffect, useMemo, useRef } from 'react'

const EMO_COLORS = {
  encouraging: 'shadow-emerald-400/30 ring-emerald-400/40',
  neutral: 'shadow-cyan-400/20 ring-cyan-400/30',
  thinking: 'shadow-yellow-400/20 ring-yellow-400/30',
  happy: 'shadow-pink-400/20 ring-pink-400/30',
}

export default function AvatarPlayer({ videoUrl, audioUrl, emotion, subtitle }) {
  const audioRef = useRef(null)

  const glow = useMemo(() => EMO_COLORS[emotion] || EMO_COLORS.neutral, [emotion])

  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.load()
      audioRef.current.play().catch(() => {})
    }
  }, [audioUrl])

  return (
    <div className={['glass relative overflow-hidden', 'ring-1', glow].join(' ')}>
      {videoUrl ? (
        <video
          className="w-full h-[360px] object-cover"
          src={videoUrl}
          autoPlay
          playsInline
          controls={false}
        />
      ) : (
        <div className="w-full h-[360px] flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="text-center">
            <div className="text-5xl">🗣️</div>
            <div className="mt-2 text-sm text-slate-200">Audio-only mode</div>
          </div>
        </div>
      )}

      {audioUrl && <audio ref={audioRef} src={audioUrl} />}

      {subtitle ? (
        <div className="absolute left-0 right-0 bottom-0 p-3 bg-black/40 backdrop-blur">
          <div className="text-sm text-white/95">{subtitle}</div>
        </div>
      ) : null}
    </div>
  )
}

