// src/roomData.ts (or wherever your data is defined)

// --- Interfaces (keep as before) ---
export interface Opening {
    id: string;
    wall: 'back' | 'front' | 'left' | 'right';
    width: number;
    height: number;
    distanceFromCorner: number;
    bottom?: number;
    thickness?: number;
  }
  
  export interface LightSource {
    id: string;
    position: [number, number, number];
  }
  
  export interface RoomData {
    width: number;
    height: number;
    depth: number;
    doors: Opening[];
    windows: Opening[];
    lights: LightSource[];
  }
  
  // --- Updated Example Data ---
  // !! Replace with your REAL room measurements and details !!
  export const myRoomData: RoomData = {
    width: 4,    // Example: 4 meters wide
    height: 2.8, // Example: 2.8 meters high
    depth: 5,    // Example: 5 meters deep
    doors: [
      // Keep your door definition(s)
      { id: 'door1', wall: 'back', width: 0.9, height: 2.1, distanceFromCorner: 0.5, thickness: 0.05 }
    ],
    windows: [
      // Keep your window definition(s)
      { id: 'window1', wall: 'right', width: 1.5, height: 1.2, distanceFromCorner: 1, bottom: 0.9, thickness: 0.1 }
    ],
    // Define 4 ceiling lights
    lights: [
      // Position relative to the room's floor center (0,0,0) before the group shift
      // Y-coordinate is close to 'height'
      { id: 'lightFL', position: [-1, 2.75, -1.5] }, // Front-Left quadrant
      { id: 'lightFR', position: [ 1, 2.75, -1.5] }, // Front-Right quadrant
      { id: 'lightBL', position: [-1, 2.75,  1.5] }, // Back-Left quadrant
      { id: 'lightBR', position: [ 1, 2.75,  1.5] }, // Back-Right quadrant
    ]
  };