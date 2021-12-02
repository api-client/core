export interface IActionView {
  /**
   * Whether the action is "opened" in the editor UI.
   */
  opened?: boolean;
}

export class ActionView {
  /**
   * Whether the action is "opened" in the editor UI.
   */
  opened?: boolean;

  constructor(input?: string|IActionView) {
    let init: IActionView;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        opened: false,
      };
    }
    this.new(init);
  }

  new(init: IActionView): void {
    const { opened=false } = init;
    this.opened = opened;
  }

  toJSON(): IActionView {
    const result: IActionView = {};
    if (typeof this.opened === 'boolean') {
      result.opened = this.opened;
    }
    return result;
  }
}
