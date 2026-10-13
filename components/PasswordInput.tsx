import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { StyleProp, TextInputProps, TextStyle, ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../lib/theme';

type PasswordInputProps = Omit<TextInputProps, 'secureTextEntry' | 'style'> & {
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

export function PasswordInput({ style, containerStyle, ...inputProps }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput {...inputProps} secureTextEntry={!visible} style={style} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        hitSlop={8}
        onPress={() => setVisible((current) => !current)}
        style={styles.toggle}
      >
        <Svg width={28} height={18} viewBox="0 0 44 28" fill="none">
          <Path
            d="M3 14C8.2 6.1 14.9 2 22 2s13.8 4.1 19 12c-5.2 7.9-11.9 12-19 12S8.2 21.9 3 14Z"
            stroke={colors.muted}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx={22} cy={14} r={6} stroke={colors.muted} strokeWidth={2.2} />
          {visible ? (
            <Path
              d="M6 3 38 25"
              stroke={colors.muted}
              strokeWidth={2.6}
              strokeLinecap="round"
            />
          ) : null}
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  toggle: { position: 'absolute', right: 5, top: 0, bottom: 0, width: 40, alignItems: 'center', justifyContent: 'center' },
});
