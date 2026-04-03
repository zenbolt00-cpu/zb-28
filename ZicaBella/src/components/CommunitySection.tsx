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

  // Fallback default looks in case API is empty or failing
  const defaultLooks = [
    { id: '1', imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000', name: 'ZICABELLA' },
    { id: '2', imageUrl: 'https://images.unsplash.com/photo-1539109132314-dc477555d656?q=80&w=1000', name: 'ZICABELLA' },
    { id: '3', imageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1000', name: 'ZICABELLA' },
  ];

  const displayUsers = users && users.length > 0 ? users : defaultLooks;
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography size={7} color={colors.textLight} weight="300" style={styles.subtitle}>{subtitle}</Typography>
        <Typography heading size={10} color={colors.foreground} weight="600" style={styles.title}>{title}</Typography>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.list}
        snapToInterval={width * 0.7 + 16}
        decelerationRate="fast"
      >
        {displayUsers.map((look) => (
          <TouchableOpacity 
            key={look.id} 
            style={[styles.item, { 
              backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
            }]} 
            activeOpacity={0.9}
          >
            <Image 
              source={{ uri: look.imageUrl }} 
              style={styles.image} 
              contentFit="cover" 
              transition={400}
            />
            <BlurView 
              intensity={isDark ? 80 : 100} 
              tint={isDark ? 'dark' : 'light'} 
              style={[styles.glassLabel, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]}
            >
              <Typography size={7} color={colors.text} weight="600" style={styles.labelText}>
                @{look.name ? look.name.toUpperCase().slice(0, 12) : 'ZICABELLA'}
              </Typography>
            </BlurView>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity 
        style={[styles.joinBtn, { 
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', 
          backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' 
        }]}
      >
        <Typography size={8} color={colors.textSecondary} weight="300" style={styles.joinText}>Join the Collective</Typography>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 48,
    marginBottom: 60,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 7,
    fontWeight: '300',
    letterSpacing: 4,
    color: 'rgba(0,0,0,0.3)',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  list: {
    paddingHorizontal: 24,
    gap: 16,
  },
  item: {
    width: width * 0.7,
    aspectRatio: 4 / 5,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  glassLabel: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  labelText: {
    fontSize: 7,
    fontWeight: '600',
    letterSpacing: 1,
  },
  joinBtn: {
    alignSelf: 'center',
    marginTop: 32,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 99,
    borderWidth: 1,
  },
  joinText: {
    fontSize: 8,
    fontWeight: '300',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
