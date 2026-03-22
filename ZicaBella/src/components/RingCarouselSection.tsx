import React from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, Dimensions 
} from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { FlatProduct } from '../api/types';
import { useColors } from '../constants/colors';
import { useThemeStore } from '../store/themeStore';
import { Typography } from './Typography';

interface Props {
  title?: string;
  products: FlatProduct[];
}

export default function RingCarouselSection({ title = "ACCESSORIES", products }: Props) {
  const navigation = useNavigation<any>();
  const colors = useColors();
  const theme = useThemeStore(state => state.theme);
  const isDark = theme === 'dark';

  if (products.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.glassCard, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
        <BlurView intensity={isDark ? 40 : 80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        
        {/* Header */}
        <View style={styles.header}>
          <Typography size={7.5} color={colors.text} weight="500" style={styles.title}>{title}</Typography>
          <TouchableOpacity 
            onPress={() => navigation.navigate('SearchTab')}
          >
            <Typography size={6.5} color={colors.textExtraLight} weight="400">VIEW ALL</Typography>
          </TouchableOpacity>
        </View>

        {/* Horizontal Scroll */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          snapToInterval={110} // Width 90 + Gap 20
          decelerationRate="fast"
        >
          {products.map((item) => (
            <TouchableOpacity 
              key={item.id}
              style={styles.itemContainer}
              onPress={() => navigation.navigate('ProductDetail', { handle: item.handle })}
              activeOpacity={0.8}
            >
              <View style={[styles.imageWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
                <Image 
                  source={{ uri: item.featuredImage || undefined }} 
                  style={styles.image}
                  contentFit="cover"
                  transition={300}
                />
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ width: 10 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  glassCard: {
    borderRadius: 32,
    overflow: 'hidden',
    paddingVertical: 20,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 8,
    fontWeight: '400',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  viewAll: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(128,128,128,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 20,
  },
  itemContainer: {
    width: 90,
    height: 90,
    borderRadius: 45, // Circular for rings/accessories looks unique
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.1)',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
