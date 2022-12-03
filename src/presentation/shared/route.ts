import { ButtonColor, ButtonColorUnion, Keyboard } from "vk-io";

export type TRoute = {
  readonly name: string;
  readonly digits?: string;
  readonly command: string;
  readonly textAliases?: (string | RegExp)[];
  readonly commandsAliases?: string[];
  readonly activities?: string[];
  readonly requiredModules?: string[];
};

export class Route implements TRoute {
  name: string;
  digits?: string | undefined;
  command: string;
  textAliases: (string | RegExp)[] = [];
  commandsAliases: string[] = [];
  activities: string[] = [];
  requiredModules: string[] = [];

  constructor(data: TRoute) {
    this.name = data.name;
    this.command = data.command;
    Object.assign(this, data);
  }

  toButton(
    color: ButtonColor | ButtonColorUnion = Keyboard.SECONDARY_COLOR,
    { label = "", payload = {} as Record<string, any> } = {}
  ) {
    return Keyboard.textButton({
      color,
      label: label || this.name,
      payload: { command: this.command, ...payload }
    });
  }

  toString({ label = "" } = {}) {
    const firstAlias = this.textAliases?.[0];
    let text = undefined;

    if (this.digits) text = this.digits;
    else if (firstAlias) text = `"${firstAlias}"`;
    else return undefined;

    return `${text} - ${label || this.name}`;
  }
}
