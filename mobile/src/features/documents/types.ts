/**
 * Document feature — TypeScript types
 */

export interface DocumentUploadResponse {
    document_id: string;
    profile_id: string;
    job_id: string;
    status: string;
    purpose: DocumentPurpose;
    message: string;
}

export type DocumentPurpose = 'prescription' | 'lab_result' | 'radiology_report';

export interface DocumentResponse {
    id: string;
    user_id: string;
    profile_id: string | null;
    file_url: string;
    file_type: 'pdf' | 'image';
    original_filename: string | null;
    purpose: DocumentPurpose;
    parent_document_id: string | null;
    status: 'uploaded' | 'processing' | 'done' | 'failed';
    created_at: string;
}

export interface JobStatusResponse {
    id: string;
    document_id: string;
    status: 'queued' | 'processing' | 'done' | 'failed';
    progress: number;
    error_message: string | null;
    started_at: string | null;
    finished_at: string | null;
}
