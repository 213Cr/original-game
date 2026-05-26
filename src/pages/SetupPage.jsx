import StatSetup from '../components/StatSetup.jsx';

export default function SetupPage({ onDone, onBack, title }) {
  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-icon" onClick={onBack}>←</button>
        <h1>{title || 'ステータス配分'}</h1>
      </div>
      <div className="page-scroll">
        <StatSetup onDone={onDone} />
      </div>
    </div>
  );
}
