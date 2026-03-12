import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Skeleton } from '@mui/material';
import { NetworkPing } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../api';
import StatusChip from '../components/StatusChip';

const cardSx = {
    bgcolor: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)',
    p: 3,
    transition: 'border-color 0.2s, box-shadow 0.2s',
    '&:hover': { borderColor: '#3f3f46' },
};

const fadeIn = {
    animation: 'fadeIn 0.4s ease',
    '@keyframes fadeIn': {
        from: { opacity: 0, transform: 'translateY(8px)' },
        to: { opacity: 1, transform: 'translateY(0)' },
    },
};

const ghostBtnSx = {
    bgcolor: 'transparent',
    border: '1px solid #3f3f46',
    color: '#a1a1aa',
    textTransform: 'none',
    fontSize: 12,
    fontWeight: 500,
    borderRadius: '8px',
    px: 1.5,
    py: 0.5,
    minWidth: 0,
    lineHeight: 1.4,
    '&:hover': { bgcolor: '#27272a', borderColor: '#52525b', color: '#fafafa' },
};

const actionBadgeColors = {
    create: { bgcolor: 'rgba(34,197,94,0.12)', color: '#22c55e', border: 'rgba(34,197,94,0.25)' },
    update: { bgcolor: 'rgba(6,182,212,0.12)', color: '#06b6d4', border: 'rgba(6,182,212,0.25)' },
    delete: { bgcolor: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'rgba(239,68,68,0.25)' },
    keygen: { bgcolor: 'rgba(234,179,8,0.12)', color: '#eab308', border: 'rgba(234,179,8,0.25)' },
    health_check: { bgcolor: 'rgba(6,182,212,0.12)', color: '#06b6d4', border: 'rgba(6,182,212,0.25)' },
};

const getActionBadge = (action) => {
    const key = Object.keys(actionBadgeColors).find(k => (action || '').toLowerCase().includes(k));
    return actionBadgeColors[key] || { bgcolor: 'rgba(161,161,170,0.12)', color: '#a1a1aa', border: 'rgba(161,161,170,0.25)' };
};

export default function Dashboard() {
    const [hosts, setHosts] = useState([]);
    const [logs, setLogs] = useState([]);
    const [latencies, setLatencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    const loadData = useCallback(async () => {
        try {
            const [hostsRes, logsRes] = await Promise.all([
                api.get('/hosts'),
                api.get('/settings/audit?limit=10').catch(() => ({ data: [] })),
            ]);
            setHosts(hostsRes.data);
            setLogs(Array.isArray(logsRes.data) ? logsRes.data.slice(0, 10) : []);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch latencies from health checks on online hosts
    const fetchLatencies = useCallback(async (hostList) => {
        const results = [];
        for (const h of hostList.filter(x => x.status === 'online')) {
            try {
                const res = await api.get(`/hosts/${h.id}/health`);
                if (res.data.latency_ms != null) results.push(res.data.latency_ms);
            } catch { /* skip */ }
        }
        setLatencies(results);
    }, []);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 15000);
        return () => clearInterval(interval);
    }, [loadData]);

    // Fetch latencies when hosts change
    useEffect(() => {
        if (hosts.length > 0) fetchLatencies(hosts);
    }, [hosts, fetchLatencies]);

    const online = hosts.filter(h => h.status === 'online').length;
    const total = hosts.length;
    const offline = total - online;

    const healthCheck = async (id) => {
        try {
            const res = await api.get(`/hosts/${id}/health`);
            enqueueSnackbar(
                `${res.data.status === 'online' ? 'Online' : 'Offline'} — ${res.data.latency_ms || '?'}ms`,
                { variant: res.data.status === 'online' ? 'success' : 'error' }
            );
            loadData();
        } catch {
            enqueueSnackbar('Erro no health check', { variant: 'error' });
        }
    };

    const pingAll = async () => {
        setChecking(true);
        enqueueSnackbar('Verificando todos os nodes...', { variant: 'info' });
        for (const h of hosts) {
            await api.get(`/hosts/${h.id}/health`).catch(() => {});
        }
        await loadData();
        setChecking(false);
        enqueueSnackbar('Status atualizado', { variant: 'success' });
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 1 }}>
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: '12px', bgcolor: '#18181b' }} />
                ))}
            </Box>
        );
    }

    // Last seen: most recent last_seen from hosts
    const lastSeenTs = hosts
        .map(h => h.last_seen)
        .filter(Boolean)
        .sort()
        .pop();
    const lastCheck = lastSeenTs
        ? new Date(lastSeenTs).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
        : null;

    // Average latency from health checks (stored in state)
    const avgLatency = latencies.length > 0
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : null;

    const statCards = [
        { label: 'Nodes Online', value: `${online}/${total}`, color: '#06b6d4' },
        { label: 'Offline', value: String(offline), color: offline > 0 ? '#ef4444' : '#a1a1aa' },
        { label: 'Latência Média', value: avgLatency != null ? `${avgLatency}ms` : '\u2014', color: avgLatency != null ? (avgLatency < 50 ? '#22c55e' : avgLatency < 150 ? '#eab308' : '#ef4444') : '#a1a1aa' },
        { label: 'Último Check', value: lastCheck || '\u2014', color: lastCheck ? '#a1a1aa' : '#52525b' },
    ];

    return (
        <Box sx={{ ...fadeIn, flex: 1, overflow: "auto", minHeight: 0 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.025em' }}>
                    Dashboard
                </Typography>
                <Button
                    size="small"
                    onClick={pingAll}
                    disabled={checking}
                    sx={{
                        ...ghostBtnSx,
                        '&.Mui-disabled': { color: '#52525b', bgcolor: 'transparent', borderColor: '#27272a' },
                    }}
                >
                    {checking ? 'Verificando...' : 'Verificar Todos'}
                </Button>
            </Box>

            {/* Stats Row */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
                gap: 2,
                mb: 3,
            }}>
                {statCards.map((stat) => (
                    <Box key={stat.label} sx={{ ...cardSx, p: 2.5, '&:hover': {} }}>
                        <Typography sx={{ fontSize: 28, fontWeight: 700, color: stat.color, lineHeight: 1.2, mb: 0.5 }}>
                            {stat.value}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: '#71717a', fontWeight: 500 }}>
                            {stat.label}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* Servidores Section */}
            <Box sx={{ mb: 3 }}>
                <Typography sx={{
                    fontSize: 11, fontWeight: 600, color: '#71717a', textTransform: 'uppercase',
                    letterSpacing: '0.08em', mb: 2,
                }}>
                    Servidores
                </Typography>

                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr', lg: '1fr 1fr 1fr 1fr' },
                    gap: '16px',
                }}>
                    {hosts.map(h => {
                        const isOnline = h.status === 'online';
                        return (
                            <Box key={h.id} sx={{
                                ...cardSx,
                                p: 2,
                                ...(!isOnline ? { borderColor: '#1f1f23', opacity: 0.55 } : {}),
                            }}>
                                {/* Top row: status dot + hostname */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Box sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        bgcolor: isOnline ? '#06b6d4' : '#ef4444',
                                        flexShrink: 0,
                                        ...(isOnline ? {
                                            boxShadow: '0 0 6px rgba(6,182,212,0.4)',
                                            animation: 'pulse 2s ease-in-out infinite',
                                            '@keyframes pulse': {
                                                '0%, 100%': { opacity: 1 },
                                                '50%': { opacity: 0.5 },
                                            },
                                        } : {}),
                                    }} />
                                    <Typography sx={{
                                        fontSize: 14, fontWeight: 600, color: '#fafafa',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                        {h.hostname}
                                    </Typography>
                                </Box>

                                {/* IP mono */}
                                <Typography sx={{ fontSize: 13, fontFamily: 'monospace', color: '#a1a1aa', mb: 0.8 }}>
                                    {h.ip_mesh}
                                </Typography>

                                {/* Bottom row: status + provider + ping */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Typography sx={{ fontSize: 12, fontWeight: 500, color: isOnline ? '#06b6d4' : '#ef4444' }}>
                                        {isOnline ? 'online' : 'offline'}
                                    </Typography>
                                    {h.provider && (
                                        <Typography sx={{ fontSize: 12, color: '#71717a' }}>
                                            {h.provider}
                                        </Typography>
                                    )}
                                    <Box sx={{ ml: 'auto' }}>
                                        <Button size="small" onClick={() => healthCheck(h.id)} sx={{ ...ghostBtnSx, fontSize: 11, px: 1, py: 0.3 }}>
                                            Ping
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                        );
                    })}
                    {hosts.length === 0 && (
                        <Box sx={{ ...cardSx, gridColumn: '1 / -1', textAlign: 'center', py: 5 }}>
                            <Typography sx={{ fontSize: 13, color: '#71717a' }}>
                                Nenhum node cadastrado
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Atividade Recente Section */}
            <Box>
                <Typography sx={{
                    fontSize: 11, fontWeight: 600, color: '#71717a', textTransform: 'uppercase',
                    letterSpacing: '0.08em', mb: 2,
                }}>
                    Atividade Recente
                </Typography>

                <Box sx={cardSx}>
                    {logs.length > 0 ? logs.map((log, i) => {
                        const badge = getActionBadge(log.action);
                        return (
                            <Box key={log.id || i}>
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 2,
                                    py: 1.5,
                                    px: 0.5,
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                                        <Box sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            px: 1,
                                            py: 0.25,
                                            borderRadius: '6px',
                                            bgcolor: badge.bgcolor,
                                            border: `1px solid ${badge.border}`,
                                            flexShrink: 0,
                                        }}>
                                            <Typography sx={{ fontSize: 11, fontWeight: 600, color: badge.color, lineHeight: 1.4 }}>
                                                {log.action}
                                            </Typography>
                                        </Box>
                                        <Typography sx={{
                                            fontSize: 13, color: '#a1a1aa',
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}>
                                            {log.target || ''}
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ fontSize: 12, color: '#71717a', flexShrink: 0, fontFamily: 'monospace' }}>
                                        {log.created_at
                                            ? new Date(log.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                                            : '\u2014'}
                                    </Typography>
                                </Box>
                                {i < logs.length - 1 && (
                                    <Box sx={{ borderBottom: '1px solid #27272a' }} />
                                )}
                            </Box>
                        );
                    }) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography sx={{ fontSize: 13, color: '#71717a' }}>
                                Sem atividade recente
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
}
