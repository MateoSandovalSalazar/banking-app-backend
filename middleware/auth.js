const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No se proporcionó un token de autenticación' });
    }

    try {
        // Verifica el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Busca al usuario en la base de datos
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Agrega el usuario y el rol al objeto `req`
        req.user = { id: user._id, role: user.role };
        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: 'Token no válido' });
    }
};
