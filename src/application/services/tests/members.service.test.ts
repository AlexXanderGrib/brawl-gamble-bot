import { configure } from "src/config";
import { MembersService } from "../members.service";

jest.setTimeout(30000);
describe(MembersService.name, () => {
  const container = configure(202005841);
  if (!container) fail("Invalid group id");
  const ms = container.inject(MembersService) as MembersService;

  test("Get All Members", async () => {
    const set = new Set<number>();

    for await (const [batch] of ms.getAll({ batchSize: 500 })) {
      expect(batch.length).toBeLessThanOrEqual(500);

      batch.forEach(id => set.add(id));
    }

    expect(set.size).toBeGreaterThan(500);
  });

  test("Get All Conversations", async () => {
    const set = new Set<number>();

    for await (const [batch] of ms.getConversations({ batchSize: 200 })) {
      expect(batch.length).toBeLessThanOrEqual(200);

      batch.map(c => set.add(c.conversation.peer.id));
    }

    expect(set.size).toBeGreaterThan(200);
  });
});
