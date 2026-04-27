// PharmaSpark — Spark Bridge
// Integrates with @sparkjsdev/spark for GPU-accelerated 3DGS rendering

import * as THREE from "three";
import { SplatMesh, SparkRenderer } from "@sparkjsdev/spark";
import { type SplatData } from "./atom-to-splat";
import { splatsToBlob } from "./ply-export";

export interface PharmaSparkViewerOptions {
  container: HTMLElement;
  width?: number;
  height?: number;
  backgroundColor?: number;
  cameraDistance?: number;
}

export class PharmaSparkViewer {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private sparkRenderer!: SparkRenderer;
  private splatMeshes: Map<string, SplatMesh> = new Map();
  private animationId: number = 0;
  private isDragging = false;
  private lastMouse = { x: 0, y: 0 };
  private cameraTheta = 0;
  private cameraPhi = Math.PI / 4;
  private cameraDistance: number;
  private cameraTarget = new THREE.Vector3(0, 0, 0);

  constructor(options: PharmaSparkViewerOptions) {
    this.container = options.container;
    this.cameraDistance = options.cameraDistance || 50;

    const width = options.width || this.container.clientWidth;
    const height = options.height || this.container.clientHeight;

    // Three.js renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: false, // Spark requires no antialias
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(options.backgroundColor ?? 0x1a1a2e);
    this.container.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 10000);
    this.updateCameraPosition();

    // Spark renderer
    this.sparkRenderer = new SparkRenderer({
      renderer: this.renderer,
      onDirty: () => this.render(),
    });
    this.scene.add(this.sparkRenderer);

    // Ambient light (for any THREE.js meshes)
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);

    // Mouse controls
    this.setupControls();

    // Start render loop
    this.animate();
  }

  private setupControls(): void {
    const el = this.renderer.domElement;

    el.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      this.lastMouse = { x: e.clientX, y: e.clientY };
    });

    el.addEventListener("mousemove", (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastMouse.x;
      const dy = e.clientY - this.lastMouse.y;
      this.cameraTheta -= dx * 0.005;
      this.cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraPhi + dy * 0.005));
      this.lastMouse = { x: e.clientX, y: e.clientY };
      this.updateCameraPosition();
    });

    el.addEventListener("mouseup", () => { this.isDragging = false; });
    el.addEventListener("mouseleave", () => { this.isDragging = false; });

    el.addEventListener("wheel", (e) => {
      e.preventDefault();
      this.cameraDistance = Math.max(5, this.cameraDistance + e.deltaY * 0.05);
      this.updateCameraPosition();
    });

    // Resize handler
    const resizeObserver = new ResizeObserver(() => {
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.renderer.setSize(w, h);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    });
    resizeObserver.observe(this.container);
  }

  private updateCameraPosition(): void {
    const x = this.cameraDistance * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);
    const y = this.cameraDistance * Math.cos(this.cameraPhi);
    const z = this.cameraDistance * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);
    this.camera.position.set(
      this.cameraTarget.x + x,
      this.cameraTarget.y + y,
      this.cameraTarget.z + z,
    );
    this.camera.lookAt(this.cameraTarget);
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());
    this.render();
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  // Load splat data by converting to PLY blob URL
  async addMolecule(name: string, splatData: SplatData): Promise<void> {
    const blob = splatsToBlob(splatData);
    const url = URL.createObjectURL(blob);

    const splatMesh = new SplatMesh({
      url,
      rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)),
    });
    this.scene.add(splatMesh);
    this.splatMeshes.set(name, splatMesh);

    // Auto-center camera on molecule
    if (splatData.count > 0) {
      let cx = 0, cy = 0, cz = 0;
      for (let i = 0; i < splatData.count; i++) {
        cx += splatData.positions[i * 3];
        cy += splatData.positions[i * 3 + 1];
        cz += splatData.positions[i * 3 + 2];
      }
      this.cameraTarget.set(cx / splatData.count, cz / splatData.count, -cy / splatData.count);
      this.updateCameraPosition();
    }
  }

  removeMolecule(name: string): void {
    const mesh = this.splatMeshes.get(name);
    if (mesh) {
      this.scene.remove(mesh);
      this.splatMeshes.delete(name);
    }
  }

  clear(): void {
    for (const [name] of this.splatMeshes) {
      this.removeMolecule(name);
    }
  }

  setCameraTarget(x: number, y: number, z: number): void {
    this.cameraTarget.set(x, y, z);
    this.updateCameraPosition();
  }

  setCameraDistance(d: number): void {
    this.cameraDistance = d;
    this.updateCameraPosition();
  }

  get element(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  dispose(): void {
    cancelAnimationFrame(this.animationId);
    this.clear();
    this.sparkRenderer.dispose();
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
