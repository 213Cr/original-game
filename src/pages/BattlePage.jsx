import { useState, useCallback } from 'react';
import BattleScreen from '../components/BattleScreen.jsx';
import { createPlayerState, resolveTurn } from '../gameLogic/battleCalc.js';
import { getCpuAction } from '../gameLogic/cpuAI.js';
import { getAllSkills } from '../gameLogic/skills.js';
import { GC } from '../gameLogic/constants.js';

const buildAvailableSkills = (state, allSkills) =>
  allSkills.map(sk => ({
    ...sk,
    disabled: sk.id === 'strong' && (state.cooldowns?.strong || 0) > 0,
    restricted: !!(state.restrictedActions?.includes(sk.id)),
  }));

export default function BattlePage({ playerStats, onHome }) {
  const [playerState, setPlayerState] = useState(() => createPlayerState(playerStats));
  const [enemyState, setEnemyState] = useState(() => createPlayerState(GC.CPU_DEFAULT_STATS));
  const [turn, setTurn] = useState(1);
  const [phase, setPhase] = useState('selecting');
  const [battleLog, setBattleLog] = useState([]);
  const [winner, setWinner] = useState(null);

  const handleAction = useCallback((action) => {
    setPhase('resolving');
    const cpuAction = getCpuAction(enemyState, playerState, turn);
    const result = resolveTurn(playerState, enemyState, action, cpuAction, turn);

    setPlayerState(result.playerState);
    setEnemyState(result.enemyState);
    setBattleLog(prev => [...prev, ...result.log]);
    setTurn(t => t + 1);

    if (result.winner) {
      setWinner(result.winner);
      setPhase('ended');
    } else {
      setPhase('selecting');
    }
  }, [playerState, enemyState, turn]);

  const handleRematch = useCallback(() => {
    setPlayerState(createPlayerState(playerStats));
    setEnemyState(createPlayerState(GC.CPU_DEFAULT_STATS));
    setTurn(1);
    setPhase('selecting');
    setBattleLog([]);
    setWinner(null);
  }, [playerStats]);

  const allSkills = getAllSkills();
  const available = buildAvailableSkills(playerState, allSkills);

  return (
    <BattleScreen
      playerState={playerState}
      enemyState={enemyState}
      turn={turn}
      phase={phase}
      isOnline={false}
      onAction={handleAction}
      battleLog={battleLog}
      winner={winner}
      availableSkills={available}
      onRematch={handleRematch}
      onHome={onHome}
    />
  );
}
