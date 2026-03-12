import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#06b6d4', light: '#22d3ee', dark: '#0891b2' },
        secondary: { main: '#6366f1' },
        background: { default: '#09090b', paper: '#18181b' },
        error: { main: '#ef4444' },
        warning: { main: '#eab308' },
        success: { main: '#22c55e' },
        text: { primary: '#fafafa', secondary: '#a1a1aa' },
        divider: '#27272a',
    },
    typography: {
        fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
        h4: { fontWeight: 700, color: '#fafafa', letterSpacing: '-0.025em' },
        h5: { fontWeight: 700, color: '#fafafa', letterSpacing: '-0.025em' },
        h6: { fontWeight: 700, color: '#fafafa', letterSpacing: '-0.025em' },
        body1: { fontSize: '0.875rem', color: '#a1a1aa' },
        body2: { fontSize: '0.875rem', color: '#a1a1aa' },
        caption: {
            fontSize: '0.6875rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#71717a',
        },
    },
    shape: { borderRadius: 12 },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: '#09090b',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#27272a #09090b',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 8,
                    boxShadow: 'none',
                    transition: 'all 0.2s ease',
                    backgroundColor: 'transparent',
                    border: '1px solid #3f3f46',
                    color: '#a1a1aa',
                    '&:hover': {
                        backgroundColor: '#27272a',
                        borderColor: '#52525b',
                        color: '#fafafa',
                        boxShadow: 'none',
                    },
                },
                containedPrimary: {
                    backgroundColor: '#0e7490',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: 10,
                    '&:hover': {
                        backgroundColor: '#0891b2',
                        border: 'none',
                        boxShadow: '0 0 20px rgba(6,182,212,0.15)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: 12,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)',
                    padding: 24,
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    '&:hover': { borderColor: '#3f3f46' },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                head: {
                    fontWeight: 600,
                    fontSize: '0.6875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#71717a',
                    borderBottom: '1px solid #27272a',
                    padding: '14px 16px',
                },
                body: {
                    borderBottom: '1px solid rgba(39,39,42,0.6)',
                    fontSize: '0.875rem',
                    padding: '14px 16px',
                    color: '#fafafa',
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    backgroundImage: 'none',
                    backgroundColor: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: 16,
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.1)',
                },
            },
        },
        MuiTextField: {
            defaultProps: { variant: 'outlined', size: 'small', fullWidth: true },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    backgroundColor: '#18181b',
                    fontSize: '0.875rem',
                    '& fieldset': { borderColor: '#3f3f46' },
                    '&:hover fieldset': { borderColor: '#52525b !important' },
                    '&.Mui-focused fieldset': { borderColor: '#06b6d4 !important', borderWidth: '1.5px !important' },
                },
                input: {
                    color: '#fafafa',
                    '&::placeholder': { color: '#71717a', opacity: 1 },
                },
            },
        },
        MuiInputLabel: {
            styleOverrides: {
                root: {
                    color: '#71717a',
                    '&.Mui-focused': { color: '#06b6d4' },
                },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: '#27272a',
                    border: '1px solid #3f3f46',
                    fontSize: '0.75rem',
                    color: '#fafafa',
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                },
            },
        },
        MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    borderRadius: 9999,
                },
            },
        },
        MuiMenu: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: 10,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                },
            },
        },
        MuiMenuItem: {
            styleOverrides: {
                root: {
                    fontSize: '0.875rem',
                    color: '#a1a1aa',
                    borderRadius: 6,
                    margin: '2px 6px',
                    '&:hover': {
                        backgroundColor: '#27272a',
                        color: '#fafafa',
                    },
                },
            },
        },
        MuiDivider: {
            styleOverrides: {
                root: { borderColor: '#27272a' },
            },
        },
    },
});

export default theme;
