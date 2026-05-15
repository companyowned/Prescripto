import apiClient from '../../services/apiClient';

export interface ProfileLinkPermissions {
    can_read_prescriptions: boolean;
    can_read_documents: boolean;
    can_read_reminders: boolean;
    can_read_family_profile: boolean;
    can_read_medical_history: boolean;
}

export interface ProfileLinkPreview {
    profile_id: string;
    profile_display_name: string;
    owner_display_name: string;
    is_own_profile: boolean;
}

export interface ProfileLinkRequestItem {
    id: string;
    profile_id: string;
    requester_user_id: string;
    status: string;
    relationship_to_subject: string | null;
    can_read_prescriptions: boolean;
    can_read_documents: boolean;
    can_read_reminders: boolean;
    can_read_family_profile: boolean;
    can_read_medical_history: boolean;
    created_at: string;
    resolved_at: string | null;
}

export const profileLinksApi = {
    async preview(token: string): Promise<ProfileLinkPreview> {
        const r = await apiClient.post<ProfileLinkPreview>('/profile-links/preview', { token });
        return r.data;
    },

    async createRequest(
        token: string,
        relationship_to_subject: string | null | undefined,
        permissions: ProfileLinkPermissions
    ): Promise<ProfileLinkRequestItem> {
        const r = await apiClient.post<ProfileLinkRequestItem>('/profile-links/request', {
            token,
            relationship_to_subject: relationship_to_subject ?? null,
            permissions,
        });
        return r.data;
    },

    async listIncoming(): Promise<ProfileLinkRequestItem[]> {
        const r = await apiClient.get<{ requests: ProfileLinkRequestItem[] }>('/profile-links/incoming');
        return r.data.requests;
    },

    async listOutgoing(): Promise<ProfileLinkRequestItem[]> {
        const r = await apiClient.get<{ requests: ProfileLinkRequestItem[] }>('/profile-links/outgoing');
        return r.data.requests;
    },

    async accept(requestId: string): Promise<ProfileLinkRequestItem> {
        const r = await apiClient.post<ProfileLinkRequestItem>(`/profile-links/${requestId}/accept`);
        return r.data;
    },

    async reject(requestId: string): Promise<ProfileLinkRequestItem> {
        const r = await apiClient.post<ProfileLinkRequestItem>(`/profile-links/${requestId}/reject`);
        return r.data;
    },

    async cancel(requestId: string): Promise<ProfileLinkRequestItem> {
        const r = await apiClient.post<ProfileLinkRequestItem>(`/profile-links/${requestId}/cancel`);
        return r.data;
    },
};
