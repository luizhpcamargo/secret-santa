import { describe, it, expect } from 'vitest';
import { generatePairs, generateGenerationHash } from './generatePairs';
import { parseParticipantsText, formatParticipantText } from './parseParticipants';
import { Group, Participant } from '../types';

const person = (id: string, groupId?: string): Participant => ({id, name: id, groupId, rules: []});

describe('groups', () => {
  const participants = Object.fromEntries([
    person('p1', 'parents'), person('p2', 'parents'),
    person('k1', 'kids'), person('k2', 'kids'),
  ].map(p => [p.id, p]));

  it('only draws inside the group when asked to', () => {
    const groups: Record<string, Group> = {
      parents: {id: 'parents', name: 'Pais', canDraw: ['parents']},
      kids: {id: 'kids', name: 'Filhos', canDraw: ['kids']},
    };

    for (let i = 0; i < 50; i++) {
      const result = generatePairs(participants, groups)!;
      expect(result).not.toBeNull();

      for (const {giver, receiver} of result.pairings)
        expect(participants[giver.id].groupId).toBe(participants[receiver.id].groupId);
    }
  });

  it('supports cross-group drawing', () => {
    const groups: Record<string, Group> = {
      parents: {id: 'parents', name: 'Pais', canDraw: ['kids']},
      kids: {id: 'kids', name: 'Filhos', canDraw: ['parents']},
    };

    for (let i = 0; i < 50; i++) {
      const result = generatePairs(participants, groups)!;
      expect(result).not.toBeNull();

      for (const {giver, receiver} of result.pairings)
        expect(participants[giver.id].groupId).not.toBe(participants[receiver.id].groupId);
    }
  });

  it('fails cleanly when the groups make a draw impossible', () => {
    const groups: Record<string, Group> = {
      parents: {id: 'parents', name: 'Pais', canDraw: ['kids']},
      kids: {id: 'kids', name: 'Filhos', canDraw: ['kids']},
    };

    // Two kids can't cover two parents, since kids only draw kids
    expect(generatePairs(participants, groups)).toBeNull();
  });

  it('ignores groups that were deleted', () => {
    expect(generatePairs(participants, {})).not.toBeNull();
  });

  it('invalidates generated links when wishlist or groups change', () => {
    const base = generateGenerationHash(participants, {});
    const withWish = generateGenerationHash({...participants, p1: {...participants.p1, wishlist: [{text: 'Livro'}]}}, {});
    const withGroupRule = generateGenerationHash(participants, {parents: {id: 'parents', name: 'Pais', canDraw: ['kids']}});

    expect(withWish).not.toBe(base);
    expect(withGroupRule).not.toBe(base);
  });
});

describe('text view', () => {
  it('keeps wishlist and group of existing participants', () => {
    const existing = {
      a: {...person('a', 'g1'), wishlist: [{text: 'Café'}]},
      b: person('b'),
    };

    const result = parseParticipantsText(formatParticipantText(existing), existing);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.participants.a).toMatchObject({id: 'a', groupId: 'g1', wishlist: [{text: 'Café'}]});
    expect(result.participants.b.id).toBe('b');
  });
});
