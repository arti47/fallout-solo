import { useEffect, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, useConvexPolyhedron, usePlane } from '@react-three/cannon';
import { IcosahedronGeometry } from 'three';
import { Edges } from '@react-three/drei';
import { sfx } from '../../utils/sound';

// A ground plane for dice to bounce on
function Ground() {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -5, 0],
    material: { restitution: 0.8, friction: 0.1 }
  }));
  return (
    <mesh ref={ref as any} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <shadowMaterial color="#14FF00" opacity={0.1} />
    </mesh>
  );
}

// invisible walls so dice don't fly off screen
function Walls() {
  usePlane(() => ({ position: [0, 0, -10], rotation: [0, 0, 0] }));
  usePlane(() => ({ position: [0, 0, 10], rotation: [0, Math.PI, 0] }));
  usePlane(() => ({ position: [-10, 0, 0], rotation: [0, Math.PI / 2, 0] }));
  usePlane(() => ({ position: [10, 0, 0], rotation: [0, -Math.PI / 2, 0] }));
  return null;
}

const geo = new IcosahedronGeometry(1, 0);
const verticesArray = Array.from(geo.attributes.position.array);
const vertices: [number, number, number][] = [];
for (let i = 0; i < verticesArray.length; i += 3) {
  vertices.push([verticesArray[i], verticesArray[i+1], verticesArray[i+2]]);
}
const indicesArray = Array.from(geo.index?.array || []);
const indices: [number, number, number][] = [];
for (let i = 0; i < indicesArray.length; i += 3) {
  indices.push([indicesArray[i], indicesArray[i+1], indicesArray[i+2]]);
}

function D20({ position, onRest, resultValue }: { position: [number, number, number], onRest: (val: number) => void, resultValue: number }) {
  const [ref, api] = useConvexPolyhedron(() => ({
    mass: 1,
    position,
    args: [vertices, indices],
    material: { restitution: 0.6, friction: 0.5 },
    angularVelocity: [
      Math.random() * 10,
      Math.random() * 10,
      Math.random() * 10
    ]
  }));

  const settled = useRef(false);

  useEffect(() => {
    // Apply a random initial impulse
    api.applyImpulse([
      (Math.random() - 0.5) * 10,
      (Math.random() * 10) + 10,
      (Math.random() - 0.5) * 10
    ], [0, 0, 0]);

    // Simple timeout for "settling" the die visually and returning the result
    // In a production app with more time, we'd check angular/linear velocity near 0
    const timer = setTimeout(() => {
      if (!settled.current) {
        settled.current = true;
        onRest(resultValue);
      }
    }, 1300); // quick bounce, then reveal

    return () => clearTimeout(timer);
  }, [api, resultValue, onRest]);

  return (
    <mesh ref={ref as any} castShadow receiveShadow>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#000000" />
      <Edges color="#14FF00" threshold={15} />
    </mesh>
  );
}

interface DiceRollerProps {
  numDice: number;
  onComplete: (results: number[]) => void;
}

export default function DiceRoller({ numDice, onComplete }: DiceRollerProps) {
  const [results, setResults] = useState<number[]>([]);

  useEffect(() => {
    sfx.diceRoll();
  }, []);
  
  // Pre-roll the results mathematically so we know what they are.
  // The physics dice act as visual flair before revealing.
  const [targetValues] = useState(() => 
    Array(numDice).fill(0).map(() => Math.floor(Math.random() * 20) + 1)
  );

  const handleRest = (val: number) => {
    setResults(prev => [...prev, val]);
  };

  const completedRef = useRef(false);

  useEffect(() => {
    if (results.length === numDice && !completedRef.current) {
      completedRef.current = true;
      const timer = setTimeout(() => onComplete(results), 450);
      return () => clearTimeout(timer);
    }
  }, [results.length, numDice, onComplete]);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-black/60">
      {/* 3D Canvas rendering the physics world */}
      <div className="absolute inset-0">
        <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 15, 10]} angle={0.3} castShadow intensity={2} color="#14FF00" />
          <Physics gravity={[0, -30, 0]}>
            <Ground />
            <Walls />
            {targetValues.map((val, i) => (
              <D20 
                key={i} 
                position={[(i - numDice/2) * 2.5, 0, 0]} 
                resultValue={val}
                onRest={handleRest}
              />
            ))}
          </Physics>
        </Canvas>
      </div>

      {/* 2D Overlay to show the actual numbers once they settle */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-none">
        {results.map((r, i) => (
          <div 
            key={i} 
            className="w-16 h-16 border-2 border-[#14FF00] bg-black text-[#14FF00] text-3xl font-bold flex items-center justify-center animate-pulse"
          >
            {r}
          </div>
        ))}
      </div>
    </div>
  );
}
