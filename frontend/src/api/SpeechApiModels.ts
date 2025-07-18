
export interface CitationDetails {
  file: SpeechFile;
  chunk: Chunk;
  phrases: Phrase[];
}

export interface Chunk {
    _id: string;
    SpeechFileId: string;
    ChunkIndex: number;
    Text: string;
    StartPhraseIndex: number;
    EndPhraseIndex: number;
    Title?: string;
}

export interface Phrase {
    Id: string;
    SpeechFileId: string;
    StartTime: string;
    Duration: string;
    RecognitionSuccess: boolean;
    DisplayText: string;
    RawRecognizedText: string;
    RecognitionConfidence: number;
}

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
