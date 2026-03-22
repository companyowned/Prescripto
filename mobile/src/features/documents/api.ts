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
        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const baseUrl = apiClient.defaults.baseURL || 'http://localhost:8000/api/v1';
        const response = await fetch(`${baseUrl}/documents`, {
            method: 'POST',
            body: formData,
            headers,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.detail || `Upload failed with status ${response.status}`);
        }

        return await response.json();
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
