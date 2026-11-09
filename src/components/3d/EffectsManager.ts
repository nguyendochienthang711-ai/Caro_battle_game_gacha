import * as THREE from 'three';
import { CellCoord, PlayerSymbol } from '../../types/game';

export interface ShockwaveItem {
  mesh: THREE.Mesh;
  progress: number;
  maxScale: number;
}

export interface ParticleBurstItem {
  points: THREE.Points;
  velocities: { vx: number; vy: number; vz: number }[];
  progress: number;
}

export interface AnimatedPieceItem {
  mesh: THREE.Group;
  progress: number;
  x: number;
  z: number;
  colorHex: number;
  landedEffectTriggered: boolean;
}

export class EffectsManager {
  private effectsGroup: THREE.Group;
  public shockwaves: ShockwaveItem[] = [];
  public particleBursts: ParticleBurstItem[] = [];
  public animatedPieces: AnimatedPieceItem[] = [];
  public winLaserObjects: THREE.Object3D[] = [];

  constructor(effectsGroup: THREE.Group) {
    this.effectsGroup = effectsGroup;
  }

  public triggerLandingEffects(x: number, z: number, colorHex: number): void {
    // 1. Expanding Neon Shockwave Ring
    const ringGeo = new THREE.RingGeometry(0.15, 0.26, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.set(x, 0.04, z);
    this.effectsGroup.add(ringMesh);
    this.shockwaves.push({ mesh: ringMesh, progress: 0, maxScale: 4.2 });

    // 2. 3D Particle Sparks Burst
    const count = 28;
    const positions = new Float32Array(count * 3);
    const velocities: { vx: number; vy: number; vz: number }[] = [];
    for (let i = 0; i < count; i++) {
      positions[i * 3] = x;
      positions[i * 3 + 1] = 0.2;
      positions[i * 3 + 2] = z;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.04 + Math.random() * 0.11;
      velocities.push({
        vx: Math.cos(angle) * speed,
        vy: 0.06 + Math.random() * 0.12,
        vz: Math.sin(angle) * speed,
      });
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.16,
      transparent: true,
      opacity: 1,
    });
    const points = new THREE.Points(pGeo, pMat);
    this.effectsGroup.add(points);
    this.particleBursts.push({ points, velocities, progress: 0 });
  }

  public showWinLaser(
    winningLine: CellCoord[],
    winnerSymbol: PlayerSymbol,
    cellToWorld: (r: number, c: number) => { x: number; z: number }
  ): void {
    if (!winningLine || winningLine.length < 2) return;
    const colorHex = winnerSymbol === 'X' ? 0x00f3ff : 0xff007f;

    const first = cellToWorld(winningLine[0].row, winningLine[0].col);
    const last = cellToWorld(winningLine[winningLine.length - 1].row, winningLine[winningLine.length - 1].col);

    const startVec = new THREE.Vector3(first.x, 0.38, first.z);
    const endVec = new THREE.Vector3(last.x, 0.38, last.z);
    const distance = startVec.distanceTo(endVec);
    const midVec = startVec.clone().lerp(endVec, 0.5);

    // Glowing Laser Cylinder connecting all 5 winning pieces
    const laserGeo = new THREE.CylinderGeometry(0.12, 0.12, distance + 0.6, 20);
    laserGeo.rotateX(Math.PI / 2);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
    });
    const laserMesh = new THREE.Mesh(laserGeo, laserMat);
    laserMesh.position.copy(midVec);
    laserMesh.lookAt(endVec);
    this.effectsGroup.add(laserMesh);
    this.winLaserObjects.push(laserMesh);

    // Outer Neon Halo Tube around Laser
    const haloGeo = new THREE.CylinderGeometry(0.28, 0.28, distance + 0.8, 20);
    haloGeo.rotateX(Math.PI / 2);
    const haloMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.45,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.copy(midVec);
    haloMesh.lookAt(endVec);
    this.effectsGroup.add(haloMesh);
    this.winLaserObjects.push(haloMesh);

    // Celebratory Firework Bursts on every winning piece
    winningLine.forEach((cell, i) => {
      const pos = cellToWorld(cell.row, cell.col);
      setTimeout(() => {
        this.triggerLandingEffects(pos.x, pos.z, 0xfacc15);
        this.triggerLandingEffects(pos.x, pos.z, colorHex);
      }, i * 140);
    });
  }

  public update(): void {
    // 1. Animate Piece Drops
    for (let i = this.animatedPieces.length - 1; i >= 0; i--) {
      const item = this.animatedPieces[i];
      item.progress += 0.055;

      if (item.progress >= 1) {
        item.mesh.position.y = 0;
        if (!item.landedEffectTriggered) {
          this.triggerLandingEffects(item.x, item.z, item.colorHex);
          item.landedEffectTriggered = true;
        }
        this.animatedPieces.splice(i, 1);
      } else {
        const t = item.progress;
        const bounce = Math.abs(Math.sin(t * Math.PI * 2.5)) * (1 - t) * 0.85;
        const fall = (1 - Math.min(1, t * 1.85)) * 4.5;
        item.mesh.position.y = fall + bounce;

        if (t >= 0.52 && !item.landedEffectTriggered) {
          this.triggerLandingEffects(item.x, item.z, item.colorHex);
          item.landedEffectTriggered = true;
        }
      }
    }

    // 2. Animate Shockwave Rings
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.progress += 0.04;
      if (sw.progress >= 1) {
        this.effectsGroup.remove(sw.mesh);
        this.shockwaves.splice(i, 1);
      } else {
        const s = 1 + sw.progress * sw.maxScale;
        sw.mesh.scale.set(s, s, 1);
        (sw.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - sw.progress) * 0.9;
      }
    }

    // 3. Animate 3D Particle Sparks
    for (let i = this.particleBursts.length - 1; i >= 0; i--) {
      const pb = this.particleBursts[i];
      pb.progress += 0.032;
      if (pb.progress >= 1) {
        this.effectsGroup.remove(pb.points);
        this.particleBursts.splice(i, 1);
      } else {
        const posAttr = pb.points.geometry.attributes.position as THREE.BufferAttribute;
        for (let j = 0; j < pb.velocities.length; j++) {
          const v = pb.velocities[j];
          posAttr.array[j * 3] += v.vx;
          posAttr.array[j * 3 + 1] += v.vy;
          posAttr.array[j * 3 + 2] += v.vz;
          v.vy -= 0.0045; // gravity
        }
        posAttr.needsUpdate = true;
        (pb.points.material as THREE.PointsMaterial).opacity = 1 - pb.progress;
      }
    }
  }

  public clear(): void {
    this.shockwaves.forEach((sw) => this.effectsGroup.remove(sw.mesh));
    this.shockwaves = [];
    this.particleBursts.forEach((pb) => this.effectsGroup.remove(pb.points));
    this.particleBursts = [];
    this.winLaserObjects.forEach((obj) => this.effectsGroup.remove(obj));
    this.winLaserObjects = [];
    this.animatedPieces = [];
  }
}
