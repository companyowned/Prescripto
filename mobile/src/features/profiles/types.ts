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
    created_at: string;
    updated_at: string;
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
