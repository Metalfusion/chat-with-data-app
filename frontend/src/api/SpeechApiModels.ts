
export interface SpeechSourceInfo {
  OriginalFileName: string;
  FileHash: string;
  PrimarySpeaker?: string;
  Album?: string;
  RecordingYear?: number;
  RecordingDateTime?: string;
  Title?: string | null;
  Description?: string | null;
  LanguageCode?: string | null;
  Copyright?: string | null;
}

export interface SpeechFile {
  Id: string;
  OriginalFileName: string;
  FileHash: string;
  BlobName: string;
  BlobUrl: string;
  CreatedAt: string;
  SourceInfo?: SpeechSourceInfo;
}
