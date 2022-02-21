var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http, {
  cors: {
    origin: '*'
  }
});

app.get('/', function (req, res) {
  res.send('<h1>欢迎来到milimili的websocket端</h1>');
});

//在线用户
var onlineUsers = {};
//当前在线人数
const findRoom = (room, userId) => room.findIndex(v => v.userId === userId)
io.on('connection', function (socket) {
  console.log('连接成功')

  //监听新用户加入
  socket.on('videoLogin', function (obj) {
    //将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
    socket.userId = obj.userId;
    socket.videoId = obj.videoId;
    socket.account = obj.account;
    socket.avatar = obj.avatar
    //检查在线列表，如果不在里面就加入
    if (!onlineUsers.hasOwnProperty(socket.videoId)) {
      onlineUsers[socket.videoId] = []
    }
    const t = onlineUsers[socket.videoId]
    if (findRoom(t, socket.userId) === -1) {
      t.push({
        userId: socket.userId,
        account: socket.account,
        avatar: socket.avatar
      })
      //向所有客户端广播用户加入
      socket.join(socket.videoId)
      io.sockets.in(socket.videoId).emit('videoLogin', { onlineUsers: t, onlineCount: t.length });
      console.log(obj.userId + '在线观看' + obj.videoId);
    }

  });

  //监听用户退出
  socket.on('videoDisconnect', function () {
    //将退出的用户从在线列表中删除
    if (onlineUsers.hasOwnProperty(socket.videoId)) {
      //退出用户的信息
      //删除
      const t = onlineUsers[socket.videoId]
      const roomIndex = findRoom(t, socket.userId)
      if (roomIndex !== -1) {
        t.splice(roomIndex, 1)
        //在线人数-1
        //向所有客户端广播用户退出
        io.sockets.in(socket.videoId).emit('videoLogin', { onlineUsers: t, onlineCount: t.length });
        console.log(socket.userId + '退出了视频' + socket.videoId);
      }
    }
  });

  socket.on('messageDisconnect', function () {
    //将退出的用户从在线列表中删除
    if (onlineUsers.hasOwnProperty(socket.usersRoomId)) {
      //退出用户的信息
      //删除
      const t = onlineUsers[socket.usersRoomId]
      const roomIndex = findRoom(t, socket.messageUserId)
      if (roomIndex !== -1) {
        t.splice(roomIndex, 1)
        //在线人数-1
        //向所有客户端广播用户退出
        io.sockets.in(socket.usersRoomId).emit('messageLogin', { onlineUsers: t, onlineCount: t.length });
        console.log(socket.messageUserId + '退出了聊天室' + socket.usersRoomId);
      }
    }
  });

  socket.on('insertBarrage', function (obj) {
    //向所有客户端广播发布的消息

    io.sockets.in(socket.videoId).emit('insertBarrage', obj);
    console.log(obj.userId + '说：' + obj.content);
  });
  //insertComment
  socket.on('insertComment', function (obj) {
    //向所有客户端广播发布的消息
    io.sockets.in(socket.videoId).emit('insertComment', obj);
    console.log(obj.userId);
    console.log(obj);
  });

  socket.on('messageLogin', function (obj) {
    //将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
    const { usersRoomId, messageUserId } = obj
    socket.usersRoomId = usersRoomId
    socket.messageUserId = messageUserId
    //检查在线列表，如果不在里面就加入
    if (!onlineUsers.hasOwnProperty(socket.usersRoomId)) {
      onlineUsers[socket.usersRoomId] = []
    }
    const t = onlineUsers[socket.usersRoomId]
    if (findRoom(t, socket.messageUserId) === -1) {
      t.push({
        userId: socket.messageUserId
      })
      //向所有客户端广播用户加入
      socket.join(socket.usersRoomId)
      io.sockets.in(socket.usersRoomId).emit('messageLogin', { onlineUsers: t, onlineCount: t.length });
      console.log(socket.messageUserId + '加入了聊天室' + socket.usersRoomId);
    }

  });

  //监听用户发布聊天内容
  socket.on('message', function (obj) {
    //向所有客户端广播发布的消息
    io.sockets.in(socket.usersRoomId).emit('message', obj);
    console.log(obj.userId + '发消息说：' + obj.content);
  });

  socket.on('disconnect', function () {
    //向所有客户端广播发布的消息
    if (onlineUsers.hasOwnProperty(socket.videoId)) {
      //退出用户的信息
      //删除
      const t = onlineUsers[socket.videoId]
      const roomIndex = findRoom(t, socket.userId)
      if (roomIndex !== -1) {
        t.splice(roomIndex, 1)
        //在线人数-1
        //向所有客户端广播用户退出
        io.sockets.in(socket.videoId).emit('videoLogin', { onlineUsers: t, onlineCount: t.length });
        console.log(socket.userId + '退出了视频' + socket.videoId);
      }
    }

    if (onlineUsers.hasOwnProperty(socket.usersRoomId)) {
      //退出用户的信息
      //删除
      const t1 = onlineUsers[socket.usersRoomId]
      const roomIndex2 = findRoom(t1, socket.messageUserId)
      if (roomIndex2 !== -1) {
        t1.splice(roomIndex2, 1)
        //在线人数-1
        //向所有客户端广播用户退出 
        console.log(socket.messageUserId + '退出了聊天室' + socket.usersRoomId);
        io.sockets.in(socket.usersRoomId).emit('messageLogin', { onlineUsers: t1, onlineCount: t1.length });
      }
    }

  });

});

http.listen(4000, function () {
  console.log('listening on *:4000');
});