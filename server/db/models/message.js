const Sequelize = require("sequelize");
const db = require("../db");

const Message = db.define("message", {
  text: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  senderId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  readAt: {
    type: Sequelize.DATE,
    allowNull: true,
    defaultValue: null,
  },
});

//TODO: Review this
Message.findUnreadMessages = async function (conversationId, userId) {
  const messages = await Message.findAll({
    where: {
      conversationId,
      readAt: null,
      senderId: {
        [Sequelize.Op.ne]: userId,
      },
    },
  });
  return messages;
};

module.exports = Message;
