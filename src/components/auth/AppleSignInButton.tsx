import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    View,
    ViewStyle,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing, borderRadius, shadows } from '../../styles/theme';
import { textStyles } from '../../styles/typography';

interface AppleSignInButtonProps {
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
}

export const AppleSignInButton: React.FC<AppleSignInButtonProps> = ({
    onPress,
    loading = false,
    disabled = false,
    style,
}) => {
    // Apple Sign-In is only available on iOS
    if (Platform.OS !== 'ios') {
        return null;
    }

    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            style={[styles.button, isDisabled && styles.button_disabled, style]}
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.7}>
            {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
            ) : (
                <View style={styles.content}>
                    <Icon name="logo-apple" size={20} color="#ffffff" style={styles.appleIcon} />
                    <Text style={styles.buttonText}>Continue with Apple</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000000',
        borderWidth: 0,
        borderRadius: 14,
        height: 56,
        paddingHorizontal: spacing.xl,
        marginTop: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    button_disabled: {
        opacity: 0.5,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    appleIcon: {
        marginRight: 12,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: 0.3,
    },
});

export default AppleSignInButton;
