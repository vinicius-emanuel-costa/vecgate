import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState({ name: 'VecGate', primary_color: '#00d4aa' });

    useEffect(() => {
        const init = async () => {
            try {
                const cfgRes = await api.get('/config');
                setConfig(cfgRes.data);
            } catch {}
            const token = localStorage.getItem('vecgate_token');
            if (token) {
                try {
                    const res = await api.get('/auth/me');
                    setUser(res.data);
                } catch { localStorage.removeItem('vecgate_token'); }
            }
            setLoading(false);
        };
        init();
    }, []);

    const login = async (username, password) => {
        const res = await api.post('/auth/login', { username, password });
        localStorage.setItem('vecgate_token', res.data.token);
        setUser(res.data.user);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('vecgate_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, config }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
