
import React, { useState, useRef, useEffect } from 'react';
import AudioPlayer, { RHAP_UI } from 'react-h5-audio-player';
import { SpeechFile, Phrase, Chunk } from '../../api/SpeechApiModels';
import styles from './TranscriptionDisplay.module.css';

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
      <div className={styles.transcriptionDisplayAudioContainer}>
        <h5 className={styles.transcriptionDisplayAudioTitle}>Audio Player</h5>
        {isDownloadingAudio && (
          <span className={styles.transcriptionDisplayAudioStatus}>Downloading audio file...</span>
        )}
        {!isDownloadingAudio && audioBlobUrl === null && file?.BlobUrl && hasDownloadedAudio && (
          <span className={styles.transcriptionDisplayAudioError}>Failed to download audio file.</span>
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
        <div className={styles.transcriptionDisplayAudioControls}>
          <strong>Starts at:</strong> {typeof resolvedStartTime === 'number' ? formatSecondsToTimestamp(resolvedStartTime) : startTimeRaw}
          <button
            type="button"
            className={styles.transcriptionDisplayJumpButton}
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
      <div className={styles.transcriptionDisplayMain}>
        <h5 className={styles.transcriptionDisplayMainTitle}>Full Transcription</h5>
        <div
          className={styles.transcriptionDisplayTranscript}
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
                className={
                  [
                    styles.transcriptionDisplayPhrase,
                    isChunk ? styles.transcriptionDisplayPhraseChunk : ''
                  ].join(' ')
                }
                style={{ borderLeft: `5px solid ${borderColor}` }}
                title={`Transcription confidence: ${(confidence * 100).toFixed(1)}%`}>
                <span className={styles.transcriptionDisplayPhraseText}>{phrase.DisplayText}</span>
                <button
                  type="button"
                  className={styles.transcriptionDisplayPhraseButton}
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
