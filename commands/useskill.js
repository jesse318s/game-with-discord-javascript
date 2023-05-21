"use strict";
const { SlashCommandBuilder } = require("discord.js");
const path = require("path");
const fs = require("fs");
const creatures = require("../constants/creatures");
const relics = require("../constants/relics");
const stages = require("../constants/stages");

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

// loads game info
const loadGameData = (gamesPath, re, interaction) => {
  return new Promise((resolve) => {
    fs.readFile(gamesPath, "utf8", (err, data) => {
      try {
        if (err) console.error(err);

        let gameInfo;

        if (!re.test(data)) {
          resolve();
          return;
        }

        gameInfo = data.match(re)[0].split(",");
        playerExperience = parseInt(gameInfo[1]);
        drachmas = parseInt(gameInfo[2]);
        playerCreature = creatures[gameInfo[3]];
        chosenRelic = relics[gameInfo[4]];
        playerCreatureHP = parseFloat(gameInfo[5]);
        playerCreatureMP = parseFloat(gameInfo[6]);
        stageId = parseInt(gameInfo[7]);
        enemyCreature =
          stages[stageId].enemyCreatures[
            Math.floor(Math.random() * stages[stageId].enemyCreatures.length)
          ];
        enemyCreatureHP = parseFloat(gameInfo[9]);

        if (playerCreatureHP <= 0 || enemyCreatureHP <= 0) {
          enemyCreature =
            stages[stageId].enemyCreatures[
              Math.floor(Math.random() * stages[stageId].enemyCreatures.length)
            ];
          enemyCreatureHP = enemyCreature.hp;
          playerCreatureHP = playerCreature.hp;
          playerCreatureMP = playerCreature.mp;
        }

        counterRef = 0;
        mpRef = playerCreatureMP;
        resolve(data);
      } catch (err) {
        console.error(err);
        interaction.reply({
          content: "Something went wrong.",
          ephemeral: true,
        });
        resolve();
      }
    });
  });
};

// regens player creature mp
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

// checks for player death, and damages player otherwise
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

// initiates chance of enemy counter attack
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
      if (moveName !== playerCreature.attackName) {
        playerCreatureMP = mpRef;
      }

      counterRef += 1;
      attackEnemyOrHeal(moveName, moveType);
      return;
    }

    if (moveName === playerCreature.attackName) {
      regenMP();
    }

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

// completes player lifesteal check and heal
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

// heals player creature
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

// performs creature special
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

// initiates chance to attack enemy creature
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

module.exports = {
  data: new SlashCommandBuilder()
    .setName("useskill")
    .setDescription("Attacks enemy or performs special")
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
    const gamesPath = path.relative(process.cwd(), "docs/games.txt");
    const userId = interaction.member.user.id;
    const re = new RegExp("^.*" + userId + ".*$", "gm");
    const gameData = await loadGameData(gamesPath, re, interaction);
    let formatted;

    if (gameData === undefined) {
      interaction.reply({
        content: "You must join the game first.",
        ephemeral: true,
      });
      return;
    }

    if (interaction.options.getSubcommand() === "1") {
      attackEnemyOrHeal(playerCreature.attackName, playerCreature.attackType);
    }

    if (interaction.options.getSubcommand() === "2") {
      attackEnemyOrHeal(playerCreature.specialName, playerCreature.specialType);
    }

    if (interaction.options.getSubcommand() === "3") {
      attackEnemyOrHeal(
        playerCreature.specialName2,
        playerCreature.specialType2
      );
    }

    formatted = gameData.replace(
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

    fs.writeFile(gamesPath, formatted, "utf8", (err) => {
      try {
        if (err) {
          console.error(err);
          interaction.reply({
            content: "Something went wrong.",
            ephemeral: true,
          });
          return;
        }

        interaction.reply({
          content:
            "**Player " +
            playerCreature.name +
            "**\nHP: " +
            playerCreatureHP +
            "\nMP: " +
            playerCreatureMP +
            "\n\n**Enemy " +
            enemyCreature.name +
            "**\nHP: " +
            enemyCreatureHP +
            "\n\n*" +
            combatAlert +
            "*\n\nLevel: " +
            (Math.sqrt(playerExperience) * 0.25).toFixed(2) +
            "\nDrachmas: " +
            drachmas,
          ephemeral: true,
        });
      } catch (err) {
        console.error(err);
        interaction.reply({
          content: "Something went wrong.",
          ephemeral: true,
        });
      }
    });
  },
};
