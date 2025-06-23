import { renderHook, waitFor } from "@testing-library/react";
import { useNlpModel } from "./useNlpModel";

jest.mock("@xenova/transformers", () => ({
  pipeline: jest.fn(),
}));

const mockPipeline = require("@xenova/transformers")
  .pipeline as jest.MockedFunction<
  typeof import("@xenova/transformers").pipeline
>;

describe("useNlpModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should initialize with correct default state", () => {
    const { result } = renderHook(() => useNlpModel());

    expect(result.current.classifier.current).toBeNull();
    expect(result.current.isModelLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("should successfully load the NLP model", async () => {
    const mockClassifier = jest.fn().mockResolvedValue({
      labels: ["test"],
      scores: [0.9],
    });
    mockPipeline.mockResolvedValueOnce(mockClassifier as any);

    const { result } = renderHook(() => useNlpModel());

    await waitFor(() => {
      expect(result.current.isModelLoading).toBe(false);
    });

    expect(result.current.classifier.current).toBe(mockClassifier);
    expect(result.current.error).toBeNull();
    expect(mockPipeline).toHaveBeenCalledWith(
      "zero-shot-classification",
      "Xenova/nli-deberta-v3-small"
    );
  });

  it("should handle model loading errors gracefully", async () => {
    const mockError = new Error("Failed to load model");
    mockPipeline.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useNlpModel());

    await waitFor(() => {
      expect(result.current.isModelLoading).toBe(false);
    });

    expect(result.current.classifier.current).toBeNull();
    expect(result.current.error).toBe(
      "NLP model failed to load. Using basic commands."
    );
  });

  it("should maintain loading state when model fails to initialize", async () => {
    const mockError = new Error("Network timeout");
    mockPipeline.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useNlpModel());

    expect(result.current.isModelLoading).toBe(true);
    expect(result.current.classifier.current).toBeNull();

    await waitFor(() => {
      expect(result.current.isModelLoading).toBe(false);
    });

    expect(result.current.error).toBe(
      "NLP model failed to load. Using basic commands."
    );
    expect(result.current.classifier.current).toBeNull();
  });

  it("should process a command correctly", async () => {
    const mockClassifier = jest.fn().mockResolvedValue({
      labels: ["LABEL_1"],
      scores: [0.9],
    });
    mockPipeline.mockResolvedValue(mockClassifier as any);

    const { result } = renderHook(() => useNlpModel());

    await waitFor(() => {
      expect(result.current.isModelLoading).toBe(false);
    });

    const processedResult = await result.current.classifier.current(
      "test command",
      ["LABEL_1", "LABEL_2"]
    );

    expect(processedResult).toEqual({
      labels: ["LABEL_1"],
      scores: [0.9],
    });
    expect(mockClassifier).toHaveBeenCalledWith("test command", [
      "LABEL_1",
      "LABEL_2",
    ]);
  });
});
