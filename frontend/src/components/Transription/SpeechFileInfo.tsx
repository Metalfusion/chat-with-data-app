

import React from 'react';
import { SpeechFile, SpeechSourceInfo } from '../../api/SpeechApiModels';
import sharedStyles from './SpeechInfoShared.module.css';


interface SpeechFileInfoProps {
  file: SpeechFile | undefined | null;
}

const SpeechFileInfo: React.FC<SpeechFileInfoProps> = ({ file }) => {
  if (!file) return null;
  const source: SpeechSourceInfo | undefined = file.SourceInfo;
  return (
    <div className={sharedStyles.speechInfoBox}>
      <h5 className={sharedStyles.speechInfoTitle}>File Info</h5>
      <ul className={sharedStyles.speechInfoList}>
        <li className={sharedStyles.speechInfoItem}><span className={sharedStyles.speechInfoLabel}>Audio File Name:</span><span className={sharedStyles.speechInfoValue}>{file.OriginalFileName}</span></li>
        <li className={sharedStyles.speechInfoItem}><span className={sharedStyles.speechInfoLabel}>Blob URL:</span><span className={sharedStyles.speechInfoValue}>{file.BlobUrl ? <a href={file.BlobUrl} target="_blank" rel="noopener noreferrer">Open</a> : '-'}</span></li>
        <li className={sharedStyles.speechInfoItem}><span className={sharedStyles.speechInfoLabel}>File Hash:</span><span className={sharedStyles.speechInfoValue}>{file.FileHash}</span></li>
      </ul>
      {source && (
        <div style={{ marginTop: '1em' }}>
          <h5 className={sharedStyles.speechInfoTitle}>Source Info</h5>
          <ul className={sharedStyles.speechInfoList}>
            {source.PrimarySpeaker && (
              <li className={sharedStyles.speechInfoItem}><span className={sharedStyles.speechInfoLabel}>Speaker:</span><span className={sharedStyles.speechInfoValue}>{source.PrimarySpeaker}</span></li>
            )}
            {source.Album && (
              <li className={sharedStyles.speechInfoItem}><span className={sharedStyles.speechInfoLabel}>Album:</span><span className={sharedStyles.speechInfoValue}>{source.Album}</span></li>
            )}
            {source.RecordingYear && !source.RecordingDateTime && (
              <li className={sharedStyles.speechInfoItem}><span className={sharedStyles.speechInfoLabel}>Recording Year:</span><span className={sharedStyles.speechInfoValue}>{source.RecordingYear}</span></li>
            )}
            {source.RecordingDateTime ? (
              <li className={sharedStyles.speechInfoItem}><span className={sharedStyles.speechInfoLabel}>Recording Date:</span><span className={sharedStyles.speechInfoValue}>{(() => {
                const dateTime = new Date(source.RecordingDateTime as string);
                if (dateTime.getHours() === 0 && dateTime.getMinutes() === 0) {
                  return dateTime.toLocaleDateString();
                }
                return dateTime.toLocaleString();
              })()}</span></li>
            ) : null}
            {source.Title && (
              <li className={sharedStyles.speechInfoItem}><span className={sharedStyles.speechInfoLabel}>Title:</span><span className={sharedStyles.speechInfoValue}>{source.Title}</span></li>
            )}
            {source.Description && (
              <li className={sharedStyles.speechInfoItem}><span className={sharedStyles.speechInfoLabel}>Description:</span><span className={sharedStyles.speechInfoValue}>{source.Description}</span></li>
            )}
            {source.LanguageCode && (
              <li className={sharedStyles.speechInfoItem}><span className={sharedStyles.speechInfoLabel}>Language:</span><span className={sharedStyles.speechInfoValue}>{source.LanguageCode}</span></li>
            )}
            {source.Copyright && (
              <li className={sharedStyles.speechInfoItem}><span className={sharedStyles.speechInfoLabel}>Copyright:</span><span className={sharedStyles.speechInfoValue}>{source.Copyright}</span></li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SpeechFileInfo;
