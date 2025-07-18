import React, { useState, useRef, useEffect } from 'react';
import AudioPlayer, { RHAP_UI } from 'react-h5-audio-player';
import { SpeechFile, Phrase, Chunk } from '../../api/SpeechApiModels';

interface TranscriptionDisplayProps {
  file?: SpeechFile;
  phrases?: Phrase[];
  chunk?: Chunk;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ file, phrases, chunk }) => {
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [isDownloadingAudio, setIsDownloadingAudio] = useState(false);
  const [hasDownloadedAudio, setHasDownloadedAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null | any>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const transcriptAutoScrollMap = useRef<WeakMap<Element, boolean>>(new WeakMap());

  useEffect(() => {
    if (chunk && phrases) {
      const startIdx = chunk.StartPhraseIndex;
      const phrase = phrases[startIdx];
      const startTimeRaw = phrase?.StartTime ?? 0;
      setStartTime(parseTimeToSeconds(startTimeRaw));
    } else {
      setStartTime(null);
    }
  }, [chunk, phrases]);

  useEffect(() => {
    if (!file?.BlobUrl) {
      if (audioBlobUrl) {
        URL.revokeObjectURL(audioBlobUrl);
        setAudioBlobUrl(null);
      }
      setHasDownloadedAudio(false);
      setIsDownloadingAudio(false);
    }
  }, [file?.BlobUrl]);

  const parseTimeToSeconds = (time: string | number): number => {
    if (typeof time === 'number') return time;
    if (typeof time === 'string') {
      const match = time.match(/^\d{2}:\d{2}:\d{2}(?:\.\d+)?/);
      if (match) {
        const [hours, minutes, seconds] = match[0].split(':').map(parseFloat);
        return hours * 3600 + minutes * 60 + seconds;
      }
      return parseFloat(time) || 0;
    }
    return 0;
  };

  const getConfidenceColor = (conf: number): string => {
    conf = Math.max(0, Math.min(1, conf));
    const stops = [
      { stop: 0.45, r: 200, g: 100, b: 100 },
      { stop: 0.55, r: 220, g: 160, b: 100 },
      { stop: 0.65, r: 220, g: 200, b: 100 },
      { stop: 0.8, r: 100, g: 180, b: 120 },
    ];
    let lower = stops[0];
    let upper = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
      if (conf >= stops[i].stop && conf <= stops[i + 1].stop) {
        lower = stops[i];
        upper = stops[i + 1];
        break;
      }
    }
    const range = upper.stop - lower.stop;
    const factor = (conf - lower.stop) / range;
    const r = Math.round(lower.r + (upper.r - lower.r) * factor);
    const g = Math.round(lower.g + (upper.g - lower.g) * factor);
    const b = Math.round(lower.b + (upper.b - lower.b) * factor);
    return `rgb(${r},${g},${b})`;
  };

  const downloadAndSetAudio = async (url: string, startTime?: number) => {
    setIsDownloadingAudio(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      setAudioBlobUrl(blobUrl);
      setHasDownloadedAudio(true);
      setTimeout(() => {
        const audioEl = audioRef.current?.audio?.current;
        if (audioEl && typeof startTime === 'number') {
          audioEl.currentTime = startTime;
          audioEl.play();
        }
      }, 200);
    } catch {
      setAudioBlobUrl(null);
      alert('Failed to download audio file.');
    } finally {
      setIsDownloadingAudio(false);
    }
  };

  const handleSeekAndPlay = async (seekTime: number) => {
    if (!audioBlobUrl && !isDownloadingAudio && !hasDownloadedAudio && file?.BlobUrl) {
      await downloadAndSetAudio(file.BlobUrl, seekTime);
      return;
    }
    const audioEl = audioRef.current?.audio?.current;
    if (audioEl && audioEl.seekable.length > 0) {
      audioEl.currentTime = seekTime;
      audioEl.play();
    } else {
      alert('Audio not loaded or seekable yet. Will play when ready.');
    }
  };

  const handleAudioLoaded = () => {
    setTimeout(() => {
      const audioEl = audioRef.current?.audio?.current;
      if (audioEl && audioEl.seekable.length > 0) {
        audioEl.play();
      }
    }, 100);
  };

  if (!file || !file.BlobUrl || !file.BlobUrl.endsWith('.mp3') || !chunk || !phrases) return null;

  const startIdx = chunk.StartPhraseIndex;
  const phrase = phrases[startIdx];
  const startTimeRaw = phrase?.StartTime ?? 0;
  const resolvedStartTime = parseTimeToSeconds(startTimeRaw);
  const audioUrl = hasDownloadedAudio && audioBlobUrl ? audioBlobUrl : '';

  return (
    <>
      <div style={{ marginBottom: '1em', padding: '0.5em', background: '#f0f8ff', borderRadius: '6px' }}>
        <h5 style={{ margin: 0 }}>Audio Player</h5>
        {isDownloadingAudio && (
          <span style={{ color: '#0078d4', fontSize: '0.9em', marginBottom: '0.5em' }}>Downloading audio file...</span>
        )}
        {!isDownloadingAudio && audioBlobUrl === null && file?.BlobUrl && hasDownloadedAudio && (
          <span style={{ color: 'red', fontSize: '0.9em', marginBottom: '0.5em' }}>Failed to download audio file.</span>
        )}
        <AudioPlayer
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          onPlay={async e => {
            if (!hasDownloadedAudio) {
              e.preventDefault();
              if (file?.BlobUrl && startTime !== null) {
                await downloadAndSetAudio(file.BlobUrl, startTime);
              }
            } else {
              const audioEl = audioRef.current?.audio?.current;
              if (audioEl && audioEl.paused) {
                audioEl.play();
              }
            }
          }}
          onPause={() => {
            const audioEl = audioRef.current?.audio?.current;
            if (audioEl && !audioEl.paused) {
              audioEl.pause();
            }
          }}
          onLoadedMetaData={handleAudioLoaded}
          style={{ width: '100%' }}
          showJumpControls={false}
          showDownloadProgress={true}
          customAdditionalControls={[]}
          customVolumeControls={[RHAP_UI.VOLUME]}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2em', fontSize: '0.9em', color: '#555', marginTop: '0.5em' }}>
          <strong>Starts at:</strong> {typeof resolvedStartTime === 'number' ? formatSecondsToTimestamp(resolvedStartTime) : startTimeRaw}
          <button
            type="button"
            style={{ marginLeft: '1em', padding: '2px 8px', fontSize: '0.9em', borderRadius: '4px', border: '1px solid #ccc', background: '#f7f7fa', cursor: 'pointer' }}
            onClick={async () => {
              if (!audioBlobUrl && !isDownloadingAudio && !hasDownloadedAudio) {
                if (file) {
                  await downloadAndSetAudio(file.BlobUrl, resolvedStartTime);
                }
                return;
              }
              const audioEl = audioRef.current?.audio?.current;
              if (audioEl && audioEl.seekable.length > 0) {
                audioEl.currentTime = resolvedStartTime;
                audioEl.play();
              } else if (!isDownloadingAudio) {
                alert('Audio not loaded or seekable yet.');
              }
            }}
          >
            Jump to citation start
          </button>
        </div>
      </div>
      {/* Full Transcription */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <h5 style={{ margin: '1em 0 0.5em 0' }}>Full Transcription</h5>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '1em',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.5',
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            border: '1px solid #eee',
            borderRadius: '6px',
            padding: '0.5em',
            paddingLeft: '0',
            background: '#fff'
          }}
          ref={el => {
            if (el && chunk && !transcriptAutoScrollMap.current.get(el)) {
              const startIdx = chunk?.StartPhraseIndex ?? -1;
              const phraseDiv = el.querySelector(`[data-phrase-idx='${startIdx}']`);
              if (phraseDiv) {
                phraseDiv.scrollIntoView({ behavior: 'auto', block: 'center' });
                transcriptAutoScrollMap.current.set(el, true);
              }
            }
          }}
        >
          {phrases?.map((phrase: Phrase, idx: number) => {
            const startIdx = chunk?.StartPhraseIndex ?? -1;
            const endIdx = chunk?.EndPhraseIndex ?? -1;
            const isChunk = idx >= startIdx && idx <= endIdx;
            const confidence = typeof phrase.RecognitionConfidence === 'number' ? phrase.RecognitionConfidence : 0;
            const borderColor = getConfidenceColor(confidence);
            return (
              <div
                key={phrase.Id || idx}
                data-phrase-idx={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: isChunk ? '#e6f7ff' : 'transparent',
                  borderRadius: isChunk ? '4px' : undefined,
                  padding: isChunk ? '2px 0' : undefined,
                  borderLeft: `5px solid ${borderColor}`,
                  paddingLeft: `0.5em`,
                  marginLeft: '0',
                }}
                title={`Transcription confidence: ${(confidence * 100).toFixed(1)}%`}>
                <span style={{ flex: 1 }}>{phrase.DisplayText}</span>
                <button
                  type="button"
                  style={{
                    marginLeft: 'auto',
                    height: '22px',
                    background: '#f7f7fa',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    color: 'gray',
                    userSelect: 'none'
                  }}
                  title={`Jump to ${formatSecondsToTimestamp(parseTimeToSeconds(phrase.StartTime))}`}
                  onClick={() => handleSeekAndPlay(parseTimeToSeconds(phrase.StartTime))}>
                  ▶
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

// Format seconds as M:SS
function formatSecondsToTimestamp(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default TranscriptionDisplay;
