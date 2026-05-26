import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import BattleScreen from '../components/BattleScreen.jsx';
import StatSetup from '../components/StatSetup.jsx';
import { getAllSkills } from '../gameLogic/skills.js';

const buildAvailableSkills = (state, allSkills) =>
  allSkills.map(sk => ({
    ...sk,
    disabled: sk.id === 'strong' && (state?.cooldowns?.strong || 0) > 0,
    restricted: !!(state?.restrictedActions?.includes(sk.id)),
  }));

export default function OnlinePage({ onHome }) {
  const socketRef = useRef(null);
  const roomCodeRef = useRef('');

  const [phase, setPhase] = useState('lobby');
  const [roomCode, setRoomCode] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [playerNum, setPlayerNum] = useState(null);
  const [opponentReady, setOpponentReady] = useState(false);
  const [gameStates, setGameStates] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [turn, setTurn] = useState(1);
  const [winner, setWinner] = useState(null);
  const [error, setError] = useState('');
  const [opponentActed, setOpponentActed] = useState(false);
  const [myActed, setMyActed] = useState(false);
  const [copied, setCopied] = useState(false);

  // URL からルームコード取得
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roomParam = params.get('room');
    if (roomParam) setJoinInput(roomParam.toUpperCase());
  }, []);

  // Socket 初期化
  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on('roomCreated', ({ code, playerNum: pNum }) => {
      setRoomCode(code);
      roomCodeRef.current = code;
      setPlayerNum(pNum);
      setPhase('waiting_join');
      history.replaceState(null, '', `?room=${code}`);
    });

    socket.on('roomJoined', ({ code, playerNum: pNum }) => {
      setRoomCode(code);
      roomCodeRef.current = code;
      setPlayerNum(pNum);
      setPhase('setup');
    });

    socket.on('opponentJoined', () => setPhase('setup'));

    socket.on('opponentReady', () => setOpponentReady(true));

    socket.on('gameStart', ({ turn: t, yourState }) => {
      setGameStates(yourState);
      setTurn(t);
      setPhase('battle');
      setBattleLog([]);
      setMyActed(false);
      setOpponentActed(false);
    });

    socket.on('opponentActed', () => setOpponentActed(true));

    socket.on('turnResult', ({ newState, log, turn: t }) => {
      setGameStates(newState);
      setBattleLog(prev => [...prev, ...log]);
      setTurn(t);
      setMyActed(false);
      setOpponentActed(false);
    });

    socket.on('gameOver', ({ winner: w, log, finalState }) => {
      setGameStates(finalState);
      setBattleLog(prev => [...prev, ...log]);
      setWinner(w === 'draw' ? 'draw' : w === playerNum ? 'player' : 'enemy');
      setPhase('ended');
    });

    socket.on('opponentDisconnected', () => {
      setError('相手が接続を切りました');
      setPhase('error');
    });

    socket.on('roomError', ({ message }) => setError(message));

    return () => socket.disconnect();
  }, [playerNum]);

  const createRoom = () => {
    setError('');
    socketRef.current?.emit('createRoom');
  };

  const joinRoom = () => {
    const code = joinInput.trim().toUpperCase();
    if (!code || code.length !== 6) { setError('6文字のコードを入力してください'); return; }
    setError('');
    socketRef.current?.emit('joinRoom', { code });
  };

  const submitReady = (stats) => {
    socketRef.current?.emit('submitReady', { code: roomCode, stats });
    setPhase('waiting_ready');
  };

  const handleAction = useCallback((action) => {
    socketRef.current?.emit('submitAction', { code: roomCode, action });
    setMyActed(true);
  }, [roomCode]);

  const shareLink = () => {
    const url = `${location.origin}${location.pathname}?room=${roomCode}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const allSkills = getAllSkills();
  const myState = gameStates?.[playerNum];
  const theirState = gameStates?.[1 - playerNum];
  const available = myState ? buildAvailableSkills(myState, allSkills) : [];

  // ロビー
  if (phase === 'lobby') {
    return (
      <div className="page">
        <div className="page-header">
          <button className="btn-icon" onClick={onHome}>←</button>
          <h1>🌐 オンライン対戦</h1>
        </div>
        <div className="page-scroll">
          {error && (
            <div className="card" style={{ borderColor: 'var(--danger)', background: 'rgba(239,68,68,0.1)', marginBottom: 10 }}>
              <p style={{ color: 'var(--danger)', margin: 0 }}>⚠️ {error}</p>
            </div>
          )}

          <div className="card">
            <div className="section-title">ルームを作成</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: 12 }}>
              ルームを作成してコードを友達に共有しましょう
            </p>
            <button className="btn btn-primary" onClick={createRoom}>
              🎮 ルームを作成する
            </button>
          </div>

          <div className="card">
            <div className="section-title">ルームに参加</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: 10 }}>
              友達から受け取ったコードを入力
            </p>
            <input
              className="input"
              placeholder="6文字のルームコード"
              value={joinInput}
              onChange={e => setJoinInput(e.target.value.toUpperCase())}
              maxLength={6}
              style={{ marginBottom: 10, letterSpacing: '0.2em', textAlign: 'center', fontSize: '1.1rem' }}
            />
            <button className="btn btn-success" onClick={joinRoom} disabled={joinInput.length !== 6}>
              ✅ このコードで参加
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 相手を待機中（ルーム作成者）
  if (phase === 'waiting_join') {
    return (
      <div className="page">
        <div className="page-header">
          <button className="btn-icon" onClick={onHome}>←</button>
          <h1>🌐 ルーム待機中</h1>
        </div>
        <div className="page-scroll">
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="section-title">ルームコード</div>
            <div className="room-code-display">{roomCode}</div>
            <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 8 }}>
              このコードを友達に伝えてください
            </p>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={shareLink}>
              {copied ? '✅ コピー済み' : '🔗 リンクをコピー'}
            </button>
          </div>
          <div className="waiting-screen" style={{ marginTop: 0 }}>
            <div className="spinner" />
            <p style={{ color: 'var(--text2)' }}>相手の参加を待っています<span className="waiting-dots" /></p>
          </div>
        </div>
      </div>
    );
  }

  // ステータス設定
  if (phase === 'setup') {
    return (
      <div className="page">
        <div className="page-header">
          <h1>⚙️ ステータス配分</h1>
        </div>
        <div className="page-scroll">
          <div className="card" style={{ marginBottom: 10 }}>
            <div className="section-title">ルームコード：{roomCode}</div>
            {opponentReady && (
              <div className="badge badge-accent">✅ 相手は準備完了</div>
            )}
          </div>
          <StatSetup onDone={submitReady} />
        </div>
      </div>
    );
  }

  // 相手の準備待ち
  if (phase === 'waiting_ready') {
    return (
      <div className="page">
        <div className="page-header">
          <h1>🌐 準備完了待ち</h1>
        </div>
        <div className="waiting-screen">
          <div className="spinner" />
          <p style={{ color: 'var(--text2)' }}>
            {opponentReady ? '✅ 相手も準備OK！もうすぐ開始します' : '相手の準備を待っています'}
            <span className="waiting-dots" />
          </p>
        </div>
      </div>
    );
  }

  // バトル・終了
  if ((phase === 'battle' || phase === 'ended') && myState && theirState) {
    return (
      <BattleScreen
        playerState={myState}
        enemyState={theirState}
        turn={turn}
        phase={myActed ? 'waiting' : phase}
        isOnline={true}
        onAction={handleAction}
        battleLog={battleLog}
        winner={winner}
        availableSkills={available}
        onRematch={null}
        onHome={onHome}
        opponentActed={opponentActed}
      />
    );
  }

  // エラー
  if (phase === 'error') {
    return (
      <div className="page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="page-scroll" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ fontSize: '3rem' }}>😵</div>
          <p style={{ color: 'var(--danger)', fontWeight: 700 }}>{error || '接続エラー'}</p>
          <button className="btn btn-primary" onClick={onHome}>ホームへ戻る</button>
        </div>
      </div>
    );
  }

  return null;
}
