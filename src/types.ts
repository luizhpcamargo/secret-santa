export interface Rule {
  type: 'must' | 'mustNot';
  targetParticipantId: string;
}

export interface WishItem {
  text: string;
  url?: string;
  price?: string;
}

export interface Participant {
  id: string;
  name: string;
  hint?: string;
  wishlist?: WishItem[];
  groupId?: string;
  rules: Rule[];
}

export type Participants = Record<string, Participant>;

export interface Group {
  id: string;
  name: string;
  // Groups whose members this group's members can draw. `undefined` means every group.
  canDraw?: string[];
}

export type Groups = Record<string, Group>;

// Data encrypted inside each participant's link
export interface ReceiverData {
  name: string;
  hint?: string;
  wishlist?: WishItem[];
}
