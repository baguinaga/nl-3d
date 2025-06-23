import { useEffect, useRef, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const diameter = 1000;
const sphereRadius = diameter / 2;

const maxSegmentDistance = 150;
const maxConnections = 6;
const segmentColor = 0x444fff;

const MAX_PARTICLES = 1800;
const MAX_SEGMENTS = 10000;

export interface SceneCommand {
  action: string; // e.g., 'particles', 'segments', 'background', 'set_color'
  parameters?: {
    target?: "particles" | "segments" | "background";
    value?: number | string;
    delta?: number;
    direction?: "increase" | "decrease";
  };
}

interface ParticleDataEntry {
  velocity: THREE.Vector3;
  numConnections: number;
}

const setVertexColor = (
  colors: Float32Array,
  index: number,
  color: number,
  alpha: number
) => {
  const c = new THREE.Color(color);
  colors[index++] = c.r * alpha;
  colors[index++] = c.g * alpha;
  colors[index++] = c.b * alpha;
  return index;
};

interface ParticleSceneProps {
  lastProcessedCommand: SceneCommand | null;
}

export function ParticleScene({ lastProcessedCommand }: ParticleSceneProps) {
  const { scene } = useThree();
  const particlesMesh = useRef<THREE.Points>(null!);
  const segmentsMesh = useRef<THREE.LineSegments>(null!);

  const particleData = useRef<ParticleDataEntry[]>([]);
  const particlePositionsArray = useRef<Float32Array | null>(null);
  const segmentPositionsArray = useRef<Float32Array | null>(null);
  const colorsArray = useRef<Float32Array | null>(null);

  const [numParticles, setNumParticles] = useState(800);
  const [particleColor, setParticleColor] = useState(0xffffff);
  const [lineColor, setLineColor] = useState(segmentColor);

  useEffect(() => {
    if (!lastProcessedCommand) return;

    console.log(`ParticleScene processing command:`, lastProcessedCommand);
    const { action, parameters } = lastProcessedCommand;

    switch (action) {
      case "change_particle_count":
        if (
          parameters?.value !== undefined &&
          typeof parameters.value === "number"
        ) {
          setNumParticles(
            Math.max(10, Math.min(parameters.value, MAX_PARTICLES))
          );
          console.log(`Setting particle count to ${parameters.value}`);
        } else if (parameters?.direction) {
          const changeAmount =
            typeof parameters.delta === "number" ? parameters.delta : 300;
          setNumParticles((prev) => {
            const newCount =
              parameters.direction === "increase"
                ? prev + changeAmount
                : Math.max(10, prev - changeAmount);
            const clamped = Math.min(newCount, MAX_PARTICLES);
            console.log(
              `Adjusting particles from ${prev} to ${clamped} (direction: ${parameters.direction})`
            );
            return clamped;
          });
        }
        break;
      case "set_color":
        if (
          parameters?.target === "particles" &&
          typeof parameters.value === "number"
        ) {
          setParticleColor(parameters.value);
          console.log(
            `Setting particle color to ${parameters.value.toString(16)}`
          );
        } else if (
          parameters?.target === "segments" &&
          typeof parameters.value === "number"
        ) {
          setLineColor(parameters.value);
          console.log(
            `Setting segment color to ${parameters.value.toString(16)}`
          );
        } else if (
          parameters?.target === "background" &&
          typeof parameters.value === "number"
        ) {
          if (scene) scene.background = new THREE.Color(parameters.value);
          console.log(
            `Setting background color to ${parameters.value.toString(16)}`
          );
        }
        break;
      default:
        console.warn(`ParticleScene: Unknown or unhandled action "${action}"`);
    }
  }, [lastProcessedCommand, scene]);

  useEffect(() => {
    if (scene && !scene.background) {
      scene.background = new THREE.Color(0xb3a89d);
    }
  }, [scene]);

  useEffect(() => {
    console.log(
      `Re-initializing particle system with ${numParticles} particles.`
    );
    if (!scene) return;
    scene.rotation.z = 0.2;

    const particlesGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(numParticles * 3);
    const velocityMultX = 0.8;
    const velocityMultY = 0.8;
    const velocityMultZ = 0.8;
    const segmentCount = Math.min(
      Math.floor(numParticles * numParticles),
      MAX_SEGMENTS
    );
    const segmentPositions = new Float32Array(segmentCount * 3);
    const colors = new Float32Array(segmentCount * 3);
    const segmentsGeometry = new THREE.BufferGeometry();

    const currentParticleData: ParticleDataEntry[] = [];
    for (let i = 0; i < numParticles; i++) {
      const x = Math.random() * sphereRadius * 2 - sphereRadius;
      const y = Math.random() * sphereRadius * 2 - sphereRadius;
      const z = Math.random() * sphereRadius * 2 - sphereRadius;
      particlePositions[i * 3] = x;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = z;
      currentParticleData.push({
        velocity: new THREE.Vector3(
          -1 + Math.random() * 2 * velocityMultX,
          -1 + Math.random() * 2 * velocityMultY,
          -1 + Math.random() * 2 * velocityMultZ
        ),
        numConnections: 0,
      });
    }
    particleData.current = currentParticleData;

    particlesGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3).setUsage(
        THREE.DynamicDrawUsage
      )
    );
    particlePositionsArray.current = particlePositions;

    segmentsGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(segmentPositions, 3).setUsage(
        THREE.DynamicDrawUsage
      )
    );
    segmentsGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage)
    );
    segmentPositionsArray.current = segmentPositions;
    colorsArray.current = colors;
    particlesGeometry.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(0, 0, 0),
      sphereRadius
    );

    const pMaterial = new THREE.PointsMaterial({
      color: particleColor,
      size: 2,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: false,
    });
    const sMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.5,
    });

    const pointCloud = new THREE.Points(particlesGeometry, pMaterial);
    const lineSegments = new THREE.LineSegments(segmentsGeometry, sMaterial);
    scene.add(pointCloud, lineSegments);
    particlesMesh.current = pointCloud;
    segmentsMesh.current = lineSegments;

    return () => {
      scene.remove(pointCloud);
      scene.remove(lineSegments);
      particlesGeometry.dispose();
      segmentsGeometry.dispose();
      pMaterial.dispose();
      sMaterial.dispose();
      particlePositionsArray.current = null;
      segmentPositionsArray.current = null;
      colorsArray.current = null;
      particleData.current = [];
    };
  }, [scene, numParticles, particleColor, lineColor]);

  useFrame((state, delta) => {
    if (
      !particlesMesh.current ||
      !segmentsMesh.current ||
      !particlePositionsArray.current ||
      !segmentPositionsArray.current ||
      !colorsArray.current ||
      particleData.current.length !== numParticles
    ) {
      return;
    }
    let vertexpos = 0;
    let colorpos = 0;
    let numConnected = 0;

    const currentParticlePositions = particlePositionsArray.current;
    const currentSegmentPositions = segmentPositionsArray.current;
    const currentColors = colorsArray.current;
    const currentFrameParticleData = particleData.current;

    for (let i = 0; i < numParticles; i++) {
      if (currentFrameParticleData[i]) {
        currentFrameParticleData[i].numConnections = 0;
      }
    }

    for (let i = 0; i < numParticles; i++) {
      const particle = currentFrameParticleData[i];
      if (!particle || !particle.velocity) continue;

      currentParticlePositions[i * 3] += particle.velocity.x * (delta * 60);
      currentParticlePositions[i * 3 + 1] += particle.velocity.y * (delta * 60);
      currentParticlePositions[i * 3 + 2] += particle.velocity.z * (delta * 60);

      const x = currentParticlePositions[i * 3];
      const y = currentParticlePositions[i * 3 + 1];
      const z = currentParticlePositions[i * 3 + 2];
      const distanceFromCenter = Math.sqrt(x * x + y * y + z * z);

      if (distanceFromCenter > sphereRadius) {
        const normalX = x / distanceFromCenter;
        const normalY = y / distanceFromCenter;
        const normalZ = z / distanceFromCenter;
        const velocity = particle.velocity;
        const kick = 0.1;

        const dotProduct =
          velocity.x * normalX + velocity.y * normalY + velocity.z * normalZ;
        velocity.x -= 2 * dotProduct * normalX;
        velocity.y -= 2 * dotProduct * normalY;
        velocity.z -= 2 * dotProduct * normalZ;

        velocity.x += (Math.random() - 0.5) * kick;
        velocity.y += (Math.random() - 0.5) * kick;
        velocity.z += (Math.random() - 0.5) * kick;

        const correctionFactor = sphereRadius / distanceFromCenter;
        currentParticlePositions[i * 3] *= correctionFactor;
        currentParticlePositions[i * 3 + 1] *= correctionFactor;
        currentParticlePositions[i * 3 + 2] *= correctionFactor;
      }

      if (particle.numConnections >= maxConnections) {
        continue;
      }

      for (let j = i + 1; j < numParticles; j++) {
        const otherParticle = currentFrameParticleData[j];
        if (!otherParticle || otherParticle.numConnections >= maxConnections) {
          continue;
        }

        const dx =
          currentParticlePositions[i * 3] - currentParticlePositions[j * 3];
        const dy =
          currentParticlePositions[i * 3 + 1] -
          currentParticlePositions[j * 3 + 1];
        const dz =
          currentParticlePositions[i * 3 + 2] -
          currentParticlePositions[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < maxSegmentDistance) {
          if (
            particle.numConnections < maxConnections &&
            otherParticle.numConnections < maxConnections
          ) {
            particle.numConnections++;
            otherParticle.numConnections++;

            currentSegmentPositions[vertexpos++] =
              currentParticlePositions[i * 3];
            currentSegmentPositions[vertexpos++] =
              currentParticlePositions[i * 3 + 1];
            currentSegmentPositions[vertexpos++] =
              currentParticlePositions[i * 3 + 2];
            currentSegmentPositions[vertexpos++] =
              currentParticlePositions[j * 3];
            currentSegmentPositions[vertexpos++] =
              currentParticlePositions[j * 3 + 1];
            currentSegmentPositions[vertexpos++] =
              currentParticlePositions[j * 3 + 2];

            const alpha = 1.0 - dist / maxSegmentDistance;
            colorpos = setVertexColor(
              currentColors,
              colorpos,
              lineColor,
              alpha
            );
            colorpos = setVertexColor(
              currentColors,
              colorpos,
              lineColor,
              alpha
            );
            numConnected++;
            if (vertexpos >= segmentPositionsArray.current.length) {
              break;
            }
          }
        }
      }
      if (vertexpos >= segmentPositionsArray.current.length) break;
    }
    if (
      segmentsMesh.current.geometry.attributes.position &&
      segmentsMesh.current.geometry.attributes.color
    ) {
      segmentsMesh.current.geometry.setDrawRange(0, numConnected * 2);
      segmentsMesh.current.geometry.attributes.position.needsUpdate = true;
      segmentsMesh.current.geometry.attributes.color.needsUpdate = true;
    }
    if (particlesMesh.current.geometry.attributes.position) {
      particlesMesh.current.geometry.attributes.position.needsUpdate = true;
    }
    if (
      particlesMesh.current &&
      (
        particlesMesh.current.material as THREE.PointsMaterial
      ).color.getHex() !== particleColor
    ) {
      (particlesMesh.current.material as THREE.PointsMaterial).color.setHex(
        particleColor
      );
    }
  });

  return null;
}
