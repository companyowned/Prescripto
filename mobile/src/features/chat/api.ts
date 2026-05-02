/**
 * Chat assistant feature — API functions
 */

import apiClient from '../../services/apiClient';
import { ChatRequest, ChatResponse } from './types';

export const chatApi = {
    async sendMessage(data: ChatRequest): Promise<ChatResponse> {
        const response = await apiClient.post<ChatResponse>('/chat', data);
        return response.data;
    },
};
