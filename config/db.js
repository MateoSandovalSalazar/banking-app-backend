const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Muestra el valor de MONGO_URI en logs
        console.log("MONGO_URI:", process.env.MONGO_URI);

        // Conecta a MongoDB con la URI de entorno
        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log(`MongoDB conectado: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1); // Salir del proceso si hay un error
    }
};

module.exports = connectDB;
