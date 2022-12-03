import { MarketRoutes } from "@pres/controllers/market.shared";
import { chunk } from "@xxhax/lists";
import { stringify } from "querystring";
import { Keyboard, KeyboardButton } from "vk-io";
import type { MarketMarketItem } from "vk-io/lib/api/schemas/objects";
import {
  Carousel,
  CarouselFullItem,
  CarouselTextItem
} from "../shared/carousel.util";

export type ProductDesc = {
  product: MarketMarketItem;
  url: string;
  short_url: string;
};

export function createProductsCarousel(
  items: ProductDesc[],
  mapping: Map<number, string>
): Carousel {
  const carousel = new Carousel();

  for (const { url, product } of items) {
    const title = product.title.slice(0, 80);
    const desc = product.description.slice(0, 80);
    const action = { type: "open_link", link: url } as const;
    const buttons: [KeyboardButton, KeyboardButton, KeyboardButton] = [
      {
        action: {
          type: "text",
          label: "Перейти к оплате",
          payload: JSON.stringify({
            command: MarketRoutes.Purchase.command,
            product_id: product.id
          })
        },
        color: Keyboard.PRIMARY_COLOR
      },
      {
        action: {
          type: "vkpay",
          hash: stringify({
            action: "pay-to-group",
            aid: 10,
            amount: Math.ceil(parseInt(product.price.amount) / 100),
            group_id: -product.owner_id,
            data: `p${product.id}`
          })
        }
      },
      {
        action: {
          type: "open_link",
          label: "Подробнее",
          link: url,
          payload: JSON.stringify({
            command: "market:send-product",
            product_id: product.id
          })
        }
      }
    ];

    const photoId = mapping.get(product.id);

    const element = photoId
      ? new CarouselFullItem(photoId, title, desc, buttons, action)
      : new CarouselTextItem(title, desc, buttons);

    carousel.elements.push(element);
  }

  return carousel;
}

export function createProductsKeyboard(items: ProductDesc[]) {
  return Keyboard.keyboard(
    chunk(
      items.map(({ product }) =>
        Keyboard.textButton({
          color: Keyboard.PRIMARY_COLOR,
          label: product.title.substr(0, 80),
          payload: {
            command: MarketRoutes.Purchase.command,
            product_id: product.id
          }
        })
      ),
      2
    )
  );
}
