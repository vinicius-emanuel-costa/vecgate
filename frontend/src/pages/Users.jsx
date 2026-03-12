import { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton,
} from '@mui/material';
import { Edit as EditIcon, Lock as LockIcon, DeleteOutline as DeleteIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../api';
import { useAuth } from '../context/AuthContext';

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

const dialogPaperSx = {
    bgcolor: '#18181b',
    border: '1px solid #3f3f46',
    borderRadius: '16px',
    backgroundImage: 'none',
    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
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

export default function Users() {
    const [users, setUsers] = useState([]);
    const [dialog, setDialog] = useState(false);
    const [passDialog, setPassDialog] = useState(false);
    const [editData, setEditData] = useState(null);
    const [passUser, setPassUser] = useState(null);
    const [newPass, setNewPass] = useState('');
    const [form, setForm] = useState({ username: '', name: '', password: '', role: 'admin' });
    const { enqueueSnackbar } = useSnackbar();
    const { user: currentUser } = useAuth();

    const load = async () => { const res = await api.get('/users'); setUsers(res.data); };
    useEffect(() => { load(); }, []);

    const openNew = () => { setEditData(null); setForm({ username: '', name: '', password: '', role: 'admin' }); setDialog(true); };
    const openEdit = (u) => { setEditData(u); setForm({ username: u.username, name: u.name, password: '', role: u.role }); setDialog(true); };

    const save = async () => {
        try {
            const body = editData ? { name: form.name, role: form.role } : form;
            if (editData) {
                await api.put(`/users/${editData.id}`, body);
                enqueueSnackbar(`${form.name} atualizado`, { variant: 'success' });
            } else {
                await api.post('/users', body);
                enqueueSnackbar(`${form.username} criado`, { variant: 'success' });
            }
            setDialog(false); load();
        } catch (err) { enqueueSnackbar(err.response?.data?.error || 'Erro', { variant: 'error' }); }
    };

    const remove = async (u) => {
        if (!confirm(`Remover ${u.username}?`)) return;
        try {
            await api.delete(`/users/${u.id}`);
            enqueueSnackbar(`${u.username} removido`, { variant: 'success' }); load();
        } catch (err) { enqueueSnackbar(err.response?.data?.error || 'Erro', { variant: 'error' }); }
    };

    const changePass = async () => {
        if (!newPass) return;
        await api.put(`/users/${passUser.id}`, { password: newPass });
        enqueueSnackbar(`Senha de ${passUser.username} alterada`, { variant: 'success' });
        setPassDialog(false); setNewPass('');
    };

    return (
        <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.025em' }}>
                    Usuarios
                </Typography>
                <Button
                    size="small"
                    onClick={openNew}
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
                    Novo Usuario
                </Button>
            </Box>

            {/* Users table */}
            <TableContainer sx={{ ...cardSx, p: 0, overflow: 'hidden' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={headerCellSx}>Usuario</TableCell>
                            <TableCell sx={headerCellSx}>Nome</TableCell>
                            <TableCell sx={headerCellSx}>Role</TableCell>
                            <TableCell sx={headerCellSx}>Criado em</TableCell>
                            <TableCell sx={{ ...headerCellSx, textAlign: 'right' }}>Acoes</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map(u => {
                            const isMe = u.id === currentUser?.id;
                            return (
                                <TableRow key={u.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                                    <TableCell sx={{ ...bodyCellSx, color: '#fafafa', fontFamily: '"Fira Code", monospace' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {u.username}
                                            {isMe && (
                                                <Box component="span" sx={{
                                                    fontSize: 10, fontWeight: 500, px: 1, py: 0.25,
                                                    borderRadius: '9999px',
                                                    bgcolor: 'rgba(6,182,212,0.1)',
                                                    color: '#22d3ee',
                                                    border: '1px solid rgba(6,182,212,0.2)',
                                                }}>
                                                    voce
                                                </Box>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ ...bodyCellSx, color: '#a1a1aa' }}>
                                        {u.name}
                                    </TableCell>
                                    <TableCell sx={bodyCellSx}>
                                        <Box component="span" sx={{
                                            fontSize: 11, fontWeight: 500, px: 1.5, py: 0.3,
                                            borderRadius: '9999px',
                                            ...(u.role === 'admin'
                                                ? { bgcolor: 'rgba(6,182,212,0.1)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.2)' }
                                                : { bgcolor: 'rgba(113,113,122,0.1)', color: '#a1a1aa', border: '1px solid rgba(113,113,122,0.2)' }
                                            ),
                                        }}>
                                            {u.role}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ ...bodyCellSx, color: '#71717a', fontFamily: '"Fira Code", monospace', whiteSpace: 'nowrap' }}>
                                        {u.created_at}
                                    </TableCell>
                                    <TableCell sx={{ ...bodyCellSx, textAlign: 'right' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                            <IconButton
                                                size="small"
                                                onClick={() => openEdit(u)}
                                                sx={{ color: '#71717a', '&:hover': { color: '#fafafa', bgcolor: '#27272a' } }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => { setPassUser(u); setPassDialog(true); setNewPass(''); }}
                                                sx={{ color: '#71717a', '&:hover': { color: '#fafafa', bgcolor: '#27272a' } }}
                                            >
                                                <LockIcon fontSize="small" />
                                            </IconButton>
                                            {!isMe && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => remove(u)}
                                                    sx={{ color: '#71717a', '&:hover': { color: '#f87171', bgcolor: 'rgba(239,68,68,0.08)' } }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* User dialog */}
            <Dialog
                open={dialog}
                onClose={() => setDialog(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: dialogPaperSx }}
            >
                <DialogTitle sx={{ color: '#fafafa', fontWeight: 600, fontSize: 16, borderBottom: '1px solid #27272a', pb: 2 }}>
                    {editData ? 'Editar Usuario' : 'Novo Usuario'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Username" value={form.username}
                            onChange={e => setForm({ ...form, username: e.target.value })}
                            disabled={!!editData} size="small" sx={fieldSx}
                            InputProps={{ sx: { color: '#fafafa' } }}
                        />
                        <TextField
                            label="Nome" value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            size="small" sx={fieldSx}
                            InputProps={{ sx: { color: '#fafafa' } }}
                        />
                        {!editData && (
                            <TextField
                                label="Senha" type="password" value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                size="small" sx={fieldSx}
                                InputProps={{ sx: { color: '#fafafa' } }}
                            />
                        )}
                        <TextField
                            select label="Role" value={form.role}
                            onChange={e => setForm({ ...form, role: e.target.value })}
                            size="small" sx={fieldSx}
                            InputProps={{ sx: { color: '#fafafa' } }}
                            SelectProps={{
                                MenuProps: { PaperProps: { sx: menuPaperSx } },
                            }}
                        >
                            <MenuItem value="admin">Admin</MenuItem>
                            <MenuItem value="viewer">Viewer</MenuItem>
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
                    <Button onClick={() => setDialog(false)} sx={{ color: '#71717a', textTransform: 'none', '&:hover': { color: '#a1a1aa' } }}>
                        Cancelar
                    </Button>
                    <Button onClick={save} sx={{
                        bgcolor: '#06b6d4', color: '#09090b', '&:hover': { bgcolor: '#22d3ee' },
                        textTransform: 'none', borderRadius: '10px', fontWeight: 600, px: 3,
                    }}>
                        Salvar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Password dialog */}
            <Dialog
                open={passDialog}
                onClose={() => setPassDialog(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: dialogPaperSx }}
            >
                <DialogTitle sx={{ color: '#fafafa', fontWeight: 600, fontSize: 16, borderBottom: '1px solid #27272a', pb: 2 }}>
                    Alterar Senha — {passUser?.username}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        label="Nova Senha" type="password" value={newPass}
                        onChange={e => setNewPass(e.target.value)}
                        sx={{ mt: 2, ...fieldSx }} size="small" fullWidth
                        InputProps={{ sx: { color: '#fafafa' } }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
                    <Button onClick={() => setPassDialog(false)} sx={{ color: '#71717a', textTransform: 'none', '&:hover': { color: '#a1a1aa' } }}>
                        Cancelar
                    </Button>
                    <Button onClick={changePass} sx={{
                        bgcolor: '#06b6d4', color: '#09090b', '&:hover': { bgcolor: '#22d3ee' },
                        textTransform: 'none', borderRadius: '10px', fontWeight: 600, px: 3,
                    }}>
                        Alterar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
