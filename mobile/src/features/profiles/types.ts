export type RelationshipToOwner =
    | 'self'
    | 'child'
    | 'parent'
    | 'spouse'
    | 'sibling'
    | 'other';

export interface PatientProfile {
    id: string;
    owner_user_id: string;
    full_name: string;
    date_of_birth: string | null;
    gender: string | null;
    relationship_to_owner: RelationshipToOwner;
    avatar_url: string | null;
    is_default: boolean;
    linked_user_id: string | null;
    sharing_level: string | null;
    created_at: string;
    updated_at: string;
    /** False when this profile is shared from another account (viewer). */
    is_owned?: boolean;
    /** owner | viewer | self — from backend ProfileAccess role. */
    my_access_role?: string;
}

export interface PatientProfileListResponse {
    profiles: PatientProfile[];
}

export interface CreatePatientProfileRequest {
    full_name: string;
    date_of_birth?: string | null;
    gender?: string | null;
    relationship_to_owner: RelationshipToOwner;
    avatar_url?: string | null;
    is_default?: boolean;
    linked_email?: string;
}

export interface UpdatePatientProfileRequest {
    full_name?: string;
    date_of_birth?: string | null;
    gender?: string | null;
    relationship_to_owner?: RelationshipToOwner;
    avatar_url?: string | null;
}

export interface ProfileLinkQrResponse {
    token: string;
    expires_in_hours: number;
    qr_uri: string;
    profile_id: string;
}
