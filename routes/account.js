const express = require('express');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const authorizeRole = require('../middleware/authorizeRole'); // Importar la función
const router = express.Router();

// Cambiar rol de usuario (solo para administradores)
router.patch('/admin/change-role', authMiddleware, authorizeRole('admin'), async (req, res) => {
    const { userId, role } = req.body;

    // Verificar que el rol sea válido
    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Rol inválido' });
    }

    try {
        // Encontrar y actualizar el rol del usuario
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        user.role = role;
        await user.save();

        res.status(200).json({ message: 'Rol actualizado con éxito', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar el rol' });
    }
});


// Ruta para que los admins vean todos los usuarios
router.get('/admin/users', authMiddleware, authorizeRole('admin'), async (req, res) => {
    try {
        const users = await User.find().select('-password'); // Excluye la contraseña
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los usuarios' });
    }
});

// Ruta para que los admins vean todas las transacciones
router.get('/admin/transactions', authMiddleware, authorizeRole('admin'), async (req, res) => {
    try {
        const transactions = await User.find().select('transactions');
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las transacciones' });
    }
});

// Ruta protegida para realizar un depósito
router.post('/deposit', authMiddleware, async (req, res) => {
    const { amount } = req.body;

    if (amount <= 0) {
        return res.status(400).json({ message: 'El monto debe ser mayor a 0' });
    }

    try {
        const user = await User.findById(req.user.id);
        await user.addTransaction('deposit', amount);

        res.status(200).json({
            message: 'Depósito realizado con éxito',
            balance: user.balance,
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
});

// Ruta protegida para realizar un retiro
router.post('/withdraw', authMiddleware, async (req, res) => {
    const { amount } = req.body;

    if (amount <= 0) {
        return res.status(400).json({ message: 'El monto debe ser mayor a 0' });
    }

    try {
        const user = await User.findById(req.user.id);
        await user.addTransaction('withdraw', amount);

        res.status(200).json({
            message: 'Retiro realizado con éxito',
            balance: user.balance,
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
});

// Ruta protegida para consultar el saldo
router.get('/balance', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({ balance: user.balance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al consultar el saldo' });
    }
});

// Ruta protegida para consultar el historial de transacciones
router.get('/transactions', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({ transactions: user.transactions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al consultar las transacciones' });
    }
});


// Ruta protegida para realizar transferencias entre usuarios
router.post('/transfer', authMiddleware, async (req, res) => {
    const { recipientEmail, amount } = req.body;

    if (amount <= 0) {
        return res.status(400).json({ message: 'El monto debe ser mayor a 0' });
    }

    try {
        const sender = await User.findById(req.user.id);
        const recipient = await User.findOne({ email: recipientEmail });

        if (!recipient) {
            return res.status(404).json({ message: 'Usuario receptor no encontrado' });
        }

        // Realizar transferencia utilizando el método del modelo
        await sender.transferTo(recipient, amount);

        res.status(200).json({
            message: 'Transferencia realizada con éxito',
            senderBalance: sender.balance,
            recipientBalance: recipient.balance,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

router.post("/transfer", authMiddleware, async (req, res) => {
    const { recipientEmail, amount } = req.body;
    // Lógica para realizar transferencia
});

router.get("/transactions", authMiddleware, async (req, res) => {
    const transactions = await Transaction.find({ userId: req.user.id });
    res.json(transactions);
});



module.exports = router;
