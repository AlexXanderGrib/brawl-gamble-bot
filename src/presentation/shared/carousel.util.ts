import type { KeyboardButton } from "vk-io";
import type { PhotosPhoto } from "vk-io/lib/api/schemas/objects";

type CarouselButtons = [KeyboardButton, KeyboardButton?, KeyboardButton?];
type CarouselBaseItem = { buttons: CarouselButtons };
type CarouselImageItemAction =
  | { type: "open_link"; link: string }
  | { type: "open_photo" };
type CarouselImageItemDTO = CarouselBaseItem & {
  photo_id: string;
  action?: CarouselImageItemAction;
};
type CarouselTextItemDTO = CarouselBaseItem & {
  title: string;
  description: string;
};

type CarouselFullItemDTO = CarouselTextItemDTO & CarouselImageItemDTO;

type CarouselItemDTO =
  | CarouselImageItemDTO
  | CarouselTextItemDTO
  | CarouselFullItemDTO;

type JsonableTo<T> = { toJSON(): T };
type Jsonable<T> = JsonableTo<T> | T;
type CarouselDTO = { type: "carousel"; elements: CarouselItemDTO[] };

function isJsonableTo<T>(something: any): something is JsonableTo<T> {
  return !!something.toJSON;
}

export class CarouselTextItem implements JsonableTo<CarouselTextItemDTO> {
  constructor(
    public title: string,
    public description: string,
    public buttons: CarouselButtons
  ) {}

  toJSON(): CarouselTextItemDTO {
    return {
      title: this.title.slice(0, 80),
      buttons: this.buttons,
      description: this.description.slice(0, 80)
    };
  }
}

export class CarouselImageItem implements JsonableTo<CarouselImageItemDTO> {
  constructor(
    public photo: PhotosPhoto | string,
    public buttons: CarouselButtons,
    public action: CarouselImageItemAction | undefined = undefined
  ) {}

  toJSON(): CarouselImageItemDTO {
    return {
      photo_id:
        typeof this.photo === "string"
          ? this.photo
          : this.photo.owner_id + "_" + this.photo.id,
      action: this.action,
      buttons: this.buttons
    };
  }
}

export class CarouselFullItem implements JsonableTo<CarouselFullItemDTO> {
  constructor(
    public photo: PhotosPhoto | string,
    public title: string,
    public description: string,
    public buttons: CarouselButtons,
    public action: CarouselImageItemAction | undefined = undefined
  ) {}

  toJSON(): CarouselFullItemDTO {
    return {
      title: this.title.slice(0, 80),
      photo_id:
        typeof this.photo === "string"
          ? this.photo
          : this.photo.owner_id + "_" + this.photo.id,
      action: this.action,
      buttons: this.buttons,
      description: this.description.slice(0, 80)
    };
  }
}

export class Carousel implements JsonableTo<CarouselDTO> {
  public readonly type = "carousel";

  constructor(public elements: Jsonable<CarouselItemDTO>[] = []) {}

  toJSON(): CarouselDTO {
    const elements = this.elements.map(el => {
      if (isJsonableTo(el)) return el.toJSON();

      return el;
    });

    return { type: this.type, elements } as const;
  }
}
