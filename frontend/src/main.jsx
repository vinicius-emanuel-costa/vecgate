import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import theme from './theme';
import App from './App';

console.log('[VecGate] v2 loaded');
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <SnackbarProvider
                maxSnack={3}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                autoHideDuration={3000}
            >
                <BrowserRouter>
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                </BrowserRouter>
            </SnackbarProvider>
        </ThemeProvider>
    </React.StrictMode>
);
