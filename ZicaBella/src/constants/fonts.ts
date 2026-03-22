export const fonts = {
  // System fonts as used in the web app
  heading: undefined, // Uses system font (SF Pro) on iOS by default
  body: undefined,    // Uses system font on iOS by default
  // If you load custom fonts via expo-font, set them here:
  // heading: 'HeadingPro',
  // body: 'Poppins',
};

export const fontSizes = {
  micro: 6,
  tiny: 7,
  xxs: 8,
  xs: 9,
  sm: 10,
  base: 11,
  md: 13,
  lg: 15,
  xl: 17,
  xxl: 20,
  title: 24,
};

export const fontWeights = {
  thin: '100' as const,
  extralight: '200' as const,
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};
