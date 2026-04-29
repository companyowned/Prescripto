/**
 * Document feature — TanStack Query hooks
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { documentsApi } from './api';

export const useUploadDocument = () => {
    return useMutation({
        mutationFn: ({
            file,
            profileId,
        }: {
            file: { uri: string; name: string; type: string };
            profileId?: string;
        }) => documentsApi.upload(file, profileId),
    });
};

export const useDocument = (documentId: string) => {
    return useQuery({
        queryKey: ['document', documentId],
        queryFn: () => documentsApi.getDocument(documentId),
        enabled: !!documentId,
    });
};

export const useJobStatus = (jobId: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: ['job', jobId],
        queryFn: () => documentsApi.getJobStatus(jobId),
        enabled: !!jobId && enabled,
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            // Poll every 2s while processing, stop when done/failed
            if (status === 'done' || status === 'failed') return false;
            return 2000;
        },
    });
};
