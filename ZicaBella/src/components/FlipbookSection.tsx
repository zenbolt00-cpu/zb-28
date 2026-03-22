import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useColors } from '../constants/colors';
import { useAdminSettings } from '../hooks/useAdminFeatures';
import { Typography } from './Typography';

const { width } = Dimensions.get('window');

interface FlipbookProps {
  imgUrl?: string;
  videoUrl?: string;
  tag?: string;
  title?: string;
  desc?: string;
}

const DEFAULTS = {
  imgUrl: "https://images.unsplash.com/photo-1552346154-21d328109967?q=80&w=1200",
  tag: "Core Manifest",
  title: "Archival Vision",
  desc: "Engineered for those who move without compromise.",
};

export default function FlipbookSection({ imgUrl, videoUrl, tag, title, desc }: FlipbookProps) {
  const colors = useColors();
  const { settings } = useAdminSettings();
  const shopData = settings?.shop || settings || {};

  const resolvedImgUrl = imgUrl || settings?.flipbook?.image;
  const resolvedVideoUrl = videoUrl || settings?.flipbook?.video;

  const displayImg   = resolvedImgUrl   || DEFAULTS.imgUrl;
  const displayTag   = tag      || settings?.flipbook?.tag    || DEFAULTS.tag;
  const displayTitle = title    || settings?.flipbook?.title  || DEFAULTS.title;
  const displayDesc  = desc     || settings?.flipbook?.description   || DEFAULTS.desc;

  const player = useVideoPlayer(resolvedVideoUrl ?? null, (player) => {
    if (!videoUrl) {
      return;
    }

    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tag Section */}
      <View style={styles.tagWrapper}>
        <Typography size={7} color={colors.textLight} weight="600" style={styles.tagText}>{displayTag}</Typography>
        <View style={[styles.tagLine, { backgroundColor: colors.borderLight }]} />
      </View>

      {/* Card Section */}
      <View style={styles.card}>
        <View style={styles.mediaContainer}>
          {resolvedVideoUrl ? (
            <VideoView
              player={player}
              style={StyleSheet.absoluteFill}
              nativeControls={false}
              contentFit="cover"
            />
          ) : (
            <Image
              source={{ uri: displayImg }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={600}
            />
          )}
          {/* Subtle dark overlay for text legibility */}
          <View style={styles.overlay} />
        </View>

        <View style={styles.textContent}>
          <Typography heading size={12} color="#FFFFFF" weight="bold" style={styles.cardTitle}>{displayTitle}</Typography>
          <View style={styles.accentLine} />
          <Typography size={7} color="rgba(255,255,255,0.7)" weight="300" style={styles.cardDesc}>{displayDesc}</Typography>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  tagWrapper: {
    alignItems: 'center',
    marginBottom: 32,
  },
  tagText: {
    fontSize: 7,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 8,
  },
  tagLine: {
    width: 20,
    height: 1,
    marginTop: 10,
  },
  card: {
    width: width * 0.85,
    maxWidth: 360,
    aspectRatio: 3 / 4.2,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  mediaContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)', // Subtle darkening
  },
  textContent: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  accentLine: {
    width: 20,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 12,
  },
  cardDesc: {
    fontSize: 7,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
    maxWidth: 180,
    lineHeight: 12,
  },
});
