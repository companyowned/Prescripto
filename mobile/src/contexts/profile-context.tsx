import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useQueryClient } from '@tanstack/react-query';
import { useProfiles } from '../features/profiles/hooks';
import { PatientProfile } from '../features/profiles/types';

const ACTIVE_PROFILE_KEY = 'active_profile_id';

async function getStoredProfileId(): Promise<string | null> {
    if (Platform.OS === 'web') return localStorage.getItem(ACTIVE_PROFILE_KEY);
    try {
        return await SecureStore.getItemAsync(ACTIVE_PROFILE_KEY);
    } catch {
        return null;
    }
}

async function setStoredProfileId(profileId: string): Promise<void> {
    if (Platform.OS === 'web') {
        localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
        return;
    }
    await SecureStore.setItemAsync(ACTIVE_PROFILE_KEY, profileId);
}

interface ProfileContextValue {
    profiles: PatientProfile[];
    activeProfile: PatientProfile | null;
    isLoading: boolean;
    setActiveProfileId: (profileId: string) => Promise<void>;
    refreshProfiles: () => void;
}

const ProfileContext = createContext<ProfileContextValue>({
    profiles: [],
    activeProfile: null,
    isLoading: true,
    setActiveProfileId: async () => {},
    refreshProfiles: () => {},
});

export const useActiveProfile = () => useContext(ProfileContext);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();
    const { data, isLoading, refetch } = useProfiles();
    const profiles = data?.profiles ?? [];
    const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null);

    useEffect(() => {
        getStoredProfileId().then((stored) => setActiveProfileIdState(stored));
    }, []);

    useEffect(() => {
        if (!profiles.length) return;
        const selected = activeProfileId
            ? profiles.find((p) => p.id === activeProfileId) ?? null
            : null;
        const defaultProfile = profiles.find((p) => p.is_default) ?? profiles[0];
        const resolved = selected ?? defaultProfile;
        if (resolved && resolved.id !== activeProfileId) {
            setActiveProfileIdState(resolved.id);
            setStoredProfileId(resolved.id);
        }
    }, [profiles, activeProfileId]);

    const activeProfile = useMemo(
        () => profiles.find((p) => p.id === activeProfileId) ?? null,
        [profiles, activeProfileId]
    );

    const setActiveProfileId = async (profileId: string) => {
        setActiveProfileIdState(profileId);
        await setStoredProfileId(profileId);
        queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
        queryClient.invalidateQueries({ queryKey: ['document'] });
    };

    return (
        <ProfileContext.Provider
            value={{
                profiles,
                activeProfile,
                isLoading,
                setActiveProfileId,
                refreshProfiles: () => refetch(),
            }}
        >
            {children}
        </ProfileContext.Provider>
    );
}
