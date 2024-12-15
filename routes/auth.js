const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Modelo de usuario
const authMiddleware = require("../middleware/auth");

// Registro de usuarios
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Verifica si el usuario ya existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "El usuario ya existe" });
        }

        // Hashea la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crea el usuario
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        // Genera un token
        const secret = process.env.JWT_SECRET || "secret";
        const token = jwt.sign({ id: user._id }, secret, { expiresIn: "1h" });

        res.status(201).json({
            message: "Usuario creado exitosamente",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Error en /register:", error);
        res.status(500).json({ message: "Error al registrar el usuario" });
    }
});

// Iniciar sesión
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Verifica si el usuario existe
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Compara la contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Contraseña incorrecta" });
        }

        // Genera un token
        const secret = process.env.JWT_SECRET || "secret";
        const token = jwt.sign({ id: user._id }, secret, { expiresIn: "1h" });

        res.status(200).json({
            message: "Inicio de sesión exitoso",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Error en /login:", error);
        res.status(500).json({ message: "Error al iniciar sesión" });
    }
});

// Ejemplo de una ruta /api/auth/googleLogin
// No es OAuth real, solo un “puente” para unificar la cuenta google en tu DB.

router.post("/googleLogin", async (req, res) => {
    try {
        const { email, name } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Falta email de Google" });
        }

        // Verifica si el usuario ya existe
        let user = await User.findOne({ email });
        if (!user) {
            // Crear un nuevo usuario con saldo 0 o lo que quieras
            user = new User({
                name: name || "Google User",
                email,
                password: null,   // sin password
                balance: 0,
            });
            await user.save();
        }

        // Genera un token, igual que en /login
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });

        res.json({
            message: "Login Google unificado",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                balance: user.balance,
            },
        });
    } catch (error) {
        console.error("Error en googleLogin:", error);
        res.status(500).json({ message: "Error en login con Google" });
    }
});


// Ruta protegida: Obtener datos del usuario actual
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error("Error en /me:", error);
        res.status(500).json({ message: "Error al obtener datos del usuario" });
    }
});

module.exports = router;
