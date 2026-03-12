import { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, TextField, Button, Tooltip,
    Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
    InputAdornment, IconButton,
} from '@mui/material';
import {
    AddRounded, SearchRounded, ContentCopyRounded,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../api';

const defaultForm = {
    hostname: '', ip_mesh: '', ip_public: '', port_wg: 51820, port_ssh: 7412,
    provider: '', region: '', notes: '', ssh_user: 'root', ssh_auth: 'password',
    ssh_password: '', ssh_key_path: '',
};

const cardSx = {
    bgcolor: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)',
    p: 3,
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

const deleteBtnSx = {
    bgcolor: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.2)',
    color: '#f87171',
    textTransform: 'none',
    fontSize: 12,
    fontWeight: 500,
    borderRadius: '8px',
    px: 1.5,
    py: 0.5,
    minWidth: 0,
    lineHeight: 1.4,
    '&:hover': { bgcolor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.35)' },
};

const fadeIn = {
    animation: 'fadeIn 0.4s ease',
    '@keyframes fadeIn': {
        from: { opacity: 0, transform: 'translateY(8px)' },
        to: { opacity: 1, transform: 'translateY(0)' },
    },
};

const dialogPaperSx = {
    bgcolor: '#18181b',
    border: '1px solid #3f3f46',
    borderRadius: '16px',
    backgroundImage: 'none',
    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
};

export default function Hosts() {
    const [hosts, setHosts] = useState([]);
    const [search, setSearch] = useState('');
    const [dialog, setDialog] = useState(false);
    const [confDialog, setConfDialog] = useState(false);
    const [confContent, setConfContent] = useState('');
    const [confHost, setConfHost] = useState('');
    const [editData, setEditData] = useState(null);
    const [form, setForm] = useState({ ...defaultForm });
    const { enqueueSnackbar } = useSnackbar();

    const load = useCallback(async () => {
        try {
            const res = await api.get('/hosts');
            setHosts(res.data);
        } catch {
            // silent
        }
    }, []);

    useEffect(() => {
        load();
        const interval = setInterval(load, 15000);
        return () => clearInterval(interval);
    }, [load]);

    const openNew = () => {
        setEditData(null);
        setForm({ ...defaultForm });
        setDialog(true);
    };

    const openEdit = (h) => {
        setEditData(h);
        setForm({
            hostname: h.hostname, ip_mesh: h.ip_mesh, ip_public: h.ip_public || '',
            port_wg: h.port_wg, port_ssh: h.port_ssh, provider: h.provider || '',
            region: h.region || '', notes: h.notes || '', ssh_user: h.ssh_user || 'root',
            ssh_auth: h.ssh_auth || 'password', ssh_password: h.ssh_password || '',
            ssh_key_path: h.ssh_key_path || '',
        });
        setDialog(true);
    };

    const save = async () => {
        try {
            if (editData) {
                await api.put(`/hosts/${editData.id}`, form);
                enqueueSnackbar(`${form.hostname} atualizado`, { variant: 'success' });
            } else {
                await api.post('/hosts', form);
                enqueueSnackbar(`${form.hostname} criado`, { variant: 'success' });
            }
            setDialog(false);
            load();
        } catch (err) {
            enqueueSnackbar(err.response?.data?.error || 'Erro', { variant: 'error' });
        }
    };

    const remove = async (h) => {
        if (!confirm(`Remover ${h.hostname}?`)) return;
        try {
            await api.delete(`/hosts/${h.id}`);
            enqueueSnackbar(`${h.hostname} removido`, { variant: 'success' });
            load();
        } catch (err) {
            enqueueSnackbar(err.response?.data?.error || 'Erro ao remover', { variant: 'error' });
        }
    };

    const keygen = async (h) => {
        if (!confirm(`Gerar novas chaves WireGuard para ${h.hostname}?`)) return;
        try {
            const res = await api.post(`/hosts/${h.id}/keygen`);
            enqueueSnackbar(`Chaves geradas! PubKey: ${res.data.pubkey.substring(0, 20)}...`, { variant: 'success' });
            load();
        } catch (err) {
            enqueueSnackbar(err.response?.data?.error || 'Erro', { variant: 'error' });
        }
    };

    const viewConf = async (h) => {
        try {
            const res = await api.get(`/hosts/${h.id}/wgconf`);
            setConfContent(res.data);
            setConfHost(h.hostname);
            setConfDialog(true);
        } catch (err) {
            enqueueSnackbar(err.response?.data?.error || 'Gere as chaves primeiro', { variant: 'warning' });
        }
    };

    const healthCheck = async (id) => {
        try {
            const res = await api.get(`/hosts/${id}/health`);
            enqueueSnackbar(
                `${res.data.status === 'online' ? 'Online' : 'Offline'} — ${res.data.latency_ms || '?'}ms`,
                { variant: res.data.status === 'online' ? 'success' : 'error' }
            );
            load();
        } catch {
            enqueueSnackbar('Erro no health check', { variant: 'error' });
        }
    };

    const filteredHosts = hosts.filter(h => {
        if (!search) return true;
        const s = search.toLowerCase();
        return [h.hostname, h.ip_mesh, h.ip_public, h.provider, h.status]
            .some(f => (f || '').toLowerCase().includes(s));
    });

    const f = (field) => ({
        value: form[field],
        onChange: (e) => setForm({ ...form, [field]: e.target.value }),
    });

    // Syntax highlight for wg config
    const renderConfContent = (text) => {
        if (!text) return null;
        return text.split('\n').map((line, i) => {
            const isHeader = /^\[(Interface|Peer)\]/.test(line.trim());
            return (
                <Box key={i} component="span" sx={{
                    display: 'block',
                    color: isHeader ? '#06b6d4' : '#a1a1aa',
                    fontWeight: isHeader ? 700 : 400,
                }}>
                    {line || '\u00A0'}
                </Box>
            );
        });
    };

    return (
        <Box sx={{ ...fadeIn, flex: 1, overflow: 'auto', minHeight: 0 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.025em' }}>
                    Hosts
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <TextField
                        size="small"
                        placeholder="Buscar..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        sx={{
                            width: 240,
                            '& .MuiOutlinedInput-root': {
                                bgcolor: '#18181b',
                                borderRadius: '10px',
                                '& fieldset': { borderColor: '#3f3f46' },
                                '&:hover fieldset': { borderColor: '#52525b' },
                                '&.Mui-focused fieldset': { borderColor: '#06b6d4', borderWidth: '1.5px' },
                            },
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchRounded sx={{ fontSize: 18, color: '#71717a' }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button
                        startIcon={<AddRounded sx={{ fontSize: 18 }} />}
                        variant="contained"
                        size="small"
                        onClick={openNew}
                        sx={{
                            bgcolor: '#0e7490',
                            color: '#fff',
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: '10px',
                            px: 2.5,
                            py: 0.8,
                            fontSize: 13,
                            '&:hover': { bgcolor: '#0891b2', boxShadow: '0 0 20px rgba(6,182,212,0.15)' },
                        }}
                    >
                        Novo Host
                    </Button>
                </Box>
            </Box>

            {/* Host Cards Grid */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr', lg: '1fr 1fr 1fr 1fr' },
                gap: '16px',
            }}>
                {filteredHosts.map(h => {
                    const isOnline = h.status === 'online';
                    return (
                        <Box key={h.id} sx={{
                            ...cardSx,
                            p: 2.5,
                            display: 'flex',
                            flexDirection: 'column',
                            ...(!isOnline ? { borderColor: '#1f1f23', opacity: 0.5 } : {}),
                        }}>
                            {/* Line 1: Status dot + hostname */}
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

                            {/* Line 2: IP mesh + IP public */}
                            <Typography sx={{ fontSize: 13, fontFamily: 'monospace', color: '#a1a1aa', mb: 0.5 }}>
                                {h.ip_mesh}{h.ip_public ? ` \u00B7 ${h.ip_public}` : ''}
                            </Typography>

                            {/* Line 3: Status text + provider/region */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography sx={{ fontSize: 12, fontWeight: 500, color: isOnline ? '#06b6d4' : '#ef4444' }}>
                                    {isOnline ? 'online' : 'offline'}
                                </Typography>
                                {(h.provider || h.region) && (
                                    <Typography sx={{ fontSize: 12, color: '#71717a' }}>
                                        {[h.provider, h.region].filter(Boolean).join(' \u00B7 ')}
                                    </Typography>
                                )}
                            </Box>

                            {/* Line 4: Action buttons */}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 'auto', pt: 0.5 }}>
                                <Button size="small" onClick={() => openEdit(h)} sx={ghostBtnSx}>
                                    Editar
                                </Button>
                                <Button size="small" onClick={() => healthCheck(h.id)} sx={ghostBtnSx}>
                                    Ping
                                </Button>
                                <Button size="small" onClick={() => keygen(h)} sx={ghostBtnSx}>
                                    Chaves
                                </Button>
                                <Button size="small" onClick={() => viewConf(h)} sx={ghostBtnSx}>
                                    wg.conf
                                </Button>
                                <Button size="small" onClick={() => remove(h)} sx={deleteBtnSx}>
                                    Remover
                                </Button>
                            </Box>
                        </Box>
                    );
                })}
                {filteredHosts.length === 0 && (
                    <Box sx={{ ...cardSx, gridColumn: '1 / -1', textAlign: 'center', py: 5 }}>
                        <Typography sx={{ fontSize: 13, color: '#71717a' }}>
                            {search ? 'Nenhum host encontrado' : 'Nenhum host cadastrado'}
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Host Form Dialog */}
            <Dialog
                open={dialog}
                onClose={() => setDialog(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: dialogPaperSx }}
            >
                <DialogTitle sx={{
                    color: '#fafafa', fontWeight: 700, fontSize: 18,
                    borderBottom: '1px solid #27272a', letterSpacing: '-0.025em',
                }}>
                    {editData ? 'Editar Host' : 'Novo Host'}
                </DialogTitle>
                <DialogContent sx={{ pt: '20px !important' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField label="Hostname" placeholder="gw-wg-sp-01" {...f('hostname')} sx={fieldSx} />
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField label="IP Mesh" placeholder="10.200.0.1" {...f('ip_mesh')} sx={fieldSx} />
                            <TextField label="IP Publico" placeholder="207.180.x.x" {...f('ip_public')} sx={fieldSx} />
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField label="Porta WireGuard" type="number" value={form.port_wg}
                                onChange={e => setForm({ ...form, port_wg: parseInt(e.target.value) || 0 })} sx={fieldSx} />
                            <TextField label="Porta SSH" type="number" value={form.port_ssh}
                                onChange={e => setForm({ ...form, port_ssh: parseInt(e.target.value) || 0 })} sx={fieldSx} />
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField label="Provider" placeholder="contabo, hetzner..." {...f('provider')} sx={fieldSx} />
                            <TextField label="Regiao" placeholder="sp, htz, usa..." {...f('region')} sx={fieldSx} />
                        </Box>

                        <Typography sx={{
                            fontSize: 11, fontWeight: 600, color: '#71717a', mt: 1,
                            letterSpacing: '0.08em', textTransform: 'uppercase',
                        }}>
                            Acesso SSH
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField label="Usuario SSH" {...f('ssh_user')} sx={fieldSx} />
                            <TextField label="Autenticacao" select value={form.ssh_auth}
                                onChange={e => setForm({ ...form, ssh_auth: e.target.value })} sx={fieldSx}>
                                <MenuItem value="password">Senha</MenuItem>
                                <MenuItem value="key">Chave SSH</MenuItem>
                            </TextField>
                        </Box>
                        {form.ssh_auth === 'password' && (
                            <TextField label="Senha SSH" type="password" {...f('ssh_password')} sx={fieldSx} />
                        )}
                        {form.ssh_auth === 'key' && (
                            <TextField label="Caminho da Chave" placeholder="/keys/id_rsa" {...f('ssh_key_path')} sx={fieldSx} />
                        )}
                        <TextField label="Notas" multiline rows={2} {...f('notes')} sx={fieldSx} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, pt: 2, borderTop: '1px solid #27272a' }}>
                    <Button onClick={() => setDialog(false)} sx={ghostBtnSx}>
                        Cancelar
                    </Button>
                    <Button variant="contained" onClick={save}
                        sx={{
                            bgcolor: '#0e7490',
                            color: '#fff',
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: '10px',
                            px: 2.5,
                            '&:hover': { bgcolor: '#0891b2', boxShadow: '0 0 20px rgba(6,182,212,0.15)' },
                        }}>
                        Salvar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* WG Config Dialog */}
            <Dialog
                open={confDialog}
                onClose={() => setConfDialog(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: dialogPaperSx }}
            >
                <DialogTitle sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    color: '#fafafa', fontWeight: 700, fontSize: 18,
                    borderBottom: '1px solid #27272a', letterSpacing: '-0.025em',
                }}>
                    wg0.conf — {confHost}
                    <Tooltip title="Copiar">
                        <IconButton size="small" onClick={() => {
                            navigator.clipboard.writeText(confContent);
                            enqueueSnackbar('Copiado!', { variant: 'success' });
                        }} sx={{ color: '#71717a', '&:hover': { color: '#06b6d4', bgcolor: 'rgba(6,182,212,0.1)' } }}>
                            <ContentCopyRounded sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Tooltip>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{
                        bgcolor: '#09090b',
                        border: '1px solid #27272a',
                        borderRadius: '10px',
                        p: '20px',
                        fontFamily: 'monospace',
                        fontSize: 13,
                        lineHeight: 1.8,
                        overflow: 'auto',
                        maxHeight: 400,
                        mt: 2,
                    }}>
                        {renderConfContent(confContent)}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setConfDialog(false)} sx={ghostBtnSx}>
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
