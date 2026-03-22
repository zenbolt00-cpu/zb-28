import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useColors } from '../constants/colors';

const { width, height } = Dimensions.get('window');

interface Props {
  source: string;
}

export default function HeroVideo({ source }: Props) {
  const colors = useColors();
  const player = useVideoPlayer(source, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={[styles.video, { backgroundColor: colors.background }]}
        nativeControls={false}
        contentFit="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width,
    height,
  },
  video: {
    width: '100%',
    height: '100%',
  },
});
