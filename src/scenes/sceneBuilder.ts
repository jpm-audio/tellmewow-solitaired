import { Container, PointData, Rectangle } from 'pixi.js';
import { CardsDealer } from '../systems/cardsDealer';
import { CardSuitInfo, Decks } from '../constants/cards';
import { SceneState, StateRegister } from '../systems/stateHandler';
import { CardLocation } from '../systems/actionsHandler';
import Card from '../components/card';
import Deck from '../components/deck';
import { Dealer } from '../components/dealer';
import { GameAction } from './gameActions';

export interface SceneBuilderCreateInfo {
  scene: Container;
  frame: Rectangle;
}

export interface SceneBuilderDropTestResult {
  destinationLocation: CardLocation;
  hasHostCard2Turn: boolean;
}

export default class SceneBuilder {
  public cardsDealer!: CardsDealer;

  public get gameActions(): GameAction[] {
    return [];
  }

  protected _createCardsDealer(cardSuitInfo: CardSuitInfo[]) {
    // CARDS
    this.cardsDealer = new CardsDealer();
    this.cardsDealer.init(cardSuitInfo);
  }

  /**
   * Call to create the scene components (Dealers, decks...) and set them in the scene container
   * @param scene Scene Container where to add the scene components
   * @param frame Frame boundaries dimensions of the scene
   */
  public create(sceneBuilderCreateInfo: SceneBuilderCreateInfo) {}
  /**
   * Deal the cards for initializing a new game
   */
  public initCards() {}
  /**
   * Set the cards in a specified state
   */
  public setCards(state: StateRegister) {}
  /**
   * Returns the current scene state, cards and piles info of all dealers
   *
   * @returns Scene state
   */
  public getInfo(): SceneState {
    return {};
  }
  /**
   *
   * @returns
   */
  public getStock(): number {
    return 0;
  }
  /**
   *   Returns a Dealer object by its name
   *
   * @param name Dealer name
   */
  public getDealerByName(name: Decks): Dealer | null {}
  /**
   * Returns a Deck object (pile) of the specified pile from a card location given
   * @param location Location of the pile
   */
  public getPileFromLocation(location: CardLocation): Deck | null {}
  /**
   * Look for a card specified by its location and returns it
   *
   * @param cardLocation
   */
  public takeCards(cardLocation: CardLocation): Card[] {
    return [];
  }
  /**
   * Prepare piles right before undo action and after cards has been taken
   *
   * @param cardLocation
   */
  public onUndoStart(
    fromLocation: CardLocation,
    toLocation: CardLocation,
    pendingTurn: boolean = false
  ): boolean {
    return false;
  }
  /**
   * Prepare piles right after undo action ends
   *
   * @param cardLocation
   */
  public onUndoEnd(
    fromLocation: CardLocation,
    toLocation: CardLocation,
    pendingTurn: boolean = false
  ): boolean {
    return false;
  }
  /**
   * Test whether the cards can be dropped on the specified location into a Dealer pile
   *
   * @param cards Cards to be dropped
   */
  public dropTest(cards: Card[]): SceneBuilderDropTestResult | null {}
  /**
   * Drop the cards on the specified location into a Dealer pile
   *
   * @param cards Cards to be dropped
   */
  public dropCards(cards: Card[], location: CardLocation): boolean {}
  /**
   * Execute the test to see whether the game is won
   *
   * @returns Resturns true if the game is won
   */
  public winTest(): boolean {
    return false;
  }

  public reset() {}

  public updateSize() {}
}
