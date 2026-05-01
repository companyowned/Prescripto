/**
 * Prescription feature — API functions
 */

import apiClient from '../../services/apiClient';
import {
    PrescriptionResponse,
    PrescriptionListResponse,
    PrescriptionUpdateRequest,
} from './types';

export const prescriptionsApi = {
    async getByDocument(documentId: string, profileId?: string): Promise<PrescriptionResponse> {
        const response = await apiClient.get<PrescriptionResponse>(
            `/prescriptions/${documentId}`,
            { params: profileId ? { profile_id: profileId } : undefined }
        );
        return response.data;
    },

    async getHistory(skip = 0, limit = 20, profileId?: string, purpose?: string): Promise<PrescriptionListResponse> {
        const params: Record<string, any> = { skip, limit };
        if (profileId) params.profile_id = profileId;
        if (purpose) params.purpose = purpose;
        const response = await apiClient.get<PrescriptionListResponse>('/prescriptions', { params });
        return response.data;
    },

    async update(
        prescriptionId: string,
        data: PrescriptionUpdateRequest
    ): Promise<PrescriptionResponse> {
        const response = await apiClient.patch<PrescriptionResponse>(
            `/prescriptions/${prescriptionId}`,
            data
        );
        return response.data;
    },
};
