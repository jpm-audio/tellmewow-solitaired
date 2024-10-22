export type CardSuit = 'club' | 'diamond' | 'heart' | 'spade';
export type Decks = 'pile' | 'waste' | 'foundation' | 'tableu';
export type Actions = 'deal' | 'move';

export type CardSuitInfo = {
  id: CardSuit;
  color: string;
  values: number;
};

const CARD_SUITS: CardSuitInfo[] = [
  {
    id: 'club',
    color: 'black',
    values: 13,
  },
  {
    id: 'diamond',
    color: 'red',
    values: 13,
  },
  {
    id: 'heart',
    color: 'red',
    values: 13,
  },
  {
    id: 'spade',
    color: 'black',
    values: 13,
  },
];

export default CARD_SUITS;
