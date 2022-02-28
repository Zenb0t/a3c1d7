import React, { useCallback, useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import { Grid, CssBaseline, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { SidebarContainer } from '../components/Sidebar';
import { ActiveChat } from '../components/ActiveChat';
import { SocketContext } from '../context/socket';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100vh',
  },
}));

const Home = ({ user, logout }) => {
  const history = useHistory();

  const socket = useContext(SocketContext);

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);

  const classes = useStyles();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const addSearchedUsers = (users) => {
    const currentUsers = {};

    // make table of current users so we can lookup faster
    conversations.forEach((convo) => {
      currentUsers[convo.otherUser.id] = true;
    });

    const newState = [...conversations];
    users.forEach((user) => {
      // only create a fake convo if we don't already have a convo with this user
      if (!currentUsers[user.id]) {
        let fakeConvo = { otherUser: user, messages: [] };
        newState.push(fakeConvo);
      }
    });

    setConversations(newState);
  };

  const clearSearchedUsers = () => {
    setConversations((prev) => prev.filter((convo) => convo.id));
  };

  const saveMessage = async (body) => {
    const { data } = await axios.post('/api/messages', body);
    return data;
  };

  const sendMessage = (data, body) => {
    socket.emit('new-message', {
      message: data.message,
      recipientId: body.recipientId,
      sender: data.sender,
    });
  };

  const postMessage = async (body) => {
    try {
      const data = await saveMessage(body);
      sendMessage(data, body);
      if (!body.conversationId) {
        addNewConvo(body.recipientId, data.message);
      }
      addMessageToConversation(data);
    } catch (err) {
      console.error(err);
    }
  };

  const addNewConvo = useCallback(
    (recipientId, message) => {
      let updatedConversations = [...conversations];
      updatedConversations.forEach((convo) => {
        if (convo.otherUser.id === recipientId) {
          convo.messages.push(message);
          convo.latestMessageText = message.text;
          convo.id = message.conversationId;
        }
      });
      setConversations(updatedConversations);
    },
    [setConversations, conversations]
  );

  const addMessageToConversation = useCallback(
    (data) => {
      // if sender isn't null, that means the message needs to be put in a brand new convo
      const { message, sender = null } = data;
      if (sender !== null) {
        const newConvo = {
          id: message.conversationId,
          otherUser: sender,
          messages: [message],
        };
        newConvo.latestMessageText = message.text;
        setConversations((prev) => [newConvo, ...prev]);
      } else {
        let updatedConversations = [...conversations];
        updatedConversations.forEach((convo) => {
          if (convo.id === message.conversationId) {
            let updatedConvo = convo;
            updatedConvo.messages.push(message);
            updatedConvo.latestMessageText = message.text;
            if (activeConversation !== updatedConvo.otherUser.username)
              updatedConvo.unreadMessageCount++;
          }
        });
        setConversations(updatedConversations);
      }
    },
    [setConversations, conversations, activeConversation]
  );

  const putReadMessages = useCallback(async (conversationId) => {
    let body = {
      id: conversationId,
    };
    try {
      await axios.put(`/api/conversations/${conversationId}`, body);
    } catch (err) {
      console.error(err);
    }
  }, []);

  //TODO: check this
  const readMessages = useCallback((conversationId) => {
    socket.emit('read-message', {
      conversationId,
    });
  }, [socket]);

  const updateReadMessages = useCallback((conversationId, user) => {
    try {
      let updatedConversations = [...conversations];
      updatedConversations.forEach((convo) => {
        if (convo.id === conversationId) {
          let messages = convo.messages;
          //As unread messages should be always consecutive, mark as read from the end of the 
          //array until find first read message or reach the end
          for (let i = messages.length - 1; i >= 0; i--) {
            let message = convo.messages[i];
            if (message.readAt !== null) {
              break; //found first read message, break the loop
            }
            if (message.senderId !== user.id && message.readAt === null) {
              message.readAt = new Date();
            }
          }
          convo.unreadMessageCount = 0;
        };
        return convo;
      });
      setConversations(updatedConversations);
    } catch (err) {
      console.error(err);
    }
  }, [conversations, setConversations]);

  const updateLastReadMessage = useCallback((conversationId) => {
    setConversations((prev) =>
      prev.map((convo) => {
        if (convo.id === conversationId) {
          const convoCopy = { ...convo };
          const messages = { ...convoCopy.messages };
          for (let j = messages.length - 1; j > 0; j--) {
            if (messages[j].readAt && messages[j].senderId === user.id) {
              convoCopy.lastReadMessage = messages[j];
              break;
            }
          }
          return convoCopy;
        } else {
          return convo;
        }
      }));
  }, [user.id]);

  const markAsRead = useCallback(async (conversationId) => {
    try {
      await putReadMessages(conversationId);
      // readMessages(conversationId);
      updateReadMessages(conversationId, user);
      updateLastReadMessage(conversationId);
    } catch (err) {
      console.error(err);
    }
  }, [putReadMessages, updateReadMessages, updateLastReadMessage, user]);

  const setActiveChat = (username) => {
    setActiveConversation(username);
  };

  const addOnlineUser = useCallback((id) => {
    setConversations((prev) =>
      prev.map((convo) => {
        if (convo.otherUser.id === id) {
          const convoCopy = { ...convo };
          convoCopy.otherUser = { ...convoCopy.otherUser, online: true };
          return convoCopy;
        } else {
          return convo;
        }
      })
    );
  }, []);

  const removeOfflineUser = useCallback((id) => {
    setConversations((prev) =>
      prev.map((convo) => {
        if (convo.otherUser.id === id) {
          const convoCopy = { ...convo };
          convoCopy.otherUser = { ...convoCopy.otherUser, online: false };
          return convoCopy;
        } else {
          return convo;
        }
      })
    );
  }, []);

  // Lifecycle

  useEffect(() => {

    if (activeConversation !== null) {
      let conversation = conversations.find(
        (convo) => convo.otherUser.username === activeConversation
      );
      if (conversation?.unreadMessageCount > 0) {
        markAsRead(conversation.id);
      }
    }
  }, [activeConversation, conversations, markAsRead]);

  useEffect(() => {
    // Socket init
    socket.on('add-online-user', addOnlineUser);
    socket.on('remove-offline-user', removeOfflineUser);
    socket.on('new-message', addMessageToConversation);

    return () => {
      // before the component is destroyed
      // unbind all event handlers used in this component
      socket.off('add-online-user', addOnlineUser);
      socket.off('remove-offline-user', removeOfflineUser);
      socket.off('new-message', addMessageToConversation);
    };
  }, [addMessageToConversation, addOnlineUser, removeOfflineUser, socket, user, updateLastReadMessage]);

  useEffect(() => {
    // when fetching, prevent redirect
    if (user?.isFetching) return;

    if (user && user.id) {
      setIsLoggedIn(true);
    } else {
      // If we were previously logged in, redirect to login instead of register
      if (isLoggedIn) history.push('/login');
      else history.push('/register');
    }
  }, [user, history, isLoggedIn]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await axios.get('/api/conversations');
        setConversations(data);
      } catch (error) {
        console.error(error);
      }
    };
    if (!user.isFetching) {
      fetchConversations();
    }
  }, [user]);

  const handleLogout = async () => {
    if (user && user.id) {
      await logout(user.id);
    }
  };

  return (
    <>
      <Button onClick={handleLogout}>Logout</Button>
      <Grid container component="main" className={classes.root}>
        <CssBaseline />
        <SidebarContainer
          conversations={conversations}
          user={user}
          clearSearchedUsers={clearSearchedUsers}
          addSearchedUsers={addSearchedUsers}
          setActiveChat={setActiveChat}
        />
        <ActiveChat
          activeConversation={activeConversation}
          conversations={conversations}
          user={user}
          postMessage={postMessage}
        />
      </Grid>
    </>
  );
};

export default Home;
