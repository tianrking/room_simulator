/* src/App.tsx */
import React, { useState, useEffect, useCallback } from 'react';
import {
    Lightbulb, LightbulbOff, Thermometer, Droplet, Wind, CloudCog, Clock
} from 'lucide-react'; // 引入所需图标 (门/窗/AC 用 div 实现)
import './App.css'; // 引入样式

// --- 子组件 Props 类型定义 (如果拆分组件则需要) ---
// interface LightProps { id: number; isOn: boolean; onClick: () => void; }
// interface DoorProps { id: string; type: string; isOpen: boolean; onClick: () => void; }
// interface WindowProps { isOpen: boolean; onClick: () => void; }
// interface ACProps { isOn: boolean; onClick: () => void; }
// interface SensorDisplayProps { icon: React.ElementType; label: string; value: string | number; unit?: string; }
// interface CO2DisplayProps extends SensorDisplayProps { value: number; } // CO2 value is always number

// --- 子组件定义 (直接内联在 App 中) ---

// 灯光组件 (内联)
const Light: React.FC<{ id: number; isOn: boolean; onClick: () => void }> = ({ id, isOn, onClick }) => {
    const Icon = isOn ? Lightbulb : LightbulbOff;
    return (
        <div id={`light-${id}`} className={`light interactive-element ${isOn ? 'on' : 'off'}`} onClick={onClick}>
            <Icon size={20} />
        </div>
    );
};

// 门组件 (内联)
const Door: React.FC<{ id: string; type: string; isOpen: boolean; onClick: () => void }> = ({ id, type, isOpen, onClick }) => {
    const typeClass = `door-${type}`; // e.g., door-large-left, door-small
    const stateClass = isOpen ? 'open' : 'closed';
    // 动态生成门洞 ID
    const openingId = `door-opening-${id.startsWith('large') ? 'large-' + type.split('-')[1] : 'small'}`;
    const openingClass = `door-opening door-opening-${id.startsWith('large') ? 'large' : 'small'}`;

    return (
        <div id={openingId} className={openingClass}>
            <div id={`door-${id}`} className={`door ${typeClass} ${stateClass} interactive-element`} onClick={onClick}></div>
        </div>
    );
};

// 窗户组件 (内联)
const Window: React.FC<{ isOpen: boolean; onClick: () => void }> = ({ isOpen, onClick }) => {
    const stateClass = isOpen ? 'open' : 'closed';
    return (
        <div id="window" className={`window ${stateClass} interactive-element`} onClick={onClick}>
            <div className="window-pane"></div>
        </div>
    );
};

// 空调组件 (内联)
const AC: React.FC<{ isOn: boolean; onClick: () => void }> = ({ isOn, onClick }) => {
    const stateClass = isOn ? 'on' : 'off';
    return (
        <div id="ac" className={`ac ${stateClass} interactive-element`} onClick={onClick}>
             {/* 气流动画通过 CSS ::before/::after 实现 */}
        </div>
    );
};

// 传感器显示组件 (内联)
const SensorDisplay: React.FC<{ icon: React.ElementType; label: string; value: string | number; unit?: string }> = ({ icon: Icon, label, value, unit }) => {
    return (
        <div className="dashboard-item sensor">
            <Icon size={28} className="sensor-icon" />
            <div className="sensor-details">
                <div className="sensor-label">{label}</div>
                <div className="sensor-value">
                    <span>{value}</span>
                    {unit && <span className="sensor-unit">{unit}</span>}
                </div>
            </div>
        </div>
    );
};

// CO2 特殊显示组件 (内联)
const CO2Display: React.FC<{ icon: React.ElementType; label: string; value: number; unit?: string }> = ({ icon: Icon, label, value, unit }) => {
    let valueColor = 'var(--co2-normal-color)';
    if (value > 1000) {
        valueColor = 'var(--co2-veryhigh-color)';
    } else if (value > 800) {
        valueColor = 'var(--co2-high-color)';
    }

    return (
        <div className="dashboard-item sensor">
            <Icon size={28} className="sensor-icon" />
            <div className="sensor-details">
                <div className="sensor-label">{label}</div>
                <div className="sensor-value">
                    <span style={{ color: valueColor }}>{value.toFixed(0)}</span>
                    {unit && <span className="sensor-unit">{unit}</span>}
                </div>
            </div>
        </div>
    );
};


// --- 主应用组件 ---
function App() {
    // --- 状态管理 (使用 TypeScript 类型) ---
    const [lightStates, setLightStates] = useState<boolean[]>([false, false, false, false]);
    const [doorStates, setDoorStates] = useState<boolean[]>([false, false, false]); // [largeLeft, largeRight, smallBottom]
    const [windowState, setWindowState] = useState<boolean>(false);
    const [acState, setAcState] = useState<boolean>(false);
    const [time, setTime] = useState<string>('--:--:--');
    const [sensors, setSensors] = useState({
        temperature: 22.5,
        humidity: 55,
        windSpeed: 3.1,
        co2Level: 450
    });

    // --- 事件处理函数 (使用 useCallback 优化) ---
    const toggleLight = useCallback((index: number) => { // 添加类型
        setLightStates(prevStates => {
            const newStates = [...prevStates];
            newStates[index] = !newStates[index];
            console.log(`灯 ${index + 1} 状态: ${newStates[index] ? '打开' : '关闭'}`);
            // TODO: 调用 Home Assistant API
            return newStates;
        });
    }, []);

    const toggleDoor = useCallback((index: number) => { // 添加类型
        setDoorStates(prevStates => {
            const newStates = [...prevStates];
            newStates[index] = !newStates[index];
            let doorName = index === 0 ? '左大门' : (index === 1 ? '右大门' : '小门');
            console.log(`${doorName} 状态: ${newStates[index] ? '打开' : '关闭'}`);
            // TODO: 调用 Home Assistant API
            return newStates;
        });
    }, []);

    const toggleWindow = useCallback(() => {
        setWindowState(prevState => {
            const newState = !prevState;
            console.log(`窗户状态: ${newState ? '打开' : '关闭'}`);
            // TODO: 调用 Home Assistant API
            return newState;
        });
    }, []);

    const toggleAC = useCallback(() => {
        setAcState(prevState => {
            const newState = !prevState;
            console.log(`空调状态: ${newState ? '打开' : '关闭'}`);
            // TODO: 调用 Home Assistant API
            return newState;
        });
    }, []);

    // --- 数据和时间更新 (使用 useEffect) ---
    useEffect(() => {
        // 更新传感器数据
        const sensorInterval = setInterval(() => {
            setSensors(prevSensors => {
                let temp = prevSensors.temperature + Math.random() * 0.6 - 0.3;
                let hum = prevSensors.humidity + Math.random() * 2 - 1;
                let wind = prevSensors.windSpeed + Math.random() * 0.4 - 0.2;
                let co2 = prevSensors.co2Level + Math.random() * 20 - 10;

                return {
                    temperature: Math.max(-10, Math.min(40, temp)),
                    humidity: Math.max(0, Math.min(100, hum)),
                    windSpeed: Math.max(0, Math.min(50, wind)),
                    co2Level: Math.max(300, Math.min(5000, co2))
                };
            });
        }, 2000);

        // 更新时间
        const timeInterval = setInterval(() => {
            const now = new Date();
            setTime(now.toLocaleTimeString('zh-CN', { hour12: false }));
        }, 1000);

        // 清理定时器
        return () => {
            clearInterval(sensorInterval);
            clearInterval(timeInterval);
        };
    }, []); // 空依赖数组表示只在挂载和卸载时运行

    return (
        <div className="control-panel">
            {/* --- 房间布局 --- */}
            <div className="room-layout">
                {/* 灯光 */}
                {lightStates.map((state, index) => (
                    <Light key={`light-${index}`} id={index + 1} isOn={state} onClick={() => toggleLight(index)} />
                ))}

                {/* 门 */}
                <Door id="large-left" type="large-left" isOpen={doorStates[0]} onClick={() => toggleDoor(0)} />
                <Door id="large-right" type="large-right" isOpen={doorStates[1]} onClick={() => toggleDoor(1)} />
                <Door id="small" type="small" isOpen={doorStates[2]} onClick={() => toggleDoor(2)} />

                {/* 窗户 */}
                <Window isOpen={windowState} onClick={toggleWindow} />

                {/* 空调 */}
                <AC isOn={acState} onClick={toggleAC} />
            </div>

            {/* --- 仪表板 --- */}
            <div className="dashboard">
                {/* 时间 */}
                <div className="dashboard-row time-row">
                    <Clock size={28} className="time-icon" />
                    <div className="time-details">
                        <div className="time-value">{time}</div>
                    </div>
                </div>
                {/* 传感器 - 第 1 行 */}
                <div className="dashboard-row">
                    <SensorDisplay icon={Thermometer} label="温度" value={sensors.temperature.toFixed(1)} unit="°C" />
                    <SensorDisplay icon={Droplet} label="湿度" value={sensors.humidity.toFixed(0)} unit="%" />
                </div>
                {/* 传感器 - 第 2 行 */}
                <div className="dashboard-row">
                    <SensorDisplay icon={Wind} label="风速" value={sensors.windSpeed.toFixed(1)} unit="m/s" />
                    <CO2Display icon={CloudCog} label="CO₂ 浓度" value={sensors.co2Level} unit="ppm" />
                </div>
            </div>
        </div>
    );
}

export default App;