import { renderHook, act } from "@testing-library/react";
import { useCommandProcessor } from "./useCommandProcessor";
import { parseColorAndValue } from "../utils/color";
import { PARTICLE_LABELS } from "../constants/particleLabels";

// Mock the color utility
jest.mock("../utils/color", () => ({
  parseColorAndValue: jest.fn(),
}));

const mockParseColorAndValue = parseColorAndValue as jest.MockedFunction<
  typeof parseColorAndValue
>;

describe("useCommandProcessor", () => {
  let mockClassifier: any;
  let mockClassifierRef: React.RefObject<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods to avoid noise in test output
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    // Create mock classifier
    mockClassifier = jest.fn();
    mockClassifierRef = { current: mockClassifier };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Initial state", () => {
    it("should initialize with null command and error", () => {
      const { result } = renderHook(() =>
        useCommandProcessor({
          classifier: mockClassifierRef,
          isModelLoading: false,
        })
      );

      expect(result.current.command).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe("NLP-driven commands (high confidence)", () => {
    it("should process INCREASE_PARTICLE_COUNT command", async () => {
      mockClassifier.mockResolvedValueOnce({
        labels: ["INCREASE_PARTICLE_COUNT"],
        scores: [0.9],
      });

      const { result } = renderHook(() =>
        useCommandProcessor({
          classifier: mockClassifierRef,
          isModelLoading: false,
        })
      );

      await act(async () => {
        await result.current.processInput("make more particles");
      });

      expect(result.current.command).toEqual({
        action: "change_particle_count",
        parameters: { direction: "increase", delta: 300 },
      });
      expect(mockClassifier).toHaveBeenCalledWith(
        "make more particles",
        PARTICLE_LABELS,
        { multi_label: false }
      );
    });

    it("should process DECREASE_PARTICLE_COUNT command", async () => {
      mockClassifier.mockResolvedValueOnce({
        labels: ["DECREASE_PARTICLE_COUNT"],
        scores: [0.8],
      });

      const { result } = renderHook(() =>
        useCommandProcessor({
          classifier: mockClassifierRef,
          isModelLoading: false,
        })
      );

      await act(async () => {
        await result.current.processInput("reduce particles");
      });

      expect(result.current.command).toEqual({
        action: "change_particle_count",
        parameters: { direction: "decrease", delta: 300 },
      });
    });

    it("should process SET_PARTICLE_COUNT command with numeric value", async () => {
      mockClassifier.mockResolvedValueOnce({
        labels: ["SET_PARTICLE_COUNT"],
        scores: [0.85],
      });
      mockParseColorAndValue.mockReturnValueOnce({ value: 500 });

      const { result } = renderHook(() =>
        useCommandProcessor({
          classifier: mockClassifierRef,
          isModelLoading: false,
        })
      );

      await act(async () => {
        await result.current.processInput("set particle count to 500");
      });

      expect(result.current.command).toEqual({
        action: "change_particle_count",
        parameters: { value: 500 },
      });
      expect(mockParseColorAndValue).toHaveBeenCalledWith(
        "set particle count to 500",
        "set particle count to"
      );
    });

    it("should process SET_PARTICLE_COLOR command", async () => {
      mockClassifier.mockResolvedValueOnce({
        labels: ["SET_PARTICLE_COLOR"],
        scores: [0.7],
      });
      mockParseColorAndValue.mockReturnValueOnce({ colorHex: 0x0000ff });

      const { result } = renderHook(() =>
        useCommandProcessor({
          classifier: mockClassifierRef,
          isModelLoading: false,
        })
      );

      await act(async () => {
        await result.current.processInput("set particle color to blue");
      });

      expect(result.current.command).toEqual({
        action: "set_color",
        parameters: { target: "particles", value: 0x0000ff },
      });
      expect(mockParseColorAndValue).toHaveBeenCalledWith(
        "set particle color to blue",
        "set particle color to"
      );
    });

    it("should process SET_LINE_COLOR command", async () => {
      mockClassifier.mockResolvedValueOnce({
        labels: ["SET_LINE_COLOR"],
        scores: [0.75],
      });
      mockParseColorAndValue.mockReturnValueOnce({ colorHex: 0xff0000 });

      const { result } = renderHook(() =>
        useCommandProcessor({
          classifier: mockClassifierRef,
          isModelLoading: false,
        })
      );

      await act(async () => {
        await result.current.processInput("set line color to red");
      });

      expect(result.current.command).toEqual({
        action: "set_color",
        parameters: { target: "segments", value: 0xff0000 },
      });
    });

    it("should process SET_BACKGROUND_COLOR command", async () => {
      mockClassifier.mockResolvedValueOnce({
        labels: ["SET_BACKGROUND_COLOR"],
        scores: [0.82],
      });
      mockParseColorAndValue.mockReturnValueOnce({ colorHex: 0x00ff00 });

      const { result } = renderHook(() =>
        useCommandProcessor({
          classifier: mockClassifierRef,
          isModelLoading: false,
        })
      );

      await act(async () => {
        await result.current.processInput("set background color to green");
      });

      expect(result.current.command).toEqual({
        action: "set_color",
        parameters: { target: "background", value: 0x00ff00 },
      });
    });
  });

  describe("Low confidence and fallback logic", () => {
    it("should fall back to increase particles for low confidence", async () => {
      mockClassifier.mockResolvedValueOnce({
        labels: ["INCREASE_PARTICLE_COUNT"],
        scores: [0.3], // Below 0.45 threshold
      });

      const { result } = renderHook(() =>
        useCommandProcessor({
          classifier: mockClassifierRef,
          isModelLoading: false,
        })
      );

      await act(async () => {
        await result.current.processInput("more particles");
      });

      expect(result.current.command).toEqual({
        action: "change_particle_count",
        parameters: { direction: "increase", delta: 200 },
      });
    });

    it("should fall back to decrease particles for recognized pattern", async () => {
      mockClassifier.mockResolvedValueOnce({
        labels: ["DECREASE_PARTICLE_COUNT"],
        scores: [0.2], // Below threshold
      });

      const { result } = renderHook(() =>
        useCommandProcessor({
          classifier: mockClassifierRef,
          isModelLoading: false,
        })
      );

      await act(async () => {
        await result.current.processInput("less particles");
      });

      expect(result.current.command).toEqual({
        action: "change_particle_count",
        parameters: { direction: "decrease", delta: 200 },
      });
    });

    it("should return unknown command for unrecognized input", async () => {
      mockClassifier.mockResolvedValueOnce({
        labels: ["SOME_UNKNOWN_LABEL"],
        scores: [0.1],
      });

      const { result } = renderHook(() =>
        useCommandProcessor({
          classifier: mockClassifierRef,
          isModelLoading: false,
        })
      );

      await act(async () => {
        await result.current.processInput("completely random input");
      });

      expect(result.current.command).toEqual({
        action: "unknown",
        parameters: { value: "completely random input" },
      });
    });
  });

  describe("Error handling", () => {
    it("should handle NLP processing errors gracefully", async () => {
      mockClassifier.mockRejectedValueOnce(new Error("NLP processing failed"));

      const { result } = renderHook(() =>
        useCommandProcessor({
          classifier: mockClassifierRef,
          isModelLoading: false,
        })
      );

      await act(async () => {
        await result.current.processInput("test input");
      });

      expect(result.current.error).toBe("Error processing command via NLP.");
      // Should fall back to unknown command
      expect(result.current.command).toEqual({
        action: "unknown",
        parameters: { value: "test input" },
      });
    });

    it("should not process when model is loading", async () => {
      const { result } = renderHook(() =>
        useCommandProcessor({
          classifier: mockClassifierRef,
          isModelLoading: true, // Model is loading
        })
      );

      await act(async () => {
        await result.current.processInput("more particles");
      });

      expect(mockClassifier).not.toHaveBeenCalled();
      // Should fall back to pattern matching
      expect(result.current.command).toEqual({
        action: "change_particle_count",
        parameters: { direction: "increase", delta: 200 },
      });
    });

    it("should not process when classifier is null", async () => {
      const nullClassifierRef = { current: null };

      const { result } = renderHook(() =>
        useCommandProcessor({
          classifier: nullClassifierRef,
          isModelLoading: false,
        })
      );

      await act(async () => {
        await result.current.processInput("more particles");
      });

      // Should fall back to pattern matching
      expect(result.current.command).toEqual({
        action: "change_particle_count",
        parameters: { direction: "increase", delta: 200 },
      });
    });
  });

  describe("Input handling", () => {
    it("should clear command for empty input", async () => {
      const { result } = renderHook(() =>
        useCommandProcessor({
          classifier: mockClassifierRef,
          isModelLoading: false,
        })
      );

      await act(async () => {
        await result.current.processInput("");
      });

      expect(result.current.command).toBeNull();
      expect(mockClassifier).not.toHaveBeenCalled();
    });

    it("should clear command for whitespace-only input", async () => {
      const { result } = renderHook(() =>
        useCommandProcessor({
          classifier: mockClassifierRef,
          isModelLoading: false,
        })
      );

      await act(async () => {
        await result.current.processInput("   \n\t  ");
      });

      expect(result.current.command).toBeNull();
      expect(mockClassifier).not.toHaveBeenCalled();
    });
  });

  describe("Color parsing integration", () => {
    it("should skip color command when parseColorAndValue returns empty", async () => {
      mockClassifier.mockResolvedValueOnce({
        labels: ["SET_PARTICLE_COLOR"],
        scores: [0.9],
      });
      mockParseColorAndValue.mockReturnValueOnce({}); // No color parsed

      const { result } = renderHook(() =>
        useCommandProcessor({
          classifier: mockClassifierRef,
          isModelLoading: false,
        })
      );

      await act(async () => {
        await result.current.processInput("set particle color to invalid");
      });

      // Should fall back to unknown since color parsing failed
      expect(result.current.command).toEqual({
        action: "unknown",
        parameters: { value: "set particle color to invalid" },
      });
    });
  });
});
