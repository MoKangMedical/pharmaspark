// PharmaSpark — PLY Export
// Export splat data as PLY files compatible with Spark renderer

import { type SplatData } from "./atom-to-splat";

// Convert SplatData to binary PLY format (compatible with Spark/standard 3DGS viewers)
export function splatsToPLY(splatData: SplatData): ArrayBuffer {
  const { positions, scales, rotations, colors, count } = splatData;

  // PLY header
  const header = `ply
format binary_little_endian 1.0
element vertex ${count}
property float x
property float y
property float z
property float scale_0
property float scale_1
property float scale_2
property float rot_0
property float rot_1
property float rot_2
property float rot_3
property float f_dc_0
property float f_dc_1
property float f_dc_2
property float opacity
end_header
`;

  const encoder = new TextEncoder();
  const headerBytes = encoder.encode(header);

  // Each vertex: 14 floats * 4 bytes = 56 bytes
  const vertexSize = 14 * 4;
  const buffer = new ArrayBuffer(headerBytes.length + count * vertexSize);
  const view = new DataView(buffer);

  // Write header
  new Uint8Array(buffer).set(headerBytes, 0);
  let offset = headerBytes.length;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const i4 = i * 4;

    // Position
    view.setFloat32(offset, positions[i3], true); offset += 4;
    view.setFloat32(offset, positions[i3 + 1], true); offset += 4;
    view.setFloat32(offset, positions[i3 + 2], true); offset += 4;

    // Scale (log-space for 3DGS)
    view.setFloat32(offset, Math.log(Math.max(scales[i3], 1e-7)), true); offset += 4;
    view.setFloat32(offset, Math.log(Math.max(scales[i3 + 1], 1e-7)), true); offset += 4;
    view.setFloat32(offset, Math.log(Math.max(scales[i3 + 2], 1e-7)), true); offset += 4;

    // Rotation (quaternion)
    view.setFloat32(offset, rotations[i4], true); offset += 4;
    view.setFloat32(offset, rotations[i4 + 1], true); offset += 4;
    view.setFloat32(offset, rotations[i4 + 2], true); offset += 4;
    view.setFloat32(offset, rotations[i4 + 3], true); offset += 4;

    // Color (DC component of SH, simplified)
    view.setFloat32(offset, colors[i4], true); offset += 4;
    view.setFloat32(offset, colors[i4 + 1], true); offset += 4;
    view.setFloat32(offset, colors[i4 + 2], true); offset += 4;

    // Opacity (sigmoid-activated)
    const opacity = colors[i4 + 3];
    const logitOpacity = Math.log(Math.max(opacity, 1e-7) / Math.max(1 - opacity, 1e-7));
    view.setFloat32(offset, logitOpacity, true); offset += 4;
  }

  return buffer;
}

// Save PLY to Blob (for download)
export function splatsToBlob(splatData: SplatData): Blob {
  return new Blob([splatsToPLY(splatData)], { type: "application/octet-stream" });
}

// Create download URL
export function splatsToDownloadURL(splatData: SplatData): string {
  return URL.createObjectURL(splatsToBlob(splatData));
}
