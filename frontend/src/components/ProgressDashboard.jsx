import { useEffect, useState } from 'react'

export default function ProgressDashboard({ apiBaseUrl, sessionId }) {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    ;(async () => {
      try {
        setErr('')
        const r = await fetch(`${apiBaseUrl}/session/${sessionId}`)
        if (!r.ok) throw new Error((await r.json())?.detail || 'Failed to load session')
        const j = await r.json()
        if (!cancelled) setData(j)
      } catch (e) {
        if (!cancelled) setErr(String(e?.message || e))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [apiBaseUrl, sessionId])

  if (!sessionId) return null

  return (
    <div className="glass p-4">
      <div className="text-sm font-semibold">Progress</div>
      {err ? <div className="mt-2 text-xs text-rose-200">{err}</div> : null}
      {data ? (
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <Stat label="Messages" value={data.message_count ?? 0} />
          <Stat label="Corrected" value={data.corrected_count ?? 0} />
          <Stat label="Score" value={data.score ?? 0} />
        </div>
      ) : (
        <div className="mt-2 text-xs text-slate-300">Loading...</div>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[11px] text-slate-300">{label}</div>
    </div>
  )
}

