import React, { useState, useRef, useEffect } from 'react';
import { Stack, IconButton } from '@fluentui/react';
import TranscriptionDisplay from '../../components/Transription/TranscriptionDisplay';
import styles from './Chat.module.css';
import SpeechFileInfo from '../../components/Transription/SpeechFileInfo';
import { SpeechFile, SpeechSourceInfo, Phrase, Chunk, CitationDetails } from '../../api/SpeechApiModels';


interface DetailsFetchStatus {
  state: 'idle' | 'loading' | 'error' | 'success';
  message?: string;
}

interface CitationPanelProps {
  isCitationPanelOpen: boolean;
  activeCitation: {
    title?: string;
    url?: string;
    filepath?: string;
    [key: string]: any;
  } | null;
  activeCitationDetails: CitationDetails | null;
  detailsFetchStatus: DetailsFetchStatus;
  setIsCitationPanelOpen: (open: boolean) => void;
}

const CitationPanel: React.FC<CitationPanelProps> = ({
  isCitationPanelOpen,
  activeCitation,
  activeCitationDetails,
  detailsFetchStatus,
  setIsCitationPanelOpen,
}) => {
  const [citationAudioBlobUrl, setCitationAudioBlobUrl] = useState<string | null>(null);
  

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


  useEffect(() => {
    if (!isCitationPanelOpen || !activeCitationDetails?.file?.BlobUrl) {
      if (citationAudioBlobUrl) {
        URL.revokeObjectURL(citationAudioBlobUrl);
        setCitationAudioBlobUrl(null);
      }
    }
  }, [isCitationPanelOpen, activeCitationDetails?.file?.BlobUrl]);

  useEffect(() => {
    if (activeCitationDetails?.chunk && activeCitationDetails?.phrases) {
      const startIdx = activeCitationDetails.chunk.StartPhraseIndex;
      const phrase = activeCitationDetails.phrases[startIdx];
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
            activeCitation?.url && !activeCitation?.url.includes('blob.core')
              ? activeCitation.url
              : activeCitation?.title ?? ''
          }>
          {activeCitation?.title}
        </h5>
        {activeCitation?.filepath && (
          <div style={{ fontSize: '0.8em', color: '#555', marginTop: '0.2em' }}>
            {activeCitation?.filepath}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {detailsFetchStatus.state === 'loading' && <div>{detailsFetchStatus.message || 'Loading citation details...'}</div>}
        {detailsFetchStatus.state === 'error' && <div style={{ color: 'red' }}>{detailsFetchStatus.message || 'Failed to load citation details.'}</div>}
        {detailsFetchStatus.state === 'success' && activeCitationDetails && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
            {/* File Info */}
            <SpeechFileInfo file={activeCitationDetails.file} />
            {/* Audio Player and Full Transcription */}
            <TranscriptionDisplay file={activeCitationDetails.file} phrases={activeCitationDetails.phrases} chunk={activeCitationDetails.chunk} />
          </div>
        )}
      </div>
    </Stack.Item>
  );
};

// Format seconds as M:SS
function formatSecondsToTimestamp(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default CitationPanel;
