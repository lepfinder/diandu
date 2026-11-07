import * as THREE from 'three';

export type LabelItem = {
  id: string;
  text: string;
  sub?: string;
  object: THREE.Object3D;
  priority?: number;
};

/** 把 3D 点投影到容器像素坐标，供 HTML 覆盖层绘制标签 */
export function projectLabels(
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
  items: LabelItem[],
): { id: string; x: number; y: number; text: string; sub?: string; visible: boolean; depth: number }[] {
  const v = new THREE.Vector3();
  return items.map((it) => {
    it.object.getWorldPosition(v);
    const world = v.clone();
    v.project(camera);
    const x = (v.x * 0.5 + 0.5) * width;
    const y = (-v.y * 0.5 + 0.5) * height;
    const visible = v.z < 1 && x > -40 && x < width + 40 && y > -20 && y < height + 20;
    return { id: it.id, x, y, text: it.text, sub: it.sub, visible, depth: world.distanceTo(camera.position) };
  });
}
