import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, Select, MenuItem, FormControl } from '@mui/material';
import { Terminal as XTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useSnackbar } from 'notistack';
import api from '../api';

const quickCommands = [
    { label: 'hostname', cmd: 'hostname\n' },
    { label: 'uptime', cmd: 'uptime\n' },
    { label: 'free -h', cmd: 'free -h\n' },
    { label: 'df -h', cmd: 'df -h\n' },
    { label: 'wg show', cmd: 'wg show\n' },
    { label: 'ip route', cmd: 'ip route\n' },
    { label: 'ps aux', cmd: 'ps aux\n' },
];

const cardSx = {
    bgcolor: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)',
    p: 3,
    transition: 'border-color 0.2s, box-shadow 0.2s',
    '&:hover': { borderColor: '#3f3f46' },
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

const menuPaperSx = {
    bgcolor: '#18181b',
    border: '1px solid #3f3f46',
    borderRadius: '10px',
    mt: 0.5,
    '& .MuiMenuItem-root': {
        fontSize: 13, color: '#fafafa',
        '&:hover': { bgcolor: 'rgba(6,182,212,0.08)' },
        '&.Mui-selected': { bgcolor: 'rgba(6,182,212,0.12)' },
    },
};

export default function TerminalPage() {
    const [hosts, setHosts] = useState([]);
    const [selectedHost, setSelectedHost] = useState('');
    const [connected, setConnected] = useState(false);
    const termRef = useRef(null);
    const termInstance = useRef(null);
    const fitAddon = useRef(null);
    const wsRef = useRef(null);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        api.get('/hosts').then(res => {
            setHosts(res.data);
            if (res.data.length > 0) setSelectedHost(String(res.data[0].id));
        });
        return () => { if (wsRef.current) wsRef.current.close(); };
    }, []);

    useEffect(() => {
        if (!termRef.current || termInstance.current) return;

        const term = new XTerminal({
            cursorBlink: true,
            fontSize: 13,
            fontFamily: '"Fira Code", "JetBrains Mono", monospace',
            theme: {
                background: '#09090b',
                foreground: '#a1a1aa',
                cursor: '#06b6d4',
                cursorAccent: '#09090b',
                selectionBackground: 'rgba(6,182,212,0.15)',
                black: '#09090b', red: '#f87171', green: '#4ade80', yellow: '#facc15',
                blue: '#60a5fa', magenta: '#c084fc', cyan: '#22d3ee', white: '#a1a1aa',
                brightBlack: '#71717a', brightRed: '#f87171', brightGreen: '#4ade80',
                brightYellow: '#facc15', brightBlue: '#60a5fa', brightMagenta: '#c084fc',
                brightCyan: '#22d3ee', brightWhite: '#fafafa',
            },
            scrollback: 5000,
            allowProposedApi: true,
        });

        const fit = new FitAddon();
        term.loadAddon(fit);
        term.open(termRef.current);
        fit.fit();

        term.writeln('\x1b[38;2;6;182;212mVecGate Terminal\x1b[0m');
        term.writeln('\x1b[38;2;113;113;122mSelecione um host e conecte.\x1b[0m');
        term.writeln('');

        term.onData((data) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'input', data }));
            }
        });

        termInstance.current = term;
        fitAddon.current = fit;

        const handleResize = () => fit.fit();
        window.addEventListener('resize', handleResize);

        term.onResize(({ cols, rows }) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'resize', cols, rows }));
            }
        });

        return () => window.removeEventListener('resize', handleResize);
    }, [termRef.current]);

    const connect = () => {
        if (!selectedHost) return;
        const host = hosts.find(h => String(h.id) === selectedHost);
        if (!host) return;

        if (wsRef.current) wsRef.current.close();

        const term = termInstance.current;
        term.clear();
        term.writeln(`\x1b[38;2;6;182;212mConectando a ${host.hostname}...\x1b[0m`);

        const token = localStorage.getItem('vecgate_token');
        const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${proto}//${location.host}/ws/ssh?token=${token}&host_id=${selectedHost}`);

        ws.onopen = () => setConnected(true);
        ws.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.type === 'data') term.write(msg.data);
            else if (msg.type === 'status') term.write(`\x1b[38;2;6;182;212m${msg.data}\x1b[0m`);
            else if (msg.type === 'error') term.write(`\x1b[38;2;248;113;113m${msg.data}\x1b[0m`);
        };
        ws.onclose = () => {
            setConnected(false);
            term.writeln('\r\n\x1b[38;2;113;113;122m[Conexao encerrada]\x1b[0m');
        };
        ws.onerror = () => {
            setConnected(false);
            term.writeln('\r\n\x1b[38;2;248;113;113m[Erro na conexao]\x1b[0m');
        };
        wsRef.current = ws;
    };

    const disconnect = () => {
        if (wsRef.current) wsRef.current.close();
        wsRef.current = null;
        setConnected(false);
    };

    const quickCmd = (cmd) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'input', data: cmd }));
        } else {
            enqueueSnackbar('Conecte a um host primeiro', { variant: 'warning' });
        }
    };

    const currentHost = hosts.find(h => String(h.id) === selectedHost);

    return (
        <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.025em' }}>
                    Terminal
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                        width: 8, height: 8, borderRadius: '50%',
                        bgcolor: connected ? '#22c55e' : '#71717a',
                        boxShadow: connected ? '0 0 8px rgba(34,197,94,0.4)' : 'none',
                        animation: connected ? 'pulse 2s infinite' : 'none',
                        '@keyframes pulse': {
                            '0%, 100%': { opacity: 1 },
                            '50%': { opacity: 0.5 },
                        },
                    }} />
                    <Typography sx={{
                        fontSize: 13, fontFamily: '"Fira Code", monospace',
                        color: connected ? '#a1a1aa' : '#71717a',
                    }}>
                        {connected ? `${currentHost?.ssh_user || 'root'}@${currentHost?.hostname}` : 'desconectado'}
                    </Typography>
                </Box>
            </Box>

            {/* Control bar */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <FormControl size="small" sx={{ minWidth: 280 }}>
                    <Select
                        value={selectedHost}
                        onChange={(e) => setSelectedHost(e.target.value)}
                        disabled={connected}
                        displayEmpty
                        sx={{
                            fontSize: 13,
                            color: '#fafafa',
                            bgcolor: '#18181b',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#3f3f46' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#52525b' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#06b6d4', borderWidth: '1.5px' },
                            borderRadius: '10px',
                            '& .MuiSvgIcon-root': { color: '#71717a' },
                        }}
                        MenuProps={{ PaperProps: { sx: menuPaperSx } }}
                    >
                        {hosts.map(h => (
                            <MenuItem key={h.id} value={String(h.id)}>
                                {h.hostname} ({h.ip_mesh})
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {!connected ? (
                    <Button
                        size="small"
                        onClick={connect}
                        sx={{
                            bgcolor: '#06b6d4',
                            color: '#09090b',
                            '&:hover': { bgcolor: '#22d3ee' },
                            textTransform: 'none',
                            borderRadius: '10px',
                            fontWeight: 600,
                            fontSize: 13,
                            px: 3,
                            py: 0.75,
                            boxShadow: '0 1px 2px rgba(6,182,212,0.3)',
                        }}
                    >
                        Conectar
                    </Button>
                ) : (
                    <Button
                        size="small"
                        onClick={disconnect}
                        sx={{
                            bgcolor: 'rgba(239,68,68,0.1)',
                            color: '#f87171',
                            border: '1px solid rgba(239,68,68,0.2)',
                            '&:hover': { bgcolor: 'rgba(239,68,68,0.2)', borderColor: 'rgba(239,68,68,0.3)' },
                            textTransform: 'none',
                            borderRadius: '10px',
                            fontWeight: 600,
                            fontSize: 13,
                            px: 3,
                            py: 0.75,
                        }}
                    >
                        Desconectar
                    </Button>
                )}
            </Box>

            {/* Terminal container */}
            <Box sx={{ ...cardSx, p: 0, overflow: 'hidden', borderRadius: '12px' }}>
                <Box ref={termRef} sx={{ height: 520 }} />
            </Box>

            {/* Quick commands */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {quickCommands.map(qc => (
                    <Box
                        key={qc.label}
                        component="button"
                        onClick={() => quickCmd(qc.cmd)}
                        sx={{
                            ...ghostBtnSx,
                            fontFamily: '"Fira Code", monospace',
                            cursor: 'pointer',
                        }}
                    >
                        {qc.label}
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
