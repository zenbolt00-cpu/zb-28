import React, { useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  Dimensions, Pressable, ScrollView, ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useColors } from '../constants/colors';
import { useThemeStore } from '../store/themeStore';
import { useCollections } from '../hooks/useProducts';
import { Typography } from './Typography';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.85, 340);

interface Props {
  visible: boolean;
  onClose: () => void;
}

const SHOP_TERMS = ['T-SHIRT', 'JEANS', 'PANTS', 'TROUSERS', 'JORTS', 'SHIRTS'];

export default function MenuDrawer({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const colors = useColors();
  const theme = useThemeStore(state => state.theme);
  const isDark = theme === 'dark';
  
  const { collections, loading } = useCollections(20, 'menu');

  const translateX = useSharedValue(-DRAWER_WIDTH);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      translateX.value = withSpring(0, { damping: 30, stiffness: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 250 });
      translateX.value = withTiming(-DRAWER_WIDTH, { duration: 250 });
    }
  }, [visible]);

  const animatedDrawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleNavigate = (route: string, params?: any) => {
    onClose();
    setTimeout(() => {
      navigation.navigate(route, params);
    }, 300);
  };

  if (!visible && opacity.value === 0) return null;

  return (
    <Modal visible={visible} transparent onRequestClose={onClose}>
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
            <BlurView intensity={isDark ? 30 : 20} tint={isDark ? 'dark' : 'default'} style={StyleSheet.absoluteFill} />
          </Pressable>
        </Animated.View>

        <Animated.View style={[
          styles.drawer, 
          animatedDrawerStyle,
          { 
            backgroundColor: isDark ? 'rgba(8, 8, 8, 0.75)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            top: insets.top + 10,
            bottom: insets.bottom + 10,
          }
        ]}>
          <BlurView intensity={isDark ? 60 : 100} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          
          <View style={styles.topBar}>
            <Typography size={6.5} color={colors.textExtraLight} weight="200" style={styles.headerLabel}>ZICA BELLA</Typography>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <Ionicons name="close" size={14} color={colors.textExtraLight} />
            </TouchableOpacity>
          </View>

          <View style={styles.mainContent}>
            <View style={styles.zonesContainer}>
              {/* Zone A Left: Collections */}
              <View style={styles.zoneA_Left}>
                <Typography size={6} color={colors.textExtraLight} weight="200" style={styles.zoneTag}>COLLECTIONS</Typography>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.textExtraLight} style={{ marginTop: 20 }} />
                  ) : collections.map(c => (
                    <TouchableOpacity 
                      key={c.id} 
                      style={styles.collectionItem}
                      onPress={() => handleNavigate('Collection', { handle: c.handle })}
                    >
                      <Typography size={10} color={colors.textSecondary} weight="200" style={styles.itemText}>{c.title.toUpperCase()}</Typography>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]} />

              {/* Zone A Right: Shop */}
              <View style={styles.zoneA_Right}>
                <Typography size={6} color={colors.textExtraLight} weight="200" style={styles.zoneTag}>SHOP</Typography>
                {SHOP_TERMS.map(term => (
                  <TouchableOpacity 
                    key={term} 
                    style={styles.shopItem}
                    onPress={() => handleNavigate('SearchTab', { query: term })}
                  >
                    <Typography size={9} color={colors.textExtraLight} weight="200" style={styles.itemText}>{term}</Typography>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Zone B: Primary Nav */}
            <View style={[styles.navSection, { borderTopColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}>
              {[
                { title: 'COLLABORATIONS', route: 'Collaborations' },
                { title: 'BLOGS', route: 'Blogs' },
                { title: 'FAQ', route: 'FAQ' },
                { title: 'COMMUNITY', route: 'Community' },
              ].map(link => (
                <TouchableOpacity 
                  key={link.title} 
                  style={styles.navLink}
                  onPress={() => handleNavigate(link.route)}
                >
                  <Typography size={18} color={colors.textSecondary} weight="200" style={styles.navText}>{link.title}</Typography>
                  <View style={[styles.navDot, { backgroundColor: colors.textExtraLight }]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Zone C: Icon Dock */}
          <View style={styles.dockContainer}>
             <View style={[styles.dock, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                {[
                  { label: 'PROFILE', icon: 'person-outline', route: 'ProfileTab' },
                  { label: 'ORDERS', icon: 'cube-outline', route: 'OrderHistory' },
                  { label: 'STORY', icon: 'information-circle-outline', route: 'Story' },
                ].map((item, idx) => (
                  <React.Fragment key={item.label}>
                    <TouchableOpacity 
                      style={styles.dockItem}
                      onPress={() => handleNavigate(item.route)}
                    >
                      <Ionicons name={item.icon as any} size={16} color={colors.textExtraLight} style={{ opacity: 0.6 }} />
                      <Typography size={5.5} color={colors.textExtraLight} weight="200" style={styles.dockLabel}>{item.label}</Typography>
                    </TouchableOpacity>
                    {idx < 2 && <View style={[styles.dockDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]} />}
                  </React.Fragment>
                ))}
             </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  drawer: {
    position: 'absolute',
    left: 10,
    width: DRAWER_WIDTH,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  headerLabel: {
    letterSpacing: 6,
    opacity: 0.6,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
  },
  zonesContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  zoneA_Left: {
    flex: 1,
    paddingRight: 12,
  },
  zoneA_Right: {
    width: '32%',
    paddingLeft: 12,
  },
  zoneTag: {
    letterSpacing: 4,
    opacity: 0.3,
    marginBottom: 20,
  },
  collectionItem: {
    marginBottom: 16,
  },
  shopItem: {
    marginBottom: 16,
  },
  itemText: {
    letterSpacing: 1,
  },
  divider: {
    width: 1,
    height: '60%',
    marginTop: 40,
  },
  navSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  navText: {
    letterSpacing: -0.5,
  },
  navDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0, // Shown on hover on web, keep hidden or subtle here
  },
  dockContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 10,
  },
  dockItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dockLabel: {
    letterSpacing: 2,
    opacity: 0.5,
  },
  dockDivider: {
    width: 1,
    height: 20,
  },
});

