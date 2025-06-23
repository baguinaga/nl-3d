import colorNameMap from "color-name";

export const rgbToInt = (rgb: [number, number, number]): number => {
  return (rgb[0] << 16) + (rgb[1] << 8) + rgb[2];
};

export const parseColorAndValue = (
  input: string,
  actionTriggerPhrase: string
): { colorHex?: number; value?: number } => {
  const lowerInput = input.toLowerCase();
  const phraseToSearch = actionTriggerPhrase.toLowerCase().trim();
  const contentAfterPhrase = lowerInput.split(phraseToSearch)[1]?.trim();

  //If there is content after the phrase, try to parse it either
  if (contentAfterPhrase) {
    //Try to parse as a color
    const colorMap = colorNameMap as Record<string, [number, number, number]>;
    const color = colorMap[contentAfterPhrase];
    //If it's a color, convert to a hex integer value
    if (color) {
      const hex = rgbToInt(color);
      return { colorHex: hex };
    }

    // TODO: replace this check - we should consider the case where color is not in the phraseToSearch
    if (phraseToSearch.includes("color")) {
      if (
        // The regexes here are used to determine if the value is a hex value
        /^0x[0-9a-fA-F]+$/.test(contentAfterPhrase) ||
        /^#[0-9a-fA-F]+$/.test(contentAfterPhrase) ||
        (/^[0-9a-fA-F]{3,6}$/.test(contentAfterPhrase) &&
          !contentAfterPhrase.startsWith("0x") &&
          !contentAfterPhrase.startsWith("#"))
      ) {
        let hexString = contentAfterPhrase;
        if (hexString.startsWith("0x")) {
          hexString = hexString.substring(2);
        } else if (hexString.startsWith("#")) {
          hexString = hexString.substring(1);
        }
        const hexVal = parseInt(hexString, 16);
        if (!isNaN(hexVal)) return { colorHex: hexVal };
      } else {
        console.warn(
          `Could not parse "${contentAfterPhrase}" as a direct hex color for "${phraseToSearch}"`
        );
      }
    }
    //If it's not a color, pass it as a numeric value
    const numericValue = parseInt(contentAfterPhrase, 10);
    if (!isNaN(numericValue) && !phraseToSearch.includes("color")) {
      return { value: numericValue };
    }
  }
  console.warn(
    `Could not parse value/color from "${input}" for action phrase "${actionTriggerPhrase}"`
  );
  return {};
};
