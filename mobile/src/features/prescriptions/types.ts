/**
 * Prescription feature — TypeScript types
 */

export interface MedicationType {
    id?: string;
    name: string;
    dose?: string | null;
    frequency?: string | null;
    duration?: string | null;
    notes?: string | null;
}

export interface DoctorType {
    id?: string;
    name: string;
    license_no?: string | null;
}

export interface FacilityType {
    id?: string;
    name: string;
    address?: string | null;
}

export interface FollowUpRequestType {
    kind: 'lab' | 'radiology';
    name: string;
    instructions?: string | null;
    confidence: number;
    source?: string | null;
}

export interface PrescriptionResponse {
    id: string;
    profile_id: string | null;
    document_id: string;
    doctor: DoctorType | null;
    facility: FacilityType | null;
    diagnosis_text: string | null;
    medications: MedicationType[];
    follow_up_requests?: FollowUpRequestType[];
    has_lab_requests?: boolean;
    has_radiology_requests?: boolean;
    confidence_score: number | null;
    raw_output_json: any;
    created_at: string;
}

export type RecordPurpose = 'prescription' | 'lab_result' | 'radiology_report';

export interface PrescriptionListItem {
    id: string;
    profile_id: string | null;
    document_id: string;
    purpose: RecordPurpose;
    diagnosis_text: string | null;
    doctor_name: string | null;
    facility_name: string | null;
    medication_count: number;
    confidence_score: number | null;
    created_at: string;
}

export interface PrescriptionListResponse {
    prescriptions: PrescriptionListItem[];
    total: number;
}

export interface PrescriptionUpdateRequest {
    diagnosis_text?: string;
    doctor?: DoctorType;
    facility?: FacilityType;
    medications?: MedicationType[];
}
