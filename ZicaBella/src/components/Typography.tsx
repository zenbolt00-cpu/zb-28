import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { useColors } from '../constants/colors';
import { TypographyPresets, TypographyPreset } from '../constants/typography';

interface TypographyProps extends TextProps {
  /** Apply a named typography preset (display, heading, body, caption, button) */
  preset?: TypographyPreset;
  /** Legacy: treat as heading weight */
  heading?: boolean;
  /** Use the Rocaston brand font */
  rocaston?: boolean;
  size?: number;
  color?: string;
  weight?: 'normal' | 'bold' | '300' | '400' | '500' | '600' | '700' | '800';
  style?: TextStyle | TextStyle[];
  letterSpacing?: number;
}

/**
 * Unified text component.
 *
 * Uses the native iOS system font (SF Pro) by default.
 * Pass `rocaston` for the brand wordmark font.
 * Pass `preset` for quick preset styling.
 */
export const Typography: React.FC<TypographyProps> = ({
  children,
  preset,
  heading,
  rocaston,
  size = 14,
  color,
  weight,
  style,
  letterSpacing,
  ...props
}) => {
  const themeColors = useColors();
  const finalColor = color || themeColors.text;

  // Resolve preset styles if provided
  const presetStyle = preset ? TypographyPresets[preset] : undefined;

  // Rocaston is the only custom font we keep; everything else uses system font
  const fontFamily = rocaston ? 'Rocaston' : undefined;

  // Determine fontWeight: explicit weight > heading shortcut > preset > default
  const resolvedWeight: TextStyle['fontWeight'] = weight
    ?? (heading ? '600' : undefined)
    ?? presetStyle?.fontWeight
    ?? undefined;

  const baseStyle: TextStyle = {
    ...presetStyle,
    fontSize: size ?? presetStyle?.fontSize ?? 14,
    color: finalColor,
    letterSpacing: letterSpacing ?? (presetStyle as any)?.letterSpacing,
    fontWeight: resolvedWeight,
    ...(fontFamily ? { fontFamily } : {}),
  };

  return (
    <Text style={[baseStyle, style]} {...props}>
      {children}
    </Text>
  );
};
