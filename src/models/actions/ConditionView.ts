export interface IConditionView {
  /**
   * Whether the condition editor is rendered in the "full" view
   * instead of the summary.
   */
  opened?: boolean;
}

export class ConditionView {
  /**
   * Whether the condition editor is rendered in the "full" view
   * instead of the summary.
   */
  opened?: boolean;

  constructor(input?: string|IConditionView) {
    let init: IConditionView;
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

  new(init: IConditionView): void {
    const { opened=false } = init;
    this.opened = opened;
  }

  toJSON(): IConditionView {
    const result: IConditionView = {};
    if (typeof this.opened === 'boolean') {
      result.opened = this.opened;
    }
    return result;
  }
}
