import { forwardRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";
import { authColors } from "@/src/config/auth";

type Props = TextInputProps & { label: string; error?: string };

export const AuthInput = forwardRef<TextInput, Props>(function AuthInput({ label, error, secureTextEntry, style, ...props }, ref) {
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));
  const [focused, setFocused] = useState(false);
  const isPassword = Boolean(secureTextEntry);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, focused && styles.inputFocused, error && styles.inputError]}>
        <TextInput
          ref={ref}
          {...props}
          onFocus={(event) => { setFocused(true); props.onFocus?.(event); }}
          onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
          secureTextEntry={isPassword ? hidden : secureTextEntry}
          placeholderTextColor={authColors.textSecondary}
          style={[styles.input, style]}
          accessibilityLabel={error ? `${label}. Error: ${error}` : label}
          accessibilityHint={error ?? props.accessibilityHint}
        />
        {isPassword ? (
          <Pressable
            accessibilityLabel={hidden ? `Show ${label.toLowerCase()}` : `Hide ${label.toLowerCase()}`}
            accessibilityRole="button"
            hitSlop={4}
            onPress={() => setHidden((current) => !current)}
            style={styles.eye}
          >
            <Text style={styles.eyeText}>{hidden ? "Show" : "Hide"}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  field: { gap: 7 },
  label: { color: authColors.textPrimary, fontSize: 13, fontWeight: "700" },
  inputWrap: { minHeight: 52, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: authColors.border, borderRadius: 14, backgroundColor: authColors.inputBackground },
  inputFocused: { borderColor: authColors.green },
  inputError: { borderColor: authColors.error },
  input: { flex: 1, minHeight: 50, paddingHorizontal: 15, color: authColors.textPrimary, fontSize: 16 },
  eye: { minWidth: 52, minHeight: 50, alignItems: "center", justifyContent: "center" },
  eyeText: { color: authColors.green, fontSize: 12, fontWeight: "800" },
  error: { color: authColors.error, fontSize: 12, lineHeight: 17 },
});
