import { useState } from 'react';
import '../styles/design-system.css';

const fmtBRL = (n) => "R$ " + Math.round(n).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
const fmtN   = (n) => Math.round(n).toLocaleString("pt-BR");

const investValues = [
  300,
  ...Array.from({ length: 19 }, (_, i) => 500 + i * 500),
  ...Array.from({ length: 18 }, (_, i) => 10000 + i * 5000),
  100000,
];
const investToIdx = (v) => { const i = investValues.findIndex(x => x >= v); return i === -1 ? investValues.length - 1 : i; };

const cplValues = [
  ...Array.from({ length: 9 },  (_, i) => 1 + i),
  ...Array.from({ length: 18 }, (_, i) => 10 + i * 5),
  ...Array.from({ length: 41 }, (_, i) => 100 + i * 10),
];
const cplToIdx = (v) => { const i = cplValues.findIndex(x => x >= v); return i === -1 ? cplValues.length - 1 : i; };

const ticketValues = [
  50,
  ...Array.from({ length: 19 }, (_, i) => 100 + i * 100),
  ...Array.from({ length: 33 }, (_, i) => 2000 + i * 1000),
  ...Array.from({ length: 14 }, (_, i) => 35000 + i * 5000),
  ...Array.from({ length: 9 },  (_, i) => 200000 + i * 100000),
  1000000, 1500000, 2000000,
  ...Array.from({ length: 8 },  (_, i) => 3000000 + i * 1000000),
];
const ticketToIdx = (v) => { const i = ticketValues.findIndex(x => x >= v); return i === -1 ? ticketValues.length - 1 : i; };

const ROICalcProposta = () => {
  const [investIdx, setInvestIdx] = useState(investToIdx(2000));
  const [cplIdx,    setCplIdx]    = useState(cplToIdx(5));
  const [conversao, setConversao] = useState(10);
  const [ticketIdx, setTicketIdx] = useState(ticketToIdx(1500));
  const [margem,    setMargem]    = useState(15);

  const investido   = investValues[investIdx];
  const cpl         = cplValues[cplIdx];
  const ticket      = ticketValues[ticketIdx];
  const leads       = cpl > 0 ? Math.floor(investido / cpl) : 0;
  const vendas      = Math.floor(leads * (conversao / 100));
  const faturamento = vendas * ticket;
  const lucro       = faturamento * (margem / 100);
  const roi         = investido > 0 ? ((lucro - investido) / investido) * 100 : 0;
  const cac         = vendas > 0 ? investido / vendas : 0;
  const roas        = investido > 0 ? faturamento / investido : 0;

  return (
    <section style={S.page}>
      <style>{css}</style>

      <div className="calc-wrap">
        {/* ── ESQUERDA: controles ── */}
        <div className="calc-left">
          <p style={S.eyebrow}>Calculadora de ROI</p>
          <div style={S.titleRow}>
            <img src="/logo-mark.png" alt="Digital Rockets" style={S.logoMark} />
            <h2 style={S.h2} className="calc-h2">Quanto você pode faturar<br className="desktop-br" /> com a Digital Rockets?</h2>
          </div>
          <p style={S.lead} className="calc-lead">Preencha os dados e veja em tempo real quanto você pode gerar<br />em leads, vendas e lucro com nossa gestão estratégica.</p>

          <div style={S.sliderBox}>
            <SliderRow
              label="Valor investido em tráfego"
              value={investIdx} min={0} max={investValues.length - 1}
              displayValue={investido} prefix="R$"
              onChange={setInvestIdx}
              onDirectInput={v => setInvestIdx(investToIdx(v))}
            />
            <SliderRow
              label="Custo por lead"
              value={cplIdx} min={0} max={cplValues.length - 1}
              displayValue={cpl} prefix="R$"
              onChange={setCplIdx}
              onDirectInput={v => setCplIdx(cplToIdx(v))}
            />
            <SliderRow
              label="Taxa de conversão"
              value={conversao} min={0.5} max={100} step={0.5}
              displayValue={conversao} suffix="%"
              onChange={setConversao}
              onDirectInput={v => setConversao(Math.min(100, Math.max(0.5, v)))}
            />
            <SliderRow
              label="Ticket médio"
              value={ticketIdx} min={0} max={ticketValues.length - 1}
              displayValue={ticket} prefix="R$"
              onChange={setTicketIdx}
              onDirectInput={v => setTicketIdx(ticketToIdx(v))}
              last
            />
          </div>
        </div>

        {/* ── DIREITA: resultados ── */}
        <div className="calc-right">
          <p style={S.sectionLabel}>Resultado projetado</p>

          <div className="result-grid" style={{ marginBottom: 10 }}>
            <StatCard label="Leads gerados"   value={fmtN(leads)} />
            <StatCard label="Vendas fechadas" value={fmtN(vendas)} />
            <StatCard label="CAC"  value={cac  > 0 ? fmtBRL(cac)  : '—'} sub="Custo por cliente" />
            <StatCard label="ROAS" value={roas > 0 ? roas.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'x' : '—'} sub="Receita / R$ investido" />
          </div>

          {/* card faturamento — destaque denim */}
          <div style={{ ...S.fatCard, marginBottom: 10 }}>
            <p style={S.fatLabel}>Faturamento total</p>
            <p style={S.fatValue}>{fmtBRL(faturamento)}</p>
          </div>

          {/* margem + lucro/ROI */}
          <div style={S.margemWrap}>
            <div style={S.margemHeader}>
              <span style={S.margemLabelText}>Margem de lucro</span>
              <MargemValor margem={margem} setMargem={setMargem} />
            </div>
            <input
              type="range" min={1} max={100} step={1} value={margem}
              onChange={e => setMargem(Number(e.target.value))}
              className="roi-range roi-range-green"
            />
            <div style={S.margemRow}>
              <div>
                <p style={S.margemMeta}>Lucro estimado</p>
                <p style={S.margemNum}>{fmtBRL(lucro)}</p>
              </div>
              <div style={S.margemDivider} />
              <div>
                <p style={S.margemMeta}>ROI</p>
                <p style={{ ...S.margemNum, color: roi > 0 ? 'var(--success)' : 'var(--fg-subtle)' }}>
                  {roi > 0 ? `+${Math.round(roi)}%` : '—'}
                </p>
              </div>
            </div>
          </div>

          <p style={S.disclaimer}>* Projeção baseada nos valores inseridos. Resultados reais dependem do mercado, estratégia e performance comercial.</p>
        </div>
      </div>
    </section>
  );
};

/* ── SliderRow ─────────────────────────────────────────────────────────── */
const SliderRow = ({ label, value, min, max, step = 1, displayValue, prefix, suffix, onChange, onDirectInput, last }) => {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState('');

  const startEdit  = () => { setDraft(displayValue.toString()); setEditing(true); };
  const commitEdit = () => {
    const n = Number(draft.replace(',', '.'));
    if (!isNaN(n) && n > 0 && onDirectInput) onDirectInput(n);
    setEditing(false);
  };

  return (
    <div>
      <div style={S.sliderHead}>
        <span style={S.sliderLabel}>{label}</span>
        {editing ? (
          <input
            autoFocus value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false); }}
            style={S.editInput}
          />
        ) : (
          <span onClick={startEdit} title="Clique para editar" style={S.sliderValue}>
            {prefix && prefix + ' '}{Number(displayValue).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}{suffix}
          </span>
        )}
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="roi-range"
      />
    </div>
  );
};

/* ── MargemValor ───────────────────────────────────────────────────────── */
const MargemValor = ({ margem, setMargem }) => {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState('');

  const startEdit  = () => { setDraft(margem.toString()); setEditing(true); };
  const commitEdit = () => {
    const n = Number(draft.replace(',', '.'));
    if (!isNaN(n) && n >= 1 && n <= 100) setMargem(Math.round(n));
    setEditing(false);
  };

  if (editing) return (
    <input autoFocus value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commitEdit}
      onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false); }}
      style={{ ...S.editInput, color: 'var(--success)', borderBottomColor: 'var(--success)', width: 60 }}
    />
  );

  return (
    <span onClick={startEdit} title="Clique para editar" style={S.margemPct}>
      {margem}%
    </span>
  );
};

/* ── StatCard ──────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, sub }) => (
  <div style={S.statCard}>
    <p style={S.statLabel}>{label}</p>
    <p style={S.statValue}>{value}</p>
    {sub && <p style={S.statSub}>{sub}</p>}
  </div>
);

/* ── CSS injetado ──────────────────────────────────────────────────────── */
const css = `
  .calc-wrap {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    align-items: start;
    max-width: 1080px;
    margin: 0 auto;
    width: 100%;
  }
  .calc-left  { display: flex; flex-direction: column; }
  .desktop-br { display: block; }
  .calc-right { display: flex; flex-direction: column; }
  .result-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  /* range base */
  .roi-range {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 3px;
    border-radius: 999px;
    background: var(--border-strong);
    outline: none;
    cursor: pointer;
    display: block;
    margin-top: 8px;
  }
  .roi-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px; height: 16px;
    border-radius: 50%;
    background: var(--denim);
    border: 2px solid var(--bg);
    box-shadow: 0 0 0 2px rgba(14,95,184,0.2), var(--shadow-sm);
    cursor: pointer;
    transition: transform 140ms ease, box-shadow 140ms ease;
  }
  .roi-range::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 0 0 4px rgba(14,95,184,0.15), var(--shadow-sm);
  }
  .roi-range::-moz-range-thumb {
    width: 16px; height: 16px;
    border-radius: 50%;
    background: var(--denim);
    border: 2px solid var(--bg);
    cursor: pointer;
  }
  /* variante verde para margem */
  .roi-range-green::-webkit-slider-thumb {
    background: var(--success);
    box-shadow: 0 0 0 2px rgba(30,158,90,0.2), var(--shadow-sm);
  }
  .roi-range-green::-webkit-slider-thumb:hover {
    box-shadow: 0 0 0 4px rgba(30,158,90,0.15), var(--shadow-sm);
  }
  .roi-range-green::-moz-range-thumb { background: var(--success); }

  @media (max-width: 860px) {
    .calc-wrap { grid-template-columns: 1fr; gap: 32px; }
    .calc-h2 { font-size: 1.15rem !important; line-height: 1.3 !important; }
    .desktop-br { display: none; }
    .calc-lead { margin-top: 6px !important; margin-bottom: 16px !important; }
    .calc-lead br { display: none; }
  }
  @media (max-width: 480px) {
    .result-grid { grid-template-columns: 1fr; }
  }
`;

/* ── Tokens de estilo ──────────────────────────────────────────────────── */
const S = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    display: 'flex',
    alignItems: 'center',
    padding: '64px 24px',
  },

  /* cabeçalho esquerdo */
  eyebrow: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--w-semi)',
    letterSpacing: 'var(--tracking-caps)',
    textTransform: 'uppercase',
    color: 'var(--denim)',
    margin: '0 0 10px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    margin: '0 0 10px',
  },
  logoMark: {
    height: 64,
    width: 'auto',
    flexShrink: 0,
  },
  h2: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xl)',
    fontWeight: 'var(--w-bold)',
    letterSpacing: 'var(--tracking-tight)',
    lineHeight: 'var(--leading-snug)',
    color: 'var(--fg-strong)',
    margin: 0,
  },
  lead: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    lineHeight: 'var(--leading-relaxed)',
    color: 'var(--fg-muted)',
    margin: '0 0 16px',
  },

  /* box de sliders */
  sliderBox: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '38px 22px',
    boxShadow: 'var(--shadow-xs)',
    display: 'flex',
    flexDirection: 'column',
    gap: '37px',
  },
  sliderHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sliderLabel: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--w-reg)',
    color: 'var(--fg-muted)',
  },
  sliderValue: {
    fontFamily: 'var(--font-num)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--w-semi)',
    color: 'var(--denim)',
    cursor: 'text',
    borderBottom: '1px dashed var(--blue-200)',
  },
  editInput: {
    fontFamily: 'var(--font-num)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--w-semi)',
    color: 'var(--denim)',
    border: 'none',
    borderBottom: '2px solid var(--denim)',
    background: 'transparent',
    outline: 'none',
    width: 110,
    textAlign: 'right',
  },

  /* label seção direita */
  sectionLabel: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--w-med)',
    letterSpacing: 'var(--tracking-caps)',
    textTransform: 'uppercase',
    color: 'var(--fg-subtle)',
    margin: '0 0 8px',
  },

  /* stat cards */
  statCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '14px 16px',
    boxShadow: 'var(--shadow-xs)',
  },
  statLabel: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--w-med)',
    letterSpacing: 'var(--tracking-wide)',
    textTransform: 'uppercase',
    color: 'var(--fg-subtle)',
    margin: '0 0 6px',
  },
  statValue: {
    fontFamily: 'var(--font-num)',
    fontSize: 'var(--text-xl)',
    fontWeight: 'var(--w-semi)',
    letterSpacing: '-0.02em',
    lineHeight: 1,
    color: 'var(--fg-strong)',
    fontVariantNumeric: 'tabular-nums',
    margin: 0,
  },
  statSub: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    color: 'var(--fg-subtle)',
    margin: '5px 0 0',
  },

  /* card faturamento */
  fatCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderLeft: '3px solid var(--denim)',
    borderRadius: 'var(--radius-md)',
    padding: '16px 18px',
    boxShadow: 'var(--shadow-xs)',
  },
  fatLabel: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--w-med)',
    letterSpacing: 'var(--tracking-wide)',
    textTransform: 'uppercase',
    color: 'var(--fg-subtle)',
    margin: '0 0 6px',
  },
  fatValue: {
    fontFamily: 'var(--font-num)',
    fontSize: 'var(--text-3xl)',
    fontWeight: 'var(--w-bold)',
    letterSpacing: '-0.03em',
    lineHeight: 1,
    color: 'var(--denim)',
    fontVariantNumeric: 'tabular-nums',
    margin: 0,
  },

  /* margem */
  margemWrap: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '14px 16px',
    boxShadow: 'var(--shadow-xs)',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  margemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  margemLabelText: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--w-reg)',
    color: 'var(--fg-muted)',
  },
  margemPct: {
    fontFamily: 'var(--font-num)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--w-semi)',
    color: 'var(--success)',
    cursor: 'text',
    borderBottom: '1px dashed rgba(30,158,90,0.35)',
  },
  margemRow: {
    display: 'flex',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid var(--border)',
  },
  margemDivider: {
    width: 1,
    background: 'var(--border)',
    flexShrink: 0,
  },
  margemMeta: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--w-med)',
    letterSpacing: 'var(--tracking-wide)',
    textTransform: 'uppercase',
    color: 'var(--fg-subtle)',
    margin: '0 0 4px',
  },
  margemNum: {
    fontFamily: 'var(--font-num)',
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--w-bold)',
    letterSpacing: '-0.02em',
    color: 'var(--fg-strong)',
    fontVariantNumeric: 'tabular-nums',
    margin: 0,
  },

  disclaimer: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    color: 'var(--fg-subtle)',
    fontStyle: 'italic',
    margin: '4px 0 0',
    lineHeight: 'var(--leading-relaxed)',
  },
};

export default ROICalcProposta;
