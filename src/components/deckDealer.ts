import { Container, Point } from 'pixi.js';
import Deck from './deck';
import Card from './card';
import CardFlipAnimation from '../animations/cardFlipAnimation';

export class DeckDealer extends Container {
  protected _cardAnimation: CardFlipAnimation;
  protected _cardsLayer: Container;
  protected _decksLayer: Container;
  public stock: Deck;
  public waste: Deck;

  constructor(stock: Deck, waste: Deck, animationDuration: number = 1) {
    super();
    this.stock = stock;
    this.waste = waste;

    this._cardAnimation = new CardFlipAnimation(animationDuration);
    this._decksLayer = new Container();
    this._cardsLayer = new Container();
    this.addChild(this._decksLayer);
    this.addChild(this._cardsLayer);
    this._decksLayer.addChild(this.stock);
    this._decksLayer.addChild(this.waste);
  }

  protected async _animateCard(card: Card, isDeal: boolean = true) {
    const deckFrom = isDeal ? this.stock : this.waste;
    const deckTo = isDeal ? this.waste : this.stock;

    const deck1Coords = deckFrom.getNextCardCoordinates(1);
    const deck2Coords = deckTo.getNextCardCoordinates(1 + this.waste.numCards);
    card.x = deckFrom.x + deck1Coords.x;
    card.y = deckFrom.y + deck1Coords.y;

    this._cardAnimation.scale = { x: 0, y: card.scale.y };
    this._cardAnimation.addPlay(
      card,
      new Point(deckFrom.x + deck1Coords.x, deckFrom.y + deck1Coords.y),
      new Point(deckTo.x + deck2Coords.x, deckTo.y + deck2Coords.y),
      () => card.flip(),
      () => {
        this._cardsLayer.removeChild(card);
        deckTo.addCard(card);
      }
    );

    this._cardsLayer.addChildAt(card, 0);
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
      this._cardsLayer.addChild(card);
    });
  }

  public reset() {
    this.stock.reset();
    this.waste.reset();
  }
}
