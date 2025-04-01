// src/components/RotatingCube.tsx
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber'; // 导入 useFrame Hook 用于动画
import * as THREE from 'three'; // 导入 THREE 核心库，主要用于类型定义

function RotatingCube() {
  // useRef 用于获取对 Three.js 对象（这里是 Mesh）的引用
  const meshRef = useRef<THREE.Mesh>(null!);

  // useState 用于管理组件的状态：是否被鼠标悬停、是否被点击（激活）
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);

  // useFrame Hook 会在每一帧渲染前执行传入的回调函数
  useFrame((_state, delta) => {
    if (meshRef.current) {
      // 让立方体持续旋转
      meshRef.current.rotation.x += delta * 0.4; // 乘以 delta 保证不同帧率下速度一致
      meshRef.current.rotation.y += delta * 0.4;
    }
  });

  // 返回 JSX 来声明式地描述 3D 对象
  return (
    // mesh 代表一个 3D 物体
    <mesh
      ref={meshRef} // 将 ref 附加到 mesh 上，以便在 useFrame 中访问
      // 根据 active 状态改变大小，点击时放大
      scale={active ? 1.5 : 1}
      // 点击事件：切换 active 状态
      onClick={() => setActive(!active)}
      // 鼠标指针移入事件
      onPointerOver={(event) => {
        event.stopPropagation(); // 可选：阻止事件冒泡到父级
        setHover(true); // 设置悬停状态为 true
      }}
      // 鼠标指针移出事件
      onPointerOut={() => setHover(false)} // 设置悬停状态为 false
    >
      {/* 定义几何体：一个盒子（立方体） */}
      {/* args 传递给 BoxGeometry 构造函数的参数：[width, height, depth] */}
      <boxGeometry args={[1.5, 1.5, 1.5]} />

      {/* 定义材质：标准网格材质，能很好地响应光照 */}
      {/* 根据 hovered 状态动态改变颜色 */}
      <meshStandardMaterial color={hovered ? '#ff69b4' : '#ffa500'} /> {/* hotpink 或 orange */}
    </mesh>
  );
}

export default RotatingCube; // 导出组件