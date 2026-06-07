import { Canvas, useThree } from '@react-three/fiber';
import { TrackballControls } from '@react-three/drei';
import { useCallback, useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';

type FloorItem = {
  component: string;
  floor: number;
  position: { x: number; y: number };
  size: { x: number; y: number };
};

type FloorPlanViewerProps = {
  items: FloorItem[];
  thickness?: number;
  floorHeight?: number;
  highlightIndex?: number | null;
  onSelectItem?: (index: number) => void;
};

const DEFAULT_THICKNESS = 0.5;
const DEFAULT_FLOOR_HEIGHT = 0.6;

function getColorFromName(name: string) {
  const hash = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 55%)`;
}

function ClickDetector({
  meshRefs,
  onSelectItem,
}: {
  meshRefs: MutableRefObject<(THREE.Mesh | null)[]>;
  onSelectItem?: (index: number) => void;
}) {
  const { camera, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useMemo(() => new THREE.Vector2(), []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(
        meshRefs.current.filter((m) => m !== null) as THREE.Mesh[],
      );

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object as THREE.Mesh;
        const index = meshRefs.current.indexOf(clickedMesh);
        if (index >= 0 && onSelectItem) {
          onSelectItem(index);
        }
      }
    };

    gl.domElement.addEventListener('click', handleClick);
    return () => gl.domElement.removeEventListener('click', handleClick);
  }, [gl, camera, raycaster, mouse, meshRefs, onSelectItem]);

  return null;
}

function GroundAxes() {
  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([-20, 0, 0, 20, 0, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="red" />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0, -20, 0, 0, 20]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="lime" />
      </line>
      <mesh position={[20.4, 0, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial color="red" />
      </mesh>
      <mesh position={[0, 0, 20.4]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial color="lime" />
      </mesh>
    </group>
  );
}

function ViewportPan({
  controlsRef,
  panSpeed = 1.2,
}: {
  controlsRef: MutableRefObject<any>;
  panSpeed?: number;
}) {
  const { camera, gl } = useThree();
  const isPanning = useRef(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const panVector = useMemo(() => new THREE.Vector3(), []);
  const panLeft = useMemo(() => new THREE.Vector3(), []);
  const panUp = useMemo(() => new THREE.Vector3(), []);
  const tempTarget = useMemo(() => new THREE.Vector3(), []);

  const handlePan = useCallback(
    (dx: number, dy: number) => {
      const controls = controlsRef.current;
      if (!controls) return;

      camera.updateMatrixWorld();
      const element = gl.domElement;
      const distance = camera.position.distanceTo(controls.target);
      const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
      const height = 2 * distance * Math.tan(fov / 2);
      const width = height * (element.clientWidth / element.clientHeight);
      const moveX = (-dx * width) / element.clientWidth;
      const moveY = (dy * height) / element.clientHeight;

      camera.getWorldDirection(panVector);
      panVector.cross(camera.up).setLength(moveX * panSpeed);
      panLeft.copy(panVector);
      panUp.copy(camera.up).setLength(moveY * panSpeed);
      panVector.copy(panLeft).add(panUp);

      camera.position.add(panVector);
      tempTarget.copy(controls.target).add(panVector);
      controls.target.copy(tempTarget);
      controls.update();
    },
    [camera, controlsRef, gl.domElement, panSpeed, panVector, panLeft, panUp, tempTarget],
  );

  useEffect(() => {
    const element = gl.domElement;
    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 2) return;
      event.preventDefault();
      isPanning.current = true;
      pointerStart.current = { x: event.clientX, y: event.clientY };
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isPanning.current || !pointerStart.current) return;
      event.preventDefault();
      const dx = event.clientX - pointerStart.current.x;
      const dy = event.clientY - pointerStart.current.y;
      pointerStart.current = { x: event.clientX, y: event.clientY };
      handlePan(dx, dy);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.button !== 2) return;
      isPanning.current = false;
      pointerStart.current = null;
    };

    const handleContextMenu = (event: Event) => event.preventDefault();

    element.addEventListener('pointerdown', handlePointerDown);
    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerup', handlePointerUp);
    element.addEventListener('pointerleave', handlePointerUp);
    element.addEventListener('contextmenu', handleContextMenu);

    return () => {
      element.removeEventListener('pointerdown', handlePointerDown);
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerup', handlePointerUp);
      element.removeEventListener('pointerleave', handlePointerUp);
      element.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [gl.domElement, handlePan]);

  return null;
}

function AutoFitCamera({
  controlsRef,
  center,
  boundsRadius,
  fov,
}: {
  controlsRef: MutableRefObject<any>;
  center: THREE.Vector3;
  boundsRadius: number;
  fov: number;
}) {
  const { camera } = useThree();
  const hasInitialized = useRef(false);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls || hasInitialized.current) return;

    const distance = Math.max(
      boundsRadius / Math.sin((fov * Math.PI) / 180 / 2),
      boundsRadius * 1.5,
    );
    camera.position.set(center.x + distance, center.y + distance * 0.6, center.z + distance);
    camera.lookAt(center);
    controls.target.copy(center);
    controls.update();
    hasInitialized.current = true;
  }, []);

  return null;
}

export default function FloorPlanViewer({
  items,
  thickness = DEFAULT_THICKNESS,
  floorHeight = DEFAULT_FLOOR_HEIGHT,
  highlightIndex = null,
  onSelectItem,
}: FloorPlanViewerProps) {
  const controlsRef = useRef<any>(null);
  const meshRefsRef = useRef<(THREE.Mesh | null)[]>([]);
  const centerOffset = thickness / 2;
  const bounds = useMemo(() => {
    if (items.length === 0) {
      return {
        minX: 0,
        maxX: 0,
        minZ: 0,
        maxZ: 0,
        maxY: 0,
        center: new THREE.Vector3(0, 0, 0),
        radius: 1,
        width: 0,
        depth: 0,
      };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    let maxY = 0;

    items.forEach((item) => {
      minX = Math.min(minX, item.position.x);
      maxX = Math.max(maxX, item.position.x + item.size.x);
      minZ = Math.min(minZ, item.position.y);
      maxZ = Math.max(maxZ, item.position.y + item.size.y);
      maxY = Math.max(maxY, item.floor * floorHeight + thickness);
    });

    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const centerY = maxY / 2;
    const width = maxX - minX;
    const depth = maxZ - minZ;
    const radius = Math.max(width, depth, maxY, 1) * 0.7;

    return {
      minX,
      maxX,
      minZ,
      maxZ,
      maxY,
      center: new THREE.Vector3(centerX, centerY, centerZ),
      radius,
      width,
      depth,
    };
  }, [items, floorHeight, thickness]);

  const boxMeshes = items.map((item, index) => {
    const x = item.position.x + item.size.x / 2;
    const z = item.position.y + item.size.y / 2;
    const y = item.floor * floorHeight + centerOffset;
    const baseColor = getColorFromName(item.component);
    const isHighlighted = index === highlightIndex;
    const color = isHighlighted ? '#ffff00' : baseColor;

    return (
      <mesh
        key={`${item.component}-${index}`}
        position={[x, y, z]}
        ref={(mesh) => {
          meshRefsRef.current[index] = mesh;
        }}
      >
        <boxGeometry args={[item.size.x, thickness, item.size.y]} />
        <meshStandardMaterial
          color={color}
          roughness={isHighlighted ? 0.2 : 0.42}
          metalness={isHighlighted ? 0.4 : 0.08}
          emissive={isHighlighted ? '#ffff00' : '#000000'}
          emissiveIntensity={isHighlighted ? 0.3 : 0}
          transparent={true}
          depthWrite={true}
          side={THREE.DoubleSide}
          opacity={isHighlighted ? 0.7 : 0.5}
        />
      </mesh>
    );
  });

  const cameraFov = 50;

  return (
    <div className="viewer-canvas-wrapper">
      <Canvas
        camera={{ position: [10, 12, 18], fov: cameraFov }}
        style={{ width: '100%', height: '100%', display: 'block', background: '#e9eef5' }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[10, 15, 10]} intensity={0.9} />
        <directionalLight position={[-10, 10, -14]} intensity={0.6} />
        <GroundAxes />
        {boxMeshes}
        <TrackballControls
          ref={controlsRef}
          rotateSpeed={3.0}
          panSpeed={0.8}
          noPan={true}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
        />
        <ViewportPan controlsRef={controlsRef} panSpeed={1.2} />
        <AutoFitCamera
          controlsRef={controlsRef}
          center={bounds.center}
          boundsRadius={bounds.radius}
          fov={cameraFov}
        />
        <ClickDetector meshRefs={meshRefsRef} onSelectItem={onSelectItem} />
      </Canvas>
    </div>
  );
}
