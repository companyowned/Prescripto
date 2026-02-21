import { Platform } from 'react-native';
import apiClient from '../../services/apiClient';
import { authService } from '../../services/auth';
import { DocumentUploadResponse, DocumentResponse, JobStatusResponse } from './types';

export const documentsApi = {
    async upload(file: { uri: string; name: string; type: string }): Promise<DocumentUploadResponse> {
        const formData = new FormData();

        if (Platform.OS === 'web') {
            // On web: fetch the URI as a blob and append it
            const response = await fetch(file.uri);
            const blob = await response.blob();
            formData.append('file', blob, file.name);
        } else {
            // On native: use the RN-style object
            formData.append('file', {
                uri: file.uri,
                name: file.name,
                type: file.type,
            } as any);
        }

        const token = await authService.getToken();
        const headers: Record<string, string> = {
            'Content-Type': 'multipart/form-data',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await apiClient.post<DocumentUploadResponse>('/documents', formData, {
            headers,
        });
        return res.data;
    },

    async getDocument(documentId: string): Promise<DocumentResponse> {
        const response = await apiClient.get<DocumentResponse>(`/documents/${documentId}`);
        return response.data;
    },

    async getJobStatus(jobId: string): Promise<JobStatusResponse> {
        const response = await apiClient.get<JobStatusResponse>(`/jobs/${jobId}`);
        return response.data;
    },
};
