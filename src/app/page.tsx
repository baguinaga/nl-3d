"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import useMeasure from "react-use-measure";
import { ParticleScene, SceneCommand } from "@/components/ParticleScene";
import { InputControl } from "@/components/InputControl";
import { OrbitControls } from "@react-three/drei";

export default function Home() {
  const [ref] = useMeasure();
  const [hasMounted, setHasMounted] = useState(false);
  const [lastProcessedCommand, setLastProcessedCommand] =
    useState<SceneCommand | null>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleProcessInput = (input: string) => {
    let command: SceneCommand | null = null;
    const lower = input.toLowerCase();
    if (lower.includes("more particles")) {
      command = {
        action: "change_particle_count",
        parameters: { direction: "increase", delta: 200 },
      };
    } else if (lower.includes("less particles")) {
      command = {
        action: "change_particle_count",
        parameters: { direction: "decrease", delta: 200 },
      };
    }
    // Add more parsing as needed
    setLastProcessedCommand(command);
  };

  const isReady = hasMounted;

  return (
    <main ref={ref} className='relative h-screen w-screen'>
      <h1 className='absolute top-0 left-0 w-full text-2xl font-bold text-center p-8 z-10 pointer-events-none'>
        NL3D: Natural Language controlled 3D Scene
      </h1>

      {!isReady && (
        <div className='absolute inset-0 flex items-center justify-center bg-black z-20'>
          <div className='animate-spin rounded-full h-32 w-32 border-t-4 border-white border-solid'></div>
        </div>
      )}
      {isReady && (
        <Canvas
          className='fullscreen-canvas'
          gl={{ antialias: true, alpha: true }}
          camera={{
            fov: 45,
            near: 1,
            far: 4000,
            position: [0, 0, 600],
          }}
        >
          <ParticleScene lastProcessedCommand={lastProcessedCommand} />
          <OrbitControls
            dampingFactor={0.25}
            rotateSpeed={0.5}
            zoomSpeed={1}
            minDistance={10}
            maxDistance={1500}
          />
        </Canvas>
      )}
      <div className='absolute inset-0 flex items-center justify-center z-10 pointer-events-none'>
        <InputControl onProcessInput={handleProcessInput} />
      </div>
    </main>
  );
}
