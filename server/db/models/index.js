const Conversation = require("./conversation");
const User = require("./user");
const Message = require("./message");
const Group = require("./group");

// associations

Group.belongsToMany(User, { through: "groupMembers" });
User.belongsToMany(Group, { through: "groupMembers" });

User.hasMany(Group, { as: "owner" });
Group.belongsTo(User, { as: "owner" });

Group.hasMany(Conversation);
Conversation.belongsTo(Group);

Conversation.hasMany(Message);
Message.belongsTo(Conversation);

Message.belongsTo(User, { as: "sender" });
User.hasMany(Message, { as: "sender" });


module.exports = {
  User,
  Conversation,
  Message,
  Group
};
