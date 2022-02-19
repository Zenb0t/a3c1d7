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
    backgroundColor: "#3F92FF",
    borderRadius: "10px",
    minWidth: 20,
    height: 20,
    padding: "3px 9px 3px 10px",
    fontWeight: "700",
  },
}));

const ChatContent = ({ conversation }) => {
  const classes = useStyles();

  const { otherUser } = conversation;
  const latestMessageText = conversation.id && conversation.latestMessageText;
  const unreadMsgs = conversation.id && conversation.unreadMessageCount;

  return (
    <Box className={classes.root}>
      <Box>
        <Typography className={classes.username}>
          {otherUser.username}
        </Typography>
        <Typography className={classes.previewText}>
          {latestMessageText}
        </Typography>
      </Box>
      <p className={classes.unreadMsgs}>{unreadMsgs}</p>
    </Box>
  );
};

export default ChatContent;
