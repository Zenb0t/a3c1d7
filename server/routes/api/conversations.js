const router = require("express").Router();
const { User, Conversation, Message } = require("../../db/models");
const { Op } = require("sequelize");
const onlineUsers = require("../../onlineUsers");

// get all conversations for a user, include latest message text for preview, and all messages
// include other user model so we have info on username/profile pic (don't include current user info)
router.get("/", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const userId = req.user.id;
    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: {
          user1Id: userId,
          user2Id: userId,
        },
      },
      attributes: ["id"],
      order: [[Message, "createdAt", "ASC"]],
      include: [
        { model: Message, order: ["createdAt", "DESC"] },
        {
          model: User,
          as: "user1",
          where: {
            id: {
              [Op.not]: userId,
            },
          },
          attributes: ["id", "username", "photoUrl"],
          required: false,
        },
        {
          model: User,
          as: "user2",
          where: {
            id: {
              [Op.not]: userId,
            },
          },
          attributes: ["id", "username", "photoUrl"],
          required: false,
        },
      ],
    });

    for (let i = 0; i < conversations.length; i++) {
      const convo = conversations[i];
      const convoJSON = convo.toJSON();

      // set a property "otherUser" so that frontend will have easier access
      if (convoJSON.user1) {
        convoJSON.otherUser = convoJSON.user1;
        delete convoJSON.user1;
      } else if (convoJSON.user2) {
        convoJSON.otherUser = convoJSON.user2;
        delete convoJSON.user2;
      }

      // set property for online status of the other user
      if (onlineUsers.includes(convoJSON.otherUser.id)) {
        convoJSON.otherUser.online = true;
      } else {
        convoJSON.otherUser.online = false;
      }


      // set properties for latest message preview
      let lastIndex = convoJSON.messages.length - 1;
      convoJSON.latestMessageText = convoJSON.messages[lastIndex].text;
      conversations[i] = convoJSON;

      //set a property for latest message time
      convoJSON.latestMessageTime = convoJSON.messages[lastIndex].createdAt;

      //set a latestMessageSenderId property so that frontend can display it more easily
      convoJSON.latestMessageSenderId = convoJSON.messages[lastIndex].senderId;

      // set a property for unread message count
      convoJSON.unreadMessageCount = 0;

      for (let j = 0; j <= lastIndex; j++) {
        if (
          !convoJSON.messages[j].readAt &&
          convoJSON.messages[j].senderId === convoJSON.otherUser.id
        ) {
          convoJSON.unreadMessageCount++;
        }
      }
    }

    res.json(conversations);
  } catch (error) {
    next(error);
  }
});

// Mark all messages in a conversation as read for the current user
router.put("/:id", async (req, res, next) => {
  console.log(req.body);
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const conversationId = req.params.id;
    const userId = req.user.id;

    const unreadMessages = await Message.findUnreadMessages(conversationId, userId);
    console.log("unreadMessages: " + unreadMessages);
    for (let i = 0; i < unreadMessages.length; i++) {
      const message = unreadMessages[i];
      message.readAt = Date.now();
      await message.save();
    }
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});




module.exports = router;
