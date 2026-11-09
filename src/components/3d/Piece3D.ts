import * as THREE from 'three';
import { PlayerSymbol } from '../../types/game';

/**
 * Creates a 3D Piece Mesh:
 * - Player X: Neon Cyan Crystal Cross with Floating Octahedron Core
 * - Player O: Neon Magenta Energy Torus with Levitating Plasma Sphere Core
 */
export function createPieceMesh(player: PlayerSymbol): THREE.Group {
  const group = new THREE.Group();

  if (player === 'X') {
    const cyanMat = new THREE.MeshStandardMaterial({
      color: 0x00f3ff,
      emissive: 0x00a8b5,
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.8,
    });

    const barGeo = new THREE.BoxGeometry(0.76, 0.22, 0.2);
    const bar1 = new THREE.Mesh(barGeo, cyanMat);
    bar1.rotation.y = Math.PI / 4;
    bar1.position.y = 0.18;
    bar1.castShadow = true;

    const bar2 = new THREE.Mesh(barGeo, cyanMat);
    bar2.rotation.y = -Math.PI / 4;
    bar2.position.y = 0.18;
    bar2.castShadow = true;

    // Floating Octahedron Energy Core
    const coreGeo = new THREE.OctahedronGeometry(0.18, 0);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xe0ffff });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 0.42;

    group.add(bar1, bar2, core);
    group.userData.core = core;
  } else {
    const magentaMat = new THREE.MeshStandardMaterial({
      color: 0xff007f,
      emissive: 0xc80064,
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.8,
    });

    const torusGeo = new THREE.TorusGeometry(0.28, 0.1, 16, 32);
    torusGeo.rotateX(Math.PI / 2);
    const torus = new THREE.Mesh(torusGeo, magentaMat);
    torus.position.y = 0.18;
    torus.castShadow = true;

    // Levitating Plasma Sphere Core
    const sphereGeo = new THREE.SphereGeometry(0.14, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0xffe4f2 });
    const core = new THREE.Mesh(sphereGeo, sphereMat);
    core.position.y = 0.38;

    group.add(torus, core);
    group.userData.core = core;
  }

  return group;
}
