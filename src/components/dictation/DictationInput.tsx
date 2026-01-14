import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing, borderRadius } from '../../styles/theme';

interface DictationInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  editable?: boolean;
  onSubmit?: () => void;
  onVoiceInput?: () => void;
  isListening?: boolean;
}

/**
 * @deprecated This component is not currently used by DictationScreen.
 * DictationScreen uses its own TextInput with custom features:
 * - Word length validation (prevents typing more chars than expected)
 * - Keyboard-aware styling adjustments
 * - Completed state visual feedback
 * - Long-press to re-edit functionality
 * 
 * Consider removing or enhancing this component to match those features.
 * 
 * Original DictationInput Component - Text input with voice button for dictation
 */
const DictationInput: React.FC<DictationInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Type your answer here...',
  editable = true,
  onSubmit,
  onVoiceInput,
  isListening = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.textInput, !editable && styles.textInputDisabled]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          multiline
          editable={editable}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {onVoiceInput && (
          <TouchableOpacity
            style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
            onPress={onVoiceInput}
            activeOpacity={0.7}
          >
            <Icon
              name={isListening ? 'stop' : 'mic'}
              size={22}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        )}
      </View>

      {onSubmit && editable && (
        <TouchableOpacity
          style={[styles.submitButton, !value.trim() && styles.submitButtonDisabled]}
          onPress={onSubmit}
          disabled={!value.trim()}
          activeOpacity={0.7}
        >
          <Text style={styles.submitButtonText}>Submit Answer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.medium,
    borderWidth: 2,
    borderColor: colors.borderColor,
    padding: spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 80,
    maxHeight: 150,
    textAlignVertical: 'top',
    paddingRight: spacing.sm,
  },
  textInputDisabled: {
    opacity: 0.6,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.round,
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  voiceButtonActive: {
    backgroundColor: colors.accentRed,
  },
  submitButton: {
    backgroundColor: colors.accentBlue,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.small,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.3,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});

export default DictationInput;
