# NL3D: Natural Language Controlled 3D Scene (Proof of Concept)

This project is a proof-of-concept demonstrating the integration of a [Three.js](https://threejs.org/) 3D scene, built with [@react-three/fiber](https://github.com/pmndrs/react-three-fiber), with [Hugging Face Transformers.js](https://huggingface.co/docs/transformers.js/index). It specifically utilizes [Xenova's pre-trained models](https://huggingface.co/Xenova) for natural language processing.

The core idea is to explore interaction with a 3D environment using text-based commands. While the current interactions could be achieved with a traditional UI, this project serves as an experiment in integrating natural language processing for 3D scene control.

The particle system was inspired by the official Three.js `webgl_buffergeometry_drawrange` example ([view source](https://github.com/mrdoob/three.js/blob/master/examples/webgl_buffergeometry_drawrange.html)) which I previously adapted to a previous personal project ([baguinaga/nl-3d](https://github.com/baguinaga/3d-angular-portfolio)).

## Overview

This application features a Three.js particle system that users can control via text commands. Natural language input is processed by a Transformers.js zero-shot classification pipeline to manipulate scene elements like particle count, colors, and background in real-time.

This project currently serves as an experimental playground and an exploration of how natural language can be used to interact with 3D graphics. _It is important to note that this work is still in progress, and further improvements are planned._

## Features

- **Dynamic Particle System:** A visually engaging Three.js scene with particles and connecting segments, built with `@react-three/fiber`.
- **Natural Language Input:** Users can type commands to control the scene.
- **Transformers.js Integration:** Leverages `Xenova/nli-deberta-v3-small` (or a similar zero-shot classification model) for intent recognition.
- **Real-time Updates:** Scene parameters change dynamically based on processed commands.

## Supported Commands

The system is designed to understand commands related to scene manipulation. While the NLP model aims for flexibility, the following phrases are currently recognized with higher confidence (and have fallback checks):

- **Particle Count:**
  - `increase particle count`
  - `decrease particle count`
  - `set particle count to <number>` (e.g., `set particle count to 500`)
- **Particle Color:**
  - `set particle color to <color>` (e.g., `set particle color to red`, `set particle color to 0x00ff00`)
- **Segment (Line) Color:**
  - `set line color to <color>` (e.g., `set line color to blue`)
- **Background Color:**
  - `set background color to <color>` (e.g., `set background color to black`)

_(`<color>` can be a standard CSS color name or a hexadecimal value.)_

## Tech Stack

- **Frontend:** [Next.js](https://nextjs.org/) (React)
- **3D Rendering:** [Three.js](https://threejs.org/) via [@react-three/fiber](https://github.com/pmndrs/react-three-fiber) and [@react-three/drei](https://github.com/pmndrs/drei)
- **Natural Language Processing:** [Hugging Face Transformers.js](https://huggingface.co/docs/transformers.js/index) (specifically Xenova models)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Deployment:** [Vercel](https://vercel.com/) (Recommended)

## Project Status & Future Work

This project is currently a **proof of concept** and further scene interactions, complex three.js scenes, and less reliance on logic fallback.

**Current Limitations & Areas for Improvement:**

- **Reliance on Fallbacks:** While Transformers.js provides significant flexibility, the system still employs string matching and fallback logic for certain commands. The goal is to minimize these fallbacks and rely more on the NLP model's capabilities.
- **NLP Model Tuning/Selection:** Further exploration of different models or fine-tuning could improve accuracy and reduce the need for explicit candidate labels or fallbacks.
- **Command Scope:** The range of interactable elements and actions is currently limited. Expanding this to more complex scene manipulations is a key area for future development.
- **Error Handling & User Feedback:** More sophisticated error handling and clearer feedback to the user on command interpretation are needed.
- **Robust Testing:** Comprehensive testing across various inputs, edge cases, and different browsers/devices is required.
- **Complex Scene Interactions:** Moving beyond simple parameter changes to more complex interactions (e.g., "make the particles swirl," "group particles by color," "change particle speed") is a long-term vision.
- **Performance Optimization:** For larger numbers of particles and segments, performance optimizations will be necessary.

The ultimate aim is to create a more seamless and intuitive way to interact with 3D environments using natural language, reducing the reliance on hardcoded commands and traditional UI elements.

## Getting Started

### Prerequisites

- Node.js (v18.x or later recommended)
- npm or yarn

### Installation

1. **Clone the repository:**

```bash
 git clone https://github.com/your-username/your-repo-name.git
 cd your-repo-name
```

2.**Install dependencies:**

```bash
  npm install
  # or
  yarn install
```

3.**Run the development server:**

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
# or
yarn build
```

### Deployment

This project is optimized for deployment on [Vercel](https://vercel.com/).

1. Push your code to a Git repository (GitHub, GitLab, Bitbucket).
2. Import the project into Vercel.
3. Vercel will typically auto-detect the Next.js settings and deploy.
