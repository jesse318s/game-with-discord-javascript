const enemyCreatures = require("./enemyCreatures");

const stages = [
  {
    id: 0,
    name: "The Bridge",
    levelReq: 0,
    enemyCreatures: enemyCreatures.enemyCreaturesHome,
  },
  {
    id: 1,
    name: "Mount Olympus",
    levelReq: 5,
    enemyCreatures: enemyCreatures.enemyCreaturesStage1,
  },
  {
    id: 2,
    name: "Countryside",
    levelReq: 10,
    enemyCreatures: enemyCreatures.enemyCreaturesStage2,
  },
  {
    id: 3,
    name: "Pillaged Ruins",
    levelReq: 12,
    enemyCreatures: enemyCreatures.enemyCreaturesStage3,
  },
];

module.exports = stages;
