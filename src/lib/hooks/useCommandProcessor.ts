import { useState, useCallback } from "react";
import { SceneCommand } from "@/lib/types/scene";
import { parseColorAndValue } from "@/lib/utils/color";
import { PARTICLE_LABELS } from "@/lib/constants/particleLabels";

export interface UseCommandProcessorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  classifier: React.RefObject<any>;
  isModelLoading: boolean;
}

export interface UseCommandProcessorReturn {
  command: SceneCommand | null;
  error: string | null;
  processInput: (inputString: string) => Promise<void>;
}

export function useCommandProcessor({
  classifier,
  isModelLoading,
}: UseCommandProcessorProps): UseCommandProcessorReturn {
  const [command, setCommand] = useState<SceneCommand | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);

  const handleProcessInput = useCallback(
    async (inputString: string) => {
      if (!inputString.trim()) {
        setCommand(null);
        return;
      }

      setProcessingError(null);
      let command: SceneCommand | null = null;
      let topScore = 0;

      if (classifier.current && !isModelLoading) {
        try {
          const nlpOutput = await (classifier.current as any)(
            inputString,
            PARTICLE_LABELS,
            { multi_label: false }
          );
          console.log("RAW NLP_OUTPUT:", JSON.stringify(nlpOutput, null, 2));
          if (nlpOutput && nlpOutput.labels && nlpOutput.labels.length > 0) {
            const topLabel = nlpOutput.labels[0];
            topScore = nlpOutput.scores[0];
            console.log(`TOP_RESULT: Label: ${topLabel}, Score: ${topScore}`);
            if (topScore >= 0.45) {
              switch (topLabel) {
                case "INCREASE_PARTICLE_COUNT":
                  command = {
                    action: "change_particle_count",
                    parameters: { direction: "increase", delta: 300 },
                  };
                  break;
                case "DECREASE_PARTICLE_COUNT":
                  command = {
                    action: "change_particle_count",
                    parameters: { direction: "decrease", delta: 300 },
                  };
                  break;
                case "SET_PARTICLE_COUNT":
                  const countData = parseColorAndValue(
                    inputString,
                    "set particle count to"
                  );
                  if (countData.value !== undefined) {
                    command = {
                      action: "change_particle_count",
                      parameters: { value: countData.value },
                    };
                  }
                  break;
                case "SET_PARTICLE_COLOR":
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
                  }
                  break;
                case "SET_LINE_COLOR":
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
                  }
                  break;
                case "SET_BACKGROUND_COLOR":
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
                  }
                  break;
              }
            }
          }
        } catch (error) {
          console.error("Error during NLP processing:", error);
          setProcessingError("Error processing command via NLP.");
        }
      }

      if (!command) {
        // Fallback for low confidence or errors
        const lowerInputString = inputString.toLowerCase();
        if (lowerInputString.includes("more particles")) {
          command = {
            action: "change_particle_count",
            parameters: { direction: "increase", delta: 200 },
          };
        } else if (lowerInputString.includes("less particles")) {
          command = {
            action: "change_particle_count",
            parameters: { direction: "decrease", delta: 200 },
          };
        } else {
          command = { action: "unknown", parameters: { value: inputString } };
        }
      }
      console.log("FINAL_COMMAND:", command);

      setCommand(command);
    },
    [classifier, isModelLoading]
  );

  return {
    command: command,
    error: processingError,
    processInput: handleProcessInput,
  };
}
