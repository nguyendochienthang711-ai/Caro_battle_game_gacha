'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import * as THREE from 'three';
import {
  BOARD_SIZE,
  CellCoord,
  PlayerSymbol,
  MoveRecord,
  CameraPreset,
  SceneApi,
} from '../../types/game';
import { createPieceMesh } from './Piece3D';
import { EffectsManager } from './EffectsManager';

interface CaroScene3DProps {
  moves: MoveRecord[];
  onCellClick: (row: number, col: number) => void;
  onCellHover?: (cell: CellCoord | null) => void;
  sceneRef?: React.MutableRefObject<SceneApi | null>;
  cameraPreset?: CameraPreset;
  currentPlayer?: PlayerSymbol;
}

export const CaroScene3D = forwardRef<SceneApi, CaroScene3DProps>(function CaroScene3D(
  { moves, onCellClick, onCellHover, sceneRef, cameraPreset, currentPlayer = 'X' },
  ref
) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const sceneApiRef = useRef<SceneApi | null>(null);
  const hoverTileMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const piecesCountRef = useRef<number>(0);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    spawnPiece3D: (row, col, player, animate = true) => {
      sceneApiRef.current?.spawnPiece3D(row, col, player, animate);
    },
    clearAllPieces: () => {
      sceneApiRef.current?.clearAllPieces();
    },
    syncBoardState: (moveList) => {
      sceneApiRef.current?.syncBoardState(moveList);
    },
    showWinEffects: (winningLine, winnerSymbol) => {
      sceneApiRef.current?.showWinEffects(winningLine, winnerSymbol);
    },
    setCameraPresetView: (presetName) => {
      sceneApiRef.current?.setCameraPresetView(presetName);
    },
    focusOnCell: (row, col) => {
      sceneApiRef.current?.focusOnCell(row, col);
    },
    resetCameraCenter: () => {
      sceneApiRef.current?.resetCameraCenter();
    },
    zoomDelta: (delta) => {
      sceneApiRef.current?.zoomDelta(delta);
    },
  }));

  const onCellClickRef = useRef(onCellClick);
  useEffect(() => {
    onCellClickRef.current = onCellClick;
  }, [onCellClick]);

  const onCellHoverRef = useRef(onCellHover);
  useEffect(() => {
    onCellHoverRef.current = onCellHover;
  }, [onCellHover]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Fog & Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050711);
    scene.fog = new THREE.FogExp2(0x050711, 0.0085);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Camera & Spherical Orbit / Pan System
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.5,
      300
    );

    const camState = {
      target: new THREE.Vector3(0, 0, 0),
      desiredTarget: new THREE.Vector3(0, 0, 0),
      theta: 0,
      phi: Math.PI / 3.1,
      radius: 36,
      desiredTheta: 0,
      desiredPhi: Math.PI / 3.1,
      desiredRadius: 36,
      isDragging: false,
      isPanning: false,
      dragStartX: 0,
      dragStartY: 0,
      pointerMovedDist: 0,
      cinematicRotate: false,
    };

    // 3. Cyberpunk Lighting Setup
    const ambientLight = new THREE.AmbientLight(0x2a3558, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
    dirLight.position.set(18, 35, 22);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const cyanPointLight = new THREE.PointLight(0x00f3ff, 2.2, 65);
    cyanPointLight.position.set(-18, 12, -18);
    scene.add(cyanPointLight);

    const magentaPointLight = new THREE.PointLight(0xff007f, 2.2, 65);
    magentaPointLight.position.set(18, 12, 18);
    scene.add(magentaPointLight);

    // 4. 30x30 Board Geometry & Neon Grid
    const cellSize = 1.0;
    const totalSpan = BOARD_SIZE * cellSize;
    const halfSpan = totalSpan / 2;

    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    // Base Obsidian Platform
    const baseGeo = new THREE.BoxGeometry(totalSpan + 1.8, 0.9, totalSpan + 1.8);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0a0f1f,
      roughness: 0.25,
      metalness: 0.75,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.46;
    baseMesh.receiveShadow = true;
    boardGroup.add(baseMesh);

    // Glowing Neon Frame Borders
    const borderMatCyan = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
    const borderMatMagenta = new THREE.MeshBasicMaterial({ color: 0xff007f });

    const borderTop = new THREE.Mesh(new THREE.BoxGeometry(totalSpan + 2.05, 0.14, 0.16), borderMatCyan);
    borderTop.position.set(0, 0.02, -halfSpan - 0.92);
    boardGroup.add(borderTop);

    const borderBottom = new THREE.Mesh(new THREE.BoxGeometry(totalSpan + 2.05, 0.14, 0.16), borderMatMagenta);
    borderBottom.position.set(0, 0.02, halfSpan + 0.92);
    boardGroup.add(borderBottom);

    const borderLeft = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, totalSpan + 2.05), borderMatCyan);
    borderLeft.position.set(-halfSpan - 0.92, 0.02, 0);
    boardGroup.add(borderLeft);

    const borderRight = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, totalSpan + 2.05), borderMatMagenta);
    borderRight.position.set(halfSpan + 0.92, 0.02, 0);
    boardGroup.add(borderRight);

    // 30x30 Grid Lines
    const linePoints: THREE.Vector3[] = [];
    const majorLinePoints: THREE.Vector3[] = [];
    for (let i = 0; i <= BOARD_SIZE; i++) {
      const pos = -halfSpan + i * cellSize;
      const isMajor = i % 5 === 0;
      const targetArray = isMajor ? majorLinePoints : linePoints;

      // Horizontal line
      targetArray.push(new THREE.Vector3(-halfSpan, 0.01, pos));
      targetArray.push(new THREE.Vector3(halfSpan, 0.01, pos));
      // Vertical line
      targetArray.push(new THREE.Vector3(pos, 0.01, -halfSpan));
      targetArray.push(new THREE.Vector3(pos, 0.01, halfSpan));
    }

    const minorGridGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    const minorGridMat = new THREE.LineBasicMaterial({ color: 0x1e3a5f, transparent: true, opacity: 0.65 });
    boardGroup.add(new THREE.LineSegments(minorGridGeo, minorGridMat));

    const majorGridGeo = new THREE.BufferGeometry().setFromPoints(majorLinePoints);
    const majorGridMat = new THREE.LineBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.45 });
    boardGroup.add(new THREE.LineSegments(majorGridGeo, majorGridMat));

    // Star Points (Hoshi) on 30x30 Grid
    const starCoords = [5, 10, 15, 20, 25];
    const starGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16);
    const starMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    starCoords.forEach((r) => {
      starCoords.forEach((c) => {
        const dot = new THREE.Mesh(starGeo, starMat);
        dot.position.set(-halfSpan + c * cellSize, 0.015, -halfSpan + r * cellSize);
        boardGroup.add(dot);
      });
    });

    // Invisible Raycast Plane
    const raycastPlaneGeo = new THREE.PlaneGeometry(totalSpan, totalSpan);
    raycastPlaneGeo.rotateX(-Math.PI / 2);
    const raycastPlaneMat = new THREE.MeshBasicMaterial({ visible: false });
    const raycastPlane = new THREE.Mesh(raycastPlaneGeo, raycastPlaneMat);
    boardGroup.add(raycastPlane);

    // 5. Interactive Hover Cell Hologram Selector
    const hoverGroup = new THREE.Group();
    hoverGroup.visible = false;
    scene.add(hoverGroup);

    const hoverTileGeo = new THREE.PlaneGeometry(0.92, 0.92);
    hoverTileGeo.rotateX(-Math.PI / 2);
    const hoverTileMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
    });
    hoverTileMatRef.current = hoverTileMat;
    const hoverTile = new THREE.Mesh(hoverTileGeo, hoverTileMat);
    hoverTile.position.y = 0.03;
    hoverGroup.add(hoverTile);

    const hoverRingGeo = new THREE.RingGeometry(0.32, 0.44, 24);
    hoverRingGeo.rotateX(-Math.PI / 2);
    const hoverRingMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const hoverRing = new THREE.Mesh(hoverRingGeo, hoverRingMat);
    hoverRing.position.y = 0.05;
    hoverGroup.add(hoverRing);

    // Last Move Beacon Marker
    const lastMoveBeacon = new THREE.Group();
    lastMoveBeacon.visible = false;
    const beaconRingGeo = new THREE.RingGeometry(0.38, 0.48, 32);
    beaconRingGeo.rotateX(-Math.PI / 2);
    const beaconRingMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
    });
    const beaconRing = new THREE.Mesh(beaconRingGeo, beaconRingMat);
    beaconRing.position.y = 0.04;
    lastMoveBeacon.add(beaconRing);

    const beaconPillarGeo = new THREE.CylinderGeometry(0.05, 0.25, 1.4, 16, 1, true);
    const beaconPillarMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    });
    const beaconPillar = new THREE.Mesh(beaconPillarGeo, beaconPillarMat);
    beaconPillar.position.y = 0.7;
    lastMoveBeacon.add(beaconPillar);
    scene.add(lastMoveBeacon);

    // 6. Ambient Floating Cyber Dust Particles
    const ambientCount = 220;
    const ambientPos = new Float32Array(ambientCount * 3);
    for (let i = 0; i < ambientCount; i++) {
      ambientPos[i * 3] = (Math.random() - 0.5) * 65;
      ambientPos[i * 3 + 1] = Math.random() * 22 + 0.5;
      ambientPos[i * 3 + 2] = (Math.random() - 0.5) * 65;
    }
    const ambientGeo = new THREE.BufferGeometry();
    ambientGeo.setAttribute('position', new THREE.BufferAttribute(ambientPos, 3));
    const ambientMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.18,
      transparent: true,
      opacity: 0.55,
    });
    const ambientParticles = new THREE.Points(ambientGeo, ambientMat);
    scene.add(ambientParticles);

    // 7. Dynamic Groups & Effects
    const piecesGroup = new THREE.Group();
    scene.add(piecesGroup);

    const effectsGroup = new THREE.Group();
    scene.add(effectsGroup);

    const effectsManager = new EffectsManager(effectsGroup);

    const cellToWorld = (row: number, col: number) => ({
      x: -halfSpan + (col + 0.5) * cellSize,
      z: -halfSpan + (row + 0.5) * cellSize,
    });

    // Connect Scene API methods
    const api: SceneApi = {
      spawnPiece3D: (row, col, player, animate = true) => {
        const cellKey = `${row}-${col}`;
        const alreadyExists = piecesGroup.children.some(
          (child) => child.userData?.cellKey === cellKey
        );
        if (alreadyExists) return;

        const { x, z } = cellToWorld(row, col);
        const pieceMesh = createPieceMesh(player);
        pieceMesh.userData.cellKey = cellKey;
        pieceMesh.position.set(x, animate ? 4.5 : 0, z);
        piecesGroup.add(pieceMesh);
        piecesCountRef.current = piecesGroup.children.length;

        lastMoveBeacon.position.set(x, 0, z);
        lastMoveBeacon.visible = true;

        if (animate) {
          effectsManager.animatedPieces.push({
            mesh: pieceMesh,
            progress: 0,
            x,
            z,
            colorHex: player === 'X' ? 0x00f3ff : 0xff007f,
            landedEffectTriggered: false,
          });
        } else {
          pieceMesh.position.y = 0;
        }
      },

      clearAllPieces: () => {
        while (piecesGroup.children.length > 0) {
          piecesGroup.remove(piecesGroup.children[0]);
        }
        piecesCountRef.current = 0;
        effectsManager.clear();
        lastMoveBeacon.visible = false;
      },

      syncBoardState: (moveList) => {
        api.clearAllPieces();
        moveList.forEach((m, idx) => {
          const isLast = idx === moveList.length - 1;
          api.spawnPiece3D(m.row, m.col, m.player, isLast);
        });
      },

      showWinEffects: (winningLine, winnerSymbol) => {
        effectsManager.showWinLaser(winningLine, winnerSymbol, cellToWorld);
      },

      setCameraPresetView: (presetName) => {
        if (presetName === 'TOP_2D') {
          camState.desiredTheta = 0;
          camState.desiredPhi = 0.06;
          camState.desiredRadius = 38;
          camState.cinematicRotate = false;
        } else if (presetName === 'ISO_3D') {
          camState.desiredTheta = 0;
          camState.desiredPhi = Math.PI / 3.1;
          camState.desiredRadius = 35;
          camState.cinematicRotate = false;
        } else if (presetName === 'CINEMATIC') {
          camState.desiredPhi = Math.PI / 3.4;
          camState.desiredRadius = 32;
          camState.cinematicRotate = true;
        }
      },

      focusOnCell: (row, col) => {
        const { x, z } = cellToWorld(row, col);
        camState.desiredTarget.set(x, 0, z);
      },

      resetCameraCenter: () => {
        camState.desiredTarget.set(0, 0, 0);
      },

      zoomDelta: (delta) => {
        camState.desiredRadius = Math.max(12, Math.min(58, camState.desiredRadius + delta));
      },
    };

    sceneApiRef.current = api;
    if (sceneRef) {
      sceneRef.current = api;
    }

    // Render initial moves
    if (moves.length > 0) {
      moves.forEach((m) => {
        api.spawnPiece3D(m.row, m.col, m.player, false);
      });
    }

    // 8. Raycasting & Event Handlers
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const getIntersectedCell = (clientX: number, clientY: number): CellCoord | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - topOffset(rect)) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const hits = raycaster.intersectObject(raycastPlane);
      if (hits.length > 0) {
        const pt = hits[0].point;
        const col = Math.floor((pt.x + halfSpan) / cellSize);
        const row = Math.floor((pt.z + halfSpan) / cellSize);
        if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
          return { row, col };
        }
      }
      return null;
    };

    function topOffset(rect: DOMRect) {
      return rect.top;
    }

    let lastHoveredKey = '';

    const onPointerDown = (e: PointerEvent) => {
      camState.isDragging = true;
      camState.isPanning = e.button === 2 || e.shiftKey;
      camState.dragStartX = e.clientX;
      camState.dragStartY = e.clientY;
      camState.pointerMovedDist = 0;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (camState.isDragging) {
        const dx = e.clientX - camState.dragStartX;
        const dy = e.clientY - camState.dragStartY;
        camState.pointerMovedDist += Math.hypot(dx, dy);
        camState.dragStartX = e.clientX;
        camState.dragStartY = e.clientY;

        if (camState.isPanning) {
          const panSpeed = 0.035;
          const forward = new THREE.Vector3(Math.sin(camState.theta), 0, Math.cos(camState.theta));
          const right = new THREE.Vector3(Math.cos(camState.theta), 0, -Math.sin(camState.theta));
          camState.desiredTarget.addScaledVector(right, -dx * panSpeed);
          camState.desiredTarget.addScaledVector(forward, -dy * panSpeed);
          camState.desiredTarget.x = Math.max(-14, Math.min(14, camState.desiredTarget.x));
          camState.desiredTarget.z = Math.max(-14, Math.min(14, camState.desiredTarget.z));
        } else {
          camState.desiredTheta -= dx * 0.0065;
          camState.desiredPhi = Math.max(0.08, Math.min(Math.PI / 2.25, camState.desiredPhi - dy * 0.0065));
        }
        return;
      }

      const cell = getIntersectedCell(e.clientX, e.clientY);
      if (cell) {
        const { x, z } = cellToWorld(cell.row, cell.col);
        hoverGroup.position.set(x, 0, z);
        hoverGroup.visible = true;

        const key = `${cell.row}-${cell.col}`;
        if (key !== lastHoveredKey) {
          lastHoveredKey = key;
          onCellHoverRef.current?.(cell);
        }
      } else {
        hoverGroup.visible = false;
        if (lastHoveredKey !== '') {
          lastHoveredKey = '';
          onCellHoverRef.current?.(null);
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const wasClick = camState.pointerMovedDist < 7 && e.button === 0 && !e.shiftKey;
      camState.isDragging = false;

      if (wasClick) {
        const cell = getIntersectedCell(e.clientX, e.clientY);
        if (cell) {
          onCellClickRef.current(cell.row, cell.col);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camState.desiredRadius = Math.max(12, Math.min(58, camState.desiredRadius + e.deltaY * 0.025));
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domElem.addEventListener('wheel', onWheel, { passive: false });
    domElem.addEventListener('contextmenu', onContextMenu);

    // 9. Main Render Loop
    let reqId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      if (camState.cinematicRotate && !camState.isDragging) {
        camState.desiredTheta += 0.003;
      }

      // Smooth Camera Interpolation
      camState.theta += (camState.desiredTheta - camState.theta) * 0.1;
      camState.phi += (camState.desiredPhi - camState.phi) * 0.1;
      camState.radius += (camState.desiredRadius - camState.radius) * 0.12;
      camState.target.lerp(camState.desiredTarget, 0.12);

      camera.position.x = camState.target.x + camState.radius * Math.sin(camState.phi) * Math.sin(camState.theta);
      camera.position.y = camState.target.y + camState.radius * Math.cos(camState.phi);
      camera.position.z = camState.target.z + camState.radius * Math.sin(camState.phi) * Math.cos(camState.theta);
      camera.lookAt(camState.target);

      // Animate Hover Indicator Pulse
      if (hoverGroup.visible) {
        const scale = 1 + Math.sin(elapsed * 6) * 0.08;
        hoverRing.scale.set(scale, scale, 1);
      }

      // Animate Last Move Beacon
      if (lastMoveBeacon.visible) {
        const bScale = 1 + Math.sin(elapsed * 5) * 0.14;
        beaconRing.scale.set(bScale, bScale, 1);
        beaconPillar.rotation.y = elapsed * 1.5;
      }

      // Animate Rotating Cores
      piecesGroup.children.forEach((piece) => {
        if (piece.userData.core) {
          piece.userData.core.rotation.y = elapsed * 2.4;
          piece.userData.core.rotation.x = elapsed * 1.6;
          piece.userData.core.position.y = 0.38 + Math.sin(elapsed * 3.5 + piece.position.x) * 0.05;
        }
      });

      // Update Effects
      effectsManager.update();

      // Ambient Cyber Dust
      ambientParticles.rotation.y = elapsed * 0.025;

      renderer.render(scene, camera);
    };

    animate();
    setSceneReady(true);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      domElem.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domElem.removeEventListener('wheel', onWheel);
      domElem.removeEventListener('contextmenu', onContextMenu);
      renderer.dispose();
      sceneApiRef.current = null;
      if (sceneRef) {
        sceneRef.current = null;
      }
    };
  }, []);

  // Reactive sync for Camera Preset buttons (3D Nghiêng / 2D Đỉnh / Xoay 360°)
  useEffect(() => {
    if (!sceneReady || !cameraPreset || !sceneApiRef.current) return;
    sceneApiRef.current.setCameraPresetView(cameraPreset);
  }, [cameraPreset, sceneReady]);

  // Reactive sync for Hover Tile color based on current player turn (Cyan X / Magenta O)
  useEffect(() => {
    if (hoverTileMatRef.current) {
      hoverTileMatRef.current.color.setHex(currentPlayer === 'O' ? 0xff007f : 0x00f3ff);
    }
  }, [currentPlayer, sceneReady]);

  // Reactive sync for 3D Pieces whenever moves array changes
  useEffect(() => {
    if (!sceneReady || !sceneApiRef.current) return;
    if (moves.length === 0) {
      if (piecesCountRef.current > 0) {
        sceneApiRef.current.clearAllPieces();
      }
      return;
    }
    if (moves.length < piecesCountRef.current) {
      sceneApiRef.current.syncBoardState(moves);
      return;
    }
    moves.forEach((m, idx) => {
      const isLatest = idx === moves.length - 1;
      sceneApiRef.current?.spawnPiece3D(m.row, m.col, m.player, isLatest);
    });
  }, [moves, sceneReady]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={mountRef} className="w-full h-full cursor-crosshair" />
      {!sceneReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-30">
          <div className="w-12 h-12 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin mb-3" />
          <p className="text-cyan-300 font-bold tracking-wider">ĐANG KHỞI TẠO ĐẤU TRƯỜNG 3D 30x30...</p>
        </div>
      )}
    </div>
  );
});
