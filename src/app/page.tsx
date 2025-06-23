"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import useMeasure from "react-use-measure";
import {
  ParticleScene,
  SceneCommand,
} from "@/components/ParticleScene/ParticleScene";
import { InputControl } from "@/components/InputControl/InputControl";
import { OrbitControls } from "@react-three/drei";

import { pipeline } from "@xenova/transformers";
import colorNameMap from "color-name";

// Helper to convert RGB from color-name to hex number
const rgbToHex = (rgb: [number, number, number]): number => {
  return (rgb[0] << 16) + (rgb[1] << 8) + rgb[2];
};

const CANDIDATE_LABELS = [
  "increase particle count",
  "decrease particle count",
  "set particle count",
  "set particle color",
  "set line color",
  "set background color",
];

export default function Home() {
  const [ref] = useMeasure();
  const [hasMounted, setHasMounted] = useState(false);
  const [lastProcessedCommand, setLastProcessedCommand] =
    useState<SceneCommand | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [nlpError, setNlpError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const classifier = useRef<any>(null);

  useEffect(() => {
    async function loadPipeline() {
      try {
        console.log("Loading zero-shot classification pipeline...");
        classifier.current = await pipeline(
          "zero-shot-classification",
          "Xenova/nli-deberta-v3-small"
        );
        console.log("Pipeline loaded successfully.");
        setNlpError(null);
      } catch (error) {
        console.error("Failed to load NLP pipeline:", error);
        setNlpError("NLP model failed to load. Using basic commands.");
      } finally {
        setIsModelLoading(false);
      }
    }
    if (typeof window !== "undefined") {
      loadPipeline();
    }
  }, []);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const parseColorAndValue = (
    input: string,
    actionTriggerPhrase: string
  ): { colorHex?: number; value?: number } => {
    const lowerInput = input.toLowerCase();
    const phraseToSearch = actionTriggerPhrase.toLowerCase().trim();
    const contentAfterPhrase = lowerInput.split(phraseToSearch)[1]?.trim();

    if (contentAfterPhrase) {
      const colorMap = colorNameMap as Record<string, [number, number, number]>;
      if (colorMap[contentAfterPhrase]) {
        return { colorHex: rgbToHex(colorMap[contentAfterPhrase]) };
      }
      const numericValue = parseInt(contentAfterPhrase, 10);
      if (!isNaN(numericValue)) {
        if (phraseToSearch.includes("color")) {
          if (
            /^0x[0-9a-fA-F]+$/.test(contentAfterPhrase) ||
            (/^[0-9a-fA-F]{3,6}$/.test(contentAfterPhrase) &&
              !contentAfterPhrase.startsWith("0x"))
          ) {
            const hexString = contentAfterPhrase.startsWith("0x")
              ? contentAfterPhrase.substring(2)
              : contentAfterPhrase;
            const hexVal = parseInt(hexString, 16);
            if (!isNaN(hexVal)) return { colorHex: hexVal };
          } else {
            console.warn(
              `Could not parse "${contentAfterPhrase}" as a direct hex color for "${phraseToSearch}"`
            );
          }
        } else {
          return { value: numericValue };
        }
      }
    }
    console.warn(
      `Could not parse value/color from "${input}" for action phrase "${actionTriggerPhrase}"`
    );
    return {};
  };

  const handleProcessInput = useCallback(
    async (inputString: string) => {
      if (!inputString.trim()) {
        setLastProcessedCommand(null);
        return;
      }

      console.log("Processing input:", inputString);
      setNlpError(null);
      let command: SceneCommand | null = null;
      let topScore = 0;

      if (classifier.current && !isModelLoading) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const nlpOutput = await (classifier.current as any)(
            inputString,
            CANDIDATE_LABELS,
            {
              multi_label: false,
            }
          );
          console.log("NLP Output:", nlpOutput);

          if (nlpOutput && nlpOutput.labels && nlpOutput.labels.length > 0) {
            const topLabel = nlpOutput.labels[0];
            topScore = nlpOutput.scores[0];
            console.log(`Top label: ${topLabel}, Score: ${topScore}`);

            if (topScore < 0.6) {
              console.warn(
                `Low confidence score (${topScore}) for NLP label: ${topLabel}.`
              );
            } else {
              switch (topLabel) {
                case "increase particle count":
                  command = {
                    action: "change_particle_count",
                    parameters: { direction: "increase", delta: 300 },
                  };
                  break;
                case "decrease particle count":
                  command = {
                    action: "change_particle_count",
                    parameters: { direction: "decrease", delta: 300 },
                  };
                  break;
                case "set particle count":
                  const countData = parseColorAndValue(
                    inputString,
                    "set particle count to"
                  );
                  if (countData.value !== undefined) {
                    command = {
                      action: "change_particle_count",
                      parameters: { value: countData.value },
                    };
                  } else {
                    command = {
                      action: "unknown",
                      parameters: {
                        value: `Parse fail: Count for ${inputString}`,
                      },
                    };
                  }
                  break;
                case "set particle color":
                  const pColorData = parseColorAndValue(
                    inputString,
                    "set particle color to"
                  );
                  if (pColorData.colorHex !== undefined) {
                    command = {
                      action: "set_color",
                      parameters: {
                        target: "particles",
                        value: pColorData.colorHex,
                      },
                    };
                  } else {
                    command = {
                      action: "unknown",
                      parameters: {
                        value: `Parse fail: Particle color for ${inputString}`,
                      },
                    };
                  }
                  break;
                case "set line color":
                  const lColorData = parseColorAndValue(
                    inputString,
                    "set line color to"
                  );
                  if (lColorData.colorHex !== undefined) {
                    command = {
                      action: "set_color",
                      parameters: {
                        target: "segments",
                        value: lColorData.colorHex,
                      },
                    };
                  } else {
                    command = {
                      action: "unknown",
                      parameters: {
                        value: `Parse fail: Line color for ${inputString}`,
                      },
                    };
                  }
                  break;
                case "set background color":
                  const bColorData = parseColorAndValue(
                    inputString,
                    "set background color to"
                  );
                  if (bColorData.colorHex !== undefined) {
                    command = {
                      action: "set_color",
                      parameters: {
                        target: "background",
                        value: bColorData.colorHex,
                      },
                    };
                  } else {
                    command = {
                      action: "unknown",
                      parameters: {
                        value: `Parse fail: Background color for ${inputString}`,
                      },
                    };
                  }
                  break;
                default:
                  command = {
                    action: "unknown",
                    parameters: { value: inputString },
                  };
              }
            }
          }
        } catch (error) {
          console.error("Error during NLP processing:", error);
          setNlpError("Error processing command via NLP.");
        }
      } else if (isModelLoading) {
        setNlpError("NLP model is still loading, please wait...");
      }

      if (!command || (command.action === "unknown" && topScore < 0.6)) {
        console.log(
          "NLP result not confident or unavailable, using fallback string matching..."
        );
        const lowerInputString = inputString.toLowerCase();
        let fallbackCommand: SceneCommand | null = null;

        if (lowerInputString.includes("more particles")) {
          fallbackCommand = {
            action: "change_particle_count",
            parameters: { direction: "increase", delta: 200 },
          };
        } else if (lowerInputString.includes("less particles")) {
          fallbackCommand = {
            action: "change_particle_count",
            parameters: { direction: "decrease", delta: 200 },
          };
        }

        if (fallbackCommand) {
          command = fallbackCommand;
        } else if (!command) {
          command = { action: "unknown", parameters: { value: inputString } };
        }
      }

      console.log("Final command to be set:", command);
      setLastProcessedCommand(command);
    },
    [classifier, isModelLoading]
  );

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
      {nlpError && (
        <div className='absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-red-600 bg-opacity-90 p-3 rounded-md text-white text-sm shadow-lg'>
          {nlpError}
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
