// src/components/SceneContainer.tsx
import React, { Suspense, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
// 导入 Sky 和 OrbitControls
import { OrbitControls, Sky } from '@react-three/drei';

interface SceneContainerProps {
  children: ReactNode;
}

function SceneContainer({ children }: SceneContainerProps) {
  return (
    <Canvas camera={{ position: [0, 5, 15], fov: 60 }}>
      {/* --- 添加天空背景 --- */}
      {/* Sky 组件会自动设置 scene.background */}
      {/* 你可以调整 sunPosition 来改变光照方向和天空颜色 */}
      <Sky sunPosition={[100, 20, 100]} distance={1000}/>

      {/* --- 通用场景设置 (灯光、控制器等保持不变) --- */}
      <ambientLight intensity={Math.PI / 2} /> {/* 可能需要根据天空亮度调整环境光 */}
      {/* 保留点光源，它们仍然会影响房间内部 */}
      <pointLight position={[5, 5, 5]} intensity={150} />
      <pointLight position={[-3, -3, 2]} intensity={80} color="lightblue" />

      <OrbitControls enableDamping dampingFactor={0.05} />

      {/* --- 渲染传入的具体内容 --- */}
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </Canvas>
  );
}

export default SceneContainer;