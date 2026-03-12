import { Box, Typography } from '@mui/material';

const statusConfig = {
    online: {
        bg: 'rgba(34,197,94,0.12)',
        color: '#4ade80',
        border: 'rgba(34,197,94,0.25)',
        dot: '#22c55e',
        pulse: true,
        label: 'online',
    },
    offline: {
        bg: 'rgba(239,68,68,0.12)',
        color: '#f87171',
        border: 'rgba(239,68,68,0.25)',
        dot: '#ef4444',
        pulse: false,
        label: 'offline',
    },
    deploying: {
        bg: 'rgba(234,179,8,0.12)',
        color: '#facc15',
        border: 'rgba(234,179,8,0.25)',
        dot: '#eab308',
        pulse: true,
        label: 'deploying',
    },
};

const pulseKeyframes = {
    '@keyframes pulse-dot': {
        '0%, 100%': { opacity: 1 },
        '50%': { opacity: 0.4 },
    },
};

export default function StatusChip({ status }) {
    const config = statusConfig[status] || statusConfig.offline;

    return (
        <Box
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                px: '10px',
                py: '3px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 500,
                bgcolor: config.bg,
                color: config.color,
                border: `1px solid ${config.border}`,
            }}
        >
            <Box
                sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: config.dot,
                    flexShrink: 0,
                    ...(config.pulse && {
                        ...pulseKeyframes,
                        animation: 'pulse-dot 2s ease-in-out infinite',
                    }),
                }}
            />
            <Typography
                sx={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: config.color,
                    lineHeight: 1,
                }}
            >
                {config.label}
            </Typography>
        </Box>
    );
}
