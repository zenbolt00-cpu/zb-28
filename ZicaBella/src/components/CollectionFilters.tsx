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
  isTabBarVisible?: boolean;
}

export default function CollectionFilters({
  allSizes,
  selectedSize,
  onSelectSize,
  sortBy,
  onSelectSort,
  viewMode,
  onToggleView,
  isTabBarVisible = true,
}: Props) {
  const colors = useColors();
  const theme = useThemeStore(state => state.theme);
  const isDark = theme === 'dark';
  const [isSizeOpen, setIsSizeOpen] = React.useState(false);

  return (
    <View style={styles.container}>
      <View style={[styles.pillWrapper, { borderColor: colors.borderLight }]}>
        <BlurView intensity={isDark ? 40 : 80} tint={isDark ? 'dark' : 'light'} style={styles.pill}>
          {/* Sort Button */}
          {isTabBarVisible && (
            <>
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
            </>
          )}

          {/* Size Button */}
          <TouchableOpacity 
            style={styles.filterBtn}
            onPress={() => {
              if (allSizes.length > 0) setIsSizeOpen(true);
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

          {/* View Toggle */}
          {isTabBarVisible && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
              <TouchableOpacity style={styles.viewToggle} onPress={onToggleView}>
                <Ionicons 
                  name={viewMode === 'grid' ? 'grid-outline' : viewMode === 'large' ? 'square-outline' : 'list-outline'} 
                  size={13} 
                  color={colors.text} 
                  style={{ opacity: 0.8 }}
                />
              </TouchableOpacity>
            </>
          )}
        </BlurView>
      </View>

      {/* Dropdown for Sizes */}
      {isSizeOpen && (
        <View style={styles.dropdownOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={() => setIsSizeOpen(false)} 
          />
          <View style={[styles.dropdownContainer, { borderColor: colors.borderLight }]}>
            <BlurView intensity={isDark ? 80 : 90} tint={isDark ? 'dark' : 'light'} style={styles.dropdownInner}>
              <TouchableOpacity 
                style={styles.dropdownOption}
                onPress={() => { onSelectSize(null); setIsSizeOpen(false); }}
              >
                <Text style={[styles.dropdownOptionText, { color: colors.text, opacity: !selectedSize ? 1 : 0.6 }]}>
                  ANY SIZE
                </Text>
              </TouchableOpacity>
              {allSizes.map(size => (
                <TouchableOpacity 
                  key={size}
                  style={styles.dropdownOption}
                  onPress={() => { onSelectSize(size); setIsSizeOpen(false); }}
                >
                  <Text style={[styles.dropdownOptionText, { color: colors.text }]}>
                    {size}
                  </Text>
                  {selectedSize === size && (
                    <Ionicons name="checkmark" size={12} color={colors.text} />
                  )}
                </TouchableOpacity>
              ))}
            </BlurView>
          </View>
        </View>
      )}
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
  dropdownOverlay: {
    position: 'absolute',
    top: 50,
    width: '100%',
    alignItems: 'center',
    zIndex: 999,
  },
  dropdownContainer: {
    width: 200,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  dropdownInner: {
    paddingVertical: 8,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  dropdownOptionText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
