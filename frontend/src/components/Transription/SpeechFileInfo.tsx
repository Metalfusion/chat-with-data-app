
import React from 'react';
import { SpeechFile, SpeechSourceInfo } from '../../api/SpeechApiModels';


interface SpeechFileInfoProps {
  file: SpeechFile | undefined | null;
}

const SpeechFileInfo: React.FC<SpeechFileInfoProps> = ({ file }) => {
  if (!file) return null;
  const source: SpeechSourceInfo | undefined = file.SourceInfo;
  return (
    <div style={{ marginBottom: '1em', padding: '0.5em', background: '#f7f7fa', borderRadius: '6px' }}>
      <h5 style={{ margin: 0 }}>File Info</h5>
      <div><strong>Audio File Name:</strong> {file.OriginalFileName}</div>
      <div><strong>Blob URL:</strong> {file.BlobUrl ? <a href={file.BlobUrl} target="_blank" rel="noopener noreferrer">Open</a> : '-'}</div>
      <div><strong>File Hash:</strong> {file.FileHash}</div>
      {source && (
        <div style={{ marginTop: '1em' }}>
          <h5 style={{ margin: 0 }}>Source Info</h5>
          {source.PrimarySpeaker && (
            <div><strong>Speaker:</strong> {source.PrimarySpeaker}</div>
          )}
          {source.Album && (
            <div><strong>Album:</strong> {source.Album}</div>
          )}
          {source.RecordingYear && !source.RecordingDateTime && (
            <div><strong>Recording Year:</strong> {source.RecordingYear}</div>
          )}
          {source.RecordingDateTime ? (
            <div>
              <strong>Recording Date:</strong> {
                (() => {
                  // If RecordingDateTime is an ISO string, parse it
                  const dateTime = new Date(source.RecordingDateTime as string);
                  if (dateTime.getHours() === 0 && dateTime.getMinutes() === 0) {
                    return dateTime.toLocaleDateString();
                  }
                  // Offset is not present in the model, so just show local time
                  return dateTime.toLocaleString();
                })()
              }
            </div>
          ) : (
            source.RecordingYear && (
              <div><strong>Recording Year:</strong> {source.RecordingYear}</div>
            )
          )}
          {source.Title && (
            <div><strong>Title:</strong> {source.Title}</div>
          )}
          {source.Description && (
            <div><strong>Description:</strong> {source.Description}</div>
          )}
          {source.LanguageCode && (
            <div><strong>Language:</strong> {source.LanguageCode}</div>
          )}
          {source.Copyright && (
            <div><strong>Copyright:</strong> {source.Copyright}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SpeechFileInfo;
