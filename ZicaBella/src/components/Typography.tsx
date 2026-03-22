import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';

interface TypographyProps extends TextProps {
  heading?: boolean;
  rocaston?: boolean;
  size?: number;
  color?: string;
  weight?: 'normal' | 'bold' | '300' | '400' | '500' | '600' | '700' | '800';
  style?: TextStyle | TextStyle[];
  letterSpacing?: number;
}

export const Typography: React.FC<TypographyProps> = ({ 
  children, 
  heading, 
  rocaston, 
  size = 14, 
  color, 
  weight,
  style, 
  letterSpacing,
  ...props 
}) => {
  const baseStyle: TextStyle = { 
    fontSize: size, 
    color, 
    letterSpacing 
  };

  if (typeof children !== 'string') {
    return (
      <Text style={[baseStyle, style]} {...props}>
        {children}
      </Text>
    );
  }

  // Determine base font family
  let baseFont = 'System';
  if (heading) baseFont = 'HeadingProWide-Bold';
  else if (rocaston) baseFont = 'Rocaston';

  // Split string into numbers and everything else
  // This regex matches numbers (including decimals/commas like 1,899 or 19.99)
  const parts = children.split(/([\d,.]+)/);

  return (
    <Text style={[baseStyle, style]} {...props}>
      {parts.map((part, i) => {
        // If it's a number (or contains only digits, commas, periods)
        // We use Poppins for any part that is purely numerical + symbols
        const isNumeric = /^[\d,.]+$/.test(part);
        
        return (
          <Text 
            key={i} 
            style={{ 
              fontFamily: isNumeric ? (weight === 'bold' || weight === '700' ? 'Poppins-Bold' : 'Poppins') : baseFont,
              fontWeight: weight as any
            }}
          >
            {part}
          </Text>
        );
      })}
    </Text>
  );
};
