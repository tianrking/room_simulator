// src/components/OfficeSimulate.tsx
import React, { useMemo } from 'react';
import * as THREE from 'three';
import Person from './Person'; // 导入修改后的 Person 组件

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

const OfficeSimulate: React.FC = () => {
  // --- 尺寸常量 ---
  const floorSize = 35; // 更大的地板
  const wallHeight = 5;
  
  // 家具尺寸
  const deskSize = { width: 1.5, height: 0.8, depth: 0.7 };
  const bigDeskSize = { width: 2.2, height: 0.8, depth: 1.2 };
  const chairSize = { width: 0.5, height: 0.5, depth: 0.5 };
  const bookshelfSize = { width: 1.0, height: 2.0, depth: 0.4 };
  const sofaSize = { width: 2.0, height: 0.8, depth: 0.9 };
  const coffeeTableSize = { width: 1.2, height: 0.4, depth: 0.6 };
  const fileCabinetSize = { width: 0.6, height: 1.2, depth: 0.6 };
  const printerSize = { width: 1.0, height: 1.0, depth: 0.6 };
  const waterCoolerSize = { width: 0.5, height: 1.2, depth: 0.5 };
  const kitchenCounterSize = { width: 3.0, height: 0.9, depth: 0.7 };
  const refrigeratorSize = { width: 0.8, height: 1.8, depth: 0.8 };
  const pingPongTableSize = { width: 2.74, height: 0.05, depth: 1.52 };
  const pingPongTableHeight = 0.76;
  const pingPongNetSize = { width: 0.02, height: 0.15, depth: 1.6 };
  const meetingTableSize = { width: 3.5, height: 0.8, depth: 1.5 };
  const plantSize = { width: 0.6, height: 1.2, depth: 0.6 };
  const receptionDeskSize = { width: 2.5, height: 1.1, depth: 0.8 };
  const columnSize = { width: 0.8, height: wallHeight, depth: 0.8 };

  // 定义人物活动范围
  const personBounds = {
    minX: -floorSize / 2 + 1,
    maxX: floorSize / 2 - 1,
    minZ: -floorSize / 2 + 1,
    maxZ: floorSize / 2 - 1,
  };

  // 人物 Y 坐标
  const personY = 1 / 2;

  // 定义所有障碍物（家具、墙壁等）
  const obstacles = useMemo<Obstacle[]>(() => [
    // 入口区域和前台
    {
      position: new THREE.Vector3(0, receptionDeskSize.height / 2, floorSize / 2 - 3),
      dimensions: new THREE.Vector3(receptionDeskSize.width, receptionDeskSize.height, receptionDeskSize.depth),
      rotation: Math.PI, // 朝向入口
      type: 'reception_desk'
    },
    
    // 前台旁的装饰植物
    {
      position: new THREE.Vector3(-3, plantSize.height / 2, floorSize / 2 - 3),
      dimensions: new THREE.Vector3(plantSize.width, plantSize.height, plantSize.depth),
      type: 'plant'
    },
    {
      position: new THREE.Vector3(3, plantSize.height / 2, floorSize / 2 - 3),
      dimensions: new THREE.Vector3(plantSize.width, plantSize.height, plantSize.depth),
      type: 'plant'
    },

    // 等待区的沙发和茶几
    {
      position: new THREE.Vector3(-7, sofaSize.height / 2, floorSize / 2 - 5),
      dimensions: new THREE.Vector3(sofaSize.width, sofaSize.height, sofaSize.depth),
      rotation: Math.PI / 2,
      type: 'sofa'
    },
    {
      position: new THREE.Vector3(-9, coffeeTableSize.height / 2, floorSize / 2 - 5),
      dimensions: new THREE.Vector3(coffeeTableSize.width, coffeeTableSize.height, coffeeTableSize.depth),
      type: 'coffee_table'
    },
    
    // 支柱柱子 (4个角落和中间区域)
    {
      position: new THREE.Vector3(-floorSize / 3, columnSize.height / 2, -floorSize / 3),
      dimensions: new THREE.Vector3(columnSize.width, columnSize.height, columnSize.depth),
      type: 'column'
    },
    {
      position: new THREE.Vector3(floorSize / 3, columnSize.height / 2, -floorSize / 3),
      dimensions: new THREE.Vector3(columnSize.width, columnSize.height, columnSize.depth),
      type: 'column'
    },
    {
      position: new THREE.Vector3(-floorSize / 3, columnSize.height / 2, floorSize / 3),
      dimensions: new THREE.Vector3(columnSize.width, columnSize.height, columnSize.depth),
      type: 'column'
    },
    {
      position: new THREE.Vector3(floorSize / 3, columnSize.height / 2, floorSize / 3),
      dimensions: new THREE.Vector3(columnSize.width, columnSize.height, columnSize.depth),
      type: 'column'
    },
    
    // 主办公区 - 左侧工作区（6个工位）
    {
      position: new THREE.Vector3(-12, deskSize.height / 2, -2),
      dimensions: new THREE.Vector3(deskSize.width, deskSize.height, deskSize.depth),
      type: 'desk'
    },
    {
      position: new THREE.Vector3(-12, deskSize.height / 2, -4),
      dimensions: new THREE.Vector3(deskSize.width, deskSize.height, deskSize.depth),
      type: 'desk'
    },
    {
      position: new THREE.Vector3(-12, deskSize.height / 2, -6),
      dimensions: new THREE.Vector3(deskSize.width, deskSize.height, deskSize.depth),
      type: 'desk'
    },
    {
      position: new THREE.Vector3(-9, deskSize.height / 2, -2),
      dimensions: new THREE.Vector3(deskSize.width, deskSize.height, deskSize.depth),
      rotation: Math.PI,
      type: 'desk'
    },
    {
      position: new THREE.Vector3(-9, deskSize.height / 2, -4),
      dimensions: new THREE.Vector3(deskSize.width, deskSize.height, deskSize.depth),
      rotation: Math.PI,
      type: 'desk'
    },
    {
      position: new THREE.Vector3(-9, deskSize.height / 2, -6),
      dimensions: new THREE.Vector3(deskSize.width, deskSize.height, deskSize.depth),
      rotation: Math.PI,
      type: 'desk'
    },
    
    // 工作区旁的文件柜
    {
      position: new THREE.Vector3(-14, fileCabinetSize.height / 2, -4),
      dimensions: new THREE.Vector3(fileCabinetSize.width, fileCabinetSize.height, fileCabinetSize.depth),
      type: 'file_cabinet'
    },
    {
      position: new THREE.Vector3(-7, fileCabinetSize.height / 2, -4),
      dimensions: new THREE.Vector3(fileCabinetSize.width, fileCabinetSize.height, fileCabinetSize.depth),
      type: 'file_cabinet'
    },
    
    // 主办公区 - 中间工作区（6个工位）
    {
      position: new THREE.Vector3(-4, deskSize.height / 2, -2),
      dimensions: new THREE.Vector3(deskSize.width, deskSize.height, deskSize.depth),
      type: 'desk'
    },
    {
      position: new THREE.Vector3(-4, deskSize.height / 2, -4),
      dimensions: new THREE.Vector3(deskSize.width, deskSize.height, deskSize.depth),
      type: 'desk'
    },
    {
      position: new THREE.Vector3(-4, deskSize.height / 2, -6),
      dimensions: new THREE.Vector3(deskSize.width, deskSize.height, deskSize.depth),
      type: 'desk'
    },
    {
      position: new THREE.Vector3(-1, deskSize.height / 2, -2),
      dimensions: new THREE.Vector3(deskSize.width, deskSize.height, deskSize.depth),
      rotation: Math.PI,
      type: 'desk'
    },
    {
      position: new THREE.Vector3(-1, deskSize.height / 2, -4),
      dimensions: new THREE.Vector3(deskSize.width, deskSize.height, deskSize.depth),
      rotation: Math.PI,
      type: 'desk'
    },
    {
      position: new THREE.Vector3(-1, deskSize.height / 2, -6),
      dimensions: new THREE.Vector3(deskSize.width, deskSize.height, deskSize.depth),
      rotation: Math.PI,
      type: 'desk'
    },
    
    // 主办公区 - 右侧工作区（6个工位）
    {
      position: new THREE.Vector3(4, deskSize.height / 2, -2),
      dimensions: new THREE.Vector3(deskSize.width, deskSize.height, deskSize.depth),
      type: 'desk'
    },
    {
      position: new THREE.Vector3(4, deskSize.height / 2, -4),
      dimensions: new THREE.Vector3(deskSize.width, deskSize.height, deskSize.depth),
      type: 'desk'
    },
    {
      position: new THREE.Vector3(4, deskSize.height / 2, -6),
      dimensions: new THREE.Vector3(deskSize.width, deskSize.height, deskSize.depth),
      type: 'desk'
    },
    {
      position: new THREE.Vector3(7, deskSize.height / 2, -2),
      dimensions: new THREE.Vector3(deskSize.width, deskSize.height, deskSize.depth),
      rotation: Math.PI,
      type: 'desk'
    },
    {
      position: new THREE.Vector3(7, deskSize.height / 2, -4),
      dimensions: new THREE.Vector3(deskSize.width, deskSize.height, deskSize.depth),
      rotation: Math.PI,
      type: 'desk'
    },
    {
      position: new THREE.Vector3(7, deskSize.height / 2, -6),
      dimensions: new THREE.Vector3(deskSize.width, deskSize.height, deskSize.depth),
      rotation: Math.PI,
      type: 'desk'
    },
    
    // 打印/复印区
    {
      position: new THREE.Vector3(11, printerSize.height / 2, -10),
      dimensions: new THREE.Vector3(printerSize.width, printerSize.height, printerSize.depth),
      type: 'printer'
    },
    
    // 书架/资料区
    {
      position: new THREE.Vector3(-14, bookshelfSize.height / 2, -10),
      dimensions: new THREE.Vector3(bookshelfSize.width, bookshelfSize.height, bookshelfSize.depth),
      type: 'bookshelf'
    },
    {
      position: new THREE.Vector3(-14, bookshelfSize.height / 2, -12),
      dimensions: new THREE.Vector3(bookshelfSize.width, bookshelfSize.height, bookshelfSize.depth),
      type: 'bookshelf'
    },
    
    // 饮水区
    {
      position: new THREE.Vector3(0, waterCoolerSize.height / 2, -12),
      dimensions: new THREE.Vector3(waterCoolerSize.width, waterCoolerSize.height, waterCoolerSize.depth),
      type: 'water_cooler'
    },
    
    // 休息区/茶水间
    {
      position: new THREE.Vector3(-10, kitchenCounterSize.height / 2, 10),
      dimensions: new THREE.Vector3(kitchenCounterSize.width, kitchenCounterSize.height, kitchenCounterSize.depth),
      type: 'kitchen_counter'
    },
    {
      position: new THREE.Vector3(-13, refrigeratorSize.height / 2, 10),
      dimensions: new THREE.Vector3(refrigeratorSize.width, refrigeratorSize.height, refrigeratorSize.depth),
      type: 'refrigerator'
    },
    {
      position: new THREE.Vector3(-8, coffeeTableSize.height / 2, 8),
      dimensions: new THREE.Vector3(coffeeTableSize.width, coffeeTableSize.height, coffeeTableSize.depth),
      type: 'coffee_table'
    },
    {
      position: new THREE.Vector3(-10, sofaSize.height / 2, 6),
      dimensions: new THREE.Vector3(sofaSize.width, sofaSize.height, sofaSize.depth),
      type: 'sofa'
    },
    
    // 会议室 (大)
    {
      position: new THREE.Vector3(10, meetingTableSize.height / 2, 0),
      dimensions: new THREE.Vector3(meetingTableSize.width, meetingTableSize.height, meetingTableSize.depth),
      type: 'meeting_table'
    },
    // 会议室玻璃墙
    {
      position: new THREE.Vector3(12, wallHeight * 0.8 / 2, -3),
      dimensions: new THREE.Vector3(8, wallHeight * 0.8, 0.1),
      rotation: Math.PI / 2,
      type: 'glass_wall'
    },
    {
      position: new THREE.Vector3(12, wallHeight * 0.8 / 2, 3),
      dimensions: new THREE.Vector3(8, wallHeight * 0.8, 0.1),
      rotation: Math.PI / 2,
      type: 'glass_wall'
    },
    {
      position: new THREE.Vector3(8, wallHeight * 0.8 / 2, 3),
      dimensions: new THREE.Vector3(0.1, wallHeight * 0.8, 8),
      type: 'glass_wall'
    },
    
    // 会议室 (小)
    {
      position: new THREE.Vector3(0, meetingTableSize.height / 2, -16),
      dimensions: new THREE.Vector3(meetingTableSize.width * 0.6, meetingTableSize.height, meetingTableSize.depth * 0.6),
      type: 'small_meeting_table'
    },
    // 小会议室玻璃墙
    {
      position: new THREE.Vector3(3, wallHeight * 0.8 / 2, -14),
      dimensions: new THREE.Vector3(6, wallHeight * 0.8, 0.1),
      rotation: Math.PI / 2,
      type: 'glass_wall'
    },
    {
      position: new THREE.Vector3(-3, wallHeight * 0.8 / 2, -14),
      dimensions: new THREE.Vector3(6, wallHeight * 0.8, 0.1),
      rotation: Math.PI / 2,
      type: 'glass_wall'
    },
    {
      position: new THREE.Vector3(3, wallHeight * 0.8 / 2, -17),
      dimensions: new THREE.Vector3(6, wallHeight * 0.8, 0.1),
      rotation: Math.PI / 2,
      type: 'glass_wall'
    },
    
    // 管理层办公室 (3个)
    {
      position: new THREE.Vector3(14, bigDeskSize.height / 2, -15),
      dimensions: new THREE.Vector3(bigDeskSize.width, bigDeskSize.height, bigDeskSize.depth),
      rotation: Math.PI / 2,
      type: 'executive_desk'
    },
    {
      position: new THREE.Vector3(12, sofaSize.height / 2, -12),
      dimensions: new THREE.Vector3(sofaSize.width * 0.8, sofaSize.height, sofaSize.depth * 0.8),
      type: 'executive_sofa'
    },
    // 管理层办公室墙
    {
      position: new THREE.Vector3(16, wallHeight * 0.9 / 2, -12),
      dimensions: new THREE.Vector3(0.1, wallHeight * 0.9, 8),
      type: 'office_wall'
    },
    {
      position: new THREE.Vector3(14, wallHeight * 0.9 / 2, -8),
      dimensions: new THREE.Vector3(4, wallHeight * 0.9, 0.1),
      type: 'office_wall'
    },
    
    // 乒乓球桌
    {
      position: new THREE.Vector3(8, pingPongTableHeight, 10),
      dimensions: new THREE.Vector3(pingPongTableSize.width, pingPongTableSize.height, pingPongTableSize.depth),
      type: 'ping_pong_table'
    },
    
    // 房间边界墙壁
    {
      position: new THREE.Vector3(0, wallHeight / 2, -floorSize / 2),
      dimensions: new THREE.Vector3(floorSize, wallHeight, 0.2),
      type: 'back_wall'
    },
    {
      position: new THREE.Vector3(-floorSize / 2, wallHeight / 2, 0),
      dimensions: new THREE.Vector3(0.2, wallHeight, floorSize),
      type: 'left_wall'
    },
    {
      position: new THREE.Vector3(floorSize / 2, wallHeight / 2, 0),
      dimensions: new THREE.Vector3(0.2, wallHeight, floorSize),
      type: 'right_wall'
    },
    {
      position: new THREE.Vector3(0, wallHeight / 2, floorSize / 2),
      dimensions: new THREE.Vector3(floorSize * 0.6, wallHeight, 0.2), // 入口处有缺口
      type: 'front_wall'
    },
    {
      position: new THREE.Vector3(-floorSize * 0.4, wallHeight / 2, floorSize / 2),
      dimensions: new THREE.Vector3(floorSize * 0.2, wallHeight, 0.2),
      type: 'front_wall_segment'
    },
    {
      position: new THREE.Vector3(floorSize * 0.4, wallHeight / 2, floorSize / 2),
      dimensions: new THREE.Vector3(floorSize * 0.2, wallHeight, 0.2),
      type: 'front_wall_segment'
    },
  ], []);

  // 定义热点区域 - 人们会在这些区域逗留
  const hotspots = useMemo<Hotspot[]>(() => [
    {
      position: new THREE.Vector3(0, 0, -12), // 饮水区
      radius: 1.5,
      type: 'watercooler',
      capacity: 3,
      minDuration: 20,
      maxDuration: 60
    },
    {
      position: new THREE.Vector3(11, 0, -10), // 打印区
      radius: 1.5,
      type: 'printer',
      capacity: 2,
      minDuration: 15,
      maxDuration: 90
    },
    {
      position: new THREE.Vector3(-9, 0, 7), // 休息区
      radius: 2.5,
      type: 'lounge',
      capacity: 4,
      minDuration: 300,
      maxDuration: 600
    },
    {
      position: new THREE.Vector3(10, 0, 0), // 大会议室
      radius: 3.0,
      type: 'meeting',
      capacity: 8,
      minDuration: 1800,
      maxDuration: 3600
    },
    {
      position: new THREE.Vector3(0, 0, -16), // 小会议室
      radius: 2.0,
      type: 'meeting',
      capacity: 4,
      minDuration: 900,
      maxDuration: 1800
    },
    {
      position: new THREE.Vector3(8, 0, 10), // 乒乓球区
      radius: 2.5,
      type: 'pingpong',
      capacity: 4,
      minDuration: 600,
      maxDuration: 1200
    },
    {
      position: new THREE.Vector3(-11, 0, 10), // 茶水间
      radius: 2.0,
      type: 'kitchen',
      capacity: 3,
      minDuration: 120,
      maxDuration: 300
    },
    {
      position: new THREE.Vector3(0, 0, floorSize / 2 - 3), // 前台
      radius: 2.0,
      type: 'reception',
      capacity: 2,
      minDuration: 60,
      maxDuration: 180
    },
    // 各工位热点
    {
      position: new THREE.Vector3(-12, 0, -2),
      radius: 1.0,
      type: 'desk',
      capacity: 1,
      minDuration: 1800,
      maxDuration: 3600
    },
    {
      position: new THREE.Vector3(-12, 0, -4),
      radius: 1.0,
      type: 'desk',
      capacity: 1,
      minDuration: 1800,
      maxDuration: 3600
    },
    {
      position: new THREE.Vector3(-12, 0, -6),
      radius: 1.0,
      type: 'desk',
      capacity: 1,
      minDuration: 1800,
      maxDuration: 3600
    },
    {
      position: new THREE.Vector3(-9, 0, -2),
      radius: 1.0,
      type: 'desk',
      capacity: 1,
      minDuration: 1800,
      maxDuration: 3600
    },
    {
      position: new THREE.Vector3(-9, 0, -4),
      radius: 1.0,
      type: 'desk',
      capacity: 1,
      minDuration: 1800,
      maxDuration: 3600
    },
    {
      position: new THREE.Vector3(-9, 0, -6),
      radius: 1.0,
      type: 'desk',
      capacity: 1,
      minDuration: 1800,
      maxDuration: 3600
    },
    {
      position: new THREE.Vector3(-4, 0, -2),
      radius: 1.0,
      type: 'desk',
      capacity: 1,
      minDuration: 1800,
      maxDuration: 3600
    },
    {
      position: new THREE.Vector3(-4, 0, -4),
      radius: 1.0,
      type: 'desk',
      capacity: 1,
      minDuration: 1800,
      maxDuration: 3600
    },
    {
      position: new THREE.Vector3(-4, 0, -6),
      radius: 1.0,
      type: 'desk',
      capacity: 1,
      minDuration: 1800,
      maxDuration: 3600
    },
  ], []);

  // 定义人员 - 固定位置和随机流动的人员
  const people = useMemo(() => [
    // 固定位置的员工 (前台接待)
    { id: "receptionist", initialPosition: [0, personY, floorSize / 2 - 4], color: "pink", isStationary: true },
    
    // 办公区员工 (18人)
    { id: "emp1", initialPosition: [-12, personY, -3], color: "red", defaultHotspot: "desk" },
    { id: "emp2", initialPosition: [-12, personY, -5], color: "blue", defaultHotspot: "desk" },
    { id: "emp3", initialPosition: [-12, personY, -7], color: "green", defaultHotspot: "desk" },
    { id: "emp4", initialPosition: [-9, personY, -3], color: "purple", defaultHotspot: "desk" },
    { id: "emp5", initialPosition: [-9, personY, -5], color: "orange", defaultHotspot: "desk" },
    { id: "emp6", initialPosition: [-9, personY, -7], color: "cyan", defaultHotspot: "desk" },
    
    { id: "emp7", initialPosition: [-4, personY, -3], color: "yellow", defaultHotspot: "desk" },
    { id: "emp8", initialPosition: [-4, personY, -5], color: "magenta", defaultHotspot: "desk" },
    { id: "emp9", initialPosition: [-4, personY, -7], color: "lime", defaultHotspot: "desk" },
    { id: "emp10", initialPosition: [-1, personY, -3], color: "indigo", defaultHotspot: "desk" },
    { id: "emp11", initialPosition: [-1, personY, -5], color: "teal", defaultHotspot: "desk" },
    { id: "emp12", initialPosition: [-1, personY, -7], color: "maroon", defaultHotspot: "desk" },
    
    { id: "emp13", initialPosition: [4, personY, -3], color: "navy", defaultHotspot: "desk" },
    { id: "emp14", initialPosition: [4, personY, -5], color: "olive", defaultHotspot: "desk" },
    { id: "emp15", initialPosition: [4, personY, -7], color: "gold", defaultHotspot: "desk" },
    { id: "emp16", initialPosition: [7, personY, -3], color: "silver", defaultHotspot: "desk" },
    { id: "emp17", initialPosition: [7, personY, -5], color: "brown", defaultHotspot: "desk" },
    { id: "emp18", initialPosition: [7, personY, -7], color: "coral", defaultHotspot: "desk" },
    
    // 管理层 (3人)
    { id: "manager1", initialPosition: [14, personY, -15], color: "black", defaultHotspot: "management" },
    { id: "manager2", initialPosition: [9, personY, -15], color: "darkblue", defaultHotspot: "management" },
    { id: "manager3", initialPosition: [4, personY, -15], color: "darkgreen", defaultHotspot: "management" },
    
    // 访客 (3人) - 随机游荡
    { id: "visitor1", initialPosition: [0, personY, floorSize / 2 - 6], color: "crimson" },
    { id: "visitor2", initialPosition: [2, personY, floorSize / 2 - 6], color: "slateblue" },
    { id: "visitor3", initialPosition: [-2, personY, floorSize / 2 - 6], color: "darkgoldenrod" },
  ], [floorSize, personY]);

  // 渲染函数,可以使用3D库来增强视觉效果
  const getRandomColor = (type: string) => {
    switch(type) {
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

  return (
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

      {/* 乒乓球桌网 */}
      <mesh 
        position={[8, pingPongTableHeight + pingPongNetSize.height / 2, 10]} 
        castShadow
      >
        <boxGeometry args={[pingPongNetSize.width, pingPongNetSize.height, pingPongNetSize.depth]} />
        <meshStandardMaterial color={0xeeeeee} />
      </mesh>

      {/* 地板纹理 - 不同区域不同颜色 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[floorSize * 0.3, floorSize * 0.3]} />
        <meshStandardMaterial color={0xe8e8e8} side={THREE.DoubleSide} />
      </mesh>

      {/* 走廊标记 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[floorSize * 0.15, floorSize]} />
        <meshStandardMaterial color={0xf5f5f5} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, Math.PI/2, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[floorSize * 0.15, floorSize]} />
        <meshStandardMaterial color={0xf5f5f5} side={THREE.DoubleSide} />
      </mesh>

      {/* 添加人员 */}
      {people.map((person) => (
        <Person 
          key={person.id}
          id={person.id}
          bounds={personBounds}
          initialPosition={person.initialPosition as [number, number, number]}
          color={person.color}
          obstacles={obstacles}
          hotspots={hotspots}
          isStationary={person.isStationary}
          defaultHotspot={person.defaultHotspot}
        />
      ))}
    </group>
  );
};

export default OfficeSimulate;