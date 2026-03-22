import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useColors } from '../constants/colors';
import { useThemeStore } from '../store/themeStore';
import { useCartStore } from '../store/cartStore';
import { Typography } from './Typography';


interface Props {
  title?: string;
  showBack?: boolean;
  onPressMenu?: () => void;
  onPressBookmarks?: () => void;
  isBookmarked?: boolean;
}

export default function GlassHeader({ 

  title = 'ZICA BELLA', 
  showBack = false,
  onPressMenu,
  onPressBookmarks,
  isBookmarked = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const colors = useColors();
  const { theme, toggleTheme } = useThemeStore();

  const isDark = theme === 'dark';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Box 1: Left Action (Logo/Back) */}
      <TouchableOpacity 
        style={[styles.islandBase, { borderColor: colors.borderLight, backgroundColor: colors.background, width: 38 }]}
        onPress={() => showBack ? navigation.goBack() : onPressMenu?.()}
        activeOpacity={0.7}
      >
        <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={styles.iconCircle}>
          {showBack ? (
            <Ionicons name="chevron-back" size={16} color={colors.text} />
          ) : (
            <Image 
              source={require('../../assets/ZB-logo-silver.svg')} 
              style={{ width: 20, height: 20, opacity: 0.9 }} 
              contentFit="contain"
            />
          )}
        </View>
      </TouchableOpacity>

      {/* Box 1: Left Action (Logo/Back) */}


      {/* Box 3: Right Actions */}
      <View style={[styles.islandBase, { borderColor: colors.borderLight, backgroundColor: colors.background, borderRadius: 19 }]}>
        <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={toggleTheme}>
            <Ionicons 
              name={isDark ? "sunny-outline" : "moon-outline"} 
              size={14} 
              color={colors.text} 
              style={{ opacity: 0.8 }} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={onPressBookmarks}>
            <Ionicons 
              name={isBookmarked ? "bookmark" : "bookmark-outline"} 
              size={14} 
              color={isBookmarked ? colors.iosGreen : colors.text} 
              style={!isBookmarked ? { opacity: 0.7 } : undefined} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    gap: 8,
  },
  islandBase: {
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    paddingHorizontal: 4,
  },
  actionBtn: {
    width: 32,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 4,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '700',
  },
});
