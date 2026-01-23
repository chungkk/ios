// Toast - Retro-style toast notification component
// Non-blocking notification that auto-dismisses

import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing } from '../../styles/theme';

export type ToastType = 'error' | 'warning' | 'success' | 'info';

interface ToastProps {
    visible: boolean;
    type?: ToastType;
    title: string;
    message?: string;
    duration?: number; // ms, default 3000
    onDismiss: () => void;
    actionLabel?: string;
    onAction?: () => void;
}

const TOAST_CONFIG: Record<ToastType, { icon: string; bgColor: string; iconColor: string }> = {
    error: {
        icon: 'alert-circle',
        bgColor: '#ff6b6b',
        iconColor: '#fff',
    },
    warning: {
        icon: 'warning',
        bgColor: '#ffc107',
        iconColor: colors.retroDark,
    },
    success: {
        icon: 'checkmark-circle',
        bgColor: '#00c853',
        iconColor: '#fff',
    },
    info: {
        icon: 'information-circle',
        bgColor: colors.retroCyan,
        iconColor: '#fff',
    },
};

const Toast: React.FC<ToastProps> = ({
    visible,
    type = 'info',
    title,
    message,
    duration = 3000,
    onDismiss,
    actionLabel,
    onAction,
}) => {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const config = TOAST_CONFIG[type];

    useEffect(() => {
        if (visible) {
            // Slide in from top
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 80,
                    friction: 10,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto-dismiss after duration
            const timer = setTimeout(() => {
                handleDismiss();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible, duration]);

    const handleDismiss = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onDismiss();
        });
    };

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: config.bgColor,
                    transform: [{ translateY }],
                    opacity,
                },
            ]}
        >
            <TouchableOpacity
                style={styles.content}
                onPress={handleDismiss}
                activeOpacity={0.9}
            >
                <View style={styles.iconContainer}>
                    <Icon name={config.icon} size={24} color={config.iconColor} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: config.iconColor }]}>{title}</Text>
                    {message && (
                        <Text style={[styles.message, { color: config.iconColor }]}>{message}</Text>
                    )}
                </View>
                {actionLabel && onAction && (
                    <TouchableOpacity style={styles.actionButton} onPress={onAction}>
                        <Text style={styles.actionText}>{actionLabel}</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: spacing.md,
        right: spacing.md,
        borderRadius: 14,
        borderWidth: 3,
        borderColor: colors.retroBorder,
        shadowColor: '#1a1a2e',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 0,
        elevation: 8,
        zIndex: 9999,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 15,
        fontWeight: '800',
    },
    message: {
        fontSize: 13,
        fontWeight: '500',
        opacity: 0.9,
        marginTop: 2,
    },
    actionButton: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    actionText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
});

export default Toast;
