import { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Skeleton } from '@mui/material';
import { useSnackbar } from 'notistack';
import api from '../api';

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
    '& .MuiFormHelperText-root': { color: '#71717a' },
};

export default function Settings() {
    const [config, setConfig] = useState(null);
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    const loadData = async () => {
        try {
            const [configRes, settingsRes] = await Promise.all([
                api.get('/config'),
                api.get('/settings')
            ]);
            setConfig(configRes.data);
            setSettings(settingsRes.data);
        } catch (err) {
            enqueueSnackbar('Erro ao carregar configuracoes', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/settings', {
                keepalive_interval: settings.keepalive_interval || '25',
                default_wg_port: settings.default_wg_port || '51820',
                default_ssh_port: settings.default_ssh_port || '22',
            });
            enqueueSnackbar('Configuracoes salvas com sucesso', { variant: 'success' });
        } catch (err) {
            enqueueSnackbar(err.response?.data?.error || 'Erro ao salvar', { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[1, 2].map(i => (
                <Skeleton key={i} variant="rounded" height={200} sx={{ borderRadius: '12px', bgcolor: '#18181b' }} />
            ))}
        </Box>
    );

    return (
        <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.025em' }}>
                    Configuracoes
                </Typography>
                <Button
                    size="small"
                    onClick={handleSave}
                    disabled={saving}
                    sx={{
                        bgcolor: '#06b6d4',
                        color: '#09090b',
                        '&:hover': { bgcolor: '#22d3ee' },
                        '&.Mui-disabled': { bgcolor: 'rgba(6,182,212,0.15)', color: 'rgba(250,250,250,0.3)' },
                        textTransform: 'none',
                        borderRadius: '10px',
                        fontWeight: 600,
                        fontSize: 13,
                        px: 3,
                        py: 0.75,
                        boxShadow: '0 1px 2px rgba(6,182,212,0.3)',
                    }}
                >
                    {saving ? 'Salvando...' : 'Salvar'}
                </Button>
            </Box>

            {/* Two-column grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: '24px' }}>
                {/* Instancia */}
                <Box sx={cardSx}>
                    <Typography sx={{
                        fontSize: 11, fontWeight: 600, color: '#71717a',
                        textTransform: 'uppercase', letterSpacing: '0.08em', mb: 2.5,
                    }}>
                        Instancia
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <Box>
                            <Typography sx={{ fontSize: 12, color: '#71717a', mb: 0.5 }}>Nome da empresa</Typography>
                            <Typography sx={{ fontSize: 14, color: '#fafafa' }}>{config?.name || '\u2014'}</Typography>
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: 12, color: '#71717a', mb: 0.5 }}>Cor</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{
                                    width: 24, height: 24, borderRadius: '50%',
                                    bgcolor: config?.primary_color || '#06b6d4',
                                    border: '1px solid #3f3f46',
                                }} />
                                <Typography sx={{ fontSize: 13, color: '#a1a1aa', fontFamily: '"Fira Code", monospace' }}>
                                    {config?.primary_color || '\u2014'}
                                </Typography>
                            </Box>
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: 12, color: '#71717a', mb: 0.5 }}>Logo URL</Typography>
                            <Typography sx={{ fontSize: 13, color: '#a1a1aa', fontFamily: '"Fira Code", monospace', wordBreak: 'break-all' }}>
                                {config?.logo_url || '\u2014'}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Rede */}
                <Box sx={cardSx}>
                    <Typography sx={{
                        fontSize: 11, fontWeight: 600, color: '#71717a',
                        textTransform: 'uppercase', letterSpacing: '0.08em', mb: 2.5,
                    }}>
                        Rede
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <TextField
                            label="Keepalive Interval (segundos)"
                            type="number"
                            size="small"
                            value={settings.keepalive_interval || ''}
                            onChange={e => handleChange('keepalive_interval', e.target.value)}
                            inputProps={{ min: 0 }}
                            sx={fieldSx}
                            InputProps={{ sx: { color: '#fafafa' } }}
                        />
                        <TextField
                            label="Porta WireGuard padrao"
                            type="number"
                            size="small"
                            value={settings.default_wg_port || ''}
                            onChange={e => handleChange('default_wg_port', e.target.value)}
                            inputProps={{ min: 1, max: 65535 }}
                            sx={fieldSx}
                            InputProps={{ sx: { color: '#fafafa' } }}
                        />
                        <TextField
                            label="Porta SSH padrao"
                            type="number"
                            size="small"
                            value={settings.default_ssh_port || ''}
                            onChange={e => handleChange('default_ssh_port', e.target.value)}
                            inputProps={{ min: 1, max: 65535 }}
                            sx={fieldSx}
                            InputProps={{ sx: { color: '#fafafa' } }}
                        />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
