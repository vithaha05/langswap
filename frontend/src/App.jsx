import { useEffect, useMemo, useState } from 'react'

import AvatarPlayer from './components/AvatarPlayer.jsx'
import DifficultyToggle from './components/DifficultyToggle.jsx'
import LanguageSelector from './components/LanguageSelector.jsx'
import MicButton from './components/MicButton.jsx'
import ProgressDashboard from './components/ProgressDashboard.jsx'
import SubtitleBar from './components/SubtitleBar.jsx'
import { useRecorder } from './hooks/useRecorder.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function App() {
  const [language, setLanguage] = useState('french')
  const [difficulty, setDifficulty] = useState('beginner')
  const [sessionId, setSessionId] = useState('')
  const [isConfirmed, setIsConfirmed] = useState(false)

  const [conversationHistory, setConversationHistory] = useState([])
  const [mode, setMode] = useState('idle') // idle | recording | processing
  const [currentVideo, setCurrentVideo] = useState(null)
  const [currentAudio, setCurrentAudio] = useState(null)
  const [currentSubtitle, setCurrentSubtitle] = useState('')
  const [currentEmotion, setCurrentEmotion] = useState('neutral')
  const [userTranscript, setUserTranscript] = useState('')
  const [error, setError] = useState('')

  const { isRecording, startRecording, stopRecording, audioBlob } = useRecorder()

  useEffect(() => {
    if (isRecording) setMode('recording')
    else if (mode === 'recording') setMode('idle')
  }, [isRecording]) // eslint-disable-line react-hooks/exhaustive-deps

  // Create session on mount
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language, difficulty }),
        })
        if (!r.ok) throw new Error((await r.json())?.detail || 'Failed to create session')
        const j = await r.json()
        if (!cancelled) setSessionId(j.session_id)
      } catch (e) {
        if (!cancelled) setError(String(e?.message || e))
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Main pipeline — triggered when user stops recording
  useEffect(() => {
    if (!audioBlob || !sessionId) return
    ;(async () => {
      try {
        setError('')
        setMode('processing')

        // 1) Transcribe user speech
        const fd = new FormData()
        const audioExt = mimeToExtension(audioBlob.type)
        fd.append('audio', audioBlob, `speech.${audioExt}`)
        const tr = await fetch(`${API_BASE_URL}/transcribe`, { method: 'POST', body: fd })
        if (!tr.ok) throw new Error((await tr.json())?.detail || 'Transcription failed')
        const tj = await tr.json()
        setUserTranscript(tj.text || '')

        // 2) Get tutor response from LLM
        const history = conversationHistory
        const rr = await fetch(`${API_BASE_URL}/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: tj.text || '', language, difficulty, history }),
        })
        if (!rr.ok) throw new Error((await rr.json())?.detail || 'Tutor response failed')
        const rj = await rr.json()

        setCurrentSubtitle(rj.reply || '')
        setCurrentEmotion(rj.emotion || 'neutral')

        // 3) Convert reply to speech
        const sr = await fetch(`${API_BASE_URL}/speak`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: rj.reply || '', language }),
        })
        if (!sr.ok) throw new Error((await sr.json())?.detail || 'TTS failed')

        const audioId = sr.headers.get('X-Audio-Id')
        const audioBytes = await sr.blob()
        const localAudioUrl = URL.createObjectURL(audioBytes)
        setCurrentAudio(localAudioUrl)

        // 4) Generate lip-synced avatar video (optional — needs D-ID key)
        let videoUrl = null
        if (audioId) {
          const publicAudioUrl = `${API_BASE_URL}/media/${audioId}.mp3`
          const ar = await fetch(`${API_BASE_URL}/avatar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio_url: publicAudioUrl, emotion: rj.emotion || 'neutral' }),
          })
          if (ar.ok) {
            const aj = await ar.json()
            videoUrl = aj.video_url || null
          }
        }
        setCurrentVideo(videoUrl)

        // 5) Save conversation to session
        const nextHistory = [
          ...conversationHistory,
          { role: 'user', content: tj.text || '' },
          { role: 'assistant', content: rj.reply || '' },
        ]
        setConversationHistory(nextHistory)
        await fetch(`${API_BASE_URL}/session/${sessionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: nextHistory,
            corrected_delta: rj.corrected ? 1 : 0,
            language,
            difficulty,
          }),
        })
      } catch (e) {
        setError(String(e?.message || e))
      } finally {
        setMode('idle')
      }
    })()
  }, [audioBlob]) // eslint-disable-line react-hooks/exhaustive-deps

  const micDisabled = useMemo(() => !isConfirmed || mode === 'processing', [isConfirmed, mode])

  const handleConfirm = () => {
    setIsConfirmed(true)
    setCurrentVideo(null)
    setCurrentAudio(null)
    setCurrentSubtitle('Ready! Tap the mic and start speaking 🎤')
    setUserTranscript('')
    setConversationHistory([])
    setMode('idle')
  }

  const handleReset = () => {
    setIsConfirmed(false)
    setCurrentVideo(null)
    setCurrentAudio(null)
    setCurrentSubtitle('')
    setUserTranscript('')
    setConversationHistory([])
    setMode('idle')
    setError('')
  }

  return (
    <div className="min-h-full">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-bold tracking-tight">LangSwap</div>
            <div className="text-sm text-slate-300">
              Speak → transcribe → tutor reply → voice → (optional) avatar
            </div>
          </div>
          <div className="text-xs text-slate-400">
            API: <span className="text-slate-200">{API_BASE_URL}</span>
          </div>
        </div>

        {error ? (
          <div className="mt-4 glass p-3 border-rose-400/30">
            <div className="text-sm text-rose-200">{error}</div>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <AvatarPlayer
              videoUrl={currentVideo}
              audioUrl={currentAudio}
              emotion={currentEmotion}
              subtitle={currentSubtitle}
            />

            <SubtitleBar userText={userTranscript} replyText={currentSubtitle} />

            <div className="flex items-center justify-between">
              <MicButton
                mode={mode}
                onStart={() => startRecording()}
                onStop={() => stopRecording()}
                disabled={micDisabled}
              />
              <div className="text-xs text-slate-300">
                {!isConfirmed
                  ? 'Choose language + difficulty, then confirm'
                  : mode === 'recording'
                  ? '🔴 Recording... tap to stop'
                  : mode === 'processing'
                  ? '⏳ Processing your speech...'
                  : '🎤 Tap to speak'}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass p-4 space-y-4">
              <div>
                <div className="text-sm font-semibold">Language</div>
                <div className="mt-2">
                  <LanguageSelector value={language} onChange={setLanguage} />
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold">Difficulty</div>
                <div className="mt-2">
                  <DifficultyToggle value={difficulty} onChange={setDifficulty} />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2 text-sm font-semibold hover:opacity-95"
                  disabled={mode !== 'idle'}
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
                  disabled={mode !== 'idle'}
                >
                  Reset
                </button>
              </div>
            </div>

            <ProgressDashboard apiBaseUrl={API_BASE_URL} sessionId={sessionId} />
          </div>
        </div>
      </div>
    </div>
  )
}

function mimeToExtension(mime) {
  const m = (mime || '').toLowerCase()
  if (m.includes('webm')) return 'webm'
  if (m.includes('mp4')) return 'mp4'
  if (m.includes('mpeg')) return 'mp3'
  if (m.includes('wav')) return 'wav'
  if (m.includes('aac')) return 'aac'
  return 'bin'
}