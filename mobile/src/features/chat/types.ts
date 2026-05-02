/**
 * Chat assistant feature — TypeScript types
 */

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
    role: ChatRole;
    content: string;
}

export interface ChatRequest {
    message: string;
    profile_id?: string;
    include_family_profiles?: boolean;
    history?: ChatMessage[];
    max_records?: number;
}

export interface ChatSource {
    type: 'prescription' | 'reminder' | 'dose' | 'general_medical' | 'safety' | 'system';
    title: string;
    reference_id?: string | null;
    metadata: Record<string, unknown>;
}

export interface ChatResponse {
    message: string;
    mode: 'llamaindex' | 'fallback';
    sources: ChatSource[];
    safety_disclaimer: string;
}
