// ===== ルーム管理 =====
const rooms = new Map();

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

const createRoom = (socketId) => {
  let code;
  do { code = generateCode(); } while (rooms.has(code));

  const room = {
    code,
    players: [
      { socketId, playerNum: 0, stats: null, ready: false },
      null,
    ],
    gameState: null,
    pendingActions: [null, null],
    turn: 1,
    phase: 'waiting_player2', // waiting_player2 | waiting_ready | battle | ended
    log: [],
  };
  rooms.set(code, room);
  return room;
};

const joinRoom = (code, socketId) => {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { error: 'ルームが見つかりません' };
  if (room.players[1]) return { error: 'ルームが満員です' };
  if (room.players[0].socketId === socketId) return { error: '自分のルームには参加できません' };

  room.players[1] = { socketId, playerNum: 1, stats: null, ready: false };
  room.phase = 'waiting_ready';
  return { room };
};

const getRoom = (code) => rooms.get(code?.toUpperCase());

const getRoomBySocket = (socketId) => {
  for (const room of rooms.values()) {
    if (room.players[0]?.socketId === socketId || room.players[1]?.socketId === socketId) {
      return room;
    }
  }
  return null;
};

const getPlayerNumBySocket = (room, socketId) => {
  if (room.players[0]?.socketId === socketId) return 0;
  if (room.players[1]?.socketId === socketId) return 1;
  return -1;
};

const submitReady = (room, playerNum, stats) => {
  room.players[playerNum].stats = stats;
  room.players[playerNum].ready = true;
  return room.players[0]?.ready && room.players[1]?.ready;
};

const deleteRoom = (code) => rooms.delete(code?.toUpperCase());

const cleanupBySocket = (socketId) => {
  const room = getRoomBySocket(socketId);
  if (room) {
    room.phase = 'ended';
    return room;
  }
  return null;
};

module.exports = {
  createRoom,
  joinRoom,
  getRoom,
  getRoomBySocket,
  getPlayerNumBySocket,
  submitReady,
  deleteRoom,
  cleanupBySocket,
};
