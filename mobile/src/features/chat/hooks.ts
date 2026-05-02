/**
 * Chat assistant feature — TanStack Query hooks
 */

import { useMutation } from '@tanstack/react-query';
import { chatApi } from './api';
import { ChatRequest } from './types';

export const useSendChatMessage = () => {
    return useMutation({
        mutationFn: (data: ChatRequest) => chatApi.sendMessage(data),
    });
};
