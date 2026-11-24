import { describe, it, expect } from 'vitest';
import { decodeReceiver, encodeReceiver } from './receiverPayload';
import { encryptText } from './crypto';

describe('receiver payload', () => {
  it('round-trips a wishlist, including accents and emoji', async () => {
    const data = {
      name: 'João',
      hint: 'Gosta de café ☕',
      wishlist: [
        {text: 'Livro "Dom Casmurro"', url: 'https://example.com/livro', price: 'R$ 40'},
        {text: 'Meias'},
      ],
    };

    expect(await decodeReceiver(await encodeReceiver(data))).toEqual(data);
  });

  it('keeps legacy formats readable', async () => {
    expect(await decodeReceiver(await encryptText('Alice'))).toEqual({name: 'Alice'});
    expect(await decodeReceiver(await encryptText(JSON.stringify({name: 'Alice', hint: 'cats'})))).toEqual({name: 'Alice', hint: 'cats'});
    expect(await decodeReceiver(await encodeReceiver({name: 'Alice', hint: 'cats'}))).toEqual({name: 'Alice', hint: 'cats'});
  });

  it('treats a numeric-looking name as a plain name', async () => {
    expect(await decodeReceiver(await encryptText('123'))).toEqual({name: '123'});
  });

  it('compresses repetitive wishlists', async () => {
    const wishlist = Array.from({length: 15}, (_, i) => ({text: `Item de presente número ${i}`, url: `https://loja.example.com/produto/${i}`}));
    const compressed = await encodeReceiver({name: 'Ana', wishlist});
    const raw = await encryptText(JSON.stringify({name: 'Ana', wishlist}));
    expect(compressed.length).toBeLessThan(raw.length);
  });
});
