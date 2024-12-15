// middleware/authorizeRole.js

const authorizeRole = (role) => {
    return (req, res, next) => {
        if (req.user && req.user.role === role) {
            next(); // Permitir el acceso
        } else {
            res.status(403).json({ message: 'Acceso denegado: No tienes los permisos necesarios' });
        }
    };
};

module.exports = authorizeRole;
