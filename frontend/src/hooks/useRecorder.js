import { useCallback, useRef, useState } from 'react'

export function useRecorder() {
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)

  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)

  const startRecording = useCallback(async () => {
    setAudioBlob(null)
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream

    const mimeType = pickSupportedMimeType()
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream)
    chunksRef.current = []

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      const finalType =
        recorder.mimeType ||
        chunksRef.current?.[0]?.type ||
        mimeType ||
        'application/octet-stream'
      const blob = new Blob(chunksRef.current, { type: finalType })
      setAudioBlob(blob)
      setIsRecording(false)
      chunksRef.current = []
      streamRef.current?.getTracks()?.forEach((t) => t.stop())
      streamRef.current = null
    }

    mediaRecorderRef.current = recorder
    recorder.start()
    setIsRecording(true)
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  return { isRecording, startRecording, stopRecording, audioBlob }
}

function pickSupportedMimeType() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
    return ''
  }
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
  ]
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) || ''
}

