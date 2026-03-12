import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, IconButton, Tooltip, ToggleButtonGroup, ToggleButton } from '@mui/material';
import {
    RefreshRounded, FitScreenRounded, CloseRounded, GridViewRounded, BlurCircularRounded,
    NetworkPing, ComputerRounded, Edit, VpnKey, Public, Storage, Cloud, LocationOn, Speed, Info,
} from '@mui/icons-material';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import api from '../api';

/* ─── Colors ─────────────────────────────────────────────── */
const ST = {
    online: { main: '#22c55e', glow: 'rgba(34,197,94,0.35)', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)' },
    offline: { main: '#ef4444', glow: 'rgba(239,68,68,0.25)', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
    deploying: { main: '#eab308', glow: 'rgba(234,179,8,0.25)', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.25)' },
};

// Mesh link colors — multiple colors like the reference
const EDGE_COLORS = [
    '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6', '#22c55e',
    '#ec4899', '#f97316', '#14b8a6', '#6366f1', '#eab308',
];

const gBtn = {
    bgcolor: 'transparent', border: '1px solid #1e3a5f', color: '#8badc9',
    textTransform: 'none', fontSize: 12, fontWeight: 500, borderRadius: '8px',
    px: 1.5, py: 0.5, minWidth: 0, lineHeight: 1.4,
    '&:hover': { bgcolor: '#162d4a', borderColor: '#2d5a8a', color: '#e2e8f0' },
};

/* ─── Custom Node ────────────────────────────────────────── */
function CustomNode({ data }) {
    const s = ST[data.status] || ST.offline;
    const on = data.status === 'online';
    return (
        <>
            {[Position.Top, Position.Bottom, Position.Left, Position.Right].map(p => (
                <Handle key={p} type={p === Position.Top || p === Position.Left ? 'target' : 'source'} position={p}
                    id={p} style={{ background: 'transparent', border: 'none', width: 1, height: 1 }} />
            ))}
            <Box sx={{
                bgcolor: '#0f2238', borderRadius: '10px', minWidth: 160, overflow: 'hidden',
                border: `1.5px solid ${on ? 'rgba(6,182,212,0.4)' : '#1e3a5f'}`,
                boxShadow: on
                    ? '0 0 20px rgba(6,182,212,0.2), 0 4px 12px rgba(0,0,0,0.4)'
                    : '0 4px 12px rgba(0,0,0,0.5)',
                cursor: 'pointer', transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
                '&:hover': {
                    borderColor: on ? 'rgba(6,182,212,0.7)' : '#2d5a8a',
                    transform: 'translateY(-2px) scale(1.03)',
                    boxShadow: on
                        ? '0 0 30px rgba(6,182,212,0.3), 0 8px 20px rgba(0,0,0,0.5)'
                        : '0 8px 20px rgba(0,0,0,0.6)',
                },
            }}>
                {/* Accent bar */}
                <Box sx={{ height: 2, background: on ? 'linear-gradient(90deg, #06b6d4, #22c55e)' : '#1e3a5f' }} />

                <Box sx={{ px: 1.5, py: 1.2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.5 }}>
                        <Box sx={{
                            width: 8, height: 8, borderRadius: '50%', bgcolor: s.main, flexShrink: 0,
                            boxShadow: on ? `0 0 8px ${s.glow}` : 'none',
                            ...(on ? { animation: 'gp 2s ease-in-out infinite', '@keyframes gp': { '0%,100%': { boxShadow: `0 0 8px ${s.glow}` }, '50%': { boxShadow: `0 0 2px ${s.glow}` } } } : {}),
                        }} />
                        <Typography sx={{ fontWeight: 700, fontSize: 12, color: '#e2e8f0', letterSpacing: '-0.01em' }}>{data.hostname}</Typography>
                    </Box>
                    <Typography sx={{ fontFamily: '"Fira Code",monospace', fontSize: 11, color: '#06b6d4', letterSpacing: '0.02em' }}>{data.ip_mesh}</Typography>
                    {data.latency_ms != null && (
                        <Typography sx={{ fontSize: 10, fontFamily: 'monospace', mt: 0.3, color: data.latency_ms < 50 ? '#4ade80' : data.latency_ms < 150 ? '#facc15' : '#f87171', fontWeight: 600 }}>
                            {data.latency_ms}ms
                        </Typography>
                    )}
                </Box>
            </Box>
        </>
    );
}
const nodeTypes = { custom: CustomNode };

/* ─── Detail Panel ───────────────────────────────────────── */
function Panel({ host, onClose, onPing, onNav, busy }) {
    if (!host) return null;
    const s = ST[host.status] || ST.offline;
    const rows = [
        { i: <Storage sx={{ fontSize: 14 }} />, l: 'IP Mesh', v: host.ip_mesh },
        { i: <Public sx={{ fontSize: 14 }} />, l: 'IP Público', v: host.ip_public },
        { i: <Cloud sx={{ fontSize: 14 }} />, l: 'Provider', v: host.provider },
        { i: <LocationOn sx={{ fontSize: 14 }} />, l: 'Região', v: host.region },
        { i: <Speed sx={{ fontSize: 14 }} />, l: 'Porta WG', v: host.port_wg },
        { i: <ComputerRounded sx={{ fontSize: 14 }} />, l: 'Porta SSH', v: host.port_ssh },
    ].filter(r => r.v);

    return (
        <Box sx={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 320, bgcolor: '#0a1929',
            borderLeft: '1px solid #1e3a5f', zIndex: 10, display: 'flex', flexDirection: 'column',
            boxShadow: '-8px 0 30px rgba(0,0,0,0.5)',
            animation: 'panelIn 0.25s cubic-bezier(.4,0,.2,1)',
            '@keyframes panelIn': { from: { transform: 'translateX(100%)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, borderBottom: '1px solid #1e3a5f' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.main, boxShadow: `0 0 10px ${s.glow}` }} />
                    <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>{host.hostname}</Typography>
                </Box>
                <IconButton size="small" onClick={onClose} sx={{ color: '#4a6a8a', '&:hover': { color: '#e2e8f0', bgcolor: '#162d4a' } }}>
                    <CloseRounded sx={{ fontSize: 18 }} />
                </IconButton>
            </Box>

            <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.8, px: 1.5, py: 0.5, borderRadius: 999, bgcolor: s.bg, border: `1px solid ${s.border}` }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: s.main, textTransform: 'capitalize' }}>{host.status}</Typography>
                    {host.latency_ms != null && <Typography sx={{ fontSize: 11, color: '#4a6a8a' }}>· {host.latency_ms}ms</Typography>}
                </Box>
            </Box>

            <Box sx={{ px: 2.5, flex: 1, overflow: 'auto', pb: 2 }}>
                <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#4a6a8a', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5 }}>Detalhes</Typography>
                {rows.map((r, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                        <Box sx={{ color: '#2d5a8a', display: 'flex' }}>{r.i}</Box>
                        <Box>
                            <Typography sx={{ fontSize: 10, color: '#4a6a8a', lineHeight: 1 }}>{r.l}</Typography>
                            <Typography sx={{ fontSize: 13, color: '#cbd5e1', fontFamily: 'monospace', mt: 0.2 }}>{r.v}</Typography>
                        </Box>
                    </Box>
                ))}
                {host.notes && <>
                    <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#4a6a8a', textTransform: 'uppercase', letterSpacing: '0.1em', mt: 2, mb: 1 }}>Notas</Typography>
                    <Typography sx={{ fontSize: 13, color: '#8badc9', lineHeight: 1.6 }}>{host.notes}</Typography>
                </>}
            </Box>

            <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid #1e3a5f', display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Button size="small" startIcon={<NetworkPing sx={{ fontSize: 14 }} />} onClick={() => onPing(host.id)} disabled={busy} sx={{ ...gBtn, flex: '1 1 45%', '&.Mui-disabled': { color: '#1e3a5f', borderColor: '#0f2238' } }}>
                    {busy ? 'Pingando...' : 'Ping'}
                </Button>
                <Button size="small" startIcon={<ComputerRounded sx={{ fontSize: 14 }} />} onClick={() => onNav('/terminal')} sx={{ ...gBtn, flex: '1 1 45%' }}>SSH</Button>
                <Button size="small" startIcon={<Edit sx={{ fontSize: 14 }} />} onClick={() => onNav('/hosts')} sx={{ ...gBtn, flex: '1 1 45%' }}>Editar</Button>
                <Button size="small" startIcon={<VpnKey sx={{ fontSize: 14 }} />} onClick={() => onNav('/hosts')} sx={{ ...gBtn, flex: '1 1 45%' }}>Chaves</Button>
            </Box>
        </Box>
    );
}

/* ─── Main ───────────────────────────────────────────────── */
export default function Topology() {
    const [hosts, setHosts] = useState([]);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selected, setSelected] = useState(null);
    const [pinging, setPinging] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [layout, setLayout] = useState('circle');
    const [rf, setRf] = useState(null);
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();

    const loadData = useCallback(async () => {
        try { const res = await api.get('/hosts'); setHosts(res.data); } catch { enqueueSnackbar('Erro ao carregar', { variant: 'error' }); }
    }, []);

    useEffect(() => { loadData(); const iv = setInterval(loadData, 15000); return () => clearInterval(iv); }, [loadData]);

    useEffect(() => { if (hosts.length) buildGraph(hosts, layout); }, [hosts, layout]);

    const buildGraph = (list, mode) => {
        const n = list.length;
        if (!n) { setNodes([]); setEdges([]); return; }

        let positions;
        if (mode === 'grid') {
            const cols = Math.ceil(Math.sqrt(n));
            const gapX = 260, gapY = 180;
            positions = list.map((_, i) => ({
                x: (i % cols) * gapX + 100,
                y: Math.floor(i / cols) * gapY + 80,
            }));
        } else {
            // Elliptical layout like the reference
            const rx = Math.max(350, n * 70);
            const ry = Math.max(220, n * 45);
            const cx = rx + 100, cy = ry + 80;
            positions = list.map((_, i) => {
                const a = (2 * Math.PI * i) / n - Math.PI / 2;
                return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) };
            });
        }

        setNodes(list.map((h, i) => ({
            id: String(h.id), type: 'custom', position: positions[i],
            data: { hostname: h.hostname, ip_mesh: h.ip_mesh, ip_public: h.ip_public, status: h.status, provider: h.provider, region: h.region, latency_ms: h.latency_ms },
        })));

        // Colorful mesh edges
        const e = [];
        let ci = 0;
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
            const on = list[i].status === 'online' && list[j].status === 'online';
            const color = EDGE_COLORS[ci % EDGE_COLORS.length];
            ci++;
            e.push({
                id: `e${list[i].id}-${list[j].id}`,
                source: String(list[i].id),
                target: String(list[j].id),
                animated: on,
                style: {
                    stroke: on ? color : '#0f2238',
                    strokeWidth: on ? 1.5 : 0.5,
                    opacity: on ? 0.5 : 0.15,
                },
            });
        }
        setEdges(e);

        setTimeout(() => rf?.fitView({ padding: 0.2, duration: 400 }), 100);
    };

    const refreshAll = async () => {
        setRefreshing(true);
        for (const h of hosts) await api.get(`/hosts/${h.id}/health`).catch(() => {});
        await loadData();
        setRefreshing(false);
        enqueueSnackbar('Atualizado!', { variant: 'success' });
    };

    const pingHost = async (id) => {
        setPinging(true);
        try {
            const res = await api.get(`/hosts/${id}/health`);
            enqueueSnackbar(`${res.data.status === 'online' ? 'Online' : 'Offline'} — ${res.data.latency_ms || '?'}ms`, { variant: res.data.status === 'online' ? 'success' : 'error' });
            await loadData();
        } catch { enqueueSnackbar('Erro', { variant: 'error' }); }
        finally { setPinging(false); }
    };

    const onNodeClick = useCallback((_, node) => {
        const h = hosts.find(x => String(x.id) === node.id);
        if (h) setSelected(h);
    }, [hosts]);

    const online = hosts.filter(h => h.status === 'online').length;
    const offline = hosts.length - online;
    const meshLinks = online > 1 ? (online * (online - 1)) / 2 : 0;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {/* Header toolbar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexShrink: 0, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.025em' }}>Network Map</Typography>
                    <Typography sx={{ fontSize: 12, color: '#4a6a8a' }}>{hosts.length} nodes · {meshLinks} links</Typography>
                    {/* Status dots */}
                    <Box sx={{ display: 'flex', gap: 1.2 }}>
                        {[
                            { n: online, c: '#22c55e', l: 'online' },
                            ...(offline > 0 ? [{ n: offline, c: '#ef4444', l: 'offline' }] : []),
                        ].map((p, i) => (
                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.c, boxShadow: `0 0 6px ${p.c}66` }} />
                                <Typography sx={{ fontSize: 11, color: '#8badc9', fontWeight: 500 }}>{p.n} {p.l}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ToggleButtonGroup size="small" exclusive value={layout} onChange={(_, v) => v && setLayout(v)}
                        sx={{ '& .MuiToggleButton-root': { border: '1px solid #1e3a5f', color: '#4a6a8a', px: 1.2, py: 0.4, fontSize: 12, textTransform: 'none', '&.Mui-selected': { bgcolor: '#162d4a', color: '#06b6d4', borderColor: '#2d5a8a' }, '&:hover': { bgcolor: '#0f2238' } } }}>
                        <ToggleButton value="circle">
                            <Tooltip title="Circular"><BlurCircularRounded sx={{ fontSize: 16 }} /></Tooltip>
                        </ToggleButton>
                        <ToggleButton value="grid">
                            <Tooltip title="Grade"><GridViewRounded sx={{ fontSize: 16 }} /></Tooltip>
                        </ToggleButton>
                    </ToggleButtonGroup>

                    <Tooltip title="Ajustar zoom">
                        <IconButton size="small" onClick={() => rf?.fitView({ padding: 0.2, duration: 300 })} sx={{ color: '#4a6a8a', '&:hover': { color: '#e2e8f0', bgcolor: '#162d4a' } }}>
                            <FitScreenRounded sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                    <Button size="small" startIcon={<RefreshRounded sx={{ fontSize: 16 }} />} onClick={refreshAll} disabled={refreshing}
                        sx={{ ...gBtn, '&.Mui-disabled': { color: '#1e3a5f', borderColor: '#0f2238' } }}>
                        {refreshing ? 'Verificando...' : 'Ping All'}
                    </Button>
                </Box>
            </Box>

            {/* Map container — fills ALL remaining space */}
            <Box sx={{
                position: 'relative', flex: 1, minHeight: 0,
                bgcolor: '#0b1929', borderRadius: '12px', overflow: 'hidden',
                border: '1px solid #1e3a5f',
                boxShadow: 'inset 0 0 80px rgba(6,182,212,0.03)',
            }}>
                <Box sx={{ position: 'absolute', inset: 0 }}>
                    <ReactFlow
                        nodes={nodes} edges={edges}
                        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                        onNodeClick={onNodeClick} onInit={setRf}
                        onPaneClick={() => setSelected(null)}
                        nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.2 }}
                        zoomOnScroll zoomOnDoubleClick panOnScroll={false}
                        minZoom={0.1} maxZoom={3}
                        proOptions={{ hideAttribution: true }}
                        style={{ background: 'transparent' }}
                    >
                        <Background color="rgba(6,182,212,0.04)" gap={40} size={1} variant="dots" />
                        <Controls showZoom showFitView showInteractive={false} position="bottom-left"
                            style={{ background: '#0a1929', border: '1px solid #1e3a5f', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }} />
                        <MiniMap position="bottom-right" pannable zoomable
                            style={{ background: '#0a1929', border: '1px solid #1e3a5f', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}
                            nodeColor={(n) => (ST[n.data?.status] || ST.offline).main} maskColor="rgba(11,25,41,0.85)" />
                    </ReactFlow>
                </Box>

                {/* Legend overlay */}
                <Box sx={{
                    position: 'absolute', top: 12, left: 12, zIndex: 5,
                    display: 'flex', gap: 2, bgcolor: 'rgba(11,25,41,0.9)', backdropFilter: 'blur(12px)',
                    border: '1px solid #1e3a5f', borderRadius: '8px', px: 2, py: 0.8,
                }}>
                    {[
                        { c: '#22c55e', l: 'Online' },
                        { c: '#ef4444', l: 'Offline' },
                        { c: '#06b6d4', l: 'Mesh link', dash: true },
                    ].map(x => (
                        <Box key={x.l} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                            {x.dash
                                ? <Box sx={{ width: 16, height: 2, bgcolor: x.c, borderRadius: 1, opacity: 0.7 }} />
                                : <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: x.c, boxShadow: `0 0 6px ${x.c}55` }} />
                            }
                            <Typography sx={{ fontSize: 11, color: '#8badc9', fontWeight: 500 }}>{x.l}</Typography>
                        </Box>
                    ))}
                </Box>

                {/* Detail panel */}
                {selected && <Panel host={selected} onClose={() => setSelected(null)} onPing={pingHost} onNav={navigate} busy={pinging} />}

                {/* Empty state */}
                {hosts.length === 0 && (
                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
                        <Box sx={{ width: 64, height: 64, borderRadius: '16px', bgcolor: '#0f2238', border: '1px solid #1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                            <Info sx={{ fontSize: 28, color: '#2d5a8a' }} />
                        </Box>
                        <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#4a6a8a', mb: 0.5 }}>Nenhum node</Typography>
                        <Typography sx={{ fontSize: 13, color: '#1e3a5f' }}>Adicione hosts para visualizar a mesh</Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
