import { useState, useEffect } from 'react';
import HomePage from './pages/HomePage.jsx';
import SetupPage from './pages/SetupPage.jsx';
import BattlePage from './pages/BattlePage.jsx';
import OnlinePage from './pages/OnlinePage.jsx';
import SkillEditorPage from './pages/SkillEditorPage.jsx';

export default function App() {
  const [page, setPage] = useState('home');
  const [playerStats, setPlayerStats] = useState(null);

  // URL に room パラメータがあれば自動でオンラインページへ
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('room')) {
      setPage('online');
    }
  }, []);

  const goHome = () => {
    history.replaceState(null, '', location.pathname);
    setPage('home');
  };

  switch (page) {
    case 'home':
      return (
        <HomePage
          onCpu={() => setPage('cpu_setup')}
          onOnline={() => setPage('online')}
          onEditor={() => setPage('editor')}
        />
      );

    case 'cpu_setup':
      return (
        <SetupPage
          title="⚙️ ステータス配分 (CPU戦)"
          onBack={() => setPage('home')}
          onDone={(stats) => {
            setPlayerStats(stats);
            setPage('cpu_battle');
          }}
        />
      );

    case 'cpu_battle':
      return (
        <BattlePage
          playerStats={playerStats}
          onHome={goHome}
        />
      );

    case 'online':
      return <OnlinePage onHome={goHome} />;

    case 'editor':
      return <SkillEditorPage onBack={() => setPage('home')} />;

    default:
      return (
        <HomePage
          onCpu={() => setPage('cpu_setup')}
          onOnline={() => setPage('online')}
          onEditor={() => setPage('editor')}
        />
      );
  }
}
