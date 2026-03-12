import { useState, useEffect } from 'react';
import {
    Box, Typography, TextField, InputAdornment, MenuItem, Select, FormControl,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import api from '../api';

const actionTypes = [
    'auth.login', 'host.create', 'host.update', 'host.delete', 'host.keygen',
    'ssh.exec', 'ssh.connect', 'ssh.deploy',
    'user.create', 'user.update', 'user.delete', 'settings.update',
];

const cardSx = {
    bgcolor: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    '&:hover': { borderColor: '#3f3f46' },
};

const fieldSx = {
    '& .MuiOutlinedInput-root': {
        bgcolor: '#18181b',
        borderRadius: '10px',
        '& fieldset': { borderColor: '#3f3f46' },
        '&:hover fieldset': { borderColor: '#52525b' },
        '&.Mui-focused fieldset': { borderColor: '#06b6d4', borderWidth: '1.5px' },
    },
    '& .MuiInputLabel-root': { color: '#71717a' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#06b6d4' },
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

const headerCellSx = {
    fontSize: 11,
    fontWeight: 600,
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    px: 2.5,
    py: 1.5,
    borderBottom: '1px solid #27272a',
    bgcolor: '#111113',
};

const bodyCellSx = {
    px: 2.5,
    py: 2,
    fontSize: 13,
    borderBottom: '1px solid rgba(39,39,42,0.5)',
};

const getActionColor = (action) => {
    if (!action) return { bg: 'rgba(113,113,122,0.1)', color: '#71717a', border: 'rgba(113,113,122,0.2)' };
    if (action.includes('create') || action.includes('keygen')) return { bg: 'rgba(34,197,94,0.1)', color: '#4ade80', border: 'rgba(34,197,94,0.2)' };
    if (action.includes('delete')) return { bg: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'rgba(239,68,68,0.2)' };
    if (action.includes('update') || action.includes('deploy')) return { bg: 'rgba(234,179,8,0.1)', color: '#facc15', border: 'rgba(234,179,8,0.2)' };
    if (action.includes('auth') || action.includes('login') || action.includes('connect')) return { bg: 'rgba(6,182,212,0.1)', color: '#22d3ee', border: 'rgba(6,182,212,0.2)' };
    return { bg: 'rgba(113,113,122,0.1)', color: '#71717a', border: 'rgba(113,113,122,0.2)' };
};

export default function AuditLog() {
    const [logs, setLogs] = useState([]);
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('all');

    useEffect(() => {
        api.get('/settings/audit?limit=100').then(res => setLogs(res.data));
    }, []);

    const filteredLogs = logs.filter(l => {
        if (actionFilter !== 'all' && l.action !== actionFilter) return false;
        if (!search) return true;
        const s = search.toLowerCase();
        return [l.username, l.action, l.target, l.details].some(f => (f || '').toLowerCase().includes(s));
    });

    return (
        <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.025em' }}>
                    Audit Log
                </Typography>
                <Typography sx={{ fontSize: 13, color: '#71717a', mr: 'auto' }}>
                    {filteredLogs.length} registros
                </Typography>

                <TextField
                    size="small"
                    placeholder="Buscar..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    sx={{
                        width: 260,
                        ...fieldSx,
                    }}
                    InputProps={{
                        sx: { color: '#fafafa' },
                        startAdornment: <InputAdornment position="start"><Search fontSize="small" sx={{ color: '#71717a' }} /></InputAdornment>,
                    }}
                />
                <FormControl size="small" sx={{ minWidth: 180 }}>
                    <Select
                        value={actionFilter}
                        onChange={e => setActionFilter(e.target.value)}
                        sx={{
                            borderRadius: '10px',
                            bgcolor: '#18181b',
                            color: '#fafafa',
                            fontSize: 13,
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#3f3f46' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#52525b' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#06b6d4', borderWidth: '1.5px' },
                            '& .MuiSvgIcon-root': { color: '#71717a' },
                        }}
                        MenuProps={{ PaperProps: { sx: menuPaperSx } }}
                    >
                        <MenuItem value="all">Todas as acoes</MenuItem>
                        {actionTypes.map(a => (
                            <MenuItem key={a} value={a}>{a}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {/* Audit table */}
            <TableContainer sx={{ ...cardSx, p: 0, overflow: 'hidden' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={headerCellSx}>Data</TableCell>
                            <TableCell sx={headerCellSx}>Usuario</TableCell>
                            <TableCell sx={headerCellSx}>Acao</TableCell>
                            <TableCell sx={headerCellSx}>Alvo</TableCell>
                            <TableCell sx={headerCellSx}>Detalhes</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredLogs.map((l, i) => {
                            const ac = getActionColor(l.action);
                            return (
                                <TableRow key={i} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                                    <TableCell sx={{ ...bodyCellSx, color: '#71717a', fontFamily: '"Fira Code", monospace', whiteSpace: 'nowrap' }}>
                                        {l.created_at}
                                    </TableCell>
                                    <TableCell sx={{ ...bodyCellSx, color: '#a1a1aa' }}>
                                        {l.username || '\u2014'}
                                    </TableCell>
                                    <TableCell sx={bodyCellSx}>
                                        <Box component="span" sx={{
                                            fontSize: 11,
                                            fontWeight: 500,
                                            fontFamily: '"Fira Code", monospace',
                                            px: '10px',
                                            py: '3px',
                                            borderRadius: '9999px',
                                            bgcolor: ac.bg,
                                            color: ac.color,
                                            border: `1px solid ${ac.border}`,
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {l.action}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ ...bodyCellSx, color: '#fafafa' }}>
                                        {l.target || '\u2014'}
                                    </TableCell>
                                    <TableCell sx={{
                                        ...bodyCellSx,
                                        color: '#71717a',
                                        maxWidth: 350,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {l.details || '\u2014'}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
                {filteredLogs.length === 0 && (
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                        <Typography sx={{ color: '#71717a', fontSize: 13 }}>
                            Nenhum registro encontrado
                        </Typography>
                    </Box>
                )}
            </TableContainer>
        </Box>
    );
}
