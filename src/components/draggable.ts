import { Container, FederatedPointerEvent, Point } from 'pixi.js';

export class Draggable extends Container {
  protected _isDragging: boolean = false;
  public dragPointerOrigin: Point;
  public dragPositionOrigin: Point;

  public get isDragging() {
    return this._isDragging;
  }

  constructor() {
    super();
    this.dragPointerOrigin = new Point();
    this.dragPositionOrigin = new Point();

    this.onpointerdown = this._onDragStart.bind(this);
    this.onpointermove = this._onDragMove.bind(this);
    this.onpointerup = this._onDragEnd.bind(this);
    this.onpointercancel = this._onDragCancel.bind(this);
    window.addEventListener('mouseout', this._onMouseLeave.bind(this));
  }

  protected _onDragStart(event: FederatedPointerEvent) {
    if (this._isDragging) return;
    this._isDragging = true;
    this.dragPositionOrigin.copyFrom(this.position);
    this.dragPointerOrigin.copyFrom(event.getLocalPosition(this.parent));
    this.emit('dragStart', event);
  }

  protected _onDragMove(event: FederatedPointerEvent) {
    if (!this.isDragging) return;
    this.x =
      this.dragPositionOrigin.x +
      (event.getLocalPosition(this.parent).x - this.dragPointerOrigin.x);
    this.y =
      this.dragPositionOrigin.y +
      (event.getLocalPosition(this.parent).y - this.dragPointerOrigin.y);
  }

  protected _onDragEnd() {
    if (this.isDragging) {
      this.emit('dragEnd');
      this._isDragging = false;
      this.x = this.dragPositionOrigin.x;
      this.y = this.dragPositionOrigin.y;
    }
  }

  protected _onDragCancel() {
    this._onDragEnd();
  }

  protected _onMouseLeave() {
    this._onDragEnd();
  }
}
