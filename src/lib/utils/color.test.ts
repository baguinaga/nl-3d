import { rgbToInt, parseColorAndValue } from "./color";

describe("rgbToInt", () => {
  it("should convert rgb to hex", () => {
    expect(rgbToInt([255, 0, 0])).toEqual(16711680);
    expect(rgbToInt([0, 255, 0])).toEqual(65280);
    expect(rgbToInt([0, 0, 255])).toEqual(255);
  });
});

describe("parseColorAndValue", () => {
  it("parses named colors", () => {
    const res = parseColorAndValue(
      "set background color to red",
      "set background color to"
    );
    expect(res).toEqual({ colorHex: 16711680 });
  });

  it("parses hex values with 0x prefix", () => {
    const res = parseColorAndValue(
      "set line color to 0x00ff00",
      "set line color to"
    );
    expect(res).toEqual({ colorHex: 65280 });
  });

  it("parses hex values with # prefix", () => {
    const res = parseColorAndValue(
      "set line color to #0000ff",
      "set line color to"
    );
    expect(res).toEqual({ colorHex: 255 });
  });

  it("parses numeric values", () => {
    const res = parseColorAndValue(
      "set particle count to 1234",
      "set particle count to"
    );
    expect(res).toEqual({ value: 1234 });
  });

  it("returns empty object if no value or color is found", () => {
    const res = parseColorAndValue(
      "set particle count to empty",
      "set particle count to"
    );
    expect(res).toEqual({});

    const res2 = parseColorAndValue(
      "set background color to empty",
      "set background color to"
    );
    expect(res2).toEqual({});
  });
});
