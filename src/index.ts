import { DonutHandler } from "./application/extras/donut.handler";
import { QiwiHandler } from "./application/extras/qiwi.handler";
import { BotVersion, configure, container } from "./config";
import type { HandlerFunction } from "./types";

const vk$ = import("./vk").then(module => module.handleVK);

export const handler: HandlerFunction = async (event, context) => {
  const json = context.getPayload();
  container.provide(BotVersion, context.functionVersion);

  const di = configure(parseInt(event.queryStringParameters.gid ?? "0"));

  if (!di) {
    return {
      body: JSON.stringify({ code: 404, message: "Not Found" }),
      headers: {
        "Content-Type": "application/json",
        "X-Powered-By": "PHP 7.0"
      },
      statusCode: 404
    };
  }

  const donut = await di.injectAsync<DonutHandler>(DonutHandler);
  const qiwi = await di.injectAsync<QiwiHandler>(QiwiHandler);

  switch (event.queryStringParameters.act) {
    case "vk":
      return vk$.then(fn => fn(json, di));

    case "donut":
      return donut.handle(json);

    case "qiwi":
      return qiwi.handle(
        json instanceof Buffer ? JSON.parse(json.toString()) : json,
        event.headers["X-Api-Signature-SHA256"] ??
          event.headers["X-Api-Signature-Sha256"] ??
          ""
      );
  }

  return {
    body: "",
    isBase64Encoded: false,
    headers: { Location: "https://youtu.be/dQw4w9WgXcQ" },
    statusCode: 301
  };
};
