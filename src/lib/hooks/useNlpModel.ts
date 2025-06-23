import { useEffect, useState, useRef } from "react";
import { pipeline } from "@xenova/transformers";

export interface UseNlpModelReturn {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  classifier: React.RefObject<any>;
  isModelLoading: boolean;
  error: string | null;
}

export function useNlpModel(): UseNlpModelReturn {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const classifier = useRef<any>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPipeline() {
      try {
        console.log("Loading zero-shot classification pipeline...");
        classifier.current = await pipeline(
          "zero-shot-classification",
          "Xenova/nli-deberta-v3-small"
        );
        console.log("Pipeline loaded successfully.");
        setError(null);
      } catch (error) {
        console.error("Failed to load NLP pipeline:", error);
        setError("NLP model failed to load. Using basic commands.");
      } finally {
        setIsModelLoading(false);
      }
    }
    if (typeof window !== "undefined") {
      loadPipeline();
    }
  }, []);

  return { classifier, isModelLoading, error };
}
