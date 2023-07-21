"use strict";
const path = require("path");
const {
  SlashCommandBuilder,
  AttachmentBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const fs = require("fs");
const creatures = require("../constants/creatures");
const relics = require("../constants/relics");
const stages = require("../constants/stages");
const { createCanvas, loadImage } = require("canvas");

const gamesPath = path.relative(process.cwd(), "docs/games.txt");
let playerExperience;
let drachmas;
let playerCreature;
let chosenRelic;
let playerCreatureHP;
let playerCreatureMP;
let stageId;
let enemyCreature;
let enemyCreatureHP;
let combatAlert;
let counterRef;
let mpRef;

const loadGameData = (re) => {
  return new Promise((resolve) => {
    fs.readFile(gamesPath, "utf8", (err, data) => {
      try {
        if (err) console.error(err);

        if (!re.test(data)) {
          resolve();
          return;
        }

        const gameInfo = data.match(re)[0].split(",");

        playerExperience = parseInt(gameInfo[1]);
        drachmas = parseInt(gameInfo[2]);
        playerCreature = creatures[gameInfo[3]];
        chosenRelic = relics[gameInfo[4]];
        playerCreatureHP = parseFloat(gameInfo[5]);
        playerCreatureMP = parseFloat(gameInfo[6]);
        stageId = parseInt(gameInfo[7]);
        enemyCreature = stages[stageId].enemyCreatures[parseFloat(gameInfo[8])];
        enemyCreatureHP = parseFloat(gameInfo[9]);

        if (playerCreatureHP <= 0 || enemyCreatureHP <= 0) {
          enemyCreature =
            stages[stageId].enemyCreatures[
              Math.floor(Math.random() * stages[stageId].enemyCreatures.length)
            ];
          enemyCreatureHP = enemyCreature.hp;
          playerCreatureHP = playerCreature.hp + chosenRelic.hpMod;
          playerCreatureMP = playerCreature.mp + chosenRelic.mpMod;
        }

        counterRef = 0;
        mpRef = playerCreatureMP;
        resolve(data);
      } catch (err) {
        console.error(err);
        resolve(null);
      }
    });
  });
};

const denyGameData = async (interaction) => {
  await interaction
    .reply({
      content: "Please join the game if you haven't.",
      ephemeral: true,
    })
    .catch((err) => {
      console.error(err);
    });
  throw new Error(`Game data was denied for ${interaction.user.tag}.
    User ID: ${interaction.user.id}`);
};

const regenMP = () => {
  if (
    playerCreatureMP !== playerCreature.mp + chosenRelic.mpMod &&
    playerCreatureMP + playerCreature.mpRegen + chosenRelic.mpRegenMod <=
      playerCreature.mp + chosenRelic.mpMod
  ) {
    playerCreatureMP =
      playerCreatureMP + playerCreature.mpRegen + chosenRelic.mpRegenMod;
    return;
  }

  playerCreatureMP = playerCreature.mp + chosenRelic.mpMod;
};

const dieOrTakeDamage = (playerCreatureDefense, criticalMultiplier) => {
  if (
    playerCreatureHP -
      (enemyCreature.attack - enemyCreature.attack * playerCreatureDefense) *
        criticalMultiplier <=
    0
  ) {
    combatAlert = "Defeat!";
    playerCreatureHP = 0;
    return;
  }

  playerCreatureHP =
    playerCreatureHP -
    (enemyCreature.attack - enemyCreature.attack * playerCreatureDefense) *
      criticalMultiplier;
};

const receiveEnemyCounterAttack = (chancePlayer, moveName, moveType) => {
  try {
    const playerCreatureSpeed = playerCreature.speed + chosenRelic.speedMod;
    let playerCreatureDefense =
      (playerCreature.defense + chosenRelic.defenseMod) / 100;
    let enemyCreatureCritical = enemyCreature.critical / 100;
    let criticalMultiplier = 1;
    let chanceEnemy = false;

    if (enemyCreature.attackType === "Magic") playerCreatureDefense = 0;

    // checks enemy creature speed vs player creature speed and sets chance
    if (enemyCreature.speed < playerCreatureSpeed) {
      chanceEnemy = Math.random() >= 0.5;
    } else {
      chanceEnemy = Math.random() >= 0.8;
    }

    if (counterRef > 1 && !chanceEnemy && !chancePlayer) chanceEnemy = true;

    // series of checks for enemy counter attack based on chance/speed
    if (!chanceEnemy && chancePlayer) combatAlert = "Enemy was too slow!";

    if (!chanceEnemy && !chancePlayer) {
      playerCreatureMP = mpRef;
      counterRef += 1;
      attackEnemyOrHeal(moveName, moveType);
      return;
    }

    if (moveName === playerCreature.attackName) regenMP();

    if (chanceEnemy && chancePlayer) combatAlert = "Both abilities succeeded.";

    // checks for player chance/speed failure
    if (chanceEnemy && !chancePlayer) combatAlert = "Your summon was too slow!";

    if (chanceEnemy) {
      // checks for enemy critical hit
      if (Math.random() <= enemyCreatureCritical) criticalMultiplier = 1.5;

      if (enemyCreature.attackType === "Poison" && criticalMultiplier === 1)
        criticalMultiplier = 1.5;

      dieOrTakeDamage(playerCreatureDefense, criticalMultiplier);
    }
  } catch (err) {
    console.log(err);
  }
};

const checkLifesteal = (
  playerCreatureSpecial,
  criticalMultiplier,
  chancePlayer,
  moveName,
  moveType
) => {
  if (moveType === "Lifesteal" && chancePlayer) {
    if (
      playerCreatureHP + playerCreatureSpecial * criticalMultiplier * 0.2 >
      playerCreature.hp + chosenRelic.hpMod
    ) {
      playerCreatureHP = playerCreature.hp + chosenRelic.hpMod;
    } else {
      playerCreatureHP =
        playerCreatureHP + playerCreatureSpecial * criticalMultiplier * 0.2;
    }
  }

  receiveEnemyCounterAttack(chancePlayer, moveName, moveType);
};

const healPlayerCreature = (
  chancePlayer,
  playerCreatureSpecial,
  criticalMultiplier,
  moveName,
  moveType
) => {
  if (chancePlayer) {
    if (
      playerCreatureHP + playerCreatureSpecial * criticalMultiplier >
      playerCreature.hp + chosenRelic.hpMod
    ) {
      playerCreatureHP = playerCreature.hp + chosenRelic.hpMod;
    } else {
      playerCreatureHP =
        playerCreatureHP + playerCreatureSpecial * criticalMultiplier;
    }
  }

  receiveEnemyCounterAttack(chancePlayer, moveName, moveType);
};

const performSpecial = (
  chancePlayer,
  playerCreatureSpecial,
  playerCreatureSpecialCost,
  criticalMultiplier,
  enemyDefense,
  moveName,
  moveType
) => {
  playerCreatureMP = playerCreatureMP - playerCreatureSpecialCost;

  if (moveType !== "Heal") {
    if (
      enemyCreatureHP -
        (playerCreatureSpecial - playerCreatureSpecial * enemyDefense) *
          criticalMultiplier <=
        0 &&
      chancePlayer
    ) {
      enemyCreatureHP = 0;
      combatAlert = "Victory!";
      playerExperience += enemyCreature.reward * 2;
      drachmas += enemyCreature.reward;
      return;
    }

    if (chancePlayer) {
      enemyCreatureHP =
        enemyCreatureHP -
        (playerCreatureSpecial - playerCreatureSpecial * enemyDefense) *
          criticalMultiplier;
    }

    checkLifesteal(
      playerCreatureSpecial,
      criticalMultiplier,
      chancePlayer,
      moveName,
      moveType
    );
    return;
  }

  healPlayerCreature(
    chancePlayer,
    playerCreatureSpecial,
    criticalMultiplier,
    moveName,
    moveType
  );
};

const attackEnemyOrHeal = (moveName, moveType) => {
  try {
    const playerCreatureAttack = playerCreature.attack + chosenRelic.attackMod;
    const playerCreatureSpeed = playerCreature.speed + chosenRelic.speedMod;
    const playerCreatureCritical =
      (playerCreature.critical + chosenRelic.criticalMod) / 100;
    let playerCreatureSpecial = playerCreature.special + chosenRelic.specialMod;
    let playerCreatureSpecialCost = playerCreature.specialCost;
    let enemyDefense = enemyCreature.defense / 100;
    let chancePlayer = false;
    let criticalMultiplier = 1;

    if (moveName === playerCreature.specialName2) {
      playerCreatureSpecial = playerCreature.special2 + chosenRelic.specialMod;
      playerCreatureSpecialCost = playerCreature.specialCost2;
    }

    if (moveType === "Magic") enemyDefense = 0;

    // checks player creature speed vs enemy creature speed and sets chance
    if (playerCreatureSpeed < enemyCreature.speed) {
      chancePlayer = Math.random() >= 0.5;
    } else {
      chancePlayer = Math.random() >= 0.8;
    }

    // checks for player critical hit
    if (Math.random() <= playerCreatureCritical) criticalMultiplier = 1.5;

    if (moveType === "Poison" && criticalMultiplier === 1)
      criticalMultiplier = 1.5;

    if (moveName === playerCreature.attackName) {
      // checks for enemy death
      if (
        enemyCreatureHP -
          (playerCreatureAttack - playerCreatureAttack * enemyDefense) *
            criticalMultiplier <=
          0 &&
        chancePlayer
      ) {
        enemyCreatureHP = 0;
        combatAlert = "Victory!";
        playerExperience += enemyCreature.reward * 2;
        drachmas += enemyCreature.reward;
        return;
      }

      if (chancePlayer) {
        enemyCreatureHP =
          enemyCreatureHP -
          (playerCreatureAttack - playerCreatureAttack * enemyDefense) *
            criticalMultiplier;
      }

      receiveEnemyCounterAttack(chancePlayer, moveName, moveType);
      return;
    }

    // checks to see if the player has enough mana to use special
    if (playerCreatureMP >= playerCreatureSpecialCost) {
      performSpecial(
        chancePlayer,
        playerCreatureSpecial,
        playerCreatureSpecialCost,
        criticalMultiplier,
        enemyDefense,
        moveName,
        moveType
      );
    } else {
      combatAlert = "Not enough MP!";
    }
  } catch (err) {
    console.log(err);
  }
};

const createGameCanvas = async () => {
  const bg = await loadImage(
    path.join(
      __dirname,
      "..",
      "assets",
      "backgrounds",
      "background" + stageId + ".png"
    )
  );
  const canvas = createCanvas(bg.width, bg.height);
  const ctx = canvas.getContext("2d");
  const overlayImgSummon = await loadImage(
    path.join(
      __dirname,
      "..",
      "assets",
      "creatures",
      combatAlert === "Your summon was too slow!" || combatAlert === "Defeat!"
        ? playerCreature.img.slice(0, -4) + "_hurt.png"
        : playerCreature.img.slice(0, -4) + "_attack.png"
    )
  );
  const overlayImgEnemy = await loadImage(
    path.join(
      __dirname,
      "..",
      "assets",
      "creatures",
      combatAlert === "Enemy was too slow!" || combatAlert === "Victory!"
        ? enemyCreature.img.slice(0, -4) + "_hurt.png"
        : enemyCreature.img.slice(0, -4) + "_attack.png"
    )
  );

  ctx.drawImage(bg, 0, 0);
  ctx.drawImage(overlayImgSummon, bg.width / 2 - overlayImgSummon.width, 0);
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(overlayImgEnemy, -bg.width / 2 - overlayImgSummon.width, 0);
  ctx.restore();
  ctx.lineWidth = "20";
  ctx.strokeStyle = "green";
  ctx.beginPath();
  ctx.lineTo(0, bg.height - ctx.lineWidth / 2);
  ctx.lineTo(
    (bg.width / 2) *
      (playerCreatureHP / (playerCreature.hp + chosenRelic.hpMod)),
    bg.height - ctx.lineWidth / 2
  );
  ctx.stroke();
  ctx.strokeStyle = "red";
  ctx.beginPath();
  ctx.lineTo(bg.width, bg.height - ctx.lineWidth / 2);
  ctx.lineTo(
    bg.width / 2 +
      (bg.width / 2 - (bg.width / 2) * (enemyCreatureHP / enemyCreature.hp)),
    bg.height - ctx.lineWidth / 2
  );
  ctx.stroke();
  return new AttachmentBuilder(canvas.toBuffer(), {
    name: "stage.png",
    description: combatAlert,
  });
};

const createGameEmbed = (gameCanvas) => {
  let embedColor = "#000000";

  if (playerCreatureMP === 0) embedColor = "#FEE75C";

  if (playerCreatureHP < (playerCreature.hp + chosenRelic.hpMod) / 2)
    embedColor = "#E67E22";

  if (playerCreatureHP === 0) embedColor = "#ED4245";

  if (enemyCreatureHP === 0) embedColor = "#3498DB";

  return new EmbedBuilder()
    .setTitle(stages[stageId].name)
    .setDescription(
      "**Player**\nLevel: " +
        (Math.sqrt(playerExperience) * 0.25).toFixed(2) +
        "\nDrachmas: " +
        drachmas +
        "\n\n" +
        "**Player " +
        playerCreature.name +
        "**\nHP: " +
        playerCreatureHP +
        " / " +
        (playerCreature.hp + chosenRelic.hpMod) +
        "\nMP: " +
        playerCreatureMP +
        " / " +
        (playerCreature.mp + chosenRelic.mpMod) +
        "\n\n**Enemy " +
        enemyCreature.name +
        "**\nHP: " +
        enemyCreatureHP +
        " / " +
        enemyCreature.hp +
        "\n\n*" +
        combatAlert +
        "*"
    )
    .setColor(embedColor)
    .setImage("attachment://" + gameCanvas.name);
};

const writeGameData = async (formatted, interaction) => {
  const gameCanvas = await createGameCanvas();
  const attackButton = new ButtonBuilder()
    .setCustomId("1")
    .setLabel(playerCreature.attackName)
    .setStyle(ButtonStyle.Success);
  const special1Button = new ButtonBuilder()
    .setCustomId("2")
    .setLabel(playerCreature.specialName)
    .setStyle(ButtonStyle.Primary);
  const special2Button = new ButtonBuilder()
    .setCustomId("3")
    .setLabel(playerCreature.specialName2)
    .setStyle(ButtonStyle.Primary);

  fs.writeFile(gamesPath, formatted, "utf8", (err) => {
    try {
      if (err) {
        console.error(err);
        interaction
          .reply({
            content: "Something went wrong.",
            ephemeral: true,
          })
          .catch((err) => console.error(err));
        return;
      }

      interaction
        .reply({
          embeds: [createGameEmbed(gameCanvas)],
          ephemeral: true,
          files: combatAlert === "Not enough MP!" ? [] : [gameCanvas],
          components: [
            new ActionRowBuilder().addComponents(
              attackButton,
              special1Button,
              special2Button
            ),
          ],
        })
        .catch((err) => console.error(err));
    } catch (err) {
      console.error(err);
      interaction
        .reply({
          content: "Something went wrong.",
          ephemeral: true,
        })
        .catch((err) => console.error(err));
    }
  });
};

const replaceGameData = (gameData, re, userId) => {
  return gameData.replace(
    re,
    userId +
      "," +
      playerExperience +
      "," +
      drachmas +
      "," +
      (playerCreature.id - 1) +
      "," +
      (chosenRelic.id - 1) +
      "," +
      playerCreatureHP +
      "," +
      playerCreatureMP +
      "," +
      stageId +
      "," +
      (enemyCreature.id - 1) +
      "," +
      enemyCreatureHP
  );
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("useskill")
    .setDescription(
      "Attacks enemy or performs special (also begins a new battle if necessary)"
    )
    .setDMPermission(false)
    .addSubcommand((subcommand) =>
      subcommand.setName("1").setDescription("Attacks enemy")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("2").setDescription("Performs special")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("3").setDescription("Performs secondary special")
    ),

  async execute(interaction) {
    const userId = interaction.member.user.id;
    const re = new RegExp("^.*" + userId + ".*$", "gm");
    const gameData = await loadGameData(re);

    gameData ?? (await denyGameData(interaction));

    if (
      interaction.options?.getSubcommand() === "1" ||
      interaction.customId === "1"
    )
      attackEnemyOrHeal(playerCreature.attackName, playerCreature.attackType);

    if (
      interaction.options?.getSubcommand() === "2" ||
      interaction.customId === "2"
    )
      attackEnemyOrHeal(playerCreature.specialName, playerCreature.specialType);

    if (
      interaction.options?.getSubcommand() === "3" ||
      interaction.customId === "3"
    )
      attackEnemyOrHeal(
        playerCreature.specialName2,
        playerCreature.specialType2
      );

    await writeGameData(replaceGameData(gameData, re, userId), interaction);
  },
};
