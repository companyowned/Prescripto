import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { colors } from '../../theme';

interface SearchBarProps extends TextInputProps {
    placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    placeholder = 'Search recent scans...',
    ...props
}) => {
    return (
        <View style={styles.searchContainer}>
            <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.content}>
                <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.4)" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder={placeholder}
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    {...props}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    searchContainer: {
        borderRadius: 16,
        marginBottom: 30,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: colors.glass.borderHighlight,
        backgroundColor: colors.glass.inputBg,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#FFFFFF',
    },
});
