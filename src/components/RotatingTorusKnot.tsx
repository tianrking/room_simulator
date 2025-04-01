// src/components/RotatingTorusKnot.tsx
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 组件函数名也对应文件名
function RotatingTorusKnot() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);

  useFrame((_state, delta) => {
    if (meshRef.current) {
      // 可以设置不同的旋转速度
      meshRef.current.rotation.x += delta * 0.1;
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <mesh
      ref={meshRef}
      scale={active ? 1.5 : 1}
      onClick={() => setActive(!active)}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHover(true);
      }}
      onPointerOut={() => setHover(false)}
    >
      {/* 使用环面纽结体几何体 */}
      <torusKnotGeometry args={[1, 0.4, 128, 16]} /> {/* 半径1, 管径0.4, 细节128, 分段16 */}

      {/* 材质保持不变 */}
      <meshStandardMaterial color={hovered ? '#ff69b4' : '#ffa500'} />
    </mesh>
  );
}

// 确保导出的名称也正确
export default RotatingTorusKnot;