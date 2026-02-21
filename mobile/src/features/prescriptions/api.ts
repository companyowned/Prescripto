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
    async getByDocument(documentId: string): Promise<PrescriptionResponse> {
        const response = await apiClient.get<PrescriptionResponse>(
            `/prescriptions/${documentId}`
        );
        return response.data;
    },

    async getHistory(skip = 0, limit = 20): Promise<PrescriptionListResponse> {
        const response = await apiClient.get<PrescriptionListResponse>('/prescriptions', {
            params: { skip, limit },
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
