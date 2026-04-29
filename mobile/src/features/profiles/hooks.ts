import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profilesApi } from './api';
import { CreatePatientProfileRequest, UpdatePatientProfileRequest } from './types';

export const useProfiles = () =>
    useQuery({
        queryKey: ['profiles'],
        queryFn: profilesApi.list,
    });

export const useCreateProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreatePatientProfileRequest) => profilesApi.create(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profiles'] }),
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            profileId,
            data,
        }: {
            profileId: string;
            data: UpdatePatientProfileRequest;
        }) => profilesApi.update(profileId, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profiles'] }),
    });
};

export const useDeleteProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (profileId: string) => profilesApi.remove(profileId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profiles'] }),
    });
};

export const useSetDefaultProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (profileId: string) => profilesApi.setDefault(profileId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profiles'] }),
    });
};
