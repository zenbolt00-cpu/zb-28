import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useColors } from '../constants/colors';
import { formatPrice } from '../utils/formatPrice';
import QuantityControl from './QuantityControl';
import { haptics } from '../utils/haptics';

interface Props {
  item: {
    id: string;
    handle: string;
    title: string;
    price: string;
    image: string;
    size: string | null;
    quantity: number;
  };
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onPress: () => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove, onPress }: Props) {
  const colors = useColors();

  const handleRemove = useCallback(() => {
    haptics.buttonTap();
    onRemove(item.id);
  }, [item.id, onRemove]);

  const renderRightActions = useCallback(() => {
    return (
      <TouchableOpacity
        style={[styles.deleteButton, { backgroundColor: colors.error }]}
        onPress={handleRemove}
        activeOpacity={0.9}
      >
        <Ionicons name="trash-outline" size={18} color={colors.background} />
      </TouchableOpacity>
    );
  }, [colors.background, colors.error, handleRemove]);

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background === '#FFFFFF' ? '#FFFFFF' : colors.surface,
            borderColor: colors.borderLight,
          },
        ]}
      >
        {/* Product Image */}
        <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
          <View style={[styles.imageContainer, { backgroundColor: colors.surface }]}>
            <Image source={{ uri: item.image }} style={styles.image} contentFit="cover" />
          </View>
        </TouchableOpacity>

        {/* Details */}
        <View style={styles.details}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          {item.size && (
            <Text style={[styles.size, { color: colors.textExtraLight }]}>
              {item.size}
            </Text>
          )}
          <Text style={[styles.price, { color: colors.textSecondary }]}>
            {formatPrice(parseFloat(item.price))}
          </Text>
        </View>

        {/* Quantity Stepper */}
        <View style={styles.actions}>
          <QuantityControl quantity={item.quantity} onUpdate={(qty) => onUpdateQuantity(item.id, qty)} />
        </View>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  details: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  title: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  size: {
    fontSize: 8,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  price: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  actions: {
    justifyContent: 'center',
  },
  deleteButton: {
    width: 72,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    marginLeft: 8,
    marginRight: 0,
  },
});
