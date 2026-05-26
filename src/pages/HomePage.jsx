export default function HomePage({ onCpu, onOnline, onEditor }) {
  return (
    <div className="page" style={{ justifyContent: 'center' }}>
      <div className="page-scroll" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="home-logo">⚔️</div>
        <h1 className="home-title">バトルゲーム</h1>
        <p className="home-sub">ステータスを配分してバトルしよう！</p>

        <div className="home-menu">
          <button className="btn btn-primary" style={{ fontSize: '1.1rem', minHeight: 58 }} onClick={onCpu}>
            🤖 CPU対戦
          </button>
          <button className="btn btn-success" style={{ fontSize: '1.1rem', minHeight: 58 }} onClick={onOnline}>
            🌐 オンライン対戦
          </button>
          <button className="btn btn-ghost" onClick={onEditor}>
            🛠️ スキル作成・管理
          </button>
        </div>

        <div style={{ marginTop: 24, padding: '12px 16px', background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div className="section-title">遊び方</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text2)', lineHeight: 1.7 }}>
            <div>1. ステータスを120ポイントで配分</div>
            <div>2. バトルで技を選んで決定</div>
            <div>3. 技ボタンを長押しで詳細確認</div>
            <div>4. オンラインはルームコードを共有</div>
          </div>
        </div>
      </div>
    </div>
  );
}
