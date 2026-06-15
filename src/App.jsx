import ROICalcProposta from './components/ROICalcProposta';

const App = () => (
  <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
    <main style={{ flex: 1 }}>
      <ROICalcProposta />
    </main>
  </div>
);

export default App;
