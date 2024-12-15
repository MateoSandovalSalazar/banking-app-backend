// BACKEND index.js
// Carga de variables de entorno
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

(async function main() {
    try {
        // Conectar a la base de datos
        await connectDB();

        const app = express();

        // Middlewares
        app.use(express.json()); // Parsear JSON
        app.use(cors());         // Permitir CORS (podrías configurar orígenes específicos)

// Rutas
app.use("/api/auth", require("./routes/auth"));     // Rutas de autenticación
app.use("/api/account", require("./routes/account"));// Ejemplo de rutas adicionales

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
    } catch (error) {
        console.error("Error al iniciar el servidor:", error);
        process.exit(1);
    }
})();
