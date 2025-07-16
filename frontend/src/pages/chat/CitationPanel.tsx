import React, { useState, useRef, useEffect } from 'react';
import { Stack, IconButton } from '@fluentui/react';
import AudioPlayer, { RHAP_UI } from 'react-h5-audio-player';
import styles from './Chat.module.css';

interface CitationPanelProps {
  isCitationPanelOpen: boolean;
  activeCitation: any;
  activeCitationDetails: any;
  setIsCitationPanelOpen: (open: boolean) => void;
}

const CitationPanel: React.FC<CitationPanelProps> = ({
  isCitationPanelOpen,
  activeCitation,
  activeCitationDetails,
  setIsCitationPanelOpen,
}) => {
  const [citationAudioBlobUrl, setCitationAudioBlobUrl] = useState<string | null>(null);
  const [isDownloadingAudio, setIsDownloadingAudio] = useState(false);
  const [hasDownloadedAudio, setHasDownloadedAudio] = useState(false);
  const citationAudioRef = useRef<any>(null);
  const [citationCurrentTime, setCitationCurrentTime] = useState(0);
  const [hasSeekedCitation, setHasSeekedCitation] = useState(false);
  const [citationStartTime, setCitationStartTime] = useState<number | null>(null); // New state for start time
  const transcriptAutoScrollMap = useRef<WeakMap<Element, boolean>>(new WeakMap());

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
    const blend = 0.6;
    const r = Math.round((conf < 0.5 ? 220 + (255 - 220) * (conf / 0.5) : 255 + (34 - 255) * ((conf - 0.5) / 0.5)) * blend + 255 * (1 - blend));
    const g = Math.round((conf < 0.5 ? 38 + (215 - 38) * (conf / 0.5) : 215 + (197 - 215) * ((conf - 0.5) / 0.5)) * blend + 255 * (1 - blend));
    const b = Math.round((conf < 0.5 ? 38 : 0 + (94 - 0) * ((conf - 0.5) / 0.5)) * blend + 255 * (1 - blend));
    return `rgb(${r},${g},${b})`;
  };

  const downloadAndSetCitationAudio = async (url: string, startTime?: number) => {
    setIsDownloadingAudio(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      setCitationAudioBlobUrl(blobUrl);
      setHasDownloadedAudio(true);
      setTimeout(() => {
        const audioEl = citationAudioRef.current?.audio?.current;
        if (audioEl && typeof startTime === 'number') {
          audioEl.currentTime = startTime;
          audioEl.play();
          setHasSeekedCitation(true);
        }
      }, 200);
    } catch {
      setCitationAudioBlobUrl(null);
      alert('Failed to download audio file.');
    } finally {
      setIsDownloadingAudio(false);
    }
  };

  const handleSeekAndPlay = async (startTime: number) => {
    if (!citationAudioBlobUrl && !isDownloadingAudio && !hasDownloadedAudio && activeCitationDetails?.file?.BlobUrl) {
      await downloadAndSetCitationAudio(activeCitationDetails.file.BlobUrl, startTime);
      return;
    }
    const audioEl = citationAudioRef.current?.audio?.current;
    if (audioEl && audioEl.seekable.length > 0) {
      audioEl.currentTime = startTime;
      audioEl.play();
      setHasSeekedCitation(true);
    } else {
      alert('Audio not loaded or seekable yet. Will play when ready.');
    }
  };

  const handleAudioLoadedMetaData = () => {
    setTimeout(() => {
      const audioEl = citationAudioRef.current?.audio?.current;
      if (audioEl && audioEl.seekable.length > 0) {
        audioEl.play();
        setHasSeekedCitation(true);
      }
    }, 100);
  };

  const seekToCitationStart = (startTime: number) => {
    const audioEl = citationAudioRef.current?.audio?.current;
    if (audioEl && typeof startTime === 'number' && !isNaN(startTime)) {
      audioEl.currentTime = startTime;
      setHasSeekedCitation(true);
    }
  };

  useEffect(() => {
    if (!isCitationPanelOpen || !activeCitationDetails?.file?.BlobUrl) {
      if (citationAudioBlobUrl) {
        URL.revokeObjectURL(citationAudioBlobUrl);
        setCitationAudioBlobUrl(null);
      }
      setHasDownloadedAudio(false);
      setIsDownloadingAudio(false);
      setHasSeekedCitation(false);
    }
  }, [isCitationPanelOpen, activeCitationDetails?.file?.BlobUrl]);

  useEffect(() => {
    if (activeCitationDetails?.chunk && activeCitationDetails?.phrases) {
      const startIdx = activeCitationDetails.chunk.StartPhraseIndex;
      const phrase = activeCitationDetails.phrases[startIdx];
      const startTimeRaw = phrase?.StartTime ?? 0;
      setCitationStartTime(parseTimeToSeconds(startTimeRaw));
    } else {
      setCitationStartTime(null);
    }
  }, [activeCitationDetails]);

  if (!isCitationPanelOpen || !activeCitation) return null;

  return (
    <Stack.Item
      className={styles.citationPanel}
      tabIndex={0}
      role="tabpanel"
      aria-label="Citations Panel"
      style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: '0 0 auto' }}>
        <Stack
          aria-label="Citations Panel Header Container"
          horizontal
          className={styles.citationPanelHeaderContainer}
          horizontalAlign="space-between"
          verticalAlign="center">
          <span aria-label="Citations" className={styles.citationPanelHeader}>
            Citations
          </span>
          <IconButton
            iconProps={{ iconName: 'Cancel' }}
            aria-label="Close citations panel"
            onClick={() => setIsCitationPanelOpen(false)}
          />
        </Stack>
        <h5
          className={styles.citationPanelTitle}
          tabIndex={0}
          title={
            activeCitation.url && !activeCitation.url.includes('blob.core')
              ? activeCitation.url
              : activeCitation.title ?? ''
          }>
          {activeCitation.title}
        </h5>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {activeCitationDetails ? (
          activeCitationDetails.error ? (
            <div style={{ color: 'red' }}>{activeCitationDetails.error}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
              {/* File Info */}
              <div style={{ marginBottom: '1em', padding: '0.5em', background: '#f7f7fa', borderRadius: '6px' }}>
                <h5 style={{ margin: 0 }}>File Info</h5>
                <div><strong>Audio File Name:</strong> {activeCitationDetails.file?.OriginalFileName}</div>
                <div><strong>Blob URL:</strong> {activeCitationDetails.file?.BlobUrl ? <a href={activeCitationDetails.file.BlobUrl} target="_blank" rel="noopener noreferrer">Open</a> : '-'}</div>
                <div><strong>File Hash:</strong> {activeCitationDetails.file?.FileHash}</div>
              </div>
              {/* Audio Player */}
              {activeCitationDetails.file?.BlobUrl && activeCitationDetails.file.BlobUrl.endsWith('.mp3') && activeCitationDetails.chunk && activeCitationDetails.phrases ? (
                (() => {
                  const startIdx = activeCitationDetails.chunk.StartPhraseIndex;
                  const phrase = activeCitationDetails.phrases[startIdx];
                  const startTimeRaw = phrase?.StartTime ?? 0;
                  const startTime = parseTimeToSeconds(startTimeRaw);
                  const handleAudioLoaded = () => {
                    setTimeout(() => {
                      if (citationAudioRef.current?.audio?.current && citationAudioRef.current.audio.current.seekable.length > 0) {
                        setHasSeekedCitation(true);
                        seekToCitationStart(startTime);
                      }
                    }, 100);
                  };
                  const audioUrl = hasDownloadedAudio && citationAudioBlobUrl ? citationAudioBlobUrl : ''; // Use empty string as placeholder when not downloaded
                  const handlePlay = async () => {
                    if (!citationAudioBlobUrl && !isDownloadingAudio && !hasDownloadedAudio) {
                      await downloadAndSetCitationAudio(activeCitationDetails.file.BlobUrl, startTime);
                    }
                  };
                  return (
                    <div style={{ marginBottom: '1em', padding: '0.5em', background: '#f0f8ff', borderRadius: '6px' }}>
                      <h5 style={{ margin: 0 }}>Audio Player</h5>
                      {isDownloadingAudio && (
                        <span style={{ color: '#0078d4', fontSize: '0.9em', marginBottom: '0.5em' }}>Downloading audio file...</span>
                      )}
                      {!isDownloadingAudio && citationAudioBlobUrl === null && activeCitationDetails?.file?.BlobUrl && hasDownloadedAudio && (
                        <span style={{ color: 'red', fontSize: '0.9em', marginBottom: '0.5em' }}>Failed to download audio file.</span>
                      )}
                      <AudioPlayer
                        ref={citationAudioRef}
                        src={audioUrl}
                        preload="auto"
                        onPlay={async e => {
                          if (!hasDownloadedAudio) {
                            e.preventDefault(); // Prevent default play action
                            if (activeCitationDetails?.file?.BlobUrl && citationStartTime !== null) {
                              await downloadAndSetCitationAudio(activeCitationDetails.file.BlobUrl, citationStartTime);
                            }
                          } else {
                            const audioEl = citationAudioRef.current?.audio?.current;
                            if (audioEl && audioEl.paused) {
                              audioEl.play();
                            }
                          }
                        }}
                        onPause={() => {
                          const audioEl = citationAudioRef.current?.audio?.current;
                          if (audioEl && !audioEl.paused) {
                            audioEl.pause();
                          }
                        }}
                        onListen={e => {
                          const audioEl = citationAudioRef.current?.audio.current;
                          if (audioEl) setCitationCurrentTime(audioEl.currentTime);
                        }}
                        onLoadedMetaData={handleAudioLoaded}
                        style={{ width: '100%' }}
                        showJumpControls={false}
                        showDownloadProgress={true}
                        customAdditionalControls={[]}
                        customVolumeControls={[RHAP_UI.VOLUME]}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1em', fontSize: '0.9em', color: '#555', marginTop: '0.5em' }}>
                        <strong>Starts at:</strong> {typeof startTimeRaw === 'string' ? `${startTime.toFixed(2)}s` : startTimeRaw}
                        <button
                          type="button"
                          style={{ marginLeft: '1em', padding: '2px 8px', fontSize: '0.9em', borderRadius: '4px', border: '1px solid #ccc', background: '#f7f7fa', cursor: 'pointer' }}
                          onClick={async () => {
                            if (!citationAudioBlobUrl && !isDownloadingAudio && !hasDownloadedAudio) {
                              await downloadAndSetCitationAudio(activeCitationDetails.file.BlobUrl, startTime);
                              return;
                            }
                            const audioEl = citationAudioRef.current?.audio?.current;
                            if (audioEl && audioEl.seekable.length > 0) {
                              audioEl.currentTime = startTime;
                              audioEl.play();
                              setHasSeekedCitation(true);
                            } else if (!isDownloadingAudio) {
                              alert('Audio not loaded or seekable yet.');
                            }
                          }}
                        >
                          Jump to citation start
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : null}
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
                    if (el && activeCitationDetails.chunk && !transcriptAutoScrollMap.current.get(el)) {
                      const startIdx = activeCitationDetails.chunk?.StartPhraseIndex ?? -1;
                      const phraseDiv = el.querySelector(`[data-phrase-idx='${startIdx}']`);
                      if (phraseDiv) {
                        phraseDiv.scrollIntoView({ behavior: 'auto', block: 'center' });
                        transcriptAutoScrollMap.current.set(el, true);
                      }
                    }
                  }}
                >
                  {activeCitationDetails.phrases?.map((phrase: any, idx: number) => {
                    const startIdx = activeCitationDetails.chunk?.StartPhraseIndex ?? -1;
                    const endIdx = activeCitationDetails.chunk?.EndPhraseIndex ?? -1;
                    const isChunk = idx >= startIdx && idx <= endIdx;
                    const confidence = typeof phrase.RecognitionConfidence === 'number' ? phrase.RecognitionConfidence : 0;
                    const borderColor = getConfidenceColor(confidence);
                    return (
                      <div
                        key={phrase._id}
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
                          title={`Jump to ${parseTimeToSeconds(phrase.StartTime).toFixed(2)}s`}
                          onClick={() => handleSeekAndPlay(parseTimeToSeconds(phrase.StartTime))}>
                          ▶
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )
        ) : (
          <div>Loading citation details...</div>
        )}
      </div>
    </Stack.Item>
  );
};

export default CitationPanel;
