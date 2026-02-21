/**
 * Document feature — TypeScript types
 */

export interface DocumentUploadResponse {
    document_id: string;
    job_id: string;
    status: string;
    message: string;
}

export interface DocumentResponse {
    id: string;
    user_id: string;
    file_url: string;
    file_type: 'pdf' | 'image';
    original_filename: string | null;
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
