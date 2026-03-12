import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Box, Typography, Menu, MenuItem } from '@mui/material';
import { LogoutOutlined, MoreVertOutlined } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const menuItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/hosts', label: 'Hosts' },
    { path: '/topology', label: 'Topologia' },
    { path: '/terminal', label: 'Terminal' },
    { path: '/users', label: 'Usuários' },
    { path: '/audit', label: 'Logs' },
    { path: '/settings', label: 'Config' },
];

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [anchorEl, setAnchorEl] = useState(null);

    const handleLogout = () => {
        setAnchorEl(null);
        logout();
        navigate('/login');
    };

    const userInitial = (user?.name || 'U').charAt(0).toUpperCase();

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#09090b' }}>
            {/* Header */}
            <Box
                component="header"
                sx={{
                    borderBottom: '1px solid #27272a',
                    bgcolor: '#09090b',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                }}
            >
                <Box
                    sx={{
                        maxWidth: 1400,
                        mx: 'auto',
                        px: { xs: 2, md: 4 },
                        height: 56,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    {/* Left: Logo */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                            sx={{
                                width: 28,
                                height: 28,
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 0 12px rgba(6,182,212,0.25)',
                            }}
                        >
                            <Box
                                sx={{
                                    width: 14,
                                    height: 14,
                                    border: '2px solid rgba(255,255,255,0.9)',
                                    borderRadius: '3px',
                                    position: 'relative',
                                    '&::after': {
                                        content: '""',
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: 4,
                                        height: 4,
                                        borderRadius: '50%',
                                        bgcolor: 'rgba(255,255,255,0.9)',
                                    },
                                }}
                            />
                        </Box>
                        <Typography
                            sx={{
                                color: '#fafafa',
                                fontSize: 20,
                                fontWeight: 400,
                                letterSpacing: '-0.02em',
                            }}
                        >
                            <span style={{ fontWeight: 700 }}>Vec</span>Gate
                        </Typography>
                    </Box>

                    {/* Right: status + user + menu */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {/* Status badge */}
                        <Box
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                px: 1.25,
                                py: 0.5,
                                fontSize: 12,
                                fontWeight: 500,
                                borderRadius: 9999,
                                bgcolor: 'rgba(34,197,94,0.12)',
                                color: '#4ade80',
                                border: '1px solid rgba(34,197,94,0.25)',
                            }}
                        >
                            <Box
                                sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    bgcolor: '#22c55e',
                                    '@keyframes pulse-status': {
                                        '0%, 100%': { opacity: 1 },
                                        '50%': { opacity: 0.4 },
                                    },
                                    animation: 'pulse-status 2s ease-in-out infinite',
                                }}
                            />
                            Rede ativa
                        </Box>

                        {/* Separator */}
                        <Box sx={{ height: 20, width: '1px', bgcolor: '#27272a' }} />

                        {/* User name */}
                        <Typography sx={{ fontSize: 14, color: '#a1a1aa', fontWeight: 500 }}>
                            {user?.name || 'Usuário'}
                        </Typography>

                        {/* Avatar */}
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#fff',
                                flexShrink: 0,
                            }}
                        >
                            {userInitial}
                        </Box>

                        {/* Menu button */}
                        <Box
                            onClick={(e) => setAnchorEl(e.currentTarget)}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 32,
                                height: 32,
                                borderRadius: '8px',
                                cursor: 'pointer',
                                border: '1px solid transparent',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    bgcolor: '#27272a',
                                    borderColor: '#3f3f46',
                                },
                            }}
                        >
                            <MoreVertOutlined sx={{ fontSize: 18, color: '#71717a' }} />
                        </Box>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={() => setAnchorEl(null)}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        >
                            <MenuItem onClick={handleLogout} sx={{ gap: 1 }}>
                                <LogoutOutlined sx={{ fontSize: 16 }} />
                                Sair
                            </MenuItem>
                        </Menu>
                    </Box>
                </Box>
            </Box>

            {/* Tab Navigation */}
            <Box
                component="nav"
                sx={{
                    borderBottom: '1px solid #27272a',
                    bgcolor: '#09090b',
                }}
            >
                <Box
                    sx={{
                        maxWidth: 1400,
                        mx: 'auto',
                        display: 'flex',
                        gap: '2px',
                        px: { xs: 2, md: 4 },
                        overflowX: 'auto',
                        scrollbarWidth: 'none',
                        '&::-webkit-scrollbar': { display: 'none' },
                    }}
                >
                    {menuItems.map((item) => {
                        const active = location.pathname === item.path;
                        return (
                            <Box
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                sx={{
                                    px: 2,
                                    py: 1.5,
                                    fontSize: 13,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                    transition: 'color 0.2s',
                                    color: active ? '#fafafa' : '#71717a',
                                    borderBottom: active ? '2px solid #06b6d4' : '2px solid transparent',
                                    '&:hover': { color: active ? '#fafafa' : '#a1a1aa' },
                                }}
                            >
                                {item.label}
                            </Box>
                        );
                    })}
                </Box>
            </Box>

            {/* Content */}
            <Box
                component="main"
                sx={{
                    maxWidth: 1400,
                    mx: 'auto',
                    width: '100%',
                    px: { xs: 2, md: 4 },
                    py: 3,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    overflow: 'hidden',
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
}
