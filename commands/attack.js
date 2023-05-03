const { SlashCommandBuilder } = require("discord.js");
const path = require("path");
const fs = require("fs");
const creatures = require("../constants/creatures");
const relics = require("../constants/relics");
const enemyCreatures = require("../constants/enemyCreatures");

let drachmas;
let playerCreature;
let chosenRelic;
let playerCreatureHP;
let enemyCreature;
let enemyCreatureHP;
let combatAlert;
let counterRef;

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
const receiveEnemyCounterAttack = (chancePlayer, moveType) => {
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
      counterRef += 1;
      attackEnemy(moveType);
      return;
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

// initiates chance to attack enemy creature
const attackEnemy = (moveType) => {
  try {
    const playerCreatureAttack = playerCreature.attack + chosenRelic.attackMod;
    const playerCreatureSpeed = playerCreature.speed + chosenRelic.speedMod;
    const playerCreatureCritical =
      (playerCreature.critical + chosenRelic.criticalMod) / 100;
    let enemyDefense = enemyCreature.defense / 100;
    let chancePlayer = false;
    let criticalMultiplier = 1;

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
      drachmas += enemyCreature.reward;
      return;
    }

    if (chancePlayer) {
      enemyCreatureHP =
        enemyCreatureHP -
        (playerCreatureAttack - playerCreatureAttack * enemyDefense) *
          criticalMultiplier;
    }

    receiveEnemyCounterAttack(chancePlayer, moveType);
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("attack")
    .setDescription("Attacks enemy"),

  async execute(interaction, client) {
    try {
      const gamesPath = path.relative(process.cwd(), "docs/games.txt");
      const userId = interaction.member.user.id;
      let re;
      let formatted;

      fs.readFile(gamesPath, "utf8", function (err, data) {
        re = new RegExp("^.*" + userId + ".*$", "gm");

        if (!re.test(data)) {
          interaction.reply({
            content: "You must join the game first.",
            ephemeral: true,
          });
          return;
        }

        drachmas = parseInt(data.match(re)[0].split(",")[1]);
        playerCreature = creatures[parseInt(data.match(re)[0].split(",")[2])];
        chosenRelic = relics[parseInt(data.match(re)[0].split(",")[3])];
        playerCreatureHP = parseFloat(data.match(re)[0].split(",")[4]);
        enemyCreature =
          enemyCreatures[parseInt(data.match(re)[0].split(",")[5])];
        enemyCreatureHP = parseFloat(data.match(re)[0].split(",")[6]);

        if (playerCreatureHP <= 0) {
          enemyCreature =
            enemyCreatures[Math.floor(Math.random() * enemyCreatures.length)];
          enemyCreatureHP = enemyCreature.hp;
          playerCreatureHP = playerCreature.hp;
        }

        if (enemyCreatureHP <= 0) {
          enemyCreature =
            enemyCreatures[Math.floor(Math.random() * enemyCreatures.length)];
          enemyCreatureHP = enemyCreature.hp;
          playerCreatureHP = playerCreature.hp;
        }

        counterRef = 0;
        attackEnemy(playerCreature.attackType);
        formatted = data.replace(
          re,
          userId +
            "," +
            drachmas +
            "," +
            (playerCreature.id - 1) +
            "," +
            (chosenRelic.id - 1) +
            "," +
            playerCreatureHP +
            "," +
            (enemyCreature.id - 1) +
            "," +
            enemyCreatureHP
        );

        if (err) return console.log(err);

        fs.writeFile(gamesPath, formatted, "utf8", function (err) {
          if (err) return console.log(err);
        });

        interaction.reply({
          content:
            "Player " +
            playerCreature.name +
            " HP: " +
            playerCreatureHP +
            "\nEnemy " +
            enemyCreature.name +
            " HP: " +
            enemyCreatureHP +
            "\n\n" +
            combatAlert,
          ephemeral: true,
        });
      });
    } catch (err) {
      console.error(err);
    }
  },
};
