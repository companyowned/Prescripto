import axios from 'axios';
import { Platform } from 'react-native';
import apiClient from '../../services/apiClient';
import { authService } from '../../services/auth';
import { DocumentPurpose, DocumentUploadResponse, DocumentResponse, JobStatusResponse } from './types';

export const documentsApi = {
    async upload(
        file: { uri: string; name: string; type: string },
        profileId?: string,
        options?: { purpose?: DocumentPurpose; parentDocumentId?: string }
    ): Promise<DocumentUploadResponse> {
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

        if (profileId) {
            formData.append('profile_id', profileId);
        }
        formData.append('purpose', options?.purpose || 'prescription');
        if (options?.parentDocumentId) {
            formData.append('parent_document_id', options.parentDocumentId);
        }

        const token = await authService.getToken();
        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const baseUrl = apiClient.defaults.baseURL || 'https://prescripto-taupe-ten.vercel.app/api/v1';

        // Native uploads use axios (XMLHttpRequest transport) rather than global fetch:
        // RN's New Architecture fetch implementation throws "Unsupported FormDataPart
        // implementation" for the {uri,name,type} file part shape that expo-camera /
        // expo-image-picker / expo-document-picker produce.
        try {
            const response = await axios.post<DocumentUploadResponse>(`${baseUrl}/documents`, formData, {
                headers,
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.detail || `Upload failed with status ${error.response?.status}`);
            }
            throw error;
        }
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
