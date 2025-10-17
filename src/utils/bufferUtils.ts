import { Buffer } from 'buffer';

export function bufferToTransferable(buf: Buffer): ArrayBuffer | SharedArrayBuffer {
  const backing = buf.buffer as ArrayBuffer | SharedArrayBuffer;
  // If Buffer covers the entire backing buffer, transfer that backing directly (zero-copy)
  if (buf.byteOffset === 0 && buf.byteLength === backing.byteLength) {
    return backing;
  }
  // Otherwise allocate an ArrayBuffer of exact size and copy the slice (safe)
  const out = new ArrayBuffer(buf.byteLength);
  new Uint8Array(out).set(new Uint8Array(backing, buf.byteOffset, buf.byteLength));
  return out;
}

export function arrayBufferToBuffer(ab: ArrayBuffer | SharedArrayBuffer): Buffer {
  return Buffer.from(new Uint8Array(ab as ArrayBuffer));
}