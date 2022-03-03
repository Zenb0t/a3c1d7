import React from "react";
import { Box, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    justifyContent: "space-between",
    marginLeft: 20,
    flexGrow: 1,
    alignItems: "center",
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
  chipBadge: {
    marginRight: 20,
    marginTop: 30,
    marginBottom: 30,
    backgroundColor: "#3F92FF",
    borderRadius: "10px",
    minWidth: 20,
    maxWidth: 30,
    height: 20,
  },
  unreadMsgs: {
    textAlign: "center",
    fontSize: 10,
    color: "#FFFFFF",
    margin: "0px 4px 0px 4px",
    padding: "0px 4px 0px 4px",
    fontWeight: "700",
    lineHeight: "2",
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
      <Box className={unreadMsgs && classes.chipBadge}>
        {unreadMsgs > 0 &&
          <Typography className={classes.unreadMsgs}>
            {unreadMsgs > 99 ? "+99" : unreadMsgs}
          </Typography>}
      </Box>
    </Box>
  );
};

export default ChatContent;
