// LockedLessonOverlay - Full-screen overlay for locked lessons
// Displayed on lesson page when user hasn't unlocked the lesson
// Migrated from ppgeil/components/LockedLessonOverlay.js

import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Lesson } from '../../types/lesson.types';
import type { UserUnlockInfo } from '../../types/unlock.types';
import { colors, spacing } from '../../styles/theme';
import { UNLOCK_COST } from '../../types/unlock.types';

interface LockedLessonOverlayProps {
    lesson: Lesson;
    userUnlockInfo: UserUnlockInfo | null;
    onUnlock: () => void;
    onGoBack: () => void;
    isLoading?: boolean;
}

const LockedLessonOverlay: React.FC<LockedLessonOverlayProps> = ({
    lesson,
    userUnlockInfo,
    onUnlock,
    onGoBack,
    isLoading = false,
}) => {
    const { t } = useTranslation();

    const freeUnlocksRemaining = userUnlockInfo?.freeUnlocksRemaining ?? 0;
    const userPoints = userUnlockInfo?.points ?? 0;

    const canUnlockFree = freeUnlocksRemaining > 0;
    const canUnlockWithPoints = userPoints >= UNLOCK_COST;
    const canUnlock = canUnlockFree || canUnlockWithPoints;

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                {/* Lock Icon */}
                <View style={styles.lockIconContainer}>
                    <Text style={styles.lockIcon}>🔒</Text>
                </View>

                {/* Title */}
                <Text style={styles.title}>
                    {t('unlock.lessonLocked', 'Bài học bị khóa')}
                </Text>

                <Text style={styles.lessonTitle} numberOfLines={2}>
                    {lesson.title}
                </Text>

                <Text style={styles.description}>
                    {t('unlock.unlockDescription', 'Mở khóa bài học này để bắt đầu học')}
                </Text>

                {/* Cost Info */}
                <View style={styles.costBox}>
                    {canUnlockFree ? (
                        <>
                            <Text style={styles.freeIcon}>🎁</Text>
                            <Text style={styles.freeText}>
                                {t('unlock.freeUnlockAvailable', 'Mở khóa miễn phí!')}
                            </Text>
                            <Text style={styles.freeRemaining}>
                                {t('unlock.freeRemaining', {
                                    count: freeUnlocksRemaining,
                                    defaultValue: `Còn ${freeUnlocksRemaining} lượt`,
                                })}
                            </Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.costLabel}>
                                {t('unlock.cost', 'Chi phí')}: <Text style={styles.costValue}>{UNLOCK_COST} Points</Text>
                            </Text>
                            <Text style={[
                                styles.balanceLabel,
                                canUnlockWithPoints ? styles.sufficient : styles.insufficient,
                            ]}>
                                {t('unlock.yourBalance', 'Số dư')}: {userPoints} Points
                            </Text>
                        </>
                    )}
                </View>

                {/* Not enough points warning */}
                {!canUnlock && (
                    <Text style={styles.warning}>
                        {t('unlock.notEnoughPoints', 'Không đủ points. Học thêm để kiếm points!')}
                    </Text>
                )}

                {/* Action buttons */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={onGoBack}
                        disabled={isLoading}
                    >
                        <Text style={styles.backBtnText}>
                            {t('common.goBack', 'Quay lại')}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.unlockBtn,
                            !canUnlock && styles.disabledBtn,
                        ]}
                        onPress={onUnlock}
                        disabled={!canUnlock || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <Text style={styles.unlockBtnText}>
                                {canUnlockFree
                                    ? t('unlock.unlockFree', 'Mở khóa')
                                    : t('unlock.unlockWithPoints', `Mở khóa (${UNLOCK_COST})`)}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
        zIndex: 100,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: spacing.xl,
        width: '100%',
        maxWidth: 360,
        alignItems: 'center',
        borderWidth: 3,
        borderColor: colors.retroBorder,
        // Neo-retro shadow
        shadowColor: '#1a1a2e',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 0,
        elevation: 8,
    },
    lockIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.bgCream,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
        borderWidth: 3,
        borderColor: colors.retroBorder,
    },
    lockIcon: {
        fontSize: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.retroDark,
        marginBottom: spacing.sm,
    },
    lessonTitle: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xs,
        lineHeight: 22,
    },
    description: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    costBox: {
        backgroundColor: colors.bgCream,
        borderRadius: 12,
        padding: spacing.md,
        width: '100%',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.retroBorder,
        marginBottom: spacing.md,
    },
    freeIcon: {
        fontSize: 32,
        marginBottom: spacing.xs,
    },
    freeText: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.retroPurple,
    },
    freeRemaining: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 4,
    },
    costLabel: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    costValue: {
        fontWeight: '700',
        color: colors.retroCoral,
    },
    balanceLabel: {
        fontSize: 14,
        marginTop: 6,
        fontWeight: '600',
    },
    sufficient: {
        color: colors.retroCyan,
    },
    insufficient: {
        color: colors.retroCoral,
    },
    warning: {
        fontSize: 13,
        color: colors.retroCoral,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    backBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: colors.bgCream,
        borderWidth: 2,
        borderColor: colors.retroBorder,
        alignItems: 'center',
    },
    backBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.retroDark,
    },
    unlockBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: colors.retroPurple,
        borderWidth: 2,
        borderColor: colors.retroBorder,
        alignItems: 'center',
        // Neo-retro shadow
        shadowColor: '#1a1a2e',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 0,
        elevation: 3,
    },
    unlockBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#ffffff',
    },
    disabledBtn: {
        backgroundColor: colors.textSecondary,
        opacity: 0.6,
    },
});

export default LockedLessonOverlay;
