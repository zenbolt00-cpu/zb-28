import React, { useRef, useState, useMemo, useEffect } from 'react';
import { View, FlatList, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { BlurView } from 'expo-blur';
import { Media } from '../api/types';

const { width } = Dimensions.get('window');

const MediaItem = ({ item, width, height, muted = true, onPress }: { item: Media, width: number, height: number, muted?: boolean, onPress?: (index: number) => void }) => {
  const isVideo = item.mediaContentType === 'VIDEO';
  const videoUrl = isVideo ? item.sources?.[0]?.url ?? null : null;

  const player = useVideoPlayer(videoUrl, (p) => {
    if (!videoUrl) {
      return;
    }

    p.loop = true;
    p.muted = muted;
    p.play();
  });

  React.useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  if (isVideo) {
    return (
      <TouchableOpacity 
        style={[styles.mediaContainer, { width, height }]} 
        activeOpacity={1} 
        onPress={() => onPress?.(0)} // The specific index is handled in renderItem
      >
        <VideoView 
          player={player} 
          style={StyleSheet.absoluteFill} 
          contentFit="cover"
          nativeControls={false}
        />
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.mediaContainer, { width, height }]}>
      <Image 
        source={{ uri: item.image?.url || (item as any).url || (item as any).src }} 
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={300}
      />
    </View>
  );
};

interface Props {
  media: Media[];
  height: number;
  showThumbnails?: boolean;
  muted?: boolean;
  onPress?: (index: number) => void;
  scrollEnabled?: boolean;
  externalActiveIndex?: number;
  onIndexChange?: (index: number) => void;
  loop?: boolean;
}

export default function ImageCarousel({ 
  media, 
  height, 
  showThumbnails = false, 
  muted = true, 
  onPress,
  scrollEnabled = true,
  externalActiveIndex,
  onIndexChange,
  loop = true
}: Props) {
  const [internalActiveIndex, setInternalActiveIndex] = useState(0);
  const isLooping = loop && media.length > 1;

  // If looping, we adjust the data and initial index
  const adjustedMedia = useMemo(() => {
    if (!isLooping) return media;
    return [media[media.length - 1], ...media, media[0]];
  }, [media, isLooping]);

  const activeIndex = externalActiveIndex !== undefined ? externalActiveIndex : internalActiveIndex;
  
  const mainListRef = useRef<FlatList>(null);
  const thumbListRef = useRef<FlatList>(null);
  const didMountRef = useRef(false);
  const previousExternalIndexRef = useRef<number | undefined>(externalActiveIndex);

  // Set initial scroll position if looping
  useEffect(() => {
    if (!adjustedMedia.length) {
      return;
    }

    if (isLooping) {
      setTimeout(() => {
        mainListRef.current?.scrollToIndex({ 
          index: 1, 
          animated: false 
        });
      }, 50);
    }
  }, [isLooping]);

  useEffect(() => {
    if (!adjustedMedia.length) {
      return;
    }

    if (!didMountRef.current) {
      didMountRef.current = true;
      previousExternalIndexRef.current = externalActiveIndex;
      return;
    }

    if (externalActiveIndex !== undefined) {
      const targetIndex = isLooping ? externalActiveIndex + 1 : externalActiveIndex;
      if (externalActiveIndex !== previousExternalIndexRef.current && targetIndex >= 0 && targetIndex < adjustedMedia.length) {
        mainListRef.current?.scrollToIndex({ index: targetIndex, animated: true });
      }
    }

    previousExternalIndexRef.current = externalActiveIndex;
  }, [externalActiveIndex, isLooping, adjustedMedia.length]);

  const scrollToMedia = (index: number) => {
    const targetIndex = isLooping ? index + 1 : index;
    setInternalActiveIndex(index);
    onIndexChange?.(index);
    if (targetIndex >= 0 && targetIndex < adjustedMedia.length) {
      mainListRef.current?.scrollToIndex({ index: targetIndex, animated: true });
    }
    if (index >= 0 && index < media.length) {
      thumbListRef.current?.scrollToIndex({ 
        index, 
        animated: true,
        viewPosition: 0.5 
      });
    }
  };

  const onMomentumScrollEnd = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    let realIndex = index;

    if (isLooping) {
      if (index === 0) {
        realIndex = media.length - 1;
        mainListRef.current?.scrollToIndex({ index: media.length, animated: false });
      } else if (index === adjustedMedia.length - 1) {
        realIndex = 0;
        mainListRef.current?.scrollToIndex({ index: 1, animated: false });
      } else {
        realIndex = index - 1;
      }
    }

    setInternalActiveIndex(realIndex);
    onIndexChange?.(realIndex);
    // Sync thumbnails
    if (realIndex >= 0 && realIndex < media.length) {
      thumbListRef.current?.scrollToIndex({ 
        index: realIndex, 
        animated: true,
        viewPosition: 0.5 
      });
    }
  };

  if (!media || media.length === 0) return null;

  return (
    <View style={[styles.container, { height }]}>
      <FlatList
        ref={mainListRef}
        data={adjustedMedia}
        extraData={activeIndex}
        horizontal
        pagingEnabled
        scrollEnabled={scrollEnabled}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => `media-${index}`}
        onMomentumScrollEnd={onMomentumScrollEnd}
        decelerationRate="fast"
        snapToAlignment="center"
        disableIntervalMomentum={!isLooping}
        renderItem={({ item, index }) => (
          <MediaItem 
            item={item} 
            width={width} 
            height={height} 
            muted={muted} 
            onPress={() => onPress?.(loop ? (index === 0 ? media.length - 1 : index === adjustedMedia.length - 1 ? 0 : index - 1) : index)} 
          />
        )}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        initialNumToRender={Math.min(adjustedMedia.length, 3)}
        windowSize={3}
        removeClippedSubviews
      />

      {showThumbnails && media.length > 1 && (
        <View style={styles.thumbnailContainer}>
          <FlatList
            ref={thumbListRef}
            data={media}
            horizontal
            scrollEnabled={scrollEnabled}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, index) => `thumb-${index}`}
            contentContainerStyle={styles.thumbListContent}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                key={index}
                onPress={() => scrollToMedia(index)}
                style={[
                  styles.thumbnail,
                  { borderColor: activeIndex === index ? '#FFF' : 'rgba(255,255,255,0.1)' }
                ]}
                activeOpacity={0.8}
                disabled={!scrollEnabled}
              >
                <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                <Image 
                  source={{ uri: item.image?.url || (item as any).url || (item as any).src }} 
                  style={styles.thumbnailImage}
                  contentFit="cover"
                />
                {activeIndex !== index && <View style={styles.thumbnailOverlay} />}
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  mediaContainer: {
    overflow: 'hidden',
  },
  thumbnailContainer: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    height: 90,
  },
  thumbListContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  thumbnail: {
    width: 60,
    height: 80,
    borderRadius: 14,
    marginHorizontal: 6,
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});
