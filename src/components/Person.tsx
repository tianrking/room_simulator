// src/components/Person.tsx
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OfficeState } from './OfficeSimulate';

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

// 人物行为状态
enum PersonState {
  IDLE = 'idle',           // 站立不动
  WALKING = 'walking',     // 正在走路
  AT_HOTSPOT = 'atHotspot', // 正在热点区域活动
  GOING_TO_HOTSPOT = 'goingToHotspot', // 正在前往热点区域
  RETURNING_TO_DESK = 'returningToDesk', // 正在返回工作区
  LEAVING_OFFICE = 'leavingOffice', // 离开办公室
  ARRIVING_OFFICE = 'arrivingOffice' // 到达办公室
}

interface PersonProps {
  initialPosition?: [number, number, number]; // 初始位置
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number }; // 移动范围
  color?: THREE.ColorRepresentation; // 人物颜色
  id: string | number; // 用于 key
  obstacles?: Obstacle[]; // 障碍物列表
  hotspots?: Hotspot[]; // 热点区域列表
  isStationary?: boolean; // 是否是固定位置的人物
  defaultHotspot?: string; // 默认热点类型（例如工位）
  officeState?: OfficeState; // 当前办公室状态
}

const Person: React.FC<PersonProps> = ({
  initialPosition = [0, 0.5, 0], // 默认初始位置 (Y=0.5 假设人物高度为1)
  bounds,
  color = 'orange',
  id,
  obstacles = [], // 默认为空数组
  hotspots = [], // 默认为空数组
  isStationary = false, // 默认为非固定人物
  defaultHotspot = undefined, // 默认没有指定热点
  officeState = OfficeState.WORKING // 默认为工作状态
}) => {
  const meshRef = useRef<THREE.Mesh>(null!); // 用于直接访问 Mesh 对象
  const personRadius = 0.2; // 人物半径 (与圆柱体保持一致)
  
  // 行走参数
  const walkSpeed = THREE.MathUtils.randFloat(0.6, 1.3); // 行走速度 (单位/秒)，每个人略有不同
  const reachThreshold = 0.2; // 到达目标的判定距离
  
  // 状态控制
  const stateRef = useRef<PersonState>(isStationary ? PersonState.IDLE : PersonState.IDLE);
  const targetPositionRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const currentPositionRef = useRef<THREE.Vector3>(new THREE.Vector3(...initialPosition));
  const targetHotspotRef = useRef<Hotspot | null>(null);
  const primaryDeskRef = useRef<THREE.Vector3 | null>(null); // 该人员的主要工位位置
  
  // 路径规划
  const pathPointsRef = useRef<THREE.Vector3[]>([]); // 存储路径点
  const currentPathIndexRef = useRef<number>(0); // 当前路径点索引
  
  // 行为时间控制
  const hotspotTimerRef = useRef<number>(0); // 在热点停留的时间
  const hotspotDurationRef = useRef<number>(0); // 应停留的总时间
  const lastStateChangeRef = useRef<number>(0); // 上次状态变更的时间
  const nextStateChangeRef = useRef<number>(0); // 下次状态变更的时间
  
  // 寻路和碰撞避免
  const isFindingNewTargetRef = useRef<boolean>(false);
  const retryCountRef = useRef<number>(0);
  const stuckTimerRef = useRef<number>(0); // 检测卡住的计时器
  const lastPositionRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const MAX_RETRIES = 10;
  
  // 工作模式
  const workPatternRef = useRef<{
    deskTime: number;      // 在工位停留的基础时间 (分钟)
    breakFrequency: number; // 工作多长时间后会休息 (分钟)
    breakDuration: number;  // 休息时间 (分钟)
    socialFactor: number;   // 社交倾向 (0-1)
  }>({
    deskTime: THREE.MathUtils.randFloat(20, 60),      // 基础工位时间
    breakFrequency: THREE.MathUtils.randFloat(45, 120), // 工作多久后需要休息
    breakDuration: THREE.MathUtils.randFloat(5, 15),   // 休息时长
    socialFactor: THREE.MathUtils.randFloat(0.1, 0.9)  // 社交倾向
  });
  
  // 监听办公室状态变化
  useEffect(() => {
    // 当办公室状态变化时重置人员行为
    resetBehaviorForOfficeState();
  }, [officeState]);

  // 初始化主工位和根据办公室状态设置初始行为
  useEffect(() => {
    // 找到主工位 - 如果有指定默认热点
    if (defaultHotspot) {
      // 找到与初始位置最近的对应类型热点
      const nearbyHotspots = hotspots
        .filter(h => h.type === defaultHotspot)
        .sort((a, b) => {
          const distA = new THREE.Vector3(...initialPosition).distanceTo(a.position);
          const distB = new THREE.Vector3(...initialPosition).distanceTo(b.position);
          return distA - distB;
        });
        
      if (nearbyHotspots.length > 0) {
        primaryDeskRef.current = nearbyHotspots[0].position.clone();
      }
    }
    
    // 记录初始位置以检测卡住状态
    lastPositionRef.current.set(...initialPosition);
    
    // 为固定位置的人员设置 IDLE 状态
    if (isStationary) {
      stateRef.current = PersonState.IDLE;
      return;
    }
    
    // 设置初始行为
    resetBehaviorForOfficeState();
  }, [isStationary, defaultHotspot, initialPosition, hotspots]);
  
  // 根据办公室状态重置人员行为
  const resetBehaviorForOfficeState = () => {
    if (isStationary) return; // 静止人物不变化
    
    // 清空路径点
    pathPointsRef.current = [];
    currentPathIndexRef.current = 0;
    
    // 根据办公室状态设置初始行为
    switch (officeState) {
      case OfficeState.WORKING:
        // 正常工作模式 - 如果有默认热点（如工位），将其设置为初始状态
        if (defaultHotspot) {
          targetHotspotRef.current = findHotspotByType(defaultHotspot);
          if (targetHotspotRef.current) {
            stateRef.current = PersonState.AT_HOTSPOT;
            scheduleNextActivity();
          } else {
            stateRef.current = PersonState.IDLE;
            scheduleRandomWalk();
          }
        } else {
          stateRef.current = PersonState.IDLE;
          scheduleRandomWalk();
        }
        break;
        
      case OfficeState.LUNCH_TIME:
        // 午餐时间 - 大部分人应该前往午餐区
        if (defaultHotspot === 'lunch') {
          // 此人被指定去吃午餐
          targetHotspotRef.current = findHotspotByType('lunch');
          if (targetHotspotRef.current) {
            stateRef.current = PersonState.GOING_TO_HOTSPOT;
            findPathToDestination(targetHotspotRef.current.position);
          } else {
            // 找不到午餐区，去其他地方
            stateRef.current = PersonState.IDLE;
            scheduleRandomWalk();
          }
        } else if (defaultHotspot) {
          // 此人指定在工位吃饭或继续工作
          targetHotspotRef.current = findHotspotByType(defaultHotspot);
          if (targetHotspotRef.current) {
            stateRef.current = PersonState.AT_HOTSPOT;
            scheduleNextActivity();
          } else {
            stateRef.current = PersonState.IDLE;
            scheduleRandomWalk();
          }
        } else {
          stateRef.current = PersonState.IDLE;
          scheduleRandomWalk();
        }
        break;
        
      case OfficeState.ARRIVING:
        // 上班时间 - 人们应该从入口移动到各自工位
        if (defaultHotspot && primaryDeskRef.current) {
          // 设置为前往工位状态
          stateRef.current = PersonState.ARRIVING_OFFICE;
          findPathToDestination(primaryDeskRef.current);
        } else {
          // 没有指定工位的人随机走动
          stateRef.current = PersonState.IDLE;
          scheduleRandomWalk();
        }
        break;
        
      case OfficeState.LEAVING:
        // 下班时间 - 人们应该从工位移动到出口
        targetHotspotRef.current = findHotspotByType('exit');
        if (targetHotspotRef.current) {
          stateRef.current = PersonState.LEAVING_OFFICE;
          findPathToDestination(targetHotspotRef.current.position);
          // 确保在这种状态下有很高的优先级绕过障碍物
        } else {
          // 找不到出口，随机走动
          stateRef.current = PersonState.IDLE;
          scheduleRandomWalk();
        }
        break;
    }
  };

  // 按类型查找热点
  const findHotspotByType = (type: string): Hotspot | null => {
    const availableHotspots = hotspots.filter(h => h.type === type);
    if (availableHotspots.length === 0) return null;
    
    // 随机选择该类型的一个热点
    return availableHotspots[Math.floor(Math.random() * availableHotspots.length)];
  };

  // 安排下一次随机行走
  const scheduleRandomWalk = () => {
    const delay = THREE.MathUtils.randFloat(2, 10); // 2-10秒后开始随机行走
    nextStateChangeRef.current = Date.now() + delay * 1000;
  };

  // 安排下一个活动
  const scheduleNextActivity = () => {
    if (isStationary) return; // 静止人物不进行活动计划
    
    // 根据办公室状态调整行为
    switch (officeState) {
      case OfficeState.LUNCH_TIME:
        handleLunchTimeActivity();
        break;
        
      case OfficeState.ARRIVING:
        handleArrivingActivity();
        break;
        
      case OfficeState.LEAVING:
        handleLeavingActivity();
        break;
        
      case OfficeState.WORKING:
      default:
        handleNormalWorkActivity();
        break;
    }
  };
  
  // 午餐时间的行为处理
  const handleLunchTimeActivity = () => {
    // 已经在午餐区的人有60%的几率继续待在那里
    if (stateRef.current === PersonState.AT_HOTSPOT && targetHotspotRef.current?.type === 'lunch') {
      if (Math.random() < 0.6) {
        // 继续吃午餐
        hotspotDurationRef.current = THREE.MathUtils.randFloat(600, 1800); // 10-30分钟
        hotspotTimerRef.current = 0;
        return;
      }
    }
    
    // 不在午餐区的人有70%的几率去吃午餐
    if (targetHotspotRef.current?.type !== 'lunch' && Math.random() < 0.7) {
      targetHotspotRef.current = findHotspotByType('lunch');
      if (targetHotspotRef.current) {
        stateRef.current = PersonState.GOING_TO_HOTSPOT;
        findPathToDestination(targetHotspotRef.current.position);
        return;
      }
    }
    
    // 其他情况下，回到工位或随机走动
    if (defaultHotspot && primaryDeskRef.current) {
      stateRef.current = PersonState.RETURNING_TO_DESK;
      findPathToDestination(primaryDeskRef.current);
    } else {
      scheduleRandomWalk();
    }
  };
  
  // 上班时间的行为处理
  const handleArrivingActivity = () => {
    // 大多数人应该前往自己的工位
    if (defaultHotspot && primaryDeskRef.current) {
      if (Math.random() < 0.9) { // 90%几率直接去工位
        stateRef.current = PersonState.ARRIVING_OFFICE;
        findPathToDestination(primaryDeskRef.current);
        return;
      }
    }
    
    // 小部分人会先去其他地方（如茶水间、打印区）
    const morningSpots = ['watercooler', 'kitchen', 'printer'];
    const spotType = morningSpots[Math.floor(Math.random() * morningSpots.length)];
    targetHotspotRef.current = findHotspotByType(spotType);
    
    if (targetHotspotRef.current) {
      stateRef.current = PersonState.GOING_TO_HOTSPOT;
      findPathToDestination(targetHotspotRef.current.position);
    } else {
      scheduleRandomWalk();
    }
  };
  
  // 下班时间的行为处理
  const handleLeavingActivity = () => {
    // 已在出口的人员会停留一会后消失
    if (stateRef.current === PersonState.AT_HOTSPOT && targetHotspotRef.current?.type === 'exit') {
      if (Math.random() < 0.7) {
        // 继续等待，稍后离开
        hotspotDurationRef.current = THREE.MathUtils.randFloat(5, 20);
        hotspotTimerRef.current = 0;
      } else {
        // 正式离开（这里可以添加人物消失的效果）
        meshRef.current.visible = false;
      }
      return;
    }
    
    // 不在出口的人应该往出口走
    targetHotspotRef.current = findHotspotByType('exit');
    if (targetHotspotRef.current) {
      stateRef.current = PersonState.LEAVING_OFFICE;
      findPathToDestination(targetHotspotRef.current.position);
    } else {
      scheduleRandomWalk();
    }
  };
  
  // 正常工作时间的行为处理
  const handleNormalWorkActivity = () => {
    // 如果有指定默认热点，优先考虑回到工位
    if (defaultHotspot && primaryDeskRef.current && stateRef.current !== PersonState.AT_HOTSPOT) {
      // 80%的几率返回工位，20%的几率去其他地方
      if (Math.random() < 0.8) {
        stateRef.current = PersonState.RETURNING_TO_DESK;
        findPathToDestination(primaryDeskRef.current);
        return;
      }
    }
    
    // 根据当前状态决定下一个活动
    if (stateRef.current === PersonState.AT_HOTSPOT && targetHotspotRef.current?.type === defaultHotspot) {
      // 如果当前在工位，决定是否休息
      if (Math.random() < 0.3) { // 30%的几率去休息
        const breakTypes = ['watercooler', 'kitchen', 'lounge', 'printer'];
        const preferredType = breakTypes[Math.floor(Math.random() * breakTypes.length)];
        targetHotspotRef.current = findHotspotByType(preferredType);
        if (targetHotspotRef.current) {
          stateRef.current = PersonState.GOING_TO_HOTSPOT;
          findPathToDestination(targetHotspotRef.current.position);
        } else {
          scheduleRandomWalk();
        }
      } else {
        // 继续工作一段时间
        hotspotDurationRef.current = workPatternRef.current.deskTime * 60; // 转为秒
        hotspotTimerRef.current = 0;
      }
    } else {
      // 如果当前在休息或其他活动，决定是否回工位
      if (defaultHotspot && primaryDeskRef.current && Math.random() < 0.7) { // 70%的几率回工位
        stateRef.current = PersonState.RETURNING_TO_DESK;
        findPathToDestination(primaryDeskRef.current);
      } else {
        // 随机选择下一个去处
        const availableTypes = ['watercooler', 'printer', 'lounge', 'kitchen', 'meeting', 'pingpong'];
        // 根据社交倾向调整热点权重
        let selectedType;
        if (Math.random() < workPatternRef.current.socialFactor) {
          // 偏好社交区域
          selectedType = ['lounge', 'kitchen', 'watercooler', 'meeting'][Math.floor(Math.random() * 4)];
        } else {
          // 随机选择
          selectedType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        }
        
        targetHotspotRef.current = findHotspotByType(selectedType);
        if (targetHotspotRef.current) {
          stateRef.current = PersonState.GOING_TO_HOTSPOT;
          findPathToDestination(targetHotspotRef.current.position);
        } else {
          scheduleRandomWalk();
        }
      }
    }
  };

  // 检查点是否与障碍物碰撞
  const checkCollision = (position: THREE.Vector3): boolean => {
    // 检查是否与任何障碍物碰撞
    for (const obstacle of obstacles) {
      // 获取障碍物的位置和尺寸
      const obstaclePos = obstacle.position;
      const obstacleDim = obstacle.dimensions;
      const rotation = obstacle.rotation || 0;

      // 如果没有旋转，使用简单的AABB碰撞检测
      if (rotation === 0) {
        // 计算障碍物的边界
        const minX = obstaclePos.x - obstacleDim.x / 2 - personRadius;
        const maxX = obstaclePos.x + obstacleDim.x / 2 + personRadius;
        const minZ = obstaclePos.z - obstacleDim.z / 2 - personRadius;
        const maxZ = obstaclePos.z + obstacleDim.z / 2 + personRadius;

        // 检查点是否在障碍物范围内
        if (
          position.x >= minX && position.x <= maxX &&
          position.z >= minZ && position.z <= maxZ
        ) {
          return true; // 发生碰撞
        }
      } else {
        // 旋转情况下的碰撞检测 - 把点旋转回去，然后进行AABB检测
        // 创建一个点的副本
        const rotatedPoint = position.clone();
        
        // 将点相对于障碍物的中心旋转
        rotatedPoint.x -= obstaclePos.x;
        rotatedPoint.z -= obstaclePos.z;
        
        // 反向旋转点（绕Y轴）
        const cosTheta = Math.cos(-rotation);
        const sinTheta = Math.sin(-rotation);
        const rotatedX = rotatedPoint.x * cosTheta - rotatedPoint.z * sinTheta;
        const rotatedZ = rotatedPoint.x * sinTheta + rotatedPoint.z * cosTheta;
        
        rotatedPoint.x = rotatedX + obstaclePos.x;
        rotatedPoint.z = rotatedZ + obstaclePos.z;
        
        // 对旋转后的点进行AABB碰撞检测
        const minX = obstaclePos.x - obstacleDim.x / 2 - personRadius;
        const maxX = obstaclePos.x + obstacleDim.x / 2 + personRadius;
        const minZ = obstaclePos.z - obstacleDim.z / 2 - personRadius;
        const maxZ = obstaclePos.z + obstacleDim.z / 2 + personRadius;
        
        if (
          rotatedPoint.x >= minX && rotatedPoint.x <= maxX &&
          rotatedPoint.z >= minZ && rotatedPoint.z <= maxZ
        ) {
          return true; // 发生碰撞
        }
      }
    }
    
    return false; // 没有碰撞
  };

  // 寻找从当前位置到目标位置的路径
  const findPathToDestination = (destination: THREE.Vector3) => {
    // 先清空现有路径
    pathPointsRef.current = [];
    currentPathIndexRef.current = 0;
    
    // 添加起点和终点
    const start = currentPositionRef.current.clone();
    const end = destination.clone();
    
    // 检查起点和终点是否有直接路径
    if (!checkPathCollision(start, end)) {
      // 如果没有碰撞，可以直接走
      pathPointsRef.current = [start, end];
      targetPositionRef.current.copy(pathPointsRef.current[1]);
      return;
    }
    
    // 需要绕行 - 为特殊场景(上班/下班)生成更多中间点
    const isSpecialState = stateRef.current === PersonState.ARRIVING_OFFICE || 
                           stateRef.current === PersonState.LEAVING_OFFICE;
    
    // 生成路径点 - 特殊状态下生成更多中间点
    generatePathPoints(start, end, isSpecialState ? 5 : 2);
    
    // 如果成功生成路径，设置当前目标为第一个路径点
    if (pathPointsRef.current.length > 0) {
      currentPathIndexRef.current = 1; // 跳过起点
      targetPositionRef.current.copy(pathPointsRef.current[currentPathIndexRef.current]);
    } else {
      // 生成失败，直接设置目标
      targetPositionRef.current.copy(end);
    }
  };
  
  // 生成从起点到终点的路径点
  const generatePathPoints = (start: THREE.Vector3, end: THREE.Vector3, numPoints: number = 3) => {
    // 基本方向和距离
    const directionVector = end.clone().sub(start);
    const distance = directionVector.length();
    const normalizedDirection = directionVector.clone().normalize();
    
    // 创建垂直于移动方向的向量，用于偏移
    const perpendicularVector = new THREE.Vector3(-normalizedDirection.z, 0, normalizedDirection.x);
    
    // 路径点数组，包含起点
    pathPointsRef.current = [start.clone()];
    
    // 生成中间点 - 在目标直线两侧寻找可行的路径点
    for (let i = 1; i <= numPoints; i++) {
      // 沿着路径均匀分布点
      const fraction = i / (numPoints + 1);
      const basePoint = start.clone().add(directionVector.clone().multiplyScalar(fraction));
      
      // 尝试不同的偏移找到无碰撞的点
      const offsets = [0, 1, -1, 2, -2, 3, -3, 4, -4];
      let validPoint = null;
      
      for (const offset of offsets) {
        // 计算偏移量 - 距离终点越近偏移越小
        const offsetMagnitude = Math.max(1, 3 * (1 - fraction)) * personRadius * 5;
        const offsetPoint = basePoint.clone().add(
          perpendicularVector.clone().multiplyScalar(offset * offsetMagnitude)
        );
        
        // 确保点在边界内
        offsetPoint.x = THREE.MathUtils.clamp(offsetPoint.x, bounds.minX, bounds.maxX);
        offsetPoint.z = THREE.MathUtils.clamp(offsetPoint.z, bounds.minZ, bounds.maxZ);
        
        // 检查点是否有效 (无碰撞)
        if (!checkCollision(offsetPoint)) {
          // 还要检查到上一个点的路径是否无碰撞
          const lastPoint = pathPointsRef.current[pathPointsRef.current.length - 1];
          if (!checkPathCollision(lastPoint, offsetPoint)) {
            validPoint = offsetPoint;
            break;
          }
        }
      }
      
      // 如果找到有效点，添加到路径
      if (validPoint) {
        pathPointsRef.current.push(validPoint);
      }
    }
    
    // 添加终点
    pathPointsRef.current.push(end.clone());
    
    // 对路径进行简化 - 移除不必要的中间点
    simplifyPath();
  };
  
  // 简化路径 - 移除不必要的中间点
  const simplifyPath = () => {
    if (pathPointsRef.current.length <= 2) return; // 只有起点和终点，无需简化
    
    let i = 0;
    while (i < pathPointsRef.current.length - 2) {
      const current = pathPointsRef.current[i];
      const next = pathPointsRef.current[i + 2]; // 尝试跳过一个点
      
      // 检查直接从当前点到下下个点是否可行
      if (!checkPathCollision(current, next)) {
        // 如果可行，移除中间点
        pathPointsRef.current.splice(i + 1, 1);
      } else {
        // 无法简化，继续下一个点
        i++;
      }
    }
  };

  // 检查从起点到终点的路径是否与障碍物碰撞
  const checkPathCollision = (start: THREE.Vector3, end: THREE.Vector3): boolean => {
    // 计算方向和距离
    const direction = end.clone().sub(start).normalize();
    const distance = start.distanceTo(end);
    
    // 沿路径检查多个点
    const numPoints = Math.max(3, Math.ceil(distance / (personRadius * 2)));
    for (let i = 0; i <= numPoints; i++) {
      const fraction = i / numPoints;
      const point = start.clone().add(direction.clone().multiplyScalar(fraction * distance));
      if (checkCollision(point)) {
        return true; // 发现碰撞
      }
    }
    
    return false; // 无碰撞
  };

  // 获取新的随机目标点
  const getRandomTarget = () => {
    if (isFindingNewTargetRef.current) return;
    isFindingNewTargetRef.current = true;
    retryCountRef.current = 0;
    
    findValidTarget();
  };

  // 寻找一个有效的（不与障碍物碰撞的）目标点
  const findValidTarget = () => {
    if (retryCountRef.current >= MAX_RETRIES) {
      console.warn(`Person ${id} failed to find valid target after ${MAX_RETRIES} attempts`);
      isFindingNewTargetRef.current = false;
      retryCountRef.current = 0;
      return;
    }
    
    retryCountRef.current++;
    
    const targetX = THREE.MathUtils.randFloat(bounds.minX, bounds.maxX);
    const targetZ = THREE.MathUtils.randFloat(bounds.minZ, bounds.maxZ);
    const potentialTarget = new THREE.Vector3(targetX, initialPosition[1], targetZ);
    
    // 检查目标点是否有效（不在障碍物内，且路径可行）
    if (!checkCollision(potentialTarget)) {
      // 使用路径规划而不是直接检查路径
// 使用路径规划而不是直接检查路径
findPathToDestination(potentialTarget);
isFindingNewTargetRef.current = false;
} else {
// 如果不合法，递归寻找新目标
setTimeout(findValidTarget, 0); // 使用setTimeout避免调用栈溢出
}
};

// 寻找摆脱碰撞的方向
const findEscapeDirection = (currentPos: THREE.Vector3, targetPos: THREE.Vector3): THREE.Vector3 => {
// 基本移动方向
const baseDirection = targetPos.clone().sub(currentPos).normalize();

// 尝试不同角度的方向
const angles = [30, -30, 45, -45, 60, -60, 90, -90, 135, -135, 180];

for (const angle of angles) {
const radians = THREE.MathUtils.degToRad(angle);
const cosAngle = Math.cos(radians);
const sinAngle = Math.sin(radians);

// 旋转基本方向
const rotatedDirX = baseDirection.x * cosAngle - baseDirection.z * sinAngle;
const rotatedDirZ = baseDirection.x * sinAngle + baseDirection.z * cosAngle;

const escapeDirection = new THREE.Vector3(rotatedDirX, 0, rotatedDirZ).normalize();
const testPos = currentPos.clone().add(escapeDirection.multiplyScalar(personRadius * 2));

// 检查新方向是否有效
if (!checkCollision(testPos)) {
  return new THREE.Vector3(rotatedDirX, 0, rotatedDirZ).normalize();
}
}

// 如果所有方向都不行，返回相反方向
return baseDirection.multiplyScalar(-1);
};

// 检查是否有足够空间进入热点
const canEnterHotspot = (hotspot: Hotspot): boolean => {
// 简单实现：检查热点中心位置是否可到达
// 更复杂的实现可以考虑热点周围的空间
return !checkCollision(hotspot.position);
};

// 检测人物是否卡住
const checkIfStuck = (currentPosition: THREE.Vector3, delta: number) => {
const moveDistance = currentPosition.distanceTo(lastPositionRef.current);

// 如果移动距离很小，且状态应该是移动的，增加stuck计时器
if (moveDistance < 0.01 && 
  (stateRef.current === PersonState.WALKING || 
   stateRef.current === PersonState.GOING_TO_HOTSPOT || 
   stateRef.current === PersonState.RETURNING_TO_DESK ||
   stateRef.current === PersonState.ARRIVING_OFFICE ||
   stateRef.current === PersonState.LEAVING_OFFICE)) {
stuckTimerRef.current += delta;

// 如果卡住超过2秒，尝试找新路径或目标
if (stuckTimerRef.current > 2) {
  if (stateRef.current === PersonState.ARRIVING_OFFICE && primaryDeskRef.current) {
    // 上班卡住了，重新规划路径
    findPathToDestination(primaryDeskRef.current);
  } else if (stateRef.current === PersonState.LEAVING_OFFICE && targetHotspotRef.current) {
    // 下班卡住了，重新规划路径
    findPathToDestination(targetHotspotRef.current.position);
  } else if (pathPointsRef.current.length > 0 && currentPathIndexRef.current < pathPointsRef.current.length - 1) {
    // 如果还有路径点，尝试前往下一个
    currentPathIndexRef.current++;
    targetPositionRef.current.copy(pathPointsRef.current[currentPathIndexRef.current]);
  } else {
    // 完全卡住，找新的随机目标
    getRandomTarget();
  }
  stuckTimerRef.current = 0;
}
} else {
// 如果在移动，重置卡住计时器
stuckTimerRef.current = 0;
}

// 更新last position
lastPositionRef.current.copy(currentPosition);
};

// 更新下一个路径点
const updateNextPathPoint = () => {
if (pathPointsRef.current.length === 0) return false;

currentPathIndexRef.current++;

// 检查是否已经到达终点
if (currentPathIndexRef.current >= pathPointsRef.current.length) {
// 路径完成
pathPointsRef.current = [];
return false;
}

// 更新目标为下一个路径点
targetPositionRef.current.copy(pathPointsRef.current[currentPathIndexRef.current]);
return true;
};

// useFrame 在每一帧都会调用 - 主要逻辑循环
useFrame((state, delta) => {
if (!meshRef.current) return;

// 固定位置的人物只需保持在原位
if (isStationary) {
return;
}

const currentPos = currentPositionRef.current;
const currentTime = Date.now();

// 检测卡住状态
checkIfStuck(currentPos, delta);

// 状态机逻辑
switch (stateRef.current) {
case PersonState.IDLE:
  // 从闲置状态开始随机行走
  if (currentTime >= nextStateChangeRef.current) {
    stateRef.current = PersonState.WALKING;
    getRandomTarget();
  }
  break;
  
case PersonState.WALKING:
  // 如果正在寻找新目标，等待
  if (isFindingNewTargetRef.current) break;
  
  // 计算到目标的距离
  const distanceToTarget = currentPos.distanceTo(targetPositionRef.current);
  
  // 如果已接近目标，进入闲置状态并计划下一次活动
  if (distanceToTarget < reachThreshold) {
    // 检查是否还有路径点
    if (pathPointsRef.current.length > 0 && updateNextPathPoint()) {
      // 继续按照路径移动
      break;
    }
    
    stateRef.current = PersonState.IDLE;
    scheduleRandomWalk();
    break;
  }
  
  // 移动逻辑
  moveTowardsTarget(currentPos, targetPositionRef.current, delta);
  break;
  
case PersonState.GOING_TO_HOTSPOT:
  // 确保有目标热点
  if (!targetHotspotRef.current) {
    stateRef.current = PersonState.IDLE;
    scheduleRandomWalk();
    break;
  }
  
  // 计算到热点的距离
  const distToHotspot = currentPos.distanceTo(targetHotspotRef.current.position);
  
  // 如果已接近热点，进入热点状态
  if (distToHotspot < targetHotspotRef.current.radius) {
    // 确认有足够空间进入热点
    if (canEnterHotspot(targetHotspotRef.current)) {
      stateRef.current = PersonState.AT_HOTSPOT;
      hotspotTimerRef.current = 0;
      
      // 设置在热点停留的时间
      const minDuration = targetHotspotRef.current.minDuration;
      const maxDuration = targetHotspotRef.current.maxDuration;
      hotspotDurationRef.current = THREE.MathUtils.randFloat(minDuration, maxDuration);
    } else {
      // 如果热点没有空间，进入闲置状态
      stateRef.current = PersonState.IDLE;
      scheduleRandomWalk();
    }
    break;
  }
  
  // 还没到热点，继续移动
  // 检查是否还有路径点
  if (pathPointsRef.current.length > 0 && 
      currentPathIndexRef.current < pathPointsRef.current.length - 1 &&
      currentPos.distanceTo(targetPositionRef.current) < reachThreshold) {
    // 已到达当前路径点，更新到下一点
    updateNextPathPoint();
  }
  
  // 移动逻辑
  moveTowardsTarget(currentPos, targetPositionRef.current, delta);
  break;
  
case PersonState.AT_HOTSPOT:
  // 在热点停留
  hotspotTimerRef.current += delta;
  
  // 如果停留时间已到，计划下一个活动
  if (hotspotTimerRef.current >= hotspotDurationRef.current) {
    scheduleNextActivity();
  }
  break;
  
case PersonState.RETURNING_TO_DESK:
  // 确保有工位位置
  if (!primaryDeskRef.current) {
    stateRef.current = PersonState.IDLE;
    scheduleRandomWalk();
    break;
  }
  
  // 计算到工位的距离
  const distToDesk = currentPos.distanceTo(primaryDeskRef.current);
  
  // 如果已接近工位，进入热点状态
  if (distToDesk < 0.5) { // 使用较小的范围
    stateRef.current = PersonState.AT_HOTSPOT;
    hotspotTimerRef.current = 0;
    targetHotspotRef.current = hotspots.find(h => 
      h.position.distanceTo(primaryDeskRef.current as THREE.Vector3) < 0.1 && 
      h.type === defaultHotspot
    ) || null;
    
    // 设置在工位停留的时间
    hotspotDurationRef.current = workPatternRef.current.deskTime * 60; // 转换为秒
    break;
  }
  
  // 检查路径点
  if (pathPointsRef.current.length > 0 && 
      currentPathIndexRef.current < pathPointsRef.current.length - 1 &&
      currentPos.distanceTo(targetPositionRef.current) < reachThreshold) {
    // 已到达当前路径点，更新到下一点
    updateNextPathPoint();
  }
  
  // 移动逻辑
  moveTowardsTarget(currentPos, targetPositionRef.current, delta);
  break;

case PersonState.ARRIVING_OFFICE:
  // 上班时间特殊处理 - 从入口一定要到工位
  if (!primaryDeskRef.current) {
    stateRef.current = PersonState.IDLE;
    scheduleRandomWalk();
    break;
  }
  
  // 计算到工位的距离
  const distToDeskArriving = currentPos.distanceTo(primaryDeskRef.current);
  
  // 如果已接近工位，进入热点状态
  if (distToDeskArriving < 0.5) {
    stateRef.current = PersonState.AT_HOTSPOT;
    hotspotTimerRef.current = 0;
    targetHotspotRef.current = hotspots.find(h => 
      h.position.distanceTo(primaryDeskRef.current as THREE.Vector3) < 0.1 && 
      h.type === defaultHotspot
    ) || null;
    
    // 设置在工位停留的时间 - 上班后先工作较长时间
    hotspotDurationRef.current = workPatternRef.current.deskTime * 60 * 1.5; // 延长工作时间
    break;
  }
  
  // 检查路径点
  if (pathPointsRef.current.length > 0 && 
      currentPathIndexRef.current < pathPointsRef.current.length - 1 &&
      currentPos.distanceTo(targetPositionRef.current) < reachThreshold) {
    // 已到达当前路径点，更新到下一点
    updateNextPathPoint();
  } else if (currentPos.distanceTo(targetPositionRef.current) < reachThreshold && 
            pathPointsRef.current.length === 0) {
    // 如果到了目标但没有更多路径点，直接前往工位
    findPathToDestination(primaryDeskRef.current);
  }
  
  // 移动逻辑 - 上班时使用更强的避障能力
  moveTowardsTarget(currentPos, targetPositionRef.current, delta, true);
  break;
  
case PersonState.LEAVING_OFFICE:
  // 下班时间特殊处理 - 必须离开办公室
  if (!targetHotspotRef.current || targetHotspotRef.current.type !== 'exit') {
    // 确保目标是出口
    targetHotspotRef.current = findHotspotByType('exit');
    if (targetHotspotRef.current) {
      findPathToDestination(targetHotspotRef.current.position);
    } else {
      stateRef.current = PersonState.IDLE;
      scheduleRandomWalk();
    }
    break;
  }
  
  // 计算到出口的距离
  const distToExit = currentPos.distanceTo(targetHotspotRef.current.position);
  
  // 如果已接近出口，进入热点状态
  if (distToExit < targetHotspotRef.current.radius) {
    stateRef.current = PersonState.AT_HOTSPOT;
    hotspotTimerRef.current = 0;
    hotspotDurationRef.current = THREE.MathUtils.randFloat(5, 15); // 停留很短时间
    break;
  }
  
  // 检查路径点
  if (pathPointsRef.current.length > 0 && 
      currentPathIndexRef.current < pathPointsRef.current.length - 1 &&
      currentPos.distanceTo(targetPositionRef.current) < reachThreshold) {
    // 已到达当前路径点，更新到下一点
    updateNextPathPoint();
  } else if (currentPos.distanceTo(targetPositionRef.current) < reachThreshold && 
            pathPointsRef.current.length === 0) {
    // 如果到了目标但没有更多路径点，直接前往出口
    findPathToDestination(targetHotspotRef.current.position);
  }
  
  // 移动逻辑 - 下班时使用更强的避障能力
  moveTowardsTarget(currentPos, targetPositionRef.current, delta, true);
  break;
}
});

// 移动逻辑 - 向目标移动并处理碰撞
const moveTowardsTarget = (currentPos: THREE.Vector3, targetPos: THREE.Vector3, delta: number, forcePath: boolean = false) => {
// 计算移动方向 (归一化向量)
const direction = targetPos.clone().sub(currentPos).normalize();

// 计算本帧的移动距离
const moveDistance = walkSpeed * delta;

// 计算新位置 (不能超过目标点)
const distanceToTarget = currentPos.distanceTo(targetPos);
const moveAmount = Math.min(moveDistance, distanceToTarget);
const newPosition = currentPos.clone().add(direction.multiplyScalar(moveAmount));

// 边界检查 (防止移出指定范围)
newPosition.x = THREE.MathUtils.clamp(newPosition.x, bounds.minX, bounds.maxX);
newPosition.z = THREE.MathUtils.clamp(newPosition.z, bounds.minZ, bounds.maxZ);

// 碰撞检测
if (checkCollision(newPosition)) {
// 特殊状态下的处理 - 专门针对上下班状态
const isSpecialState = stateRef.current === PersonState.ARRIVING_OFFICE || 
                      stateRef.current === PersonState.LEAVING_OFFICE ||
                      forcePath;
                      
if (isSpecialState) {
  // 发生碰撞时，重新规划路径
  if (stateRef.current === PersonState.ARRIVING_OFFICE && primaryDeskRef.current) {
    findPathToDestination(primaryDeskRef.current);
  } else if (stateRef.current === PersonState.LEAVING_OFFICE && targetHotspotRef.current) {
    findPathToDestination(targetHotspotRef.current.position);
  } else if (targetPositionRef.current) {
    // 其他情况下，尝试重新规划到当前目标
    findPathToDestination(targetPositionRef.current);
  }
} else {
  // 一般碰撞处理 - 寻找逃离方向
  const escapeDirection = findEscapeDirection(currentPos, targetPos);
  const escapePosition = currentPos.clone().add(
    escapeDirection.multiplyScalar(moveDistance * 0.5) // 减小移动量，更平滑地避开障碍物
  );
  
  // 检查逃离位置是否有效
  if (!checkCollision(escapePosition)) {
    // 更新位置
    currentPositionRef.current.copy(escapePosition);
    meshRef.current.position.copy(escapePosition);
  } else {
    // 如果无法移动，考虑生成新目标
    getRandomTarget();
  }
}
} else {
// 如果没有碰撞，正常更新位置
currentPositionRef.current.copy(newPosition);
meshRef.current.position.copy(newPosition);

// 让人物朝向移动方向
if (distanceToTarget > 0.1) { // 只在有显著移动时更新朝向
  const lookAtTarget = new THREE.Vector3(targetPos.x, currentPos.y, targetPos.z);
  meshRef.current.lookAt(lookAtTarget);
}
}
};

// 渲染人物模型
return (
<group>
{/* 使用圆柱体代表人物 */}
<mesh ref={meshRef} castShadow name={`person-${id}`} position={initialPosition}>
  {/* 身体 - CylinderGeometry 参数: radiusTop, radiusBottom, height, radialSegments */}
  <cylinderGeometry args={[0.2, 0.2, 0.9, 16]} />
  <meshStandardMaterial color={color} />
  
  {/* 头部 - 小球体 */}
  <mesh position={[0, 0.6, 0]}>
    <sphereGeometry args={[0.15, 16, 16]} />
    <meshStandardMaterial color={color} />
  </mesh>
  
  {/* 状态指示器 - 只在开发模式使用 */}
  {false && (
    <mesh position={[0, 1.2, 0]}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshStandardMaterial color={
        stateRef.current === PersonState.IDLE ? 'gray' :
        stateRef.current === PersonState.WALKING ? 'green' :
        stateRef.current === PersonState.AT_HOTSPOT ? 'blue' :
        stateRef.current === PersonState.GOING_TO_HOTSPOT ? 'yellow' :
        stateRef.current === PersonState.RETURNING_TO_DESK ? 'purple' :
        stateRef.current === PersonState.ARRIVING_OFFICE ? 'orange' :
        stateRef.current === PersonState.LEAVING_OFFICE ? 'red' : 'white'
      } />
    </mesh>
  )}
</mesh>
</group>
);
};

export default Person;