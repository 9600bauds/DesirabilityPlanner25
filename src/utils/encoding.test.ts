import { describe, expect, it } from 'vitest';
import { decodeData, encodeData } from './encoding';

describe('encodeData / decodeData', () => {
  it('round-trips every possible byte value', () => {
    const data = new Uint8Array(256).map((_, i) => i);
    expect([...decodeData(encodeData(data))]).toEqual([...data]);
  });

  it('rejects characters that cannot appear in its own output', () => {
    expect(() => decodeData('!!!!')).toThrow();
  });
});
