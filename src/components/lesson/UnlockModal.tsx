// UnlockModal - Popup to confirm lesson unlock
// Migrated from ppgeil/components/UnlockModal.js

import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Lesson } from '../../types/lesson.types';
import type { UserUnlockInfo } from '../../types/unlock.types';
import { colors, spacing } from '../../styles/theme';
import { UNLOCK_COST } from '../../types/unlock.types';

interface UnlockModalProps {
    visible: boolean;
    lesson: Lesson | null;
    userUnlockInfo: UserUnlockInfo | null;
    onConfirm: (lessonId: string) => Promise<void>;
    onClose: () => void;
    isLoading?: boolean;
}

const UnlockModal: React.FC<UnlockModalProps> = ({
    visible,
    lesson,
    userUnlockInfo,
    onConfirm,
    onClose,
    isLoading = false,
}) => {
    const { t } = useTranslation();
    const [error, setError] = useState<string | null>(null);

    if (!lesson) return null;

    const freeUnlocksRemaining = userUnlockInfo?.freeUnlocksRemaining ?? 0;
    const userPoints = userUnlockInfo?.points ?? 0;

    const canUnlockFree = freeUnlocksRemaining > 0;
    const canUnlockWithPoints = userPoints >= UNLOCK_COST;
    const canUnlock = canUnlockFree || canUnlockWithPoints;

    const handleConfirm = async () => {
        setError(null);
        try {
            await onConfirm(lesson.id);
        } catch (err: any) {
            setError(err.message || t('unlock.error', 'Có lỗi xảy ra'));
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            supportedOrientations={['portrait', 'landscape']}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modal}>
                            {/* Close button */}
                            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                                <Text style={styles.closeBtnText}>×</Text>
                            </TouchableOpacity>

                            {/* Lock Icon */}
                            <View style={styles.lockIconContainer}>
                                <Text style={styles.lockIconEmoji}>🔒</Text>
                            </View>

                            {/* Title */}
                            <Text style={styles.title}>
                                {t('unlock.title', 'Mở khóa bài học')}
                            </Text>
                            <Text style={styles.lessonTitle} numberOfLines={2}>
                                {lesson.title}
                            </Text>

                            {/* Info Box */}
                            <View style={styles.infoBox}>
                                {canUnlockFree ? (
                                    <View style={styles.freeUnlock}>
                                        <Text style={styles.freeIcon}>🎁</Text>
                                        <View style={styles.freeTextContainer}>
                                            <Text style={styles.freeTitle}>
                                                {t('unlock.free', 'Miễn phí!')}
                                            </Text>
                                            <Text style={styles.freeDescription}>
                                                {t('unlock.freeRemaining', {
                                                    count: freeUnlocksRemaining,
                                                    defaultValue: `Còn ${freeUnlocksRemaining} lượt mở khóa miễn phí`,
                                                })}
                                            </Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.pointsInfo}>
                                        <View style={styles.pointsRow}>
                                            <Text style={styles.pointsLabel}>
                                                {t('unlock.cost', 'Chi phí')}:
                                            </Text>
                                            <Text style={styles.pointsCost}>{UNLOCK_COST} Points</Text>
                                        </View>
                                        <View style={styles.pointsRow}>
                                            <Text style={styles.pointsLabel}>
                                                {t('unlock.balance', 'Số dư của bạn')}:
                                            </Text>
                                            <Text style={[
                                                styles.pointsBalance,
                                                canUnlockWithPoints ? styles.sufficient : styles.insufficient,
                                            ]}>
                                                {userPoints} Points
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </View>

                            {/* Error message */}
                            {error && <Text style={styles.error}>{error}</Text>}

                            {/* Not enough points warning */}
                            {!canUnlock && !canUnlockFree && (
                                <Text style={styles.warning}>
                                    {t('unlock.notEnoughPoints', 'Không đủ points để mở khóa. Học thêm để kiếm points!')}
                                </Text>
                            )}

                            {/* Action buttons */}
                            <View style={styles.actions}>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={onClose}
                                    disabled={isLoading}
                                >
                                    <Text style={styles.cancelBtnText}>
                                        {t('unlock.cancel', 'Hủy')}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.confirmBtn,
                                        !canUnlock && styles.disabledBtn,
                                    ]}
                                    onPress={handleConfirm}
                                    disabled={!canUnlock || isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color="#ffffff" />
                                    ) : (
                                        <Text style={styles.confirmBtnText}>
                                            {canUnlockFree
                                                ? t('unlock.confirmFree', 'Mở khóa miễn phí')
                                                : t('unlock.confirm', `Mở khóa (${UNLOCK_COST} Points)`)}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modal: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: spacing.lg,
        width: '100%',
        maxWidth: 340,
        borderWidth: 3,
        borderColor: colors.retroBorder,
        // Neo-retro shadow
        shadowColor: '#1a1a2e',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 0,
        elevation: 5,
    },
    closeBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.bgCream,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.retroBorder,
    },
    closeBtnText: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.retroDark,
        marginTop: -2,
    },
    lockIconContainer: {
        alignItems: 'center',
        marginBottom: spacing.md,
        marginTop: spacing.sm,
    },
    lockIconEmoji: {
        fontSize: 48,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.retroDark,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    lessonTitle: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.md,
        lineHeight: 20,
    },
    infoBox: {
        backgroundColor: colors.bgCream,
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 2,
        borderColor: colors.retroBorder,
        marginBottom: spacing.md,
    },
    freeUnlock: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    freeIcon: {
        fontSize: 28,
        marginRight: spacing.sm,
    },
    freeTextContainer: {
        flex: 1,
    },
    freeTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.retroPurple,
    },
    freeDescription: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    pointsInfo: {
        gap: 8,
    },
    pointsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pointsLabel: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    pointsCost: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.retroCoral,
    },
    pointsBalance: {
        fontSize: 16,
        fontWeight: '700',
    },
    sufficient: {
        color: colors.retroCyan,
    },
    insufficient: {
        color: colors.retroCoral,
    },
    error: {
        color: colors.retroCoral,
        fontSize: 13,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    warning: {
        fontSize: 13,
        color: colors.retroCoral,
        textAlign: 'center',
        marginBottom: spacing.md,
        lineHeight: 18,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: colors.bgCream,
        borderWidth: 2,
        borderColor: colors.retroBorder,
        alignItems: 'center',
    },
    cancelBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.retroDark,
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: colors.retroPurple,
        borderWidth: 2,
        borderColor: colors.retroBorder,
        alignItems: 'center',
        // Neo-retro shadow
        shadowColor: '#1a1a2e',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 0,
        elevation: 2,
    },
    confirmBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#ffffff',
    },
    disabledBtn: {
        backgroundColor: colors.textSecondary,
        opacity: 0.6,
    },
});

export default UnlockModal;
