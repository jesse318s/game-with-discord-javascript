const help = require("../commands/help");
const fs = require("fs");

describe("helpCommand", () => {
  test("interaction is replied to with a message containing the help information", async () => {
    const commandFiles = fs
      .readdirSync("./commands")
      .filter((file) => file.endsWith(".js"));
    let str = "";
    const mockInteraction = {
      reply: jest.fn().mockResolvedValue(true),
    };

    for (const file of commandFiles) {
      const command = require(`../commands/${file}`);

      str += `\u2022 **Command:** ${command.data.name}, **Description:** ${command.data.description}\n`;
    }

    await help.execute(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith({
      content: str,
      ephemeral: true,
    });
  });
});
