const uint8ToBinary = (uint8: Uint8Array): string => {
  let result = '';
  for (let i = 0; i < uint8.length; i++) {
    result += String.fromCharCode(uint8[i]);
  }
  return result;
};
const binaryToUint8 = (binary: string): Uint8Array => {
  const result = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    result[i] = binary.charCodeAt(i);
  }
  return result;
};

const base64ToUrl = (data: string): string => {
  return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const urlToBase64 = (str: string): string => {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if needed
  const padding = base64.length % 4;
  const paddedBase64 = padding ? base64 + '='.repeat(4 - padding) : base64;

  return atob(paddedBase64);
};

export function encodeData(data: Uint8Array): string {
  try {
    return base64ToUrl(uint8ToBinary(data));
  } catch (error) {
    console.error('Error encoding data:', error);
    throw new Error(
      `Encoding failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export function decodeData(str: string): Uint8Array {
  try {
    const binary = urlToBase64(str);
    const bytes = binaryToUint8(binary);
    return bytes;
  } catch (error) {
    console.error('Error decoding data:', error);
    throw new Error(
      `Decoding failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
