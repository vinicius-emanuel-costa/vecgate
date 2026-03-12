import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, InputAdornment, IconButton, CircularProgress } from '@mui/material';
import { VisibilityOutlined, VisibilityOffOutlined } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            enqueueSnackbar('Preencha todos os campos', { variant: 'warning' });
            return;
        }
        setLoading(true);
        try {
            await login(username, password);
            navigate('/');
        } catch (err) {
            enqueueSnackbar(err?.response?.data?.detail || err?.message || 'Falha na autenticação', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const fieldSx = {
        '& .MuiOutlinedInput-root': {
            bgcolor: '#18181b',
            borderRadius: '10px',
            fontSize: 14,
            '& fieldset': { borderColor: '#3f3f46' },
            '&:hover fieldset': { borderColor: '#52525b !important' },
            '&.Mui-focused fieldset': { borderColor: '#06b6d4 !important', borderWidth: '1.5px !important' },
        },
        '& .MuiInputLabel-root': { color: '#71717a' },
        '& .MuiInputLabel-root.Mui-focused': { color: '#06b6d4' },
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#09090b',
                background: 'radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.08) 0%, transparent 60%)',
            }}
        >
            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    width: '100%',
                    maxWidth: 420,
                    mx: 2,
                    p: 5,
                    borderRadius: '16px',
                    bgcolor: '#18181b',
                    border: '1px solid #27272a',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.1)',
                }}
            >
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 5 }}>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 0 16px rgba(6,182,212,0.3)',
                            }}
                        >
                            <Box
                                sx={{
                                    width: 16,
                                    height: 16,
                                    border: '2px solid rgba(255,255,255,0.9)',
                                    borderRadius: '4px',
                                    position: 'relative',
                                    '&::after': {
                                        content: '""',
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: 5,
                                        height: 5,
                                        borderRadius: '50%',
                                        bgcolor: 'rgba(255,255,255,0.9)',
                                    },
                                }}
                            />
                        </Box>
                        <Typography
                            sx={{
                                color: '#fafafa',
                                fontSize: 28,
                                fontWeight: 400,
                                letterSpacing: '-0.02em',
                            }}
                        >
                            <span style={{ fontWeight: 700 }}>Vec</span>Gate
                        </Typography>
                    </Box>
                    <Typography sx={{ fontSize: 14, color: '#71717a', fontWeight: 400 }}>
                        Mesh Network Manager
                    </Typography>
                </Box>

                {/* Fields */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <TextField
                        fullWidth
                        placeholder="Usuário"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        autoFocus
                        sx={fieldSx}
                    />
                    <TextField
                        fullWidth
                        placeholder="Senha"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        sx={fieldSx}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                        size="small"
                                        sx={{ color: '#71717a', '&:hover': { color: '#a1a1aa' } }}
                                    >
                                        {showPassword ? (
                                            <VisibilityOffOutlined sx={{ fontSize: 18 }} />
                                        ) : (
                                            <VisibilityOutlined sx={{ fontSize: 18 }} />
                                        )}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loading}
                        sx={{
                            mt: 1,
                            height: 44,
                            fontSize: 14,
                            fontWeight: 600,
                            borderRadius: '10px',
                            background: '#0e7490',
                            border: 'none',
                            color: '#ffffff',
                            boxShadow: 'none',
                            textTransform: 'none',
                            '&:hover': {
                                background: '#0891b2',
                                border: 'none',
                                boxShadow: '0 0 20px rgba(6,182,212,0.15)',
                            },
                            '&.Mui-disabled': {
                                background: 'rgba(14,116,144,0.4)',
                                color: 'rgba(255,255,255,0.5)',
                            },
                        }}
                    >
                        {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Acessar'}
                    </Button>
                </Box>

                {/* Footer */}
                <Typography sx={{ textAlign: 'center', mt: 5, fontSize: 12, color: '#71717a' }}>
                    Powered by WireGuard
                </Typography>
            </Box>
        </Box>
    );
}
