import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { useColors } from '../constants/colors';
import { useThemeStore } from '../store/themeStore';
import { Typography } from './Typography';

const { width } = Dimensions.get('window');

interface Props {
  title?: string;
  subtitle?: string;
}

import { useFeaturedUsers } from '../hooks/useAdminFeatures';

export default function CommunitySection({ 
  title = "FEATURED LOOKS", 
  subtitle = "COMMUNITY" 
}: Props) {
  const colors = useColors();
  const theme = useThemeStore(s => s.theme);
  const isDark = theme === 'dark';
  const { users, loading } = useFeaturedUsers(true);

  // Fallback default looks
  const defaultLooks = [
    { id: '1', imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000', name: 'DUSKYN' },
    { id: '2', imageUrl: 'https://images.unsplash.com/photo-1539109132314-dc477555d656?q=80&w=1000', name: 'MEGHAN' },
    { id: '3', imageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1000', name: 'ARAV' },
  ];

  const displayUsers = users && users.length > 0 ? users : defaultLooks;
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography size={7} color={colors.textLight} weight="300" style={styles.subtitle}>{subtitle}</Typography>
        <Typography heading size={10} color={colors.foreground} weight="700" style={styles.title}>{title}</Typography>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.list}
        snapToInterval={width * 0.72 + 16}
        decelerationRate="fast"
        scrollEventThrottle={16}
      >
        {displayUsers.map((look) => (
          <TouchableOpacity 
            key={look.id} 
            style={[styles.item, { 
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
            }]} 
            activeOpacity={0.95}
          >
            <Image 
              source={{ uri: look.imageUrl }} 
              style={styles.image} 
              contentFit="cover" 
              transition={800}
            />
            <View style={styles.labelContainer}>
              <BlurView 
                intensity={isDark ? 40 : 60} 
                tint={isDark ? 'dark' : 'light'} 
                style={[styles.glassLabel, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
              >
                <Typography size={6.5} color={colors.text} weight="700" style={styles.labelText}>
                  @{look.name ? look.name.toUpperCase().slice(0, 14) : 'USER'}
                </Typography>
              </BlurView>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 64,
    marginBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  subtitle: {
    letterSpacing: 4.5,
    opacity: 0.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    letterSpacing: 4.2,
    textTransform: 'uppercase',
  },
  list: {
    paddingHorizontal: 12, // Reduced gap from screen
    paddingRight: 24,
    gap: 12,
  },
  item: {
    width: width * 0.82, // Increased width
    aspectRatio: 3 / 4.9, // Reduced height by ~5% (was 5.2)
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 0, // Removed border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  labelContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  glassLabel: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  labelText: {
    letterSpacing: 1.2,
  },
});
