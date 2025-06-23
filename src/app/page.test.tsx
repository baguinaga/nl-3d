import { render, screen } from "@testing-library/react";
import Home from "./page";

jest.mock("@xenova/transformers", () => ({
  pipeline: jest.fn().mockResolvedValue({
    __esModule: true,
    default: jest.fn(() => ({})),
  }),
}));

jest.mock("react-use-measure", () => ({
  __esModule: true,
  default: jest.fn(() => [jest.fn(), { width: 0, height: 0 }]),
}));

jest.mock("@react-three/fiber", () => ({
  Canvas: jest.fn(() => null),
}));

jest.mock("@react-three/drei", () => ({
  OrbitControls: jest.fn(() => null),
}));

describe("Home Page", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the input control", async () => {
    render(<Home />);

    const inputElement = await screen.findByPlaceholderText(/Enter command/i);
    expect(inputElement).toBeInTheDocument();
  });
});
