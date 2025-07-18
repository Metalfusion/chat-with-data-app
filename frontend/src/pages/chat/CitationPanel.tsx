import React, { useState, useRef, useEffect } from 'react';
import { Stack, IconButton } from '@fluentui/react';
import TranscriptionDisplay from '../../components/Transription/TranscriptionDisplay';
import TranscriptionSummaryComponent from '../../components/Transription/TranscriptionSummary';
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
            {/* Collapsible Transcription Summary */}
            <CitationSummaryLoader speechFileId={activeCitationDetails.file?.Id} />
            {/* Audio Player and Full Transcription */}
            <div style={{ minHeight: '300px', maxHeight: '100%', overflow: 'auto' }}>
              <TranscriptionDisplay file={activeCitationDetails.file} phrases={activeCitationDetails.phrases} chunk={activeCitationDetails.chunk} />
            </div>
          </div>
        )}
      </div>
    </Stack.Item>
  );
};

// Collapsible loader for summary (must be outside CitationPanel)
import { FontIcon, Text } from '@fluentui/react';

const CitationSummaryLoader: React.FC<{ speechFileId?: string }> = ({ speechFileId }) => {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<any>(null);

  const handleAccordionClick = async () => {
    if (!open && !summary && speechFileId) {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/transcript/${speechFileId}/summary`);
        if (!res.ok) throw new Error(`Failed to fetch summary (${res.status})`);
        const data = await res.json();
        setSummary(data);
      } catch (e: any) {
        setError(e.message || 'Failed to load summary');
      } finally {
        setLoading(false);
      }
    }
    setOpen(v => !v);
  };

  if (!speechFileId) return null;
  return (
    <div style={{ marginBottom: '1em' }}>
      <Stack.Item onKeyDown={e => (e.key === 'Enter' || e.key === ' ' ? handleAccordionClick() : null)}>
        <Stack style={{ width: '100%' }}>
          <Stack horizontal horizontalAlign="start" verticalAlign="center">
            <Text
              className={styles.accordionTitle}
              onClick={handleAccordionClick}
              aria-label="Show transcription summary"
              tabIndex={0}
              role="button"
              style={{
                cursor: 'pointer',
                fontWeight: 'bold',
                userSelect: 'none',
              }}>
              <span>Transcription summary</span>
            </Text>
            <FontIcon
              className={styles.accordionIcon}
              onClick={handleAccordionClick}
              iconName={open ? 'ChevronDown' : 'ChevronRight'}
              style={{
                fontSize: '0.9em',
                marginLeft: '0.5em',
                marginTop: '0.4em',
                cursor: 'pointer',
                fontWeight: 'bold',
                userSelect: 'none',
              }}
            />
          </Stack>
        </Stack>
      </Stack.Item>
      {open && (
        <div id="citation-summary-panel" style={{ marginTop: '0.5em' }}>
          <div style={{
            background: '#f7f7fa',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '1em',
            marginBottom: '0.5em',
          }}>
            {loading && <div>Loading summary...</div>}
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {summary && <TranscriptionSummaryComponent summary={summary} />}
          </div>
        </div>
      )}
    </div>
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
