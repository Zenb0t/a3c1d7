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

  //Read message logic

  const putReadMessages = async (conversationId) => {
    let body = {
      id: conversationId,
    };
    try {
      await axios.put(`/api/conversations/${conversationId}`, body);
    } catch (err) {
      console.error(err);
    }
  };

  const sendReadMessages = useCallback((conversationId, userId) => {
    socket.emit('message-read', conversationId, userId);
  }, [socket]);

  const markConversationAsRead = useCallback((conversationId, userId) => {
    try {
      let updatedConversations = [...conversations];
      updatedConversations.forEach((convo) => {
        if (convo.id === conversationId) {
          let messages = convo.messages;
          for (let i = messages.length - 1; i >= 0; i--) {
            let message = convo.messages[i];
            if (message.isRead) {
              break; //found first read message, break the loop
            }
            if (message.senderId !== userId && !message.isRead) {
              message.isRead = true;
            }
          }
          convo.lastReadMessage = messages.slice().reverse().find((message) => message.isRead === true && message.senderId !== userId);
          convo.unreadMessageCount = 0;
        };
        return convo;
      });
      setConversations(updatedConversations);
    } catch (err) {
      console.error(err);
    }
  }, [conversations, setConversations]);

  const markAsRead = useCallback(async (conversationId, userId) => {
    try {
      await putReadMessages(conversationId);
      sendReadMessages(conversationId, userId);
      markConversationAsRead(conversationId, userId);
    } catch (err) {
      console.error(err);
    }
  }, [markConversationAsRead, sendReadMessages]);

  // Add message logic
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
        updatedConversations.forEach((convo, index) => {
          if (convo.id === message.conversationId) {
            const updatedConvo = {...convo};
            const messageCopy = { ...message };
            if (activeConversation && activeConversation !== updatedConvo.otherUser.username) {
              updatedConvo.unreadMessageCount++;
            } else {
              markAsRead(message.conversationId, user.id);
            }
            updatedConvo.messages.push(messageCopy);
            updatedConvo.latestMessageText = messageCopy.text;
            updatedConversations[index] = updatedConvo;
          }
          
        });
        setConversations(updatedConversations);
      }
    },
    [conversations, activeConversation, markAsRead, user.id]
  );

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
      const activeConvo = conversations.find(
        (convo) => convo.otherUser.username === activeConversation
      );
      if (activeConvo?.unreadMessageCount > 0) {
        markAsRead(activeConvo.id, user.id);
      }
    }
  }, [activeConversation, conversations, markAsRead, user.id]);

  useEffect(() => {
    socket.on('message-read', (data) => {
      markConversationAsRead(data.conversationId, data.userId);
    });

  }, [markConversationAsRead, socket]);

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
  }, [addMessageToConversation, addOnlineUser, removeOfflineUser, socket]);

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
