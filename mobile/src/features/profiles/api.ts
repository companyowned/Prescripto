import apiClient from '../../services/apiClient';
import {
    CreatePatientProfileRequest,
    PatientProfile,
    PatientProfileListResponse,
    UpdatePatientProfileRequest,
} from './types';

export const profilesApi = {
    async list(): Promise<PatientProfileListResponse> {
        const response = await apiClient.get<PatientProfileListResponse>('/profiles');
        return response.data;
    },

    async create(data: CreatePatientProfileRequest): Promise<PatientProfile> {
        const response = await apiClient.post<PatientProfile>('/profiles', data);
        return response.data;
    },

    async update(profileId: string, data: UpdatePatientProfileRequest): Promise<PatientProfile> {
        const response = await apiClient.patch<PatientProfile>(`/profiles/${profileId}`, data);
        return response.data;
    },

    async remove(profileId: string): Promise<void> {
        await apiClient.delete(`/profiles/${profileId}`);
    },

    async setDefault(profileId: string): Promise<PatientProfile> {
        const response = await apiClient.post<PatientProfile>(`/profiles/${profileId}/set-default`);
        return response.data;
    },
};
