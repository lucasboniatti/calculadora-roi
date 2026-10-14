import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';

const LS_KEY = 'roi-calc-v1';

const loadState = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) ?? {}; } catch { return {}; }
};

const usePersisted = (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    const s = loadState();
    return key in s ? s[key] : defaultValue;
  });
  const set = (v) => {
    setValue(v);
    try {
      const s = loadState();
      localStorage.setItem(LS_KEY, JSON.stringify({ ...s, [key]: v }));
    } catch {}
  };
  return [value, set];
};
import '../styles/design-system.css';

// padrão de arredondamento: parte decimal até ,5 arredonda para baixo, a partir de ,51 para cima
// (epsilon evita erro de ponto flutuante; +0 evita "-0")
const arredonda = (n, casas = 0) => {
  const f = 10 ** casas;
  return (Math.sign(n) * Math.ceil(Math.abs(n) * f - 0.5 - 1e-9)) / f + 0;
};
const fmtBRL = (n) => "R$ " + arredonda(n).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
const fmtN   = (n) => arredonda(n).toLocaleString("pt-BR");
const fmtROI = (n) => arredonda(n).toLocaleString("pt-BR") + "%";
const fmtDec = (n) => arredonda(n, 1).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const investValues = [
  300,
  ...Array.from({ length: 19 }, (_, i) => 500 + i * 500),
  ...Array.from({ length: 18 }, (_, i) => 10000 + i * 5000),
  100000,
];
const investToIdx = (v) => { const i = investValues.findIndex(x => x >= v); return i === -1 ? investValues.length - 1 : i; };

const cplValues = [
  ...Array.from({ length: 50 }, (_, i) => 1 + i),
  ...Array.from({ length: 10 }, (_, i) => 55 + i * 5),
  ...Array.from({ length: 41 }, (_, i) => 110 + i * 10),
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

const recompraValues = [
  ...Array.from({ length: 100 }, (_, i) => 1 + i),
  ...Array.from({ length: 40 },  (_, i) => 110 + i * 10),
  ...Array.from({ length: 30 },  (_, i) => 550 + i * 50),
];
const recompraToIdx = (v) => { const i = recompraValues.findIndex(x => x >= v); return i === -1 ? recompraValues.length - 1 : i; };

const ROICalcProposta = () => {
  const pageRef = useRef(null);
  const [investIdx,    setInvestIdx]    = usePersisted('investIdx',    investToIdx(2000));
  const [investExato,  setInvestExato]  = usePersisted('investExato',  null);
  const [cplIdx,       setCplIdx]       = usePersisted('cplIdx',       cplToIdx(5));
  const [cplExato,     setCplExato]     = usePersisted('cplExato',     null);
  const [conversao,    setConversao]    = usePersisted('conversao',    10);
  const [ticketIdx,    setTicketIdx]    = usePersisted('ticketIdx',    ticketToIdx(1500));
  const [ticketExato,  setTicketExato]  = usePersisted('ticketExato',  null);
  const [margem,       setMargem]       = usePersisted('margem',       15);
  const [recompraAtiva,   setRecompraAtiva]   = usePersisted('recompraAtiva',   false);
  const [recompraIdx,     setRecompraIdx]     = usePersisted('recompraIdx',     recompraToIdx(3));
  const [recompraExato,   setRecompraExato]   = usePersisted('recompraExato',   null);
  const [recompraEditing, setRecompraEditing] = useState(false);
  const [recompraDraft,   setRecompraDraft]   = useState('');
  const [margemAtiva,      setMargemAtiva]      = usePersisted('margemAtiva',      false);
  const [indicacoesAtiva,  setIndicacoesAtiva]  = usePersisted('indicacoesAtiva',  false);
  const [indicacoesPorCliente, setIndicacoesPorCliente] = usePersisted('indicacoesPorCliente', 3);
  const [conversaoIndicacao, setConversaoIndicacao] = usePersisted('conversaoIndicacao', 10);
  const [indicacoesEditing, setIndicacoesEditing] = useState(false);
  const [indicacoesDraft,   setIndicacoesDraft]   = useState('');

  const investido   = investExato  ?? investValues[investIdx];
  const cpl         = cplExato     ?? cplValues[cplIdx];
  const ticket      = ticketExato  ?? ticketValues[ticketIdx];
  const leads       = cpl > 0 ? arredonda(investido / cpl) : 0;
  const vendas      = arredonda(leads * (conversao / 100));
  const faturamento = vendas * ticket;
  const lucro       = faturamento * (margem / 100);
  const roi         = investido > 0 ? ((lucro - investido) / investido) * 100 : 0;
  const cac         = vendas > 0 ? investido / vendas : 0;
  const roas        = investido > 0 ? faturamento / investido : 0;

  const recompraQtd         = recompraExato ?? recompraValues[recompraIdx];
  const recompraFaturamento = recompraAtiva ? ticket * (recompraQtd - 1) * vendas : 0;
  const recompraLucro       = recompraAtiva ? (faturamento + recompraFaturamento) * (margem / 100) : 0;
  const ltv                 = recompraAtiva && vendas > 0 ? ticket * recompraQtd : 0;

  const indicacoesTotais              = indicacoesAtiva ? vendas * indicacoesPorCliente : 0;
  const vendasIndicacoes              = indicacoesAtiva ? arredonda(indicacoesTotais * (conversaoIndicacao / 100)) : 0;
  const ticketIndicacoes              = recompraAtiva ? ticket * recompraQtd : ticket;
  const faturamentoSoIndicacoes       = indicacoesAtiva ? vendasIndicacoes * ticketIndicacoes : 0;
  const faturamentoIndicacoes         = indicacoesAtiva ? (recompraAtiva ? faturamento + recompraFaturamento : faturamento) + faturamentoSoIndicacoes : 0;
  const lucroIndicacoes               = indicacoesAtiva ? faturamentoIndicacoes * (margem / 100) : 0;

  const handleWhatsApp = () => {
    const lines = [
      '*Projeção de ROI - Digital Rockets*',
      '',
      '*Dados da campanha*',
      `• Investimento em tráfego: ${fmtBRL(investido)}`,
      `• Custo por lead (CPL): ${fmtBRL(cpl)}`,
      `• Taxa de conversão: ${conversao}%`,
      `• Ticket médio: ${fmtBRL(ticket)}`,
      '',
      '*Resultado projetado*',
      `• Leads gerados: ${fmtN(leads)}`,
      `• Vendas fechadas: ${fmtN(vendas)}`,
      `• CAC: ${fmtBRL(cac)}`,
      `• ROAS: ${fmtDec(roas)}x`,
      `• Faturamento total: ${fmtBRL(faturamento)}`,
    ];

    if (margemAtiva) {
      lines.push(`• Margem de lucro: ${margem}%`);
      lines.push(`• Lucro estimado: ${fmtBRL(lucro)}`);
      lines.push(`• ROI: ${fmtROI(roi)}`);
    }

    if (recompraAtiva) {
      lines.push('');
      lines.push('*Com recompra*');
      lines.push(`• Recompra total: ${recompraQtd}×`);
      lines.push(`• Faturamento com recompra: ${fmtBRL(faturamento + recompraFaturamento)}`);
      lines.push(`• LTV por cliente: ${fmtBRL(ltv)}`);
      if (margemAtiva) lines.push(`• Lucro com recompra: ${fmtBRL(recompraLucro)}`);
    }

    if (indicacoesAtiva) {
      lines.push('');
      lines.push('*Com indicações*');
      lines.push(`• Indicações por cliente: ${indicacoesPorCliente}×`);
      lines.push(`• Indicações recebidas: ${fmtN(indicacoesTotais)}`);
      lines.push(`• Taxa de conversão das indicações: ${conversaoIndicacao}%`);
      lines.push(`• Vendas via indicações: ${fmtN(vendasIndicacoes)}`);
      lines.push(`• Faturamento com indicações: ${fmtBRL(faturamentoIndicacoes)}`);
      lines.push(`• Fat. só indicações: ${fmtBRL(faturamentoSoIndicacoes)}`);
      if (margemAtiva) lines.push(`• Lucro com indicações: ${fmtBRL(lucroIndicacoes)}`);
    }

    lines.push('');
    lines.push('_Calculadora de ROI - roi.dr-flow.com_');

    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/5551995597332?text=${text}`, '_blank');
  };

  const [downloading, setDownloading] = useState(false);

  const handlePDF = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const el = pageRef.current;
      if (!el) return;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'projecao-roi-digital-rockets.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section ref={pageRef} style={S.page}>
      <style>{css}</style>

      <div className="calc-wrap">
        {/* ── ESQUERDA: controles ── */}
        <div className="calc-left">
          <div style={S.titleRow}>
            <img src="/logo-mark.png" alt="Digital Rockets" style={S.logoMark} />
            <div>
              <p style={S.eyebrow}>Calculadora de ROI</p>
              <h2 style={S.h2} className="calc-h2">Quanto você pode faturar<br className="desktop-br" /> com a Digital Rockets?</h2>
            </div>
          </div>
          <p style={S.lead} className="calc-lead">*Projeção baseada nos valores inseridos. Resultados reais dependem do mercado, estratégia e performance comercial.</p>

          <div style={S.sliderBox}>
            <SliderRow
              label="Valor investido em tráfego"
              value={investIdx} min={0} max={investValues.length - 1}
              displayValue={investido} prefix="R$"
              onChange={v => { setInvestIdx(v); setInvestExato(null); }}
              onDirectInput={v => { setInvestIdx(investToIdx(v)); setInvestExato(v); }}
            />
            <SliderRow
              label="Custo por lead"
              value={cplIdx} min={0} max={cplValues.length - 1}
              displayValue={cpl} prefix="R$"
              onChange={v => { setCplIdx(v); setCplExato(null); }}
              onDirectInput={v => { setCplIdx(cplToIdx(v)); setCplExato(v); }}
            />
            <SliderRow
              label="Taxa de conversão"
              value={conversao} min={0.5} max={100} step={0.5}
              displayValue={conversao} suffix="%"
              onChange={setConversao}
              onDirectInput={v => setConversao(v)}
            />
            <SliderRow
              label="Ticket médio"
              value={ticketIdx} min={0} max={ticketValues.length - 1}
              displayValue={ticket} prefix="R$"
              onChange={v => { setTicketIdx(v); setTicketExato(null); }}
              onDirectInput={v => { setTicketIdx(ticketToIdx(v)); setTicketExato(v); }}
            />

            {/* ── Margem de lucro ── */}
            <div>
              <div style={S.sliderHead}>
                <span style={S.sliderLabel}>Margem de lucro</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {margemAtiva && (
                    <MargemValor margem={margem} setMargem={setMargem} />
                  )}
                  <button
                    type="button"
                    onClick={() => setMargemAtiva(v => !v)}
                    style={{ ...S.toggleBtn, ...(margemAtiva ? S.toggleBtnGreen : {}) }}
                    aria-pressed={margemAtiva}
                  >
                    <span style={{ ...S.toggleThumb, ...(margemAtiva ? S.toggleThumbOn : {}) }} />
                  </button>
                </div>
              </div>
              {margemAtiva && (
                <input
                  type="range" min={1} max={100} step={1} value={margem}
                  onChange={e => setMargem(Number(e.target.value))}
                  className="roi-range roi-range-green"
                />
              )}
            </div>

            {/* ── Recompra Total ── */}
            <div>
              <div style={S.sliderHead}>
                <span style={S.sliderLabel}>Recompra total</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {recompraAtiva && (
                    recompraEditing ? (
                      <input
                        autoFocus value={recompraDraft}
                        onChange={e => setRecompraDraft(e.target.value)}
                        onBlur={() => {
                          const n = Number(recompraDraft.replace(',', '.'));
                          if (!isNaN(n) && n > 0) { setRecompraIdx(recompraToIdx(n)); setRecompraExato(n); }
                          setRecompraEditing(false);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') e.target.blur();
                          if (e.key === 'Escape') setRecompraEditing(false);
                        }}
                        style={{ ...S.editInput, color: 'var(--warning)', borderBottomColor: 'rgba(232,162,27,0.4)', width: 60 }}
                      />
                    ) : (
                      <span
                        onClick={() => { setRecompraDraft(recompraQtd.toString()); setRecompraEditing(true); }}
                        title="Clique para editar"
                        style={{ ...S.sliderValue, color: 'var(--warning)', borderBottomColor: 'rgba(232,162,27,0.4)', cursor: 'text' }}
                      >
                        {recompraQtd}×
                      </span>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => setRecompraAtiva(v => !v)}
                    style={{ ...S.toggleBtn, ...(recompraAtiva ? S.toggleBtnWarning : {}) }}
                    aria-pressed={recompraAtiva}
                  >
                    <span style={{ ...S.toggleThumb, ...(recompraAtiva ? S.toggleThumbOn : {}) }} />
                  </button>
                </div>
              </div>
              {recompraAtiva && (
                <input
                  type="range" min={0} max={recompraValues.length - 1} step={1} value={recompraIdx}
                  onChange={e => { setRecompraIdx(Number(e.target.value)); setRecompraExato(null); }}
                  className="roi-range roi-range-warning"
                />
              )}
            </div>

            {/* ── Indicações recebidas ── */}
            <div>
              <div style={S.sliderHead}>
                <span style={S.sliderLabel}>Indicações recebidas</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {indicacoesAtiva && (
                    indicacoesEditing ? (
                      <input
                        autoFocus value={indicacoesDraft}
                        onChange={e => setIndicacoesDraft(e.target.value)}
                        onBlur={() => {
                          const n = Number(indicacoesDraft.replace(',', '.'));
                          if (!isNaN(n) && n > 0) setIndicacoesPorCliente(n);
                          setIndicacoesEditing(false);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') e.target.blur();
                          if (e.key === 'Escape') setIndicacoesEditing(false);
                        }}
                        style={{ ...S.editInput, color: 'var(--purple)', borderBottomColor: 'rgba(124,58,237,0.35)', width: 50 }}
                      />
                    ) : (
                      <span
                        onClick={() => { setIndicacoesDraft(indicacoesPorCliente.toString()); setIndicacoesEditing(true); }}
                        title="Clique para editar"
                        style={{ ...S.sliderValue, color: 'var(--purple)', borderBottomColor: 'rgba(124,58,237,0.35)' }}
                      >
                        {indicacoesPorCliente}×
                      </span>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => setIndicacoesAtiva(v => !v)}
                    style={{ ...S.toggleBtn, ...(indicacoesAtiva ? S.toggleBtnPurple : {}) }}
                    aria-pressed={indicacoesAtiva}
                  >
                    <span style={{ ...S.toggleThumb, ...(indicacoesAtiva ? S.toggleThumbOn : {}) }} />
                  </button>
                </div>
              </div>
              {indicacoesAtiva && (
                <input
                  type="range" min={0.5} max={100} step={0.5} value={indicacoesPorCliente}
                  onChange={e => setIndicacoesPorCliente(Number(e.target.value))}
                  className="roi-range roi-range-purple"
                />
              )}
            </div>

            {/* ── Taxa de conversão das indicações ── */}
            {indicacoesAtiva && (
              <SliderRow
                purple
                label="Taxa de conversão indicação"
                value={conversaoIndicacao} min={0.5} max={100} step={0.5}
                displayValue={conversaoIndicacao} suffix="%"
                onChange={setConversaoIndicacao}
                onDirectInput={v => setConversaoIndicacao(v)}
              />
            )}
          </div>
          {/* ── botões de ação ── */}
          <div className="no-print" style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-start' }}>
            <button
              onClick={handleWhatsApp}
              style={{ ...S.btnPDF, flex: 'none', padding: '9px 12px' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#25D366'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; }}
              title="Enviar pelo WhatsApp"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.862L.057 23.882a.5.5 0 0 0 .613.613l6.02-1.475A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.658-.516-5.168-1.414l-.371-.214-3.847.943.963-3.847-.228-.385A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
            </button>
            <button
              onClick={handlePDF}
              disabled={downloading}
              style={{ ...S.btnPDF, flex: 'none', padding: '9px 12px', opacity: downloading ? 0.6 : 1, cursor: downloading ? 'wait' : 'pointer' }}
              onMouseEnter={e => { if (!downloading) { e.currentTarget.style.borderColor = 'var(--border-brand)'; e.currentTarget.style.color = 'var(--fg-brand)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--fg)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; }}
              title="Baixar projeção como imagem"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── DIREITA: resultados ── */}
        <div className="calc-right">
          <p style={S.sectionLabel}>Resultado projetado</p>

          <div className="result-grid" style={{ marginBottom: 10 }}>
            <StatCard label="Leads gerados"   value={fmtN(leads)} />
            <StatCard label="Vendas fechadas" value={fmtN(vendas)} />
            <StatCard label="CAC"  value={cac  > 0 ? fmtBRL(cac)  : '—'} sub="Custo por cliente" />
            <StatCard label="ROAS" value={roas > 0 ? fmtDec(roas) + 'x' : '—'} sub="Receita / R$ investido" />
          </div>

          {/* card faturamento — destaque denim */}
          <div style={{ ...S.fatCard, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <p style={S.fatLabel}>Faturamento total</p>
              {margemAtiva && investido > 0 && roi > 0 && (
                <span style={S.roiBadge}>ROI: {fmtROI(roi)}</span>
              )}
            </div>
            <p style={S.fatValue}>{fmtBRL(faturamento)}</p>
          </div>

          {/* lucro + ROI — logo abaixo do faturamento, só quando margem ativa */}
          {margemAtiva && (
            <div className="result-grid" style={{ marginBottom: 10 }}>
              <StatCard label="Lucro estimado" value={fmtBRL(lucro)} valueStyle={{ color: 'var(--success)' }} />
              <StatCard label="Payback projetado" value={lucro > 0 ? (() => { const m = investido / lucro; return m < 1 ? `${arredonda(m * 30)} dias` : `${fmtDec(m)} meses`; })() : '—'} />
            </div>
          )}

          {/* cards recompra — só exibe quando ativo */}
          {recompraAtiva && (
            <div style={S.recompraResultWrap}>
              <div style={{ ...S.fatCard, borderLeftColor: 'var(--warning)', marginBottom: 0, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <p style={S.fatLabel}>Faturamento total com recompra</p>
                  {margemAtiva && investido > 0 && (() => {
                    const roiRecompra = ((recompraLucro - investido) / investido) * 100;
                    return roiRecompra > 0 ? (
                      <span style={S.roiBadge}>ROI: {fmtROI(roiRecompra)}</span>
                    ) : null;
                  })()}
                </div>
                <p style={{ ...S.fatValue, color: 'var(--warning)' }}>{fmtBRL(faturamento + recompraFaturamento)}</p>
              </div>
              <div style={{ ...S.recompraResultGrid, gridTemplateColumns: margemAtiva ? '1fr 1fr' : '1fr' }}>
                {margemAtiva && (
                  <div style={S.recompraCard}>
                    <p style={S.fatLabel}>Lucro com recompra</p>
                    <p style={{ ...S.fatValue, fontSize: 'var(--text-xl)', color: 'var(--success)' }}>{fmtBRL(recompraLucro)}</p>
                    <p style={S.statSub}>{recompraQtd} compras × {margem}%</p>
                  </div>
                )}
                <div style={S.recompraCard}>
                  <p style={S.fatLabel}>LTV por cliente</p>
                  <p style={{ ...S.fatValue, fontSize: 'var(--text-xl)', color: 'var(--warning)' }}>{fmtBRL(ltv)}</p>
                  <p style={S.statSub}>{recompraQtd}× ticket médio</p>
                </div>
              </div>
            </div>
          )}

          {/* bloco indicações — só exibe quando ativo */}
          {indicacoesAtiva && (
            <div style={S.indicacoesResultWrap}>
              {/* linha 1: indicações recebidas + vendas fechadas */}
              <div style={{ ...S.recompraResultGrid, gridTemplateColumns: '1fr 1fr' }}>
                <div style={S.recompraCard}>
                  <p style={S.fatLabel}>Indicações recebidas</p>
                  <p style={{ ...S.fatValue, fontSize: 'var(--text-xl)', color: 'var(--purple)' }}>{fmtN(indicacoesTotais)}</p>
                  <p style={S.statSub}>{vendas} clientes × {indicacoesPorCliente} indicações</p>
                </div>
                <div style={S.recompraCard}>
                  <p style={S.fatLabel}>Vendas fechadas</p>
                  <p style={{ ...S.fatValue, fontSize: 'var(--text-xl)', color: 'var(--purple)' }}>{fmtN(vendasIndicacoes)}</p>
                  <p style={S.statSub}>{fmtN(indicacoesTotais)} ind. × {conversaoIndicacao}% conversão</p>
                </div>
              </div>
              {/* linha 2: faturamento total recompra + indicações (largura cheia) */}
              <div style={{ ...S.fatCard, borderLeftColor: 'var(--purple)', marginBottom: 0, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <p style={S.fatLabel}>Faturamento total com indicações</p>
                  {margemAtiva && investido > 0 && (() => {
                    const roiInd = ((lucroIndicacoes - investido) / investido) * 100;
                    return roiInd > 0 ? (
                      <span style={{ ...S.roiBadge, color: 'var(--success)', background: '#1E9E5A1A', border: '1px solid #1E9E5A40' }}>
                        ROI: {fmtROI(roiInd)}
                      </span>
                    ) : null;
                  })()}
                </div>
                <p style={{ ...S.fatValue, color: 'var(--purple)' }}>{fmtBRL(faturamentoIndicacoes)}</p>
              </div>
              {/* linha 3: lucro (só com margem) + fat. só indicações (sempre) */}
              <div style={{ ...S.recompraResultGrid, gridTemplateColumns: margemAtiva ? '1fr 1fr' : '1fr' }}>
                {margemAtiva && (
                  <div style={S.recompraCard}>
                    <p style={S.fatLabel}>Lucro com indicações</p>
                    <p style={{ ...S.fatValue, fontSize: 'var(--text-xl)', color: 'var(--success)' }}>{fmtBRL(lucroIndicacoes)}</p>
                    <p style={S.statSub}>{vendasIndicacoes} vendas × {margem}%</p>
                  </div>
                )}
                <div style={S.recompraCard}>
                  <p style={S.fatLabel}>Fat. só indicações</p>
                  <p style={{ ...S.fatValue, fontSize: 'var(--text-xl)', color: 'var(--purple)' }}>{fmtBRL(faturamentoSoIndicacoes)}</p>
                  <p style={S.statSub}>1 compra + {indicacoesPorCliente} ind. × ticket</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

/* ── SliderRow ─────────────────────────────────────────────────────────── */
const SliderRow = ({ label, value, min, max, step = 1, displayValue, prefix, suffix, onChange, onDirectInput, last, purple }) => {
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
            style={purple ? { ...S.editInput, color: 'var(--purple)', borderBottomColor: 'rgba(124,58,237,0.35)' } : S.editInput}
          />
        ) : (
          <span onClick={startEdit} title="Clique para editar" style={purple ? { ...S.sliderValue, color: 'var(--purple)', borderBottomColor: 'rgba(124,58,237,0.35)' } : S.sliderValue}>
            {prefix && prefix + ' '}{arredonda(Number(displayValue), 1).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}{suffix}
          </span>
        )}
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={purple ? 'roi-range roi-range-purple' : 'roi-range'}
      />
    </div>
  );
};

/* ── RecompraValor ─────────────────────────────────────────────────────── */
const RecompraValor = ({ qtd, setIdx }) => {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState('');

  const startEdit  = () => { setDraft(qtd.toString()); setEditing(true); };
  const commitEdit = () => {
    const n = Number(draft.replace(',', '.'));
    if (!isNaN(n) && n > 0) setIdx(n);
    setEditing(false);
  };

  if (editing) return (
    <input autoFocus value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commitEdit}
      onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false); }}
      style={{ ...S.editInput, color: 'var(--warning)', borderBottomColor: 'var(--warning)', width: 60 }}
    />
  );

  return (
    <span onClick={startEdit} title="Clique para editar" style={{ ...S.sliderValue, color: 'var(--warning)', borderBottomColor: 'rgba(232,162,27,0.4)', cursor: 'text' }}>
      {qtd}×
    </span>
  );
};

/* ── MargemValor ───────────────────────────────────────────────────────── */
const MargemValor = ({ margem, setMargem }) => {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState('');

  const startEdit  = () => { setDraft(margem.toString()); setEditing(true); };
  const commitEdit = () => {
    const n = Number(draft.replace(',', '.'));
    if (!isNaN(n) && n > 0) setMargem(n);
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
const StatCard = ({ label, value, sub, valueStyle }) => (
  <div style={S.statCard}>
    <p style={S.statLabel}>{label}</p>
    <p style={{ ...S.statValue, ...valueStyle }}>{value}</p>
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
  /* variante âmbar para recompra */
  .roi-range-warning::-webkit-slider-thumb {
    background: var(--warning);
    box-shadow: 0 0 0 2px rgba(232,162,27,0.2), var(--shadow-sm);
  }
  .roi-range-warning::-webkit-slider-thumb:hover {
    box-shadow: 0 0 0 4px rgba(232,162,27,0.15), var(--shadow-sm);
  }
  .roi-range-warning::-moz-range-thumb { background: var(--warning); }
  /* variante roxa para indicações */
  .roi-range-purple::-webkit-slider-thumb {
    background: var(--purple);
    box-shadow: 0 0 0 2px rgba(124,58,237,0.2), var(--shadow-sm);
  }
  .roi-range-purple::-webkit-slider-thumb:hover {
    box-shadow: 0 0 0 4px rgba(124,58,237,0.15), var(--shadow-sm);
  }
  .roi-range-purple::-moz-range-thumb { background: var(--purple); }

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
  @media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { background: #fff !important; }
    .calc-wrap { display: block !important; max-width: 100% !important; }
    .calc-left, .calc-right { width: 100% !important; max-width: 100% !important; page-break-inside: avoid; }
    .calc-right { margin-top: 24px; }
    button, input[type=range] { display: none !important; }
    .no-print { display: none !important; }
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
    margin: '0 0 4px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    margin: '0 0 10px',
  },
  logoMark: {
    height: 80,
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
    fontStyle: 'italic',
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
    marginBottom: 10,
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

  /* toggle switch */
  toggleBtn: {
    flexShrink: 0,
    width: 40,
    height: 22,
    borderRadius: 999,
    background: 'var(--border-strong)',
    border: 'none',
    cursor: 'pointer',
    padding: 3,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    transition: 'background 200ms ease',
  },
  toggleBtnOn: {
    background: 'var(--denim)',
  },
  toggleBtnGreen: {
    background: 'var(--success)',
  },
  toggleBtnWarning: {
    background: 'var(--warning)',
  },
  toggleBtnPurple: {
    background: 'var(--purple)',
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: '#fff',
    boxShadow: 'var(--shadow-sm)',
    transition: 'transform 200ms ease',
    flexShrink: 0,
  },
  toggleThumbOn: {
    transform: 'translateX(18px)',
  },

  roiBadge: {
    fontFamily: 'var(--font-num)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--w-semi)',
    color: 'var(--success)',
    background: '#1E9E5A1A',
    border: '1px solid #1E9E5A40',
    borderRadius: 'var(--radius-pill)',
    padding: '2px 8px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },

  btnWhatsapp: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '13px 20px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: 'var(--grad-denim)',
    color: 'var(--fg-on-dark)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--w-semi)',
    letterSpacing: '0.01em',
    boxShadow: 'var(--shadow-brand)',
    cursor: 'pointer',
    transition: 'background .15s, box-shadow .15s, transform .1s',
  },

  btnPDF: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '13px 20px',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--border-strong)',
    background: 'var(--surface)',
    color: 'var(--fg)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--w-semi)',
    letterSpacing: '0.01em',
    boxShadow: 'var(--shadow-xs)',
    cursor: 'pointer',
    transition: 'border-color .15s, box-shadow .15s, transform .1s',
  },

  /* recompra — direita */
  recompraResultWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 10,
    padding: '14px 16px',
    background: '#FDF8EE',
    border: '1px solid #E8A21B4D',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-xs)',
  },
  indicacoesResultWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 10,
    padding: '14px 16px',
    background: '#F7F4FE',
    border: '1px solid #7C3AED4D',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-xs)',
  },
  recompraResultGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  recompraCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 14px',
  },
};

export default ROICalcProposta;
