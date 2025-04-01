// src/components/Room.tsx
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { RoomData, Opening } from './roomData'; // Adjust import if needed

interface RoomProps {
  roomData: RoomData;
  showPlaceholders?: boolean;
}

function createWallGeometry(
  wallWidth: number,
  wallHeight: number,
  openings: Opening[],
  wallThickness: number = 0.1
): THREE.ExtrudeGeometry | null {
    const wallShape = new THREE.Shape();
    wallShape.moveTo(0, 0);
    wallShape.lineTo(wallWidth, 0);
    wallShape.lineTo(wallWidth, wallHeight);
    wallShape.lineTo(0, wallHeight);
    wallShape.lineTo(0, 0);

    openings.forEach(opening => {
        const holePath = new THREE.Path();
        const x = opening.distanceFromCorner;
        const y = opening.bottom ?? 0;
        holePath.moveTo(x, y);
        holePath.lineTo(x + opening.width, y);
        holePath.lineTo(x + opening.width, y + opening.height);
        holePath.lineTo(x, y + opening.height);
        holePath.lineTo(x, y);
        wallShape.holes.push(holePath);
    });

    const extrudeSettings = { steps: 1, depth: wallThickness, bevelEnabled: false };

    try {
        const geometry = new THREE.ExtrudeGeometry(wallShape, extrudeSettings);
        geometry.center();
        return geometry;
    } catch (error) {
        console.error("Error creating extruded geometry:", error, { wallWidth, wallHeight, openings });
        return null;
    }
}

function Room({ roomData, showPlaceholders = true }: RoomProps) {
  const { width, height, depth, doors, windows, lights } = roomData;
  const wallThickness = 0.1;

  const wallGeometries = useMemo(() => {
    const openingsByWall = {
      back: [...doors, ...windows].filter(o => o.wall === 'back'),
      front: [...doors, ...windows].filter(o => o.wall === 'front'),
      left: [...doors, ...windows].filter(o => o.wall === 'left'),
      right: [...doors, ...windows].filter(o => o.wall === 'right'),
    };
    return {
      back: createWallGeometry(width, height, openingsByWall.back, wallThickness),
      left: createWallGeometry(depth, height, openingsByWall.left, wallThickness),
      right: createWallGeometry(depth, height, openingsByWall.right, wallThickness),
    };
  }, [width, height, depth, doors, windows, wallThickness]);

  // --- Materials ---
  const floorMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#a0522d', side: THREE.DoubleSide }), []);

  // **** 使用 MeshBasicMaterial 并强制 DoubleSide ****
  const wallMaterial = useMemo(() => new THREE.MeshBasicMaterial({
     color: 'white',
     side: THREE.DoubleSide // <--- 强制渲染双面
     }), []);
  // ************************************************

  const doorPlaceholderMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: 'grey', side: THREE.DoubleSide }), []);
  const windowPlaceholderMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: 'skyblue', side: THREE.DoubleSide }), []);
  const lightPlaceholderMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: 'yellow' }), []);

  const calculateOpeningTransform = (opening: Opening) => {
    let pos: [number, number, number] = [0, 0, 0];
    let rot: [number, number, number] = [0, 0, 0];
    const placeholderDepth = wallThickness;
    const centerOffset = opening.distanceFromCorner + opening.width / 2;
    const verticalCenter = (opening.bottom ?? 0) + opening.height / 2;

    if (opening.wall === 'back') {
        pos = [centerOffset - width / 2, verticalCenter, -depth / 2];
    } else if (opening.wall === 'left') {
        pos = [-width / 2, verticalCenter, centerOffset - depth / 2];
        rot = [0, Math.PI / 2, 0];
    } else if (opening.wall === 'right') {
        pos = [width / 2, verticalCenter, centerOffset - depth / 2];
        rot = [0, -Math.PI / 2, 0];
    }
    return { pos, rot, args: [opening.width, opening.height, placeholderDepth] as [number, number, number] };
  };

  return (
    <group position={[0, -height / 2, 0]}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={floorMaterial}>
        <planeGeometry args={[width, depth]} />
      </mesh>
      {/* Walls using the DOUBLE_SIDED basic material */}
      {wallGeometries.back && (
        <mesh geometry={wallGeometries.back} material={wallMaterial} position={[0, height / 2, -depth / 2]} />
      )}
      {wallGeometries.left && (
        <mesh geometry={wallGeometries.left} material={wallMaterial} rotation={[0, Math.PI / 2, 0]} position={[-width / 2, height / 2, 0]} />
      )}
      {wallGeometries.right && (
        <mesh geometry={wallGeometries.right} material={wallMaterial} rotation={[0, -Math.PI / 2, 0]} position={[width / 2, height / 2, 0]} />
      )}

      {/* Placeholders */}
      {showPlaceholders && doors.map(door => {
        const { pos, rot, args } = calculateOpeningTransform(door);
        return ( <mesh key={door.id} position={pos} rotation={rot} material={doorPlaceholderMaterial}><boxGeometry args={args} /></mesh> )
      })}
      {showPlaceholders && windows.map(window => {
        const { pos, rot, args } = calculateOpeningTransform(window);
        return ( <mesh key={window.id} position={pos} rotation={rot} material={windowPlaceholderMaterial}><boxGeometry args={args} /></mesh> )
      })}

      {/* Lights */}
      {lights.map(light => (
        <React.Fragment key={light.id}>
          {showPlaceholders && ( <mesh position={light.position} material={lightPlaceholderMaterial}><sphereGeometry args={[0.1, 16, 16]} /></mesh> )}
          <pointLight position={light.position} intensity={40} distance={Math.max(width, depth) * 1.2} decay={1.5} />
        </React.Fragment>
      ))}
    </group>
  );
}

export default Room;