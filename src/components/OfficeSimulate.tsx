// src/components/OfficeSimulate.tsx
import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import Person from './Person';
import { officeObstacles, officeHotspots } from './OfficeData';

// 定义障碍物的类型
interface Obstacle {
  position: THREE.Vector3;
  dimensions: THREE.Vector3;
  rotation?: number; // Y轴旋转角度，默认为0
  type?: string; // 障碍物类型，用于调试
}

// 定义热点区域的类型
interface Hotspot {
  position: THREE.Vector3;
  radius: number;
  type: string; // 热点类型: 'coffee', 'printer', 'watercooler', 'meeting', 'lunch', 'desk'
  capacity: number; // 最大容纳人数
  minDuration: number; // 最短停留时间（秒）
  maxDuration: number; // 最长停留时间（秒）
}

// 定义工作状态
export enum OfficeState {
  WORKING = 'working',      // 正常工作
  LUNCH_TIME = 'lunch',     // 午餐时间
  ARRIVING = 'arriving',    // 上班时间
  LEAVING = 'leaving'       // 下班时间
}

// 人员属性
interface PersonData {
  id: string;
  initialPosition: [number, number, number];
  color: string;
  isStationary?: boolean;
  defaultHotspot?: string;
  role?: string;
}

const OfficeSimulate: React.FC = () => {
  // 状态管理
  const [officeState, setOfficeState] = useState<OfficeState>(OfficeState.WORKING);

  // --- 尺寸常量 ---
  const floorSize = 35; // 地板大小
  const wallHeight = 5;
  const personY = 1 / 2; // 人物Y坐标

  // 定义人物活动范围
  const personBounds = {
    minX: -floorSize / 2 + 1,
    maxX: floorSize / 2 - 1,
    minZ: -floorSize / 2 + 1,
    maxZ: floorSize / 2 - 1,
  };

  // 从外部数据文件导入障碍物
  const obstacles = useMemo<Obstacle[]>(() => officeObstacles(floorSize, wallHeight), [floorSize, wallHeight]);

  // 从外部数据文件导入热点区域
  const hotspots = useMemo<Hotspot[]>(() => officeHotspots(floorSize), [floorSize]);

  // 定义人员 - 根据不同的办公室状态有不同的行为
  const people = useMemo<PersonData[]>(() => {
    const basePeople = [
      // 固定位置的员工 (前台接待)
      { id: "receptionist", initialPosition: [0, personY, floorSize / 2 - 4] as [number, number, number], color: "pink", isStationary: true },

      // 办公区员工 (18人)
      { id: "emp1", initialPosition: [-12, personY, -3] as [number, number, number], color: "red", defaultHotspot: "desk", role: "worker" },
      { id: "emp2", initialPosition: [-12, personY, -5] as [number, number, number], color: "blue", defaultHotspot: "desk", role: "worker" },
      { id: "emp3", initialPosition: [-12, personY, -7] as [number, number, number], color: "green", defaultHotspot: "desk", role: "worker" },
      { id: "emp4", initialPosition: [-9, personY, -3] as [number, number, number], color: "purple", defaultHotspot: "desk", role: "worker" },
      { id: "emp5", initialPosition: [-9, personY, -5] as [number, number, number], color: "orange", defaultHotspot: "desk", role: "worker" },
      { id: "emp6", initialPosition: [-9, personY, -7] as [number, number, number], color: "cyan", defaultHotspot: "desk", role: "worker" },

      { id: "emp7", initialPosition: [-4, personY, -3] as [number, number, number], color: "yellow", defaultHotspot: "desk", role: "worker" },
      { id: "emp8", initialPosition: [-4, personY, -5] as [number, number, number], color: "magenta", defaultHotspot: "desk", role: "worker" },
      { id: "emp9", initialPosition: [-4, personY, -7] as [number, number, number], color: "lime", defaultHotspot: "desk", role: "worker" },
      { id: "emp10", initialPosition: [-1, personY, -3] as [number, number, number], color: "indigo", defaultHotspot: "desk", role: "worker" },
      { id: "emp11", initialPosition: [-1, personY, -5] as [number, number, number], color: "teal", defaultHotspot: "desk", role: "worker" },
      { id: "emp12", initialPosition: [-1, personY, -7] as [number, number, number], color: "maroon", defaultHotspot: "desk", role: "worker" },

      { id: "emp13", initialPosition: [4, personY, -3] as [number, number, number], color: "navy", defaultHotspot: "desk", role: "worker" },
      { id: "emp14", initialPosition: [4, personY, -5] as [number, number, number], color: "olive", defaultHotspot: "desk", role: "worker" },
      { id: "emp15", initialPosition: [4, personY, -7] as [number, number, number], color: "gold", defaultHotspot: "desk", role: "worker" },
      { id: "emp16", initialPosition: [7, personY, -3] as [number, number, number], color: "silver", defaultHotspot: "desk", role: "worker" },
      { id: "emp17", initialPosition: [7, personY, -5] as [number, number, number], color: "brown", defaultHotspot: "desk", role: "worker" },
      { id: "emp18", initialPosition: [7, personY, -7] as [number, number, number], color: "coral", defaultHotspot: "desk", role: "worker" },

      // 管理层 (3人)
      { id: "manager1", initialPosition: [14, personY, -15] as [number, number, number], color: "black", defaultHotspot: "management", role: "manager" },
      { id: "manager2", initialPosition: [9, personY, -15] as [number, number, number], color: "darkblue", defaultHotspot: "management", role: "manager" },
      { id: "manager3", initialPosition: [4, personY, -15] as [number, number, number], color: "darkgreen", defaultHotspot: "management", role: "manager" },

      // 访客 (3人) - 随机游荡
      { id: "visitor1", initialPosition: [0, personY, floorSize / 2 - 6] as [number, number, number], color: "crimson", role: "visitor" },
      { id: "visitor2", initialPosition: [2, personY, floorSize / 2 - 6] as [number, number, number], color: "slateblue", role: "visitor" },
      { id: "visitor3", initialPosition: [-2, personY, floorSize / 2 - 6] as [number, number, number], color: "darkgoldenrod", role: "visitor" },
    ];

    // 根据不同的办公室状态修改人员行为
    return basePeople.map(person => {
      // 创建新对象避免修改原对象
      const modifiedPerson = { ...person };

      switch (officeState) {
        case OfficeState.LUNCH_TIME:
          // 午餐时间: 大部分人去餐厅/休息区，一些人留在工位
          if (person.role === 'worker' || person.role === 'manager') {
            // 80%的员工去吃午饭
            if (Math.random() < 0.8) {
              modifiedPerson.defaultHotspot = 'lunch';
            }
          }
          break;

        case OfficeState.ARRIVING:
          // 上班时间: 人们从入口移动到各自工位
          if (person.role === 'worker' || person.role === 'manager') {
            // 所有人从入口附近开始
            const offsetX = THREE.MathUtils.randFloat(-5, 5);
            const offsetZ = THREE.MathUtils.randFloat(-2, 2);
            // modifiedPerson.initialPosition = [offsetX, personY, floorSize / 2 - 5 + offsetZ];
            modifiedPerson.initialPosition = [offsetX, personY, floorSize / 2 - 5 + offsetZ] as [number, number, number];
          }
          break;

        case OfficeState.LEAVING:
          // 下班时间: 人们从工位移动到出口
          if (person.role === 'worker' || person.role === 'manager') {
            modifiedPerson.defaultHotspot = 'exit';
          }
          break;

        case OfficeState.WORKING:
        default:
          // 正常工作状态，使用默认配置
          break;
      }

      return modifiedPerson;
    });
  }, [floorSize, personY, officeState]);

  // 渲染地板颜色
  const getRandomColor = (type: string) => {
    switch (type) {
      case 'desk': return 0x8B4513; // 棕色
      case 'executive_desk': return 0x4d2e0d; // 深棕色
      case 'sofa': case 'executive_sofa': return 0x3f7eb3; // 蓝色
      case 'coffee_table': return 0x9f9f9f; // 灰色
      case 'file_cabinet': return 0x696969; // 深灰色
      case 'bookshelf': return 0x8e6237; // 中棕色
      case 'printer': return 0x2d2d2d; // 黑色
      case 'water_cooler': return 0xadd8e6; // 浅蓝色
      case 'kitchen_counter': return 0xf5f5dc; // 米色
      case 'refrigerator': return 0xdcdcdc; // 浅灰色
      case 'plant': return 0x228B22; // 绿色
      case 'meeting_table': case 'small_meeting_table': return 0x5c4033; // 深棕色
      case 'reception_desk': return 0x7e1e9c; // 紫色
      case 'column': return 0xe6e6e6; // 浅灰色
      case 'ping_pong_table': return 0x006400; // 深绿色
      default: return 0xcccccc; // 默认灰色
    }
  };

  // 状态切换按钮
  const StateToggleButtons = () => {
    return (
      <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          style={{
            padding: '8px 16px',
            backgroundColor: officeState === OfficeState.WORKING ? '#4CAF50' : '#e0e0e0',
            color: officeState === OfficeState.WORKING ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
          onClick={() => setOfficeState(OfficeState.WORKING)}
        >
          Working
        </button>
        <button
          style={{
            padding: '8px 16px',
            backgroundColor: officeState === OfficeState.LUNCH_TIME ? '#4CAF50' : '#e0e0e0',
            color: officeState === OfficeState.LUNCH_TIME ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
          onClick={() => setOfficeState(OfficeState.LUNCH_TIME)}
        >
          Lunch Time
        </button>
        <button
          style={{
            padding: '8px 16px',
            backgroundColor: officeState === OfficeState.ARRIVING ? '#4CAF50' : '#e0e0e0',
            color: officeState === OfficeState.ARRIVING ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
          onClick={() => setOfficeState(OfficeState.ARRIVING)}
        >
          Arriving
        </button>
        <button
          style={{
            padding: '8px 16px',
            backgroundColor: officeState === OfficeState.LEAVING ? '#4CAF50' : '#e0e0e0',
            color: officeState === OfficeState.LEAVING ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
          onClick={() => setOfficeState(OfficeState.LEAVING)}
        >
          Leaving
        </button>
      </div>
    );
  };

  // 根据当前办公室状态渲染状态说明
  const renderStateInfo = () => {
    let stateInfo = "";
    switch (officeState) {
      case OfficeState.WORKING:
        stateInfo = "Normal working hours: Employees work at their desks, occasionally taking breaks to move around.";
        break;
      case OfficeState.LUNCH_TIME:
        stateInfo = "Lunch time: Most employees head to the break area or pantry for meals.";
        break;
      case OfficeState.ARRIVING:
        stateInfo = "Arriving time: Employees gradually enter from the entrance and head to their desks.";
        break;
      case OfficeState.LEAVING:
        stateInfo = "Leaving time: Employees pack up their belongings and gradually leave the office.";
        break;
    }

    return (
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        maxWidth: '300px'
      }}>
        <h3 style={{ margin: '0 0 8px 0' }}>{stateInfo}</h3>
        <p style={{ margin: '0', fontSize: '14px' }}>
          Personnel: {people.length} |
          Obstacles: {obstacles.length} |
          Hotspot_Areas: {hotspots.length}
        </p>
      </div>
    );
  };

  return (
    <>
      {/* UI控制按钮 */}
      <Html fullscreen>
        <StateToggleButtons />
        {renderStateInfo()}
      </Html>

      {/* 3D场景 */}
      <group name="OfficeLayout_Enhanced">
        {/* 地面 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[floorSize, floorSize]} />
          <meshStandardMaterial color={0xf0f0f0} side={THREE.DoubleSide} />
        </mesh>

        {/* 渲染所有障碍物 */}
        {obstacles.map((obstacle, index) => (
          <mesh
            key={`obstacle-${index}`}
            position={[obstacle.position.x, obstacle.position.y, obstacle.position.z]}
            rotation={[0, obstacle.rotation || 0, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[obstacle.dimensions.x, obstacle.dimensions.y, obstacle.dimensions.z]} />
            <meshStandardMaterial
              color={getRandomColor(obstacle.type || 'default')}
              transparent={obstacle.type?.includes('glass') || false}
              opacity={obstacle.type?.includes('glass') ? 0.4 : 1}
            />
          </mesh>
        ))}

        {/* 地板纹理 - 不同区域不同颜色 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
          <planeGeometry args={[floorSize * 0.3, floorSize * 0.3]} />
          <meshStandardMaterial color={0xe8e8e8} side={THREE.DoubleSide} />
        </mesh>

        {/* 走廊标记 */}
        {/* 走廊标记 - 优化为地面线条 */}
        {/* 水平方向的标记 */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.01, 0]}
          receiveShadow
        >
          <planeGeometry args={[floorSize * 0.15, floorSize]} />
          <meshStandardMaterial color={0xf5f5f5} side={THREE.DoubleSide} />
        </mesh>

        {/* 添加人员 */}
        {people.map((person) => (
          <Person
            key={`${person.id}-${officeState}`} // 重要: 状态改变时强制重新创建
            id={person.id}
            bounds={personBounds}
            initialPosition={person.initialPosition}
            color={person.color}
            obstacles={obstacles}
            hotspots={hotspots}
            isStationary={person.isStationary}
            defaultHotspot={person.defaultHotspot}
            officeState={officeState} // 传递当前办公室状态
          />
        ))}
      </group>
    </>
  );
};

export default OfficeSimulate;