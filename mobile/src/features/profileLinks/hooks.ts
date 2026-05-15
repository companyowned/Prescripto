import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileLinksApi, ProfileLinkPermissions } from './api';

export function useProfileLinkPreview(token: string | undefined) {
    return useQuery({
        queryKey: ['profile-link-preview', token],
        queryFn: () => profileLinksApi.preview(token!),
        enabled: !!token && token.length > 20,
    });
}

export function useCreateProfileLinkRequest() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (args: {
            token: string;
            relationship_to_subject?: string | null;
            permissions: ProfileLinkPermissions;
        }) => profileLinksApi.createRequest(args.token, args.relationship_to_subject, args.permissions),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['profile-link-outgoing'] });
        },
    });
}

export function useIncomingProfileLinkRequests() {
    return useQuery({
        queryKey: ['profile-link-incoming'],
        queryFn: () => profileLinksApi.listIncoming(),
    });
}

export function useAcceptProfileLinkRequest() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (requestId: string) => profileLinksApi.accept(requestId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['profile-link-incoming'] });
            qc.invalidateQueries({ queryKey: ['profiles'] });
        },
    });
}

export function useRejectProfileLinkRequest() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (requestId: string) => profileLinksApi.reject(requestId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['profile-link-incoming'] });
        },
    });
}
