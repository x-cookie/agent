'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Preload GLB
useGLTF.preload('/3d-model.glb');

function Model() {
  const { scene } = useGLTF('/3d-model.glb');
  const groupRef = useRef<THREE.Group>(null);

  // Float up-down animation
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.y = -0.5 + Math.sin(clock.elapsedTime * 0.8) * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={[1.5, 1.5, 1.5]} position={[0, -0.5, 0]} />
    </group>
  );
}

function LoadingFallback() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(139, 92, 246, 0.02))',
      borderRadius: '12px',
      color: 'var(--t3)',
      fontSize: '11px',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <i className="ti ti-loader-2" style={{ fontSize: '20px', animation: 'spin 2s linear infinite', color: 'var(--purple)' }} />
      <span>Loading…</span>
    </div>
  );
}

interface ChatBot3DModelProps {
  size?: number;
}

export function ChatBot3DModel({ size = 240 }: ChatBot3DModelProps = {}) {
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '12px',
      overflow: 'hidden',
      margin: '0 auto'
    }}>
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          camera={{ position: [0, 0.8, 2.5], fov: 45 }}
          style={{ width: '100%', height: '100%', background: '#0a0a0f' }}
        >
          <ambientLight intensity={1.1} color="#ffffff" />
          <directionalLight position={[2, 2, 2]} intensity={0.9} color="#ffffff" />
          <directionalLight position={[-2, 1, 2]} intensity={0.5} color="#ffffff" />
          <pointLight position={[1, 1, 1]} intensity={0.7} color="#a78bfa" />

          <Model />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={false}
            rotateSpeed={0}
          />
        </Canvas>
      </Suspense>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
