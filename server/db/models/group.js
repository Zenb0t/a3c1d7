const Sequelize = require("sequelize");
const db = require("../db");

const Group = db.define("group", {
    groupName: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    description: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    groupImage: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    groupOwner: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
});
