import { MembersService } from "@app/services/members.service";
import { autoKeyboard } from "@pres/views/auto.keyboard";
import { emoji } from "@xxhax/emoji";
import { API, Keyboard } from "vk-io";
import type { MessagesSendParams } from "vk-io/lib/api/schemas/params";
import { BotAPI, Config, configure, GroupID } from "../../config";

const di = configure(202005841);

if (!di) throw new Error("No di");

const message: MessagesSendParams = {
  message: `Бот - всё ${emoji.skull}`,
  attachment: [],
  keyboard: autoKeyboard({
    inline: true,
    keyboard: Keyboard.builder().textButton({
      label: `F`,
      color: "negative"
    })
  })
};

console.log("Preparing spam!");

async function main() {
  if (!di) throw new Error("No di");

  const groupId = await di.injectAsync<number>(GroupID);
  const api = await di.injectAsync<API>(BotAPI);
  const config = await di.injectAsync<Config>(Config);
  const ms = await di.injectAsync<MembersService>(MembersService);
  console.log("Dependencies Injected");

  const servers = await api.groups.getCallbackServers({ group_id: groupId });
  console.log("Callback Servers got");

  const server = servers.items.find(
    server => server.secret_key === config.webhook.secret
  );

  if (!server) throw new Error("No server");
  console.log("Server found");

  const backup = await api.groups.getCallbackSettings({
    server_id: server.id,
    group_id: groupId
  });
  console.log("Callback Settings backup made");

  await api.groups.setCallbackSettings({
    server_id: server.id,
    group_id: groupId,
    message_reply: 0
  });
  console.log("Callback Settings patched");

  try {
    console.log("Starting spam");

    let total = 0;

    for await (const [batch, { offset, count }] of ms.getConversations({
      batchSize: 100
    })) {
      const peer_ids = batch
        .filter(c => c.conversation && c.conversation.can_write.allowed)
        .map(c => c.conversation?.peer.local_id)
        .filter(id => !!id) as number[];

      if (peer_ids.length === 0) {
        continue;
      }

      console.log(`[${offset}/${count}] Delivered ${peer_ids.length} `);
      total += peer_ids.length;
      await api.messages.send({ ...message, peer_ids, random_id: Date.now() });
    }

    console.log(`Total: ${total}`);
  } catch (error) {
    console.log(error);
  } finally {
    await api.groups.setCallbackSettings({
      server_id: server.id,
      group_id: groupId,
      ...backup.events
    });
    console.log("Callback settings reverted");
  }
}

main();
