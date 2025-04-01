// src/pages/HomePage.tsx
// import React from 'react';
import SceneContainer from '../components/SceneContainer';
// import RotatingCube from '../components/RotatingCube'; // 保留这个导入
// import RotatingTorusKnot from '../components/RotatingTorusKnot'; // 添加这个新的导入

// import Room from '../components/Room';

// import { myRoomData } from '../components/roomData'; 
import OfficeSimulate from '../components/OfficeSimulate';

function HomePage() {
  return (
    <SceneContainer>
      {/* <RotatingCube /> */}
      {/* <RotatingTorusKnot /> */}
      {/* <Room /> */}

      {/* <Room roomData={myRoomData} showPlaceholders={true} /> */}

      <OfficeSimulate />
    </SceneContainer>
  );
}

export default HomePage;