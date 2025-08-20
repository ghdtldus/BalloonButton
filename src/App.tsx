import * as THREE from 'three';
import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, MeshReflectorMaterial, ContactShadows } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const modelPath = './inflation.glb';

function Model({ ...props }) {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<THREE.AnimationAction[]>([]);

  const handleClick = () => {
    actionsRef.current.forEach((action) => {
      action.reset();
      action.play();
    });
  };

  const onPointerOver = () => {
    document.body.style.cursor = 'pointer';
  };

  const onPointerOut = () => {
    document.body.style.cursor = 'auto';
  };

  useEffect(() => {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      modelPath,
      (gltf) => {
        const mesh = gltf.scene;
        const mixer = new THREE.AnimationMixer(mesh);
        mixerRef.current = mixer;

        if (gltf.animations && gltf.animations.length) {
          gltf.animations.forEach((clip) => {
            clip.duration = 6;
            const action = mixer.clipAction(clip);
            action.clampWhenFinished = true;
            action.loop = THREE.LoopOnce;
            action.setDuration(6);
            action.reset();
            action.play();
            actionsRef.current.push(action);
          });
        }

        setModel(mesh);
        setLoading(false);

        // ✅ Clear loading attributes once done
        document.body.removeAttribute('data-loading');
        document.body.classList.remove('loading');
      },
      (xhr) => {
        if (xhr.total) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          // ✅ Update body attribute while loading
          document.body.setAttribute('data-loading', percent.toString());
        }
      },
      (err) => {
        console.error('An error happened loading the model:', err);
        setError(err);
        setLoading(false);

        // also clear so UI doesn’t get stuck
        document.body.removeAttribute('data-loading');
        document.body.classList.remove('loading');
      }
    );

    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
      }
    };
  }, []);

  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  if (loading || error || !model) {
    return null;
  }

  return (
    <primitive
      {...props}
      object={model}
      castShadow
      receiveShadow
      onClick={handleClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    />
  );
}

function MetalGround({ ...props }) {
  return (
    <mesh {...props} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <MeshReflectorMaterial
        color="#1e1818"
        metalness={0.2}
        roughness={0.2}
        blur={[0, 0]}
        resolution={2048}
        mirror={0}
      />
    </mesh>
  );
}

export default function App() {
  return (
    <div id="content">
      <Canvas camera={{ position: [-8, 30, 20], fov: 18 }}>
        <directionalLight position={[0, 15, 0]} intensity={1} shadow-mapSize={1024} />

        <Environment preset="studio" background={false} environmentRotation={[0, Math.PI / -2, 0]} />
        <Model position={[0, 5, 0]} />
        <ContactShadows opacity={0.5} scale={10} blur={5} far={10} resolution={512} color="#000000" />
        <MetalGround rotation-x={Math.PI / -2} position={[0, -0.01, 0]} />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={true}
          enableDamping={true}
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}
