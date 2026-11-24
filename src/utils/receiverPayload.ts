import { ReceiverData } from "../types";
import { decryptBytes, encryptBytes } from "./crypto";

// Compressed payloads start with this byte. Legacy payloads are plain UTF-8
// text (a bare name or a JSON object), which never starts with a control byte.
const COMPRESSED_MARKER = 0x01;

async function transform(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const writer = stream.writable.getWriter();
  writer.write(bytes);
  writer.close();
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}

export async function encodeReceiver(data: ReceiverData): Promise<string> {
  const encoder = new TextEncoder();

  // Keep the legacy formats when there is no wishlist, so older links keep the same shape
  if (!data.wishlist?.length)
    return encryptBytes(encoder.encode(data.hint ? JSON.stringify({name: data.name, hint: data.hint}) : data.name));

  const compressed = await transform(encoder.encode(JSON.stringify(data)), new CompressionStream('deflate-raw'));

  const payload = new Uint8Array(compressed.length + 1);
  payload[0] = COMPRESSED_MARKER;
  payload.set(compressed, 1);

  return encryptBytes(payload);
}

export async function decodeReceiver(encrypted: string): Promise<ReceiverData> {
  const bytes = await decryptBytes(encrypted);
  const decoder = new TextDecoder();

  if (bytes[0] === COMPRESSED_MARKER)
    return JSON.parse(decoder.decode(await transform(bytes.slice(1), new DecompressionStream('deflate-raw')))) as ReceiverData;

  const text = decoder.decode(bytes);

  try {
    // Format with hint
    const data = JSON.parse(text) as ReceiverData;
    if (typeof data === 'object' && data && typeof data.name === 'string')
      return data;
  } catch {}

  // Oldest format: just the name
  return {name: text};
}
