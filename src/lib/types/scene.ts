import { Vector3 } from "three";

export type SceneAction = "change_particle_count" | "set_color" | "unknown";

export type SceneTarget = "particles" | "segments" | "background";

export interface SceneCommandParameters {
  // Use unions for more specific parameter types per action
  direction?: "increase" | "decrease";
  delta?: number;
  value?: number | string; // value could be a count or a parse fail message
  target?: SceneTarget;
}

export interface SceneCommand {
  action: SceneAction;
  parameters: SceneCommandParameters;
}

export interface ParticleDataEntry {
  velocity: Vector3;
  numConnections: number;
}

export interface ParticleSceneProps {
  lastProcessedCommand: SceneCommand | null;
}
