// HintBox Component - Reusable hint display for dictation
// Shows masked words with reveal functionality

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import { colors, spacing } from '../../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

interface HintBoxProps {
    sentence: string;
    userInput: string;
    currentIndex: number;
    revealedWords: { [key: string]: boolean };
    revealCount: { [key: number]: number };
    userPoints: number;
    isKeyboardVisible?: boolean;
    onRevealWord: (wordKey: string, currentCount: number) => void;
    onWordPress: (word: string, pureWord: string) => void;
    onPointsInsufficient: () => void;
    onAutoFillWord?: (wordIndex: number, word: string) => void;
}

const HintBox: React.FC<HintBoxProps> = ({
    sentence,
    userInput,
    currentIndex,
    revealedWords,
    revealCount,
    userPoints,
    isKeyboardVisible = false,
    onRevealWord,
    onWordPress,
    onPointsInsufficient,
    onAutoFillWord,
}) => {
    const currentRevealCount = revealCount[currentIndex] || 0;
    const freeRevealsRemaining = Math.max(0, 2 - currentRevealCount);
    const isPaidReveal = currentRevealCount >= 2;

    const renderWord = (word: string, index: number) => {
        const pureWord = word.replace(/[.,!?;:"""''„]/g, '');
        const punctuation = word.replace(pureWord, '');
        const wordKey = `${currentIndex}-${index}`;
        const isRevealedByClick = revealedWords[wordKey];

        // Check user input for this word position
        const userWords = userInput.trim().toLowerCase().split(/\s+/).filter(w => w.length > 0);
        const userWord = userWords[index]?.replace(/[.,!?;:"""''„]/g, '') || '';
        const correctWord = pureWord.toLowerCase();

        // Calculate matched characters from start
        let matchedChars = 0;
        for (let i = 0; i < Math.min(userWord.length, correctWord.length); i++) {
            if (userWord[i] === correctWord[i]) {
                matchedChars++;
            } else {
                break;
            }
        }

        const isFullyCorrect = userWord === correctWord;
        const isWrong = userWord.length > 0 && matchedChars === 0;
        const hasPartialMatch = matchedChars > 0 && !isFullyCorrect;

        const handleReveal = () => {
            if (!isFullyCorrect && !isRevealedByClick) {
                const newCount = currentRevealCount + 1;

                // From 3rd reveal onwards, check if user has points
                if (newCount > 2 && userPoints <= 0) {
                    onPointsInsufficient();
                    return;
                }

                onRevealWord(wordKey, currentRevealCount);

                // Auto-fill the revealed word into input
                if (onAutoFillWord) {
                    onAutoFillWord(index, pureWord);
                }
            }
        };

        return (
            <View key={index} style={styles.maskedWordWrapper}>
                {isFullyCorrect || isRevealedByClick ? (
                    <TouchableOpacity
                        style={[styles.wordBox, styles.wordBoxRevealed]}
                        onPress={() => onWordPress(word, pureWord)}
                    >
                        <Text style={styles.revealedWord}>{pureWord}</Text>
                    </TouchableOpacity>
                ) : isWrong ? (
                    <TouchableOpacity style={[styles.wordBox, styles.wordBoxWrong]} onPress={handleReveal}>
                        <Text style={styles.wrongAsterisks}>{'*'.repeat(pureWord.length)}</Text>
                    </TouchableOpacity>
                ) : hasPartialMatch ? (
                    <TouchableOpacity style={[styles.wordBox, styles.wordBoxPartial]} onPress={handleReveal}>
                        <Text style={styles.matchedChars}>{pureWord.substring(0, matchedChars)}</Text>
                        <Text style={styles.remainingAsterisks}>{'*'.repeat(pureWord.length - matchedChars)}</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={[styles.wordBox, styles.wordBoxHidden]} onPress={handleReveal}>
                        <Text style={styles.hiddenAsterisks}>{'*'.repeat(pureWord.length)}</Text>
                    </TouchableOpacity>
                )}
                {punctuation && <Text style={styles.punctuation}>{punctuation}</Text>}
            </View>
        );
    };

    const containerStyle: ViewStyle[] = [
        styles.maskedSentenceBox,
        isKeyboardVisible ? styles.maskedSentenceBoxKeyboard : styles.maskedSentenceBoxAboveInput,
    ];

    return (
        <View style={containerStyle}>
            <View style={styles.hintHeader}>
                <Text style={styles.maskedLabel}>💡 Hint</Text>
                <Text style={[styles.freeHintText, isPaidReveal && styles.freeHintWarning]}>
                    {isPaidReveal ? '-1đ/lần' : `${freeRevealsRemaining}x free`}
                </Text>
            </View>
            <View style={styles.maskedWordsContainer}>
                {sentence.split(' ').map(renderWord)}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    maskedSentenceBox: {
        backgroundColor: '#fff',
        padding: isTablet ? 28 : 14,
        borderRadius: isTablet ? 20 : 12,
        marginBottom: spacing.sm,
        borderWidth: 1.5,
        borderColor: colors.retroBorder,
    },
    maskedSentenceBoxAboveInput: {
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
    },
    maskedSentenceBoxKeyboard: {
        marginHorizontal: spacing.md,
        marginBottom: 6,
        // Keep same padding and borderRadius to prevent layout shift
    },
    hintHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    maskedLabel: {
        fontSize: isTablet ? 20 : 12,
        fontWeight: '700',
        color: colors.textMuted,
    },
    freeHintText: {
        fontSize: isTablet ? 12 : 9,
        fontWeight: '700',
        color: '#fff',
        backgroundColor: colors.retroCyan,
        paddingHorizontal: isTablet ? 10 : 6,
        paddingVertical: isTablet ? 4 : 2,
        borderRadius: isTablet ? 6 : 4,
        borderWidth: 1,
        borderColor: colors.retroBorder,
        overflow: 'hidden',
    },
    freeHintWarning: {
        backgroundColor: colors.retroCoral,
    },
    maskedWordsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: isTablet ? 14 : 6,
    },
    maskedWordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    wordBox: {
        paddingHorizontal: isTablet ? 16 : 8,
        paddingVertical: isTablet ? 12 : 4,
        borderRadius: isTablet ? 10 : 6,
        borderWidth: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    wordBoxHidden: {
        backgroundColor: colors.retroCream,
        borderColor: colors.retroBorder,
    },
    wordBoxWrong: {
        backgroundColor: '#ffe0e0',
        borderColor: colors.retroCoral,
    },
    wordBoxPartial: {
        backgroundColor: '#e0f7fa',
        borderColor: colors.retroCyan,
    },
    wordBoxRevealed: {
        backgroundColor: '#e8f5e9',
        borderColor: colors.retroCyan,
    },
    hiddenAsterisks: {
        fontSize: isTablet ? 22 : 14,
        fontWeight: '500',
        color: colors.textMuted,
        letterSpacing: 1,
    },
    wrongAsterisks: {
        fontSize: isTablet ? 22 : 14,
        fontWeight: '500',
        color: colors.retroCoral,
        letterSpacing: 1,
    },
    matchedChars: {
        fontSize: isTablet ? 22 : 14,
        fontWeight: '700',
        color: colors.retroCyan,
    },
    remainingAsterisks: {
        fontSize: isTablet ? 22 : 14,
        fontWeight: '500',
        color: colors.textMuted,
        letterSpacing: 1,
    },
    revealedWord: {
        fontSize: isTablet ? 22 : 14,
        fontWeight: '700',
        color: colors.retroCyan,
    },
    punctuation: {
        fontSize: isTablet ? 22 : 14,
        color: colors.retroDark,
        marginLeft: 1,
    },
});

export default HintBox;
