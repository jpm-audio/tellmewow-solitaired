import { Application, Container, Sprite, Texture } from 'pixi.js';
import Card from '../components/card';
import CARD_SUITS from '../constants/cards';
import Deck from '../components/deck';

interface GameDecks {
  stock: Deck;
  waste: Deck;
  fundations: Deck[];
  tableu: Deck[];
}

export class SolitaireScene extends Container {
  protected _isInitialized: boolean = false;
  private _config = {
    backTexture: 'back_red.png',
    baseTexture: 'card_base-2.png',
    baseLogoTexture: 'logo-black.png',
    frameHeight: 1194,
    cardHeight: 367,
    cardsGap: 4,
    tableuDecksOffset: 65,
    cardScale: 1,
    fundations: 4,
    tableuCols: 7,
  };
  private _cards: Card[] = [];
  private _decks: GameDecks = {
    stock: new Deck(),
    waste: new Deck(),
    fundations: [],
    tableu: [],
  };

  constructor() {
    super();
  }

  public async init(app: Application) {
    if (this._isInitialized) return;
    this._isInitialized = true;

    this._config.cardScale =
      this._config.cardHeight / Texture.from(this._config.backTexture).height;

    this._createCards();
    this._createDecks();

    this._decks.stock.addCard(this._cards[0], 'back');
    //this._decks.waste.addCard(this._cards[1]);
    this._decks.tableu[0].addCard(this._cards[2]);
    this._decks.tableu[1].addCard(this._cards[3], 'back');
    this._decks.tableu[1].addCard(this._cards[4]);
    this._decks.tableu[2].addCard(this._cards[5], 'back');
    this._decks.tableu[2].addCard(this._cards[6], 'back');
    this._decks.tableu[2].addCard(this._cards[7]);
    this._decks.tableu[3].addCard(this._cards[8], 'back');
    this._decks.tableu[3].addCard(this._cards[9], 'back');
    this._decks.tableu[3].addCard(this._cards[10], 'back');
    this._decks.tableu[3].addCard(this._cards[11]);
    this._decks.tableu[4].addCard(this._cards[12], 'back');
    this._decks.tableu[4].addCard(this._cards[13], 'back');
    this._decks.tableu[4].addCard(this._cards[14], 'back');
    this._decks.tableu[4].addCard(this._cards[15], 'back');
    this._decks.tableu[4].addCard(this._cards[16]);
    this._decks.tableu[5].addCard(this._cards[17], 'back');
    this._decks.tableu[5].addCard(this._cards[18], 'back');
    this._decks.tableu[5].addCard(this._cards[19], 'back');
    this._decks.tableu[5].addCard(this._cards[20], 'back');
    this._decks.tableu[5].addCard(this._cards[21], 'back');
    this._decks.tableu[5].addCard(this._cards[22]);
    this._decks.tableu[6].addCard(this._cards[23], 'back');
    this._decks.tableu[6].addCard(this._cards[24], 'back');
    this._decks.tableu[6].addCard(this._cards[25], 'back');
    this._decks.tableu[6].addCard(this._cards[26], 'back');
    this._decks.tableu[6].addCard(this._cards[27], 'back');
    this._decks.tableu[6].addCard(this._cards[28], 'back');
    this._decks.tableu[6].addCard(this._cards[29]);
    //this._decks.fundations[0].addCard(this._cards[30]);
    //this._decks.fundations[1].addCard(this._cards[31]);
    //this._decks.fundations[2].addCard(this._cards[32]);
    //this._decks.fundations[3].addCard(this._cards[33]);
  }

  private _createCards() {
    CARD_SUITS.forEach((suit) => {
      for (let i = 1; i < suit.values + 1; i++) {
        const card = new Card(
          { suit: suit.id, value: i },
          'back_red.png',
          `${suit.id}_${i}.png`
        );
        card.scale.set(this._config.cardScale);
        this._cards.push(card);
      }
    });
  }

  private _createDecks() {
    const gap = this._config.cardsGap * this._config.cardScale;
    const cardWidth = this._cards[0].width;
    const cardHeight = this._cards[0].height;

    // Stock
    this._decks.stock = new Deck();
    this._decks.stock.x = gap + cardWidth / 2;
    this._decks.stock.y = gap + cardHeight / 2;
    this.addChild(this._decks.stock);

    // Waste
    const base = Sprite.from(this._config.baseTexture);
    this.addChild(base);
    this._decks.waste = new Deck();
    this._decks.waste.x = this._decks.stock.x + gap + cardWidth;
    this._decks.waste.y = this._decks.stock.y;
    this.addChild(this._decks.waste);
    base.height = this._cards[0].height;
    base.width = this._cards[0].width;
    base.anchor.set(0.5);
    base.x = this._decks.waste.x;
    base.y = this._decks.waste.y;

    // Fundations
    for (let i = 0; i < this._config.fundations; i++) {
      const base = Sprite.from(this._config.baseTexture);
      this.addChild(base);
      const baseLogo = Sprite.from(this._config.baseLogoTexture);
      this.addChild(baseLogo);

      const deck = new Deck();
      this._decks.fundations.push(deck);
      this._decks.fundations[i].x =
        this._decks.waste.x + (2 + i) * (gap + cardWidth);
      this._decks.fundations[i].y = this._decks.waste.y;
      this.addChild(deck);

      base.height = this._cards[0].height;
      base.width = this._cards[0].width;
      baseLogo.scale.set(this._config.cardScale * 0.75);
      base.anchor.set(0.5);
      baseLogo.anchor.set(0.5);
      base.x = baseLogo.x = this._decks.fundations[i].x;
      base.y = baseLogo.y = this._decks.fundations[i].y;
    }

    // Tableu
    const offsetY = this._config.tableuDecksOffset * this._config.cardScale;
    const deckY = this._decks.stock.y + gap + cardHeight;
    for (let i = 0; i < this._config.tableuCols; i++) {
      const deck = new Deck({ x: 0, y: offsetY });
      this._decks.tableu.push(deck);
      this._decks.tableu[i].x = this._decks.stock.x + i * (gap + cardWidth);
      this._decks.tableu[i].y = deckY;
      this.addChild(deck);
    }
  }

  public updateSize(app: Application) {
    if (!this._isInitialized) return;

    const scale = app.canvas.height / this._config.frameHeight;
    this.scale.set(scale);

    console.log(app.canvas.height);
  }
}
