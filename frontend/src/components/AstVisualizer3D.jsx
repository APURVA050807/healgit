import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function AstVisualizer3D({ activeLog, isRunning }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 16;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // Determine node color from actual verification state
    const hasUnresolvedError = activeLog && !activeLog.healed;
    const wasAutoHealed = activeLog && activeLog.status === "Auto-Healed";
    const primaryHex = isRunning
      ? 0xf59e0b
      : hasUnresolvedError
      ? 0xef4444
      : wasAutoHealed
      ? 0x10b981
      : 0x71717a;

    // Outer Wireframe Icosahedron (Represents the Deterministic Sandbox Boundary)
    const coreGeo = new THREE.IcosahedronGeometry(4.2, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: primaryHex,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    // AST Syntax Tree Nodes positioned on vertices
    const posAttr = coreGeo.attributes.position;
    const nodeGeo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
    const cleanMat = new THREE.MeshBasicMaterial({ color: 0xfafafa });
    const defectMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const healedMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });

    const errorCount = activeLog?.errorCount || 0;
    const seen = new Set();
    let idxCounter = 0;

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);
      const key = `${vx.toFixed(2)},${vy.toFixed(2)},${vz.toFixed(2)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      let mat = cleanMat;
      if (idxCounter < errorCount) {
        mat = activeLog?.healed ? healedMat : defectMat;
      }

      const nodeMesh = new THREE.Mesh(nodeGeo, mat);
      nodeMesh.position.set(vx, vy, vz);
      group.add(nodeMesh);

      // Connect radial edge to origin (AST Root)
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(vx, vy, vz),
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: idxCounter < errorCount ? (activeLog?.healed ? 0x10b981 : 0xef4444) : 0x27272a,
      });
      group.add(new THREE.Line(lineGeo, lineMat));
      idxCounter++;
    }

    // Mouse Drag Orbit Interaction
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;

    const onDown = (e) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      group.rotation.y += dx * 0.008;
      group.rotation.x += dy * 0.008;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onUp = () => {
      isDragging = false;
    };

    const domElem = renderer.domElement;
    domElem.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const speed = isRunning ? 0.025 : 0.0035;
      if (!isDragging) {
        group.rotation.y += speed;
        group.rotation.x += speed * 0.4;
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      domElem.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [activeLog, isRunning]);

  return <div ref={mountRef} style={{ width: "100%", height: "220px", cursor: "grab" }} />;
}