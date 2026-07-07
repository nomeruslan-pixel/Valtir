import { Buffer } from 'buffer';

export interface IBeaconData {
  uuid: string;
  major: number;
  minor: number;
  txPower: number;
}

// Поліфіл для atob (React Native не завжди підтримує atob глобально)
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const lookup = new Uint8Array(256);
for (let i = 0; i < chars.length; i++) {
  lookup[chars.charCodeAt(i)] = i;
}

const decodeBase64 = (base64: string): Uint8Array => {
  let bufferLength = base64.length * 0.75,
    len = base64.length, i, p = 0,
    encoded1, encoded2, encoded3, encoded4;

  if (base64[base64.length - 1] === "=") {
    bufferLength--;
    if (base64[base64.length - 2] === "=") {
      bufferLength--;
    }
  }

  const bytes = new Uint8Array(bufferLength);

  for (i = 0; i < len; i += 4) {
    encoded1 = lookup[base64.charCodeAt(i)];
    encoded2 = lookup[base64.charCodeAt(i + 1)];
    encoded3 = lookup[base64.charCodeAt(i + 2)];
    encoded4 = lookup[base64.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }

  return bytes;
};

function byteToHex(b: number) {
  return b.toString(16).padStart(2, '0');
}

export const parseIBeacon = (manufacturerData: string | null): IBeaconData | null => {
  if (!manufacturerData) return null;

  try {
    const bytes = decodeBase64(manufacturerData);

    // Scan the bytes to find the iBeacon identifier (Type 0x02, Length 0x15) 
    // OR AltBeacon identifier (Type 0xBE, Length 0xAC) which Android simulators often use
    let startIndex = -1;
    for (let i = 0; i <= bytes.length - 23; i++) {
      const isIBeacon = bytes[i] === 0x02 && bytes[i + 1] === 0x15;
      const isAltBeacon = bytes[i] === 0xbe && bytes[i + 1] === 0xac;
      
      if (isIBeacon || isAltBeacon) {
        startIndex = i;
        break;
      }
    }

    if (startIndex === -1) return null;

    // UUID is 16 bytes starting at startIndex + 2
    const uuidStart = startIndex + 2;
    const uuidBytes = bytes.slice(uuidStart, uuidStart + 16);
    const uuidParts = [
      byteToHex(uuidBytes[0]) + byteToHex(uuidBytes[1]) + byteToHex(uuidBytes[2]) + byteToHex(uuidBytes[3]),
      byteToHex(uuidBytes[4]) + byteToHex(uuidBytes[5]),
      byteToHex(uuidBytes[6]) + byteToHex(uuidBytes[7]),
      byteToHex(uuidBytes[8]) + byteToHex(uuidBytes[9]),
      byteToHex(uuidBytes[10]) + byteToHex(uuidBytes[11]) + byteToHex(uuidBytes[12]) + byteToHex(uuidBytes[13]) + byteToHex(uuidBytes[14]) + byteToHex(uuidBytes[15])
    ];
    const uuid = uuidParts.join('-').toUpperCase();

    // Major is 2 bytes starting at startIndex + 18
    const major = (bytes[startIndex + 18] << 8) | bytes[startIndex + 19];
    
    // Minor is 2 bytes starting at startIndex + 20
    const minor = (bytes[startIndex + 20] << 8) | bytes[startIndex + 21];
    
    // TxPower is 1 byte at startIndex + 22 (signed 8-bit int)
    let txPower = bytes[startIndex + 22];
    if (txPower > 127) txPower -= 256;

    return { uuid, major, minor, txPower };
  } catch (e) {
    return null;
  }
};
