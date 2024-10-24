import { ActionRegister } from './actionsHandler';

export interface interactionDefinition {
  id: string;
  callback: (action: ActionRegister) => Promise<void>;
}

export class VirtualPlayer {
  protected _interactions: Array<interactionDefinition> = [];

  public addInteraction(interaction: interactionDefinition) {
    const exists = this._interactions.find((i) => i.id === interaction.id);
    if (exists) return;
    this._interactions.push(interaction);
  }

  public async interact(action: ActionRegister) {
    const interaction = this._interactions.find((i) => i.id === action.action);
    if (interaction) await interaction.callback(action);
  }
}
