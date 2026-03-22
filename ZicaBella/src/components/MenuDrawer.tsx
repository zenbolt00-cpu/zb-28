import React from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  Dimensions, Pressable, ScrollView 
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../constants/colors';
import { useThemeStore } from '../store/themeStore';

const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function MenuDrawer({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const colors = useColors();
  const theme = useThemeStore(state => state.theme);
  const isDark = theme === 'dark';

  const collections = [
    { title: 'ACID TEES', handle: 'acid-tees' },
    { title: 'DO-ZAK COLLECTION', handle: 'do-zak-collection' },
    { title: 'DRIP DENIM', handle: 'drip-denim' },
    { title: 'FEATURED COLLECTION', handle: 'featured-collection' },
    { title: 'JORTSY', handle: 'jortsy' },
    { title: 'LEATHER ROOM', handle: 'leather-room' },
    { title: 'ROGUE WINTER', handle: 'rogue-winter' },
    { title: 'VEXEE SHIRTS', handle: 'vexee-shirts' }
  ];

  const shopItems = [
    { title: 'T-shirt', handle: 't-shirts' },
    { title: 'Jeans', handle: 'jeans' },
    { title: 'Pants', handle: 'pants' },
    { title: 'Trousers', handle: 'trousers' },
    { title: 'Jorts', handle: 'jorts' },
    { title: 'Shirts', handle: 'shirts' }
  ];

  const bottomLinks = [
    { title: 'COLLABORATIONS', route: 'Collaborations' },
    { title: 'BLOGS', route: 'Blogs' },
    { title: 'FAQ', route: 'FAQ' },
    { title: 'COMMUNITY', route: 'Community' },
    { title: 'ZICA AI', route: 'ChatTab' }
  ];

  const islandItems = [
    { label: 'PROFILE', icon: 'person-outline', route: 'ProfileTab' },
    { label: 'ORDERS', icon: 'cube-outline', route: 'ProfileTab' },
    { label: 'STORY', icon: 'information-circle-outline', route: 'Story' },
  ];

  const handleNavigate = (route: string, params?: any) => {
    onClose();
    navigation.navigate(route, params);
  };

  const GlassWidget = ({ title, children, style }: { title: string, children: React.ReactNode, style?: any }) => (
    <View style={[styles.widgetWrapper, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }, style]}>
      <BlurView intensity={isDark ? 40 : 80} tint={isDark ? 'dark' : 'light'} style={styles.widget}>
        <Text style={[styles.columnHeader, { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)' }]}>{title}</Text>
        {children}
      </BlurView>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <BlurView intensity={isDark ? 40 : 20} tint={isDark ? 'dark' : 'default'} style={StyleSheet.absoluteFill} />
        </Pressable>

        <View style={[styles.drawer, { 
          paddingBottom: insets.bottom + 20, 
          backgroundColor: 'transparent', // Liquid glass requires fully transparent container
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
        }]}>
          <BlurView intensity={isDark ? 80 : 100} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          
          <View style={[styles.header, { paddingTop: 40 }]}>
            <Text style={[styles.headerLogo, { color: colors.text }]}>ZICA BELLA</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <Ionicons name="close" size={16} color={colors.text} style={{ opacity: 0.6 }} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.widgetGrid}>
              <GlassWidget title="COLLECTIONS" style={{ flex: 1.2 }}>
                {collections.map(item => (
                  <TouchableOpacity 
                    key={item.handle} 
                    style={styles.itemBtn}
                    onPress={() => handleNavigate('Collection', { handle: item.handle })}
                  >
                    <Text style={[styles.itemText, { color: colors.textSecondary }]}>{item.title}</Text>
                  </TouchableOpacity>
                ))}
              </GlassWidget>

              <GlassWidget title="SHOP" style={{ flex: 0.8 }}>
                {shopItems.map(item => (
                  <TouchableOpacity 
                    key={item.handle} 
                    style={styles.itemBtn}
                    onPress={() => handleNavigate('Collection', { handle: item.handle })}
                  >
                    <Text style={[styles.itemText, { color: colors.textSecondary }]}>{item.title}</Text>
                  </TouchableOpacity>
                ))}
              </GlassWidget>
            </View>

            <View style={styles.bottomLinksSection}>
              <View style={[styles.bottomLinksContent, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                <BlurView intensity={isDark ? 40 : 80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                {bottomLinks.map(link => (
                  <TouchableOpacity 
                    key={link.title} 
                    style={styles.bottomLinkBtn}
                    onPress={() => handleNavigate(link.route)}
                  >
                    <Text style={[styles.bottomLinkText, { color: colors.text }]}>{link.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.islandContainer}>
            <View style={[styles.island, { backgroundColor: 'transparent', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
              <BlurView intensity={isDark ? 50 : 80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
              {islandItems.map(item => (
                <TouchableOpacity 
                  key={item.label} 
                  style={styles.islandItem}
                  onPress={() => handleNavigate(item.route)}
                >
                  <Ionicons name={item.icon as any} size={16} color={colors.text} style={{ opacity: 0.8 }} />
                  <Text style={[styles.islandLabel, { color: colors.text }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  drawer: {
    height: '92%',
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44,
    overflow: 'hidden',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 40,
  },
  headerLogo: {
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingBottom: 240,
  },
  widgetGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  widgetWrapper: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  widget: {
    padding: 24,
    minHeight: 220,
  },
  columnHeader: {
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 24,
    textTransform: 'uppercase',
  },
  itemBtn: {
    marginBottom: 16,
  },
  itemText: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  bottomLinksSection: {
    marginTop: 12,
  },
  bottomLinksContent: {
    borderRadius: 32,
    padding: 28,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  bottomLinkBtn: {
    marginBottom: 20,
  },
  bottomLinkText: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  islandContainer: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  island: {
    width: '100%',
    height: 64,
    borderRadius: 32,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  islandItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  islandLabel: {
    fontSize: 7,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
