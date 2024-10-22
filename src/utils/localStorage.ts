export class LocalStorage {
  protected _itemId: string;

  constructor(itemId: string) {
    this._itemId = itemId;
  }

  public get() {
    const dataString = localStorage.getItem(this._itemId);
    return dataString !== null ? JSON.parse(dataString) : null;
  }

  public set(data: string | number | [] | object) {
    if (data === undefined || data === null) return;
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    localStorage.setItem(this._itemId, dataString);
  }

  public delete() {
    localStorage.removeItem(this._itemId);
  }
}
