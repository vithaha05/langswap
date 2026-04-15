export default function SubtitleBar({ userText, replyText }) {
  const { target, english } = splitReply(replyText)

  return (
    <div className="glass p-4 w-full">
      <div className="text-xs text-slate-300">{userText || '...'}</div>
      <div className="mt-2 text-lg font-semibold text-white">{target || ''}</div>
      {english && <div className="mt-1 text-sm italic text-slate-200">{english}</div>}
    </div>
  )
}

function splitReply(reply) {
  const r = (reply || '').trim()
  if (!r) return { target: '', english: '' }

  const open = r.lastIndexOf('(')
  const close = r.lastIndexOf(')')
  if (open !== -1 && close !== -1 && close > open) {
    return {
      target: r.slice(0, open).trim(),
      english: r.slice(open, close + 1).trim(),
    }
  }
  return { target: r, english: '' }
}

