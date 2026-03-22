import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  useAnimatedScrollHandler, 
  interpolate, 
  Extrapolation 
} from 'react-native-reanimated';
import { FlatCollection } from '../api/types';
import { Typography } from './Typography';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.72;
const CARD_HEIGHT = CARD_WIDTH * 1.45;
const OVERLAP_FACTOR = 0.30; // Extreme overlap: 70% of card width is hidden
const ITEM_WIDTH = CARD_WIDTH * OVERLAP_FACTOR;

interface Props {
  collections: FlatCollection[];
}

const REPEAT_COUNT = 30;
const AnimatedFlatList = Animated.FlatList as any;

export default function CollectionCarousel({ collections }: Props) {
  const navigation = useNavigation<any>();
  const scrollX = useSharedValue(0);

  const loopData = useMemo(() => {
    if (!collections) return [];
    return Array(REPEAT_COUNT).fill(collections).flat();
  }, [collections]);

  const initialIndex = collections ? Math.floor(REPEAT_COUNT / 2) * collections.length : 0;

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  const renderItem = useCallback(({ item, index }: { item: FlatCollection; index: number }) => {
    return (
      <AnimatedCard 
        item={item} 
        index={index} 
        scrollX={scrollX} 
        onPress={() => navigation.navigate('Collection', { handle: item.handle })}
      />
    );
  }, []);

  // Use CellRendererComponent to force Z-indexing at the list level
  const CellRendererComponent = useCallback(({ children, index, style, ...props }: any) => {
    const animatedStyle = useAnimatedStyle(() => {
      const input = [
        (index - 1) * ITEM_WIDTH,
        index * ITEM_WIDTH,
        (index + 1) * ITEM_WIDTH,
      ];
      const zIndex = interpolate(
        scrollX.value,
        input,
        [1, 10000, 1],
        Extrapolation.CLAMP
      );
      return {
        zIndex: Math.floor(zIndex),
        elevation: Math.floor(zIndex / 100), 
      } as any;
    });

    return (
      <Animated.View {...props} style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    );
  }, [scrollX]);

  if (!collections || collections.length === 0) return null;

  return (
    <View style={styles.container}>
      <AnimatedFlatList
        id="CollectionFlatList"
        data={loopData}
        renderItem={renderItem}
        CellRendererComponent={CellRendererComponent}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        contentContainerStyle={{
          paddingHorizontal: (width - ITEM_WIDTH) / 2,
          paddingVertical: 45,
        }}
        getItemLayout={(_: any, index: number) => ({
          length: ITEM_WIDTH,
          offset: ITEM_WIDTH * index,
          index,
        })}
        initialScrollIndex={initialIndex}
        keyExtractor={(_: any, i: number) => i.toString()}
      />
    </View>
  );
}

function AnimatedCard({ item, index, scrollX, onPress }: any) {
  const animatedStyle = useAnimatedStyle(() => {
    const input = [
      (index - 1) * ITEM_WIDTH,
      index * ITEM_WIDTH,
      (index + 1) * ITEM_WIDTH,
    ];

    const scale = interpolate(
      scrollX.value,
      input,
      [0.65, 1, 0.65], // Dramatically smaller side cards
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      input,
      [0.7, 1, 0.7],
      Extrapolation.CLAMP
    );

    const rotateY = interpolate(
      scrollX.value,
      input,
      [20, 0, -20],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [
        { perspective: 1200 },
        { scale },
        { rotateY: `${rotateY}deg` as any }
      ],
    } as any;
  });

  const overlayStyle = useAnimatedStyle(() => {
    const input = [
      (index - 1) * ITEM_WIDTH,
      index * ITEM_WIDTH,
      (index + 1) * ITEM_WIDTH,
    ];
    const opacity = interpolate(
      scrollX.value,
      input,
      [0.45, 0, 0.45],
      Extrapolation.CLAMP
    );
    return { opacity } as any;
  });

  return (
    <Animated.View style={[styles.cardContainer, animatedStyle]}>
      <TouchableOpacity 
        activeOpacity={0.95} 
        onPress={onPress} 
        style={styles.card}
      >
        <Image
          source={{ uri: item.image || undefined }}
          style={styles.image}
          contentFit="cover"
          transition={400}
        />
        <Animated.View style={[styles.depthOverlay, overlayStyle]} />
        
        {/* Unique Glass Border Overlay */}
        <View style={styles.glassBorder} />

        <View style={styles.titleContainer}>
          <Typography 
            heading 
            size={8.5} 
            color="#FFFFFF" 
            weight="700" 
            style={styles.title}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {item.title?.toUpperCase()}
          </Typography>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  cardContainer: {
    width: ITEM_WIDTH,
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#111',
    borderRadius: 36,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  glassBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    // Inner glow effect via a second border or shadow is hard in RN, 
    // but semi-transparent white border on dark background creates a glass effect.
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  depthOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  titleContainer: {
    position: 'absolute',
    bottom: 32,
    left: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
