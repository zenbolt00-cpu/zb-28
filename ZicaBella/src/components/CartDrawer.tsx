import React from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  Dimensions, Pressable, FlatList 
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useCartStore } from '../store/cartStore';
import { useColors } from '../constants/colors';
import { useThemeStore } from '../store/themeStore';
import { formatPrice } from '../utils/formatPrice';
import CartItem from './CartItem';

const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export default function CartDrawer({ visible, onClose, onCheckout }: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const colors = useColors();
  const theme = useThemeStore(state => state.theme);
  const isDark = theme === 'dark';
  const { items, total, updateQuantity, removeItem } = useCartStore();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <BlurView intensity={isDark ? 40 : 15} tint={isDark ? 'dark' : 'default'} style={StyleSheet.absoluteFill} />
        </Pressable>

        <View style={[styles.drawer, { 
          paddingBottom: insets.bottom + 20,
          backgroundColor: isDark ? 'rgba(5,7,12,0.8)' : 'rgba(255,255,255,0.8)',
          borderColor: colors.borderLight
        }]}>
          <BlurView intensity={isDark ? 30 : 100} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          
          <View style={[styles.header, { paddingTop: 30 }]}>
            <View style={styles.headerLeft}>
              <Ionicons name="bag-handle-outline" size={18} color={colors.text} />
              <Text style={[styles.drawerTitle, { color: colors.text }]}>ZICA BELLA</Text>
              <View style={[styles.badge, { backgroundColor: colors.borderLight }]}>
                <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{items.length}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.borderLight }]}>
              <Ionicons name="close" size={20} color={colors.text} style={{ opacity: 0.6 }} />
            </TouchableOpacity>
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="bag-outline" size={40} color={colors.textExtraLight} />
              <Text style={[styles.emptyText, { color: colors.textExtraLight }]}>Your bag is empty</Text>
              <TouchableOpacity onPress={onClose} style={[styles.shopBtn, { borderColor: colors.borderLight }]}>
                <Text style={[styles.shopBtnText, { color: colors.textSecondary }]}>Start Shopping</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                  <CartItem 
                    item={item} 
                    onUpdateQuantity={(id, q) => updateQuantity(id, q)}
                    onRemove={(id) => removeItem(id)}
                    onPress={() => {
                      onClose();
                      navigation.navigate('ProductDetail', { handle: item.handle });
                    }}
                  />
                )}
              />

              <View style={[styles.footer, { backgroundColor: 'transparent', borderTopColor: colors.borderLight }]}>
                <View style={styles.footerInner}>
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: colors.textExtraLight }]}>ESTIMATED TOTAL</Text>
                    <Text style={[styles.totalValue, { color: colors.text }]}>{formatPrice(total())}</Text>
                  </View>
                  
                  <TouchableOpacity style={[styles.checkoutBtn, { backgroundColor: colors.text }]} onPress={onCheckout}>
                    <Text style={[styles.checkoutBtnText, { color: colors.background }]}>CHECKOUT</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
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
    height: '85%',
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44,
    overflow: 'hidden',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  drawerTitle: {
    fontSize: 12,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 10,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  shopBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 99,
    borderWidth: 1,
  },
  shopBtnText: {
    fontSize: 9,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  footer: {
    borderTopWidth: 1,
  },
  footerInner: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '400',
  },
  checkoutBtn: {
    height: 64,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 4,
  },
});
