// src/App.tsx
// 路径 './' 表示从当前目录(src)开始查找
// 因此 './pages/HomePage' 是正确的路径
import HomePage from './pages/HomePage'; // 导入主页组件 (从 pages 文件夹)
// import './App.css'; // 如果 App.css 已清空或不需要，可以移除

function App() {
  // App 组件现在只负责渲染顶层页面/路由
  // 在更复杂的应用中，这里可能会包含路由逻辑 (React Router)
  return (
    <HomePage /> // 直接渲染主页组件
  );
}

export default App;