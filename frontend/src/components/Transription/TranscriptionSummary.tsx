

import React from 'react';
import { TranscriptionSummary } from '../../api/SpeechApiModels';
import ReactMarkdown from 'react-markdown';
import sharedStyles from './SpeechInfoShared.module.css';

interface TranscriptionSummaryProps {
  summary: TranscriptionSummary | undefined | null;
}

const TranscriptionSummaryComponent: React.FC<TranscriptionSummaryProps> = ({ summary }) => {
  if (!summary) return null;
  return (
    <div>
      <div className={sharedStyles.speechInfoBox}>
        <h5 className={sharedStyles.speechInfoTitle}>Transcription Summary</h5>
        <ul className={sharedStyles.speechInfoList}>
          <li className={sharedStyles.speechInfoItem}>
            <span className={sharedStyles.speechInfoLabel}>Source File Name:</span><span className={sharedStyles.speechInfoValue}>{summary.SourceFileName}</span>
          </li>
          <li className={sharedStyles.speechInfoItem}>
            <span className={sharedStyles.speechInfoLabel}>Created (UTC):</span><span className={sharedStyles.speechInfoValue}>{new Date(summary.CreatedUtc).toLocaleString()}</span>
          </li>
        </ul>
      </div>
      <div className={sharedStyles.summaryMarkdownBox}>
        <ReactMarkdown>{summary.Summary}</ReactMarkdown>
      </div>
    </div>
  );
};

export default TranscriptionSummaryComponent;