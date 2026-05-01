/**
 * Prescription feature — TanStack Query hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { prescriptionsApi } from './api';
import { PrescriptionUpdateRequest } from './types';

export const usePrescription = (documentId: string, profileId?: string) => {
    return useQuery({
        queryKey: ['prescription', documentId, profileId],
        queryFn: () => prescriptionsApi.getByDocument(documentId, profileId),
        enabled: !!documentId,
    });
};

export const usePrescriptionHistory = (skip = 0, limit = 20, profileId?: string, purpose?: string) => {
    return useQuery({
        queryKey: ['prescriptions', 'history', profileId, purpose, skip, limit],
        queryFn: () => prescriptionsApi.getHistory(skip, limit, profileId, purpose),
        enabled: !!profileId,
    });
};

export const useUpdatePrescription = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            prescriptionId,
            data,
        }: {
            prescriptionId: string;
            data: PrescriptionUpdateRequest;
        }) => prescriptionsApi.update(prescriptionId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['prescription'] });
            queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
        },
    });
};
