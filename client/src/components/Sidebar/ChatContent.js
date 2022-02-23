import React from "react";
import { Box, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    justifyContent: "space-between",
    marginLeft: 20,
    flexGrow: 1,
  },
  username: {
    fontWeight: "bold",
    letterSpacing: -0.2,
  },
  previewUnreadText: {
    fontWeight: 600,
    fontSize: 12,
    color: "black",
    letterSpacing: -0.17,
  },
  previewText: {
    fontSize: 12,
    color: "#9CADC8",
    letterSpacing: -0.17,
  },
  unreadMsgs: {
    textAlign: "center",
    fontSize: 10,
    color: "#FFFFFF",
    marginRight: 30,
    marginTop: 10,
    backgroundColor: "#3F92FF",
    borderRadius: "10px",
    minWidth: 20,
    maxWidth: 30,
    height: 20,
    padding: "3px 9px 3px 10px",
    fontWeight: "700",
  },
}));

const ChatContent = ({ conversation }) => {
  const classes = useStyles();

  const { otherUser } = conversation;
  const latestMessageText = conversation.id && conversation.latestMessageText;
  const latestMessageSenderId = conversation.id && conversation.latestMessageSenderId;
  const unreadMsgs = conversation.id && conversation.unreadMessageCount;

  return (
    <Box className={classes.root}>
      <Box>
        <Typography className={classes.username}>
          {otherUser.username}
        </Typography>
        <Typography className={unreadMsgs > 0 && latestMessageSenderId === otherUser.id ? classes.previewUnreadText : classes.previewText}>
          {latestMessageText}
        </Typography>
      </Box>
      <Box>
        {unreadMsgs > 0
          ? <Typography className={classes.unreadMsgs}>{
            unreadMsgs > 99
              ? "+99"
              : unreadMsgs
          }</Typography>
          : null}
      </Box>
    </Box>
  );
};

export default ChatContent;
