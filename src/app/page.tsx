"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import useMeasure from "react-use-measure";
import { ParticleScene } from "@/components/ParticleScene/ParticleScene";
import { useCommandProcessor } from "@/lib/hooks/useCommandProcessor";
import { useNlpModel } from "@/lib/hooks/useNlpModel";
import { InputControl } from "@/components/InputControl/InputControl";

export default function Home() {
  const [ref] = useMeasure();
  const [hasMounted, setHasMounted] = useState(false);

  const { classifier, isModelLoading, error: modelError } = useNlpModel();

  const {
    command: lastProcessedCommand,
    error: processingError,
    processInput: handleProcessInput,
  } = useCommandProcessor({ classifier, isModelLoading });

  const displayError = modelError || processingError;

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const isReady = hasMounted;

  return (
    <main ref={ref} className='relative h-screen w-screen'>
      <h1 className='absolute top-0 left-0 w-full text-2xl font-bold text-center p-8 z-10 pointer-events-none'>
        NL3D: Natural Language controlled 3D Scene
      </h1>

      {isModelLoading && (
        <div className='absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-gray-700 bg-opacity-80 p-3 rounded-md text-white text-sm shadow-lg'>
          Initializing language model...
        </div>
      )}
      {displayError && (
        <div className='absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-red-600 bg-opacity-90 p-3 rounded-md text-white text-sm shadow-lg'>
          {displayError}
        </div>
      )}

      {!isReady && !isModelLoading && (
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
        <div className='pointer-events-auto'>
          <InputControl onProcessInput={handleProcessInput} />
        </div>
      </div>
    </main>
  );
}
