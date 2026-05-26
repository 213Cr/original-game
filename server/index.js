const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const rooms = require('./rooms.js');
const { createPlayerState, resolveTurn } = require('./battleCalc.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

io.on('connection', (socket) => {
  console.log('[connect]', socket.id);

  // ===== ルーム作成 =====
  socket.on('createRoom', () => {
    const room = rooms.createRoom(socket.id);
    socket.join(room.code);
    socket.emit('roomCreated', { code: room.code, playerNum: 0 });
    console.log('[createRoom]', room.code, socket.id);
  });

  // ===== ルーム参加 =====
  socket.on('joinRoom', ({ code }) => {
    const result = rooms.joinRoom(code, socket.id);
    if (result.error) {
      socket.emit('roomError', { message: result.error });
      return;
    }
    const room = result.room;
    socket.join(room.code);
    socket.emit('roomJoined', { code: room.code, playerNum: 1 });
    // 先に待っていたプレイヤーに通知
    socket.to(room.code).emit('opponentJoined');
    console.log('[joinRoom]', room.code, socket.id);
  });

  // ===== 準備完了 (ステータス送信) =====
  socket.on('submitReady', ({ code, stats }) => {
    const room = rooms.getRoom(code);
    if (!room) return;
    const playerNum = rooms.getPlayerNumBySocket(room, socket.id);
    if (playerNum < 0) return;

    const bothReady = rooms.submitReady(room, playerNum, stats);
    socket.to(room.code).emit('opponentReady');

    if (bothReady) {
      // 両プレイヤーの戦闘状態を生成
      const p0State = createPlayerState(room.players[0].stats);
      const p1State = createPlayerState(room.players[1].stats);
      room.gameState = {
        players: [p0State, p1State],
        turn: 1,
      };
      room.phase = 'battle';
      io.to(room.code).emit('gameStart', {
        turn: 1,
        yourState: [p0State, p1State],
      });
      console.log('[gameStart]', room.code);
    }
  });

  // ===== アクション送信 =====
  socket.on('submitAction', ({ code, action }) => {
    const room = rooms.getRoom(code);
    if (!room || room.phase !== 'battle') return;
    const playerNum = rooms.getPlayerNumBySocket(room, socket.id);
    if (playerNum < 0) return;

    room.pendingActions[playerNum] = action;
    socket.to(room.code).emit('opponentActed');
    console.log('[submitAction]', room.code, 'player', playerNum, action?.skill?.id);

    // 両方のアクションが揃ったらターン解決
    if (room.pendingActions[0] !== null && room.pendingActions[1] !== null) {
      const result = resolveTurn(room.gameState, room.pendingActions, room.gameState.turn);
      room.gameState = result.gameState;
      room.gameState.turn++;
      room.pendingActions = [null, null];

      if (result.winner !== null) {
        room.phase = 'ended';
        io.to(room.code).emit('gameOver', {
          winner: result.winner,
          log: result.log,
          finalState: result.gameState.players,
        });
        console.log('[gameOver]', room.code, 'winner:', result.winner);
      } else {
        io.to(room.code).emit('turnResult', {
          newState: result.gameState.players,
          log: result.log,
          turn: room.gameState.turn,
        });
      }
    }
  });

  // ===== 切断 =====
  socket.on('disconnect', () => {
    console.log('[disconnect]', socket.id);
    const room = rooms.cleanupBySocket(socket.id);
    if (room && room.phase !== 'ended') {
      socket.to(room.code).emit('opponentDisconnected');
      rooms.deleteRoom(room.code);
    }
  });
});

const PORT = 3001;
server.listen(PORT, 'localhost', () => {
  console.log(`[server] listening on localhost:${PORT}`);
});
