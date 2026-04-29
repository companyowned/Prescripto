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

    async getHistory(skip = 0, limit = 20, profileId?: string): Promise<PrescriptionListResponse> {
        const response = await apiClient.get<PrescriptionListResponse>('/prescriptions', {
            params: { skip, limit, profile_id: profileId },
        });
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
