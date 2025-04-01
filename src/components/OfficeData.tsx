// src/components/OfficeData.tsx
import * as THREE from 'three';

// 定义障碍物的类型
export interface Obstacle {
  position: THREE.Vector3;
  dimensions: THREE.Vector3;
  rotation?: number; // Y轴旋转角度，默认为0
  type?: string; // 障碍物类型，用于调试
}

// 定义热点区域的类型
export interface Hotspot {
  position: THREE.Vector3;
  radius: number;
  type: string; // 热点类型: 'coffee', 'printer', 'watercooler', 'meeting', 'lunch', 'desk'
  capacity: number; // 最大容纳人数
  minDuration: number; // 最短停留时间（秒）
  maxDuration: number; // 最长停留时间（秒）
}

// 定义家具尺寸常量 - 集中管理尺寸数据
const furniture = {
  desk: { width: 1.5, height: 0.8, depth: 0.7 },
  bigDesk: { width: 2.2, height: 0.8, depth: 1.2 },
  chair: { width: 0.5, height: 0.5, depth: 0.5 },
  bookshelf: { width: 1.0, height: 2.0, depth: 0.4 },
  sofa: { width: 2.0, height: 0.8, depth: 0.9 },
  coffeeTable: { width: 1.2, height: 0.4, depth: 0.6 },
  fileCabinet: { width: 0.6, height: 1.2, depth: 0.6 },
  printer: { width: 1.0, height: 1.0, depth: 0.6 },
  waterCooler: { width: 0.5, height: 1.2, depth: 0.5 },
  kitchenCounter: { width: 3.0, height: 0.9, depth: 0.7 },
  refrigerator: { width: 0.8, height: 1.8, depth: 0.8 },
  pingPongTable: { width: 2.74, height: 0.05, depth: 1.52 },
  pingPongTableHeight: 0.76,
  pingPongNet: { width: 0.02, height: 0.15, depth: 1.6 },
  meetingTable: { width: 3.5, height: 0.8, depth: 1.5 },
  plant: { width: 0.6, height: 1.2, depth: 0.6 },
  receptionDesk: { width: 2.5, height: 1.1, depth: 0.8 },
  column: { width: 0.8, height: 5, depth: 0.8 }
};

// 返回所有办公室障碍物
export const officeObstacles = (floorSize: number, wallHeight: number): Obstacle[] => {
  // 从常量中获取尺寸
  const {
    desk, bigDesk, bookshelf, sofa, coffeeTable, fileCabinet, 
    printer, waterCooler, kitchenCounter, refrigerator, 
    pingPongTable, pingPongTableHeight, meetingTable, plant, 
    receptionDesk, column
  } = furniture;

  return [
    // 入口区域和前台
    {
      position: new THREE.Vector3(0, receptionDesk.height / 2, floorSize / 2 - 3),
      dimensions: new THREE.Vector3(receptionDesk.width, receptionDesk.height, receptionDesk.depth),
      rotation: Math.PI, // 朝向入口
      type: 'reception_desk'
    },
    
    // 前台旁的装饰植物
    {
      position: new THREE.Vector3(-3, plant.height / 2, floorSize / 2 - 3),
      dimensions: new THREE.Vector3(plant.width, plant.height, plant.depth),
      type: 'plant'
    },
    {
      position: new THREE.Vector3(3, plant.height / 2, floorSize / 2 - 3),
      dimensions: new THREE.Vector3(plant.width, plant.height, plant.depth),
      type: 'plant'
    },

    // 等待区的沙发和茶几
    {
      position: new THREE.Vector3(-7, sofa.height / 2, floorSize / 2 - 5),
      dimensions: new THREE.Vector3(sofa.width, sofa.height, sofa.depth),
      rotation: Math.PI / 2,
      type: 'sofa'
    },
    {
      position: new THREE.Vector3(-9, coffeeTable.height / 2, floorSize / 2 - 5),
      dimensions: new THREE.Vector3(coffeeTable.width, coffeeTable.height, coffeeTable.depth),
      type: 'coffee_table'
    },
    
    // 支柱柱子 (4个角落和中间区域)
    {
      position: new THREE.Vector3(-floorSize / 3, column.height / 2, -floorSize / 3),
      dimensions: new THREE.Vector3(column.width, column.height, column.depth),
      type: 'column'
    },
    {
      position: new THREE.Vector3(floorSize / 3, column.height / 2, -floorSize / 3),
      dimensions: new THREE.Vector3(column.width, column.height, column.depth),
      type: 'column'
    },
    {
      position: new THREE.Vector3(-floorSize / 3, column.height / 2, floorSize / 3),
      dimensions: new THREE.Vector3(column.width, column.height, column.depth),
      type: 'column'
    },
    {
      position: new THREE.Vector3(floorSize / 3, column.height / 2, floorSize / 3),
      dimensions: new THREE.Vector3(column.width, column.height, column.depth),
      type: 'column'
    },
    
    // 主办公区 - 左侧工作区（6个工位）
    {
      position: new THREE.Vector3(-12, desk.height / 2, -2),
      dimensions: new THREE.Vector3(desk.width, desk.height, desk.depth),
      type: 'desk'
    },
    {
      position: new THREE.Vector3(-12, desk.height / 2, -4),
      dimensions: new THREE.Vector3(desk.width, desk.height, desk.depth),
      type: 'desk'
    },
    {
      position: new THREE.Vector3(-12, desk.height / 2, -6),
      dimensions: new THREE.Vector3(desk.width, desk.height, desk.depth),
      type: 'desk'
    },
    {
      position: new THREE.Vector3(-9, desk.height / 2, -2),
      dimensions: new THREE.Vector3(desk.width, desk.height, desk.depth),
      rotation: Math.PI,
      type: 'desk'
    },
    {
      position: new THREE.Vector3(-9, desk.height / 2, -4),
      dimensions: new THREE.Vector3(desk.width, desk.height, desk.depth),
      rotation: Math.PI,
      type: 'desk'
    },
    {
      position: new THREE.Vector3(-9, desk.height / 2, -6),
      dimensions: new THREE.Vector3(desk.width, desk.height, desk.depth),
      rotation: Math.PI,
      type: 'desk'
    },
    
    // 工作区旁的文件柜
    {
      position: new THREE.Vector3(-14, fileCabinet.height / 2, -4),
      dimensions: new THREE.Vector3(fileCabinet.width, fileCabinet.height, fileCabinet.depth),
      type: 'file_cabinet'
    },
    {
      position: new THREE.Vector3(-7, fileCabinet.height / 2, -4),
      dimensions: new THREE.Vector3(fileCabinet.width, fileCabinet.height, fileCabinet.depth),
      type: 'file_cabinet'
    },
    
    // 主办公区 - 中间工作区（6个工位）
    {
      position: new THREE.Vector3(-4, desk.height / 2, -2),
      dimensions: new THREE.Vector3(desk.width, desk.height, desk.depth),
      type: 'desk'
    },
    {
      position: new THREE.Vector3(-4, desk.height / 2, -4),
      dimensions: new THREE.Vector3(desk.width, desk.height, desk.depth),
      type: 'desk'
    },
    {
      position: new THREE.Vector3(-4, desk.height / 2, -6),
      dimensions: new THREE.Vector3(desk.width, desk.height, desk.depth),
      type: 'desk'
    },
    {
      position: new THREE.Vector3(-1, desk.height / 2, -2),
      dimensions: new THREE.Vector3(desk.width, desk.height, desk.depth),
      rotation: Math.PI,
      type: 'desk'
    },
    {
      position: new THREE.Vector3(-1, desk.height / 2, -4),
      dimensions: new THREE.Vector3(desk.width, desk.height, desk.depth),
      rotation: Math.PI,
      type: 'desk'
    },
    {
      position: new THREE.Vector3(-1, desk.height / 2, -6),
      dimensions: new THREE.Vector3(desk.width, desk.height, desk.depth),
      rotation: Math.PI,
      type: 'desk'
    },
    
    // 主办公区 - 右侧工作区（6个工位）
    {
      position: new THREE.Vector3(4, desk.height / 2, -2),
      dimensions: new THREE.Vector3(desk.width, desk.height, desk.depth),
      type: 'desk'
    },
    {
      position: new THREE.Vector3(4, desk.height / 2, -4),
      dimensions: new THREE.Vector3(desk.width, desk.height, desk.depth),
      type: 'desk'
    },
    {
      position: new THREE.Vector3(4, desk.height / 2, -6),
      dimensions: new THREE.Vector3(desk.width, desk.height, desk.depth),
      type: 'desk'
    },
    {
      position: new THREE.Vector3(7, desk.height / 2, -2),
      dimensions: new THREE.Vector3(desk.width, desk.height, desk.depth),
      rotation: Math.PI,
      type: 'desk'
    },
    {
      position: new THREE.Vector3(7, desk.height / 2, -4),
      dimensions: new THREE.Vector3(desk.width, desk.height, desk.depth),
      rotation: Math.PI,
      type: 'desk'
    },
    {
      position: new THREE.Vector3(7, desk.height / 2, -6),
      dimensions: new THREE.Vector3(desk.width, desk.height, desk.depth),
      rotation: Math.PI,
      type: 'desk'
    },
    
    // 打印/复印区
    {
      position: new THREE.Vector3(11, printer.height / 2, -10),
      dimensions: new THREE.Vector3(printer.width, printer.height, printer.depth),
      type: 'printer'
    },
    
    // 书架/资料区
    {
      position: new THREE.Vector3(-14, bookshelf.height / 2, -10),
      dimensions: new THREE.Vector3(bookshelf.width, bookshelf.height, bookshelf.depth),
      type: 'bookshelf'
    },
    {
      position: new THREE.Vector3(-14, bookshelf.height / 2, -12),
      dimensions: new THREE.Vector3(bookshelf.width, bookshelf.height, bookshelf.depth),
      type: 'bookshelf'
    },
    
    // 饮水区
    {
      position: new THREE.Vector3(0, waterCooler.height / 2, -12),
      dimensions: new THREE.Vector3(waterCooler.width, waterCooler.height, waterCooler.depth),
      type: 'water_cooler'
    },
    
    // 休息区/茶水间
    {
      position: new THREE.Vector3(-10, kitchenCounter.height / 2, 10),
      dimensions: new THREE.Vector3(kitchenCounter.width, kitchenCounter.height, kitchenCounter.depth),
      type: 'kitchen_counter'
    },
    {
      position: new THREE.Vector3(-13, refrigerator.height / 2, 10),
      dimensions: new THREE.Vector3(refrigerator.width, refrigerator.height, refrigerator.depth),
      type: 'refrigerator'
    },
    {
      position: new THREE.Vector3(-8, coffeeTable.height / 2, 8),
      dimensions: new THREE.Vector3(coffeeTable.width, coffeeTable.height, coffeeTable.depth),
      type: 'coffee_table'
    },
    {
      position: new THREE.Vector3(-10, sofa.height / 2, 6),
      dimensions: new THREE.Vector3(sofa.width, sofa.height, sofa.depth),
      type: 'sofa'
    },
    
    // 会议室 (大)
    {
      position: new THREE.Vector3(10, meetingTable.height / 2, 0),
      dimensions: new THREE.Vector3(meetingTable.width, meetingTable.height, meetingTable.depth),
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
      position: new THREE.Vector3(0, meetingTable.height / 2, -16),
      dimensions: new THREE.Vector3(meetingTable.width * 0.6, meetingTable.height, meetingTable.depth * 0.6),
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
      position: new THREE.Vector3(14, bigDesk.height / 2, -15),
      dimensions: new THREE.Vector3(bigDesk.width, bigDesk.height, bigDesk.depth),
      rotation: Math.PI / 2,
      type: 'executive_desk'
    },
    {
      position: new THREE.Vector3(12, sofa.height / 2, -12),
      dimensions: new THREE.Vector3(sofa.width * 0.8, sofa.height, sofa.depth * 0.8),
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
      dimensions: new THREE.Vector3(pingPongTable.width, pingPongTable.height, pingPongTable.depth),
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
  ];
};

// 返回所有热点区域
export const officeHotspots = (floorSize: number): Hotspot[] => {
  return [
    // 饮水区
    {
      position: new THREE.Vector3(0, 0, -12),
      radius: 1.5,
      type: 'watercooler',
      capacity: 3,
      minDuration: 20,
      maxDuration: 60
    },
    // 打印区
    {
      position: new THREE.Vector3(11, 0, -10),
      radius: 1.5,
      type: 'printer',
      capacity: 2,
      minDuration: 15,
      maxDuration: 90
    },
    // 休息区
    {
      position: new THREE.Vector3(-9, 0, 7),
      radius: 2.5,
      type: 'lounge',
      capacity: 4,
      minDuration: 300,
      maxDuration: 600
    },
    // 大会议室
    {
      position: new THREE.Vector3(10, 0, 0),
      radius: 3.0,
      type: 'meeting',
      capacity: 8,
      minDuration: 1800,
      maxDuration: 3600
    },
    // 小会议室
    {
      position: new THREE.Vector3(0, 0, -16),
      radius: 2.0,
      type: 'meeting',
      capacity: 4,
      minDuration: 900,
      maxDuration: 1800
    },
    // 乒乓球区
    {
      position: new THREE.Vector3(8, 0, 10),
      radius: 2.5,
      type: 'pingpong',
      capacity: 4,
      minDuration: 600,
      maxDuration: 1200
    },
    // 茶水间
    {
      position: new THREE.Vector3(-11, 0, 10),
      radius: 2.0,
      type: 'kitchen',
      capacity: 3,
      minDuration: 120,
      maxDuration: 300
    },
    // 前台
    {
      position: new THREE.Vector3(0, 0, floorSize / 2 - 3),
      radius: 2.0,
      type: 'reception',
      capacity: 2,
      minDuration: 60,
      maxDuration: 180
    },
    
    // 午餐区域 - 扩展的茶水间/休息区
    {
      position: new THREE.Vector3(-10, 0, 9),
      radius: 4.0,
      type: 'lunch',
      capacity: 10,
      minDuration: 1200, // 20分钟
      maxDuration: 2400  // 40分钟
    },
    
    // 出口区域 (下班时使用)
    {
      position: new THREE.Vector3(0, 0, floorSize / 2 - 1),
      radius: 3.0,
      type: 'exit',
      capacity: 20,
      minDuration: 10,
      maxDuration: 30
    },
    
    // 各工位热点 - 左侧工作区
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
    
    // 各工位热点 - 中间工作区
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
    {
      position: new THREE.Vector3(-1, 0, -2),
      radius: 1.0,
      type: 'desk',
      capacity: 1,
      minDuration: 1800,
      maxDuration: 3600
    },
    {
      position: new THREE.Vector3(-1, 0, -4),
      radius: 1.0,
      type: 'desk',
      capacity: 1,
      minDuration: 1800,
      maxDuration: 3600
    },
    {
      position: new THREE.Vector3(-1, 0, -6),
      radius: 1.0,
      type: 'desk',
      capacity: 1,
      minDuration: 1800,
      maxDuration: 3600
    },
    
    // 各工位热点 - 右侧工作区
    {
      position: new THREE.Vector3(4, 0, -2),
      radius: 1.0,
      type: 'desk',
      capacity: 1,
      minDuration: 1800,
      maxDuration: 3600
    },
    {
      position: new THREE.Vector3(4, 0, -4),
      radius: 1.0,
      type: 'desk',
      capacity: 1,
      minDuration: 1800,
      maxDuration: 3600
    },
    {
      position: new THREE.Vector3(4, 0, -6),
      radius: 1.0,
      type: 'desk',
      capacity: 1,
      minDuration: 1800,
      maxDuration: 3600
    },
    {
      position: new THREE.Vector3(7, 0, -2),
      radius: 1.0,
      type: 'desk',
      capacity: 1,
      minDuration: 1800,
      maxDuration: 3600
    },
    {
      position: new THREE.Vector3(7, 0, -4),
      radius: 1.0,
      type: 'desk',
      capacity: 1,
      minDuration: 1800,
      maxDuration: 3600
    },
    {
      position: new THREE.Vector3(7, 0, -6),
      radius: 1.0,
      type: 'desk',
      capacity: 1,
      minDuration: 1800,
      maxDuration: 3600
    },
    
    // 管理层办公室热点
    {
      position: new THREE.Vector3(14, 0, -15),
      radius: 1.0,
      type: 'management',
      capacity: 1,
      minDuration: 2400,
      maxDuration: 4800
    },
    {
      position: new THREE.Vector3(9, 0, -15),
      radius: 1.0,
      type: 'management',
      capacity: 1,
      minDuration: 2400,
      maxDuration: 4800
    },
    {
      position: new THREE.Vector3(4, 0, -15),
      radius: 1.0,
      type: 'management',
      capacity: 1,
      minDuration: 2400,
      maxDuration: 4800
    }
  ];
};