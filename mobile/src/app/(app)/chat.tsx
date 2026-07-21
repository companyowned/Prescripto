import React, { useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MockBottomTabs } from '../../components/home';
import { GlassBackground } from '../../components/ui';
import { useActiveProfile } from '../../contexts/profile-context';
import { useSendChatMessage } from '../../features/chat/hooks';
import { ChatMessage, ChatSource } from '../../features/chat/types';
import { colors } from '../../theme';

interface LocalMessage extends ChatMessage {
    id: string;
    sources?: ChatSource[];
    mode?: 'llamaindex' | 'fallback';
}

const starterMessage: LocalMessage = {
    id: 'starter',
    role: 'assistant',
    content:
        'Ask about general medical guidance, saved prescriptions, medications, follow-up requests, or reminder schedules.',
};

export default function ChatScreen() {
    const router = useRouter();
    const scrollRef = useRef<ScrollView>(null);
    const { activeProfile } = useActiveProfile();
    const sendChatMessage = useSendChatMessage();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<LocalMessage[]>([starterMessage]);

    const canSend = input.trim().length > 0 && !sendChatMessage.isPending;

    const visibleHistory = useMemo(
        () =>
            messages
                .filter((message) => message.id !== 'starter')
                .slice(-10)
                .map(({ role, content }) => ({ role, content })),
        [messages]
    );

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed || sendChatMessage.isPending) return;

        const userMessage: LocalMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: trimmed,
        };
        setMessages((current) => [...current, userMessage]);
        setInput('');

        try {
            const response = await sendChatMessage.mutateAsync({
                message: trimmed,
                profile_id: activeProfile?.id,
                include_family_profiles: true,
                history: visibleHistory,
                max_records: 20,
            });
            setMessages((current) => [
                ...current,
                {
                    id: `assistant-${Date.now()}`,
                    role: 'assistant',
                    content: response.message,
                    sources: response.sources,
                    mode: response.mode,
                },
            ]);
        } catch {
            setMessages((current) => [
                ...current,
                {
                    id: `assistant-error-${Date.now()}`,
                    role: 'assistant',
                    content:
                        'I could not reach the assistant service. Please check your connection and try again.',
                },
            ]);
        }
    };

    return (
        <GlassBackground>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.screen}>
                    <KeyboardAvoidingView
                        style={styles.container}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
                    >
                        <View style={styles.header}>
                            <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                                <Ionicons name="chevron-back" size={24} color={colors.white} />
                            </TouchableOpacity>
                            <View style={styles.headerText}>
                                <Text style={styles.title}>Dawini</Text>
                            <Text style={styles.subtitle}>
                                Family profiles
                            </Text>
                            </View>
                            <View style={styles.iconButton}>
                                <Ionicons name="sparkles" size={20} color={colors.primary[300]} />
                            </View>
                        </View>

                        <ScrollView
                            ref={scrollRef}
                            style={styles.messagesScroll}
                            contentContainerStyle={styles.messages}
                            showsVerticalScrollIndicator={false}
                            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
                        >
                            {messages.map((message) => (
                                <View
                                    key={message.id}
                                    style={[
                                        styles.messageBubble,
                                        message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.messageText,
                                            message.role === 'user' ? styles.userText : styles.assistantText,
                                        ]}
                                    >
                                        {message.content}
                                    </Text>
                                    {message.sources && message.sources.length > 0 ? (
                                        <View style={styles.sources}>
                                            <Text style={styles.sourceLabel}>
                                                {message.mode === 'llamaindex' ? 'LlamaIndex' : 'Local'} answer
                                                {' '}· {message.sources.length} source(s)
                                            </Text>
                                            {message.sources.slice(0, 3).map((source, index) => (
                                                <Text key={`${message.id}-${source.type}-${index}`} style={styles.sourceText}>
                                                    {source.type}: {source.title}
                                                </Text>
                                            ))}
                                        </View>
                                    ) : null}
                                </View>
                            ))}

                            {sendChatMessage.isPending ? (
                                <View style={[styles.messageBubble, styles.assistantBubble, styles.loadingBubble]}>
                                    <ActivityIndicator color={colors.primary[300]} />
                                    <Text style={styles.loadingText}>Preparing a safe answer...</Text>
                                </View>
                            ) : null}
                        </ScrollView>

                        <View style={styles.composer}>
                            <TextInput
                                value={input}
                                onChangeText={setInput}
                                placeholder="Ask about symptoms, doctors, medicines, or reminders"
                                placeholderTextColor={colors.textMuted}
                                multiline
                                style={styles.input}
                                maxLength={1000}
                            />
                            <TouchableOpacity
                                style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
                                onPress={handleSend}
                                disabled={!canSend}
                            >
                                <Ionicons name="send" size={20} color={colors.white} />
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>

                    <MockBottomTabs
                        activeTab="chat"
                        onHomePress={() => router.push('/(app)/home')}
                        onRecordsPress={() => router.push('/(app)/history')}
                        onRemindersPress={() => router.push('/(app)/reminders')}
                        onChatPress={() => { }}
                        onInsightsPress={() => router.push('/(app)/insights')}
                        onSettingsPress={() => router.push('/(app)/settings')}
                    />
                </View>
            </SafeAreaView>
        </GlassBackground>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    screen: {
        flex: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 8 : 30,
        paddingBottom: 110,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 18,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.glass.background,
        borderWidth: 1,
        borderColor: colors.glass.border,
    },
    headerText: {
        flex: 1,
    },
    title: {
        color: colors.white,
        fontSize: 24,
        fontWeight: '800',
    },
    subtitle: {
        color: colors.textSecondary,
        fontSize: 13,
        marginTop: 2,
    },
    messagesScroll: {
        flex: 1,
    },
    messages: {
        paddingBottom: 20,
        gap: 12,
    },
    messageBubble: {
        maxWidth: '88%',
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: colors.primary[500],
        borderColor: 'rgba(255, 255, 255, 0.25)',
        borderBottomRightRadius: 6,
    },
    assistantBubble: {
        alignSelf: 'flex-start',
        backgroundColor: colors.glass.background,
        borderColor: colors.glass.borderHighlight,
        borderBottomLeftRadius: 6,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    userText: {
        color: colors.white,
        fontWeight: '600',
    },
    assistantText: {
        color: colors.white,
    },
    sources: {
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: colors.glass.border,
        gap: 4,
    },
    sourceLabel: {
        color: colors.primary[300],
        fontSize: 12,
        fontWeight: '700',
    },
    sourceText: {
        color: colors.textSecondary,
        fontSize: 12,
    },
    loadingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    loadingText: {
        color: colors.textSecondary,
        fontSize: 14,
    },
    composer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
        padding: 10,
        borderRadius: 24,
        backgroundColor: colors.glass.background,
        borderWidth: 1,
        borderColor: colors.glass.borderHighlight,
    },
    input: {
        flex: 1,
        minHeight: 42,
        maxHeight: 120,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: colors.white,
        fontSize: 15,
    },
    sendButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary[500],
    },
    sendButtonDisabled: {
        opacity: 0.45,
    },
});
