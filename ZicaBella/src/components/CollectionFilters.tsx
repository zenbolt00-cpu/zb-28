import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../constants/colors';
import { useThemeStore } from '../store/themeStore';

interface Props {
  allSizes: string[];
  selectedSize: string | null;
  onSelectSize: (size: string | null) => void;
  sortBy: string;
  onSelectSort: (sort: string) => void;
  viewMode: 'grid' | 'large' | 'list';
  onToggleView: () => void;
}

export default function CollectionFilters({
  allSizes,
  selectedSize,
  onSelectSize,
  sortBy,
  onSelectSort,
  viewMode,
  onToggleView
}: Props) {
  const colors = useColors();
  const theme = useThemeStore(state => state.theme);
  const isDark = theme === 'dark';

  return (
    <View style={styles.container}>
      <View style={[styles.pillWrapper, { borderColor: colors.borderLight }]}>
        <BlurView intensity={isDark ? 40 : 80} tint={isDark ? 'dark' : 'light'} style={styles.pill}>
          {/* Sort Button */}
          <TouchableOpacity 
            style={styles.filterBtn} 
            onPress={() => {
              const sorts = ['featured', 'newest', 'price-asc', 'price-desc'];
              const next = sorts[(sorts.indexOf(sortBy) + 1) % sorts.length];
              onSelectSort(next);
            }}
          >
            <Text style={[styles.filterText, { color: colors.text }]}>
              {sortBy.replace('-', ' ').toUpperCase()}
            </Text>
            <Ionicons name="chevron-down" size={10} color={colors.textExtraLight} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* Size Button */}
          <TouchableOpacity 
            style={styles.filterBtn}
            onPress={() => {
              if (allSizes.length === 0) return;
              const currentIndex = selectedSize ? allSizes.indexOf(selectedSize) : -1;
              const nextSize = currentIndex < allSizes.length - 1 ? allSizes[currentIndex + 1] : null;
              onSelectSize(nextSize);
            }}
          >
            <View style={styles.sizeLabelRow}>
              <Text style={[styles.filterText, { color: colors.text }]}>
                {selectedSize || 'SIZE'}
              </Text>
              {selectedSize && <View style={[styles.activeDot, { backgroundColor: colors.iosBlue }]} />}
            </View>
            <Ionicons name="chevron-down" size={10} color={colors.textExtraLight} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* View Toggle */}
          <TouchableOpacity style={styles.viewToggle} onPress={onToggleView}>
            <Ionicons 
              name={viewMode === 'grid' ? 'grid-outline' : viewMode === 'large' ? 'square-outline' : 'list-outline'} 
              size={13} 
              color={colors.text} 
              style={{ opacity: 0.8 }}
            />
          </TouchableOpacity>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    zIndex: 100,
    marginBottom: 24,
    marginTop: 12,
  },
  pillWrapper: {
    borderRadius: 99,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 24,
  },
  sizeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  filterText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  divider: {
    width: 1,
    height: 14,
    marginHorizontal: 4,
  },
  viewToggle: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    height: 24,
  },
});
