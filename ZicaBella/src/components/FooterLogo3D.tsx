import React, { Suspense, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { Center, useGLTF } from '@react-three/drei/native';
import { Asset } from 'expo-asset';
import { Image } from 'expo-image';
import type { Group } from 'three';

const LOGO_SVG = require('../assets/ZB-logo-silver.svg');
const MODEL = require('../assets/Zicabella-silver-logo.glb');

/** Exact parity with Next.js StorefrontFooter (w-14 h-14 = 56px) */
const WRAP_W = 56;
const WRAP_H = 56;

function LogoMesh({ uri }: { uri: string }) {
  const gltf = useGLTF(uri);
  const group = useRef<Group>(null);

  useFrame((state, dt) => {
    if (group.current) {
      // Smooth auto-rotate matching web's model-viewer
      group.current.rotation.y += dt * 0.4;
      // Subtle float
      group.current.position.y = Math.sin(state.clock.elapsedTime) * 0.05;
    }
  });

  return (
    <Center top>
      <group ref={group}>
        <primitive object={gltf.scene} scale={1.25} />
      </group>
    </Center>
  );
}

function Scene({ uri }: { uri: string }) {
  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} />
      <directionalLight position={[-10, 5, -5]} intensity={0.8} color="#c8d4ee" />
      <pointLight position={[0, 2, 5]} intensity={0.5} />
      <Suspense fallback={null}>
        <LogoMesh uri={uri} />
      </Suspense>
    </>
  );
}

class LogoErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { err: boolean }
> {
  state = { err: false };

  static getDerivedStateFromError() {
    return { err: true };
  }

  render() {
    if (this.state.err) return this.props.fallback;
    return this.props.children;
  }
}

function SvgMark() {
  return (
    <View style={styles.wrap}>
      <Image source={LOGO_SVG} style={styles.img} contentFit="contain" accessibilityLabel="ZICA BELLA" />
    </View>
  );
}

export default function FooterLogo3D() {
  const [uri, setUri] = useState<string | null>(null);
  const [useSvg, setUseSvg] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const asset = Asset.fromModule(MODEL);
        await asset.downloadAsync();
        const u = asset.localUri ?? asset.uri;
        if (!cancelled && u) setUri(u);
        else if (!cancelled) setUseSvg(true);
      } catch {
        if (!cancelled) setUseSvg(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (useSvg || !uri) {
    if (!useSvg && !uri) {
      return (
        <View style={[styles.wrap, styles.center]}>
          <ActivityIndicator color="rgba(255,255,255,0.35)" size="small" />
        </View>
      );
    }
    return <SvgMark />;
  }

  return (
    <LogoErrorBoundary fallback={<SvgMark />}>
      <View style={styles.wrap}>
        <Canvas
          camera={{ position: [0, 0, 4.5], fov: 28 }}
          gl={{ alpha: true, antialias: true, logarithmicDepthBuffer: true }}
          style={styles.canvas}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
        >
          <Scene uri={uri} />
        </Canvas>
      </View>
    </LogoErrorBoundary>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: WRAP_W,
    height: WRAP_H,
    alignSelf: 'center',
    marginBottom: 12, // Exact mb-3 parity
  },
  canvas: {
    flex: 1,
  },
  img: {
    width: '100%',
    height: '100%',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

