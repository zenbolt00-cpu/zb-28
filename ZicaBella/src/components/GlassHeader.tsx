import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useColors } from '../constants/colors';
import { useThemeStore } from '../store/themeStore';
import { useUIStore } from '../store/uiStore';

interface Props {
  title?: string;
  showBack?: boolean;
  onPressMenu?: () => void;
  isBookmarked?: boolean;
  hideRightIsland?: boolean;
}

export default function GlassHeader({ 
  title = 'ZICA BELLA', 
  showBack = false,
  onPressMenu,
  isBookmarked = false,
  hideRightIsland = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const colors = useColors();
  const { theme, toggleTheme } = useThemeStore();
  const setBookmarkOpen = useUIStore((state) => state.setBookmarkOpen);

  const isDark = theme === 'dark';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Left Action: Logo / Back */}
      <TouchableOpacity
        style={[styles.islandBase, styles.leftIsland, { borderColor: colors.borderLight, backgroundColor: colors.background }]}
        onPress={() => showBack ? (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main')) : onPressMenu?.()}
        activeOpacity={0.7}
      >
        <BlurView intensity={70} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={styles.iconCircle}>
          {showBack ? (
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          ) : (
            <Image 
              source={require('../../assets/ZB-logo-silver.svg')} 
              style={{ width: 20, height: 20, opacity: 0.9 }} 
              contentFit="contain"
            />
          )}
        </View>
      </TouchableOpacity>

      {/* Right Actions: Theme Toggle + Bookmark */}
      {!hideRightIsland && (
        <View style={[styles.islandBase, styles.rightIsland, { borderColor: colors.borderLight, backgroundColor: colors.background }]}>
          <BlurView intensity={70} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={styles.rightActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={toggleTheme}>
              <Ionicons 
                name={isDark ? "sparkles-outline" : "contrast-outline"} 
                size={16} 
                color={colors.text} 
                style={{ opacity: 0.9 }} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setBookmarkOpen(true)}
            >
              <Ionicons 
                name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                size={16} 
                color={isBookmarked ? colors.iosGreen : colors.text} 
                style={!isBookmarked ? { opacity: 0.85 } : undefined} 
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  leftIsland: {
    width: 42,
  },
  rightIsland: {
    borderRadius: 21,
  },
  iconCircle: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    paddingHorizontal: 4,
  },
  actionBtn: {
    width: 34,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
