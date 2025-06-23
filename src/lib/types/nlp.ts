export type ClassifierFunc = (
  text: string,
  labels: string[],
  options?: { multi_label: boolean }
) => Promise<{ labels: string[]; scores: number[] }>;
