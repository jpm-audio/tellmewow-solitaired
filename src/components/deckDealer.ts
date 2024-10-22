import { Container, Point } from 'pixi.js';
import Deck from './deck';
import Card from './card';
import CardFlipAnimation from '../animations/cardFlipAnimation';
import { Dealer, DealerSettings } from './dealer';

interface DeckDealerSettings extends DealerSettings {
  dealAnimation: {
    duration: number;
  };
}

export class DeckDealer extends Dealer {
  protected _cardAnimation: CardFlipAnimation;
  protected _basesLayer: Container;
  protected _cardsLayer: Container;
  protected _decksLayer: Container;
  public stock: Deck;
  public waste: Deck;

  constructor(settings: DeckDealerSettings) {
    super();

    // Layers
    this._basesLayer = new Container();
    this._decksLayer = new Container();
    this._cardsLayer = new Container();
    this.addChild(this._basesLayer);
    this.addChild(this._decksLayer);
    this.addChild(this._cardsLayer);

    // Bases
    settings.bases[0].x = settings.deck.padding + settings.deck.width / 2;
    settings.bases[0].y = settings.deck.padding + settings.deck.height / 2;
    this._basesLayer.addChild(settings.bases[0]);

    settings.bases[1].x =
      settings.bases[0].x + settings.deck.gap + settings.deck.width;
    settings.bases[1].y = settings.bases[0].y;
    this._basesLayer.addChild(settings.bases[1]);

    // Stock
    this.stock = new Deck();
    this.stock.x = settings.bases[0].x;
    this.stock.y = settings.bases[0].y;
    this._decksLayer.addChild(this.stock);

    // Waste
    this.waste = new Deck();
    this.waste.x = settings.bases[1].x;
    this.waste.y = settings.bases[1].y;
    this._decksLayer.addChild(this.waste);

    // Animation
    this._cardAnimation = new CardFlipAnimation(
      settings.dealAnimation.duration
    );

    // Events
    settings.bases[0].interactive = true;
    settings.bases[0].on('pointerdown', (e) => {
      this.emit('stock.pointerdown', this, e);
    });
  }

  protected async _animateCard(card: Card, isDeal: boolean = true) {
    const deckFrom = isDeal ? this.stock : this.waste;
    const deckTo = isDeal ? this.waste : this.stock;

    const deck1Coords = deckFrom.getNextCardCoordinates(1);
    const deck2Coords = deckTo.getNextCardCoordinates(1 + this.waste.numCards);
    card.x = deckFrom.x + deck1Coords.x;
    card.y = deckFrom.y + deck1Coords.y;

    this._cardsLayer.addChildAt(card, 0);

    this._cardAnimation.scale = { x: 0, y: card.scale.y };
    await this._cardAnimation.addPlay(
      card,
      new Point(deckFrom.x + deck1Coords.x, deckFrom.y + deck1Coords.y),
      new Point(deckTo.x + deck2Coords.x, deckTo.y + deck2Coords.y),
      () => card.flip(),
      () => {
        this._cardsLayer.removeChild(card);
        deckTo.addCard(card, isDeal ? 'front' : 'back');
      }
    );
  }

  public addCards(cards: Card[]) {
    cards.forEach((card) => {
      this.stock.addCard(card, 'back');
    });
  }

  public async deal() {
    const card = this.stock.getCard();
    if (card === null) return;
    await this._animateCard(card);
  }

  public async undeal() {
    const card = this.waste.getCard();
    if (card === null) return;
    await this._animateCard(card, false);
  }

  public async redeal() {
    const card = this.waste.getCard();
    if (card === null) return;

    const cards = this.waste.reset();
    await this._animateCard(card, false);

    cards.forEach((card) => {
      this.stock.addCard(card, 'back');
    });
  }

  public async unredeal() {
    if (this.stock.numCards === 0) return;

    const cards = this.stock.reset();
    const lastCard = cards.pop() as Card;

    await this._animateCard(lastCard, true);

    cards.forEach((card) => {
      this.waste.addCard(card, 'front');
      console.log(card.info.suit + ' - ' + card.info.value);
    });
    this.waste.addCard(lastCard, 'front');
  }

  public reset() {
    this.stock.reset();
    this.waste.reset();
  }
}
