const mongoose = require("mongoose");

// Esquema del usuario
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: false, // Dependiendo si también aceptas OAuth (Google, etc.)
    },
    googleId: {
        type: String,
        required: false,
    },
    role: {
        type: String,
        enum: ["user", "admin", "employee"],
        default: "user",
    },
    balance: {
        type: Number,
        default: 0,
    },
    transactions: [
        {
            type: {
                type: String,
                enum: ["deposit", "withdraw", "transfer"],
                required: true,
            },
            amount: {
                type: Number,
                required: true,
            },
            date: {
                type: Date,
        default: Date.now,
            },
            details: {
                type: String,
        default: null,
            },
        },
    ],
});

// Método para agregar una transacción y actualizar el balance
UserSchema.methods.addTransaction = async function (type, amount, details = null) {
    if (amount <= 0) {
        throw new Error("El monto debe ser mayor a 0");
    }

    if (type === "withdraw" && this.balance < amount) {
        throw new Error("Fondos insuficientes");
    }

    // Actualizar saldo según el tipo de transacción
    if (type === "deposit") {
        this.balance += amount;
    } else if (type === "withdraw") {
        this.balance -= amount;
    }

    // Agregar la transacción al historial
    this.transactions.push({ type, amount, details });
    await this.save();
};

// Método para transferir dinero a otro usuario
UserSchema.methods.transferTo = async function (recipient, amount) {
    if (amount <= 0) {
        throw new Error("El monto debe ser mayor a 0");
    }

    if (this.balance < amount) {
        throw new Error("Fondos insuficientes para la transferencia");
    }

    // Actualizar saldos
    this.balance -= amount;
    recipient.balance += amount;

    // Registrar transacción del remitente
    this.transactions.push({
        type: "transfer",
        amount,
        details: `To: ${recipient.email}`,
    });

    // Registrar transacción del destinatario
    recipient.transactions.push({
        type: "transfer",
        amount,
        details: `From: ${this.email}`,
    });

    // Guardar ambos usuarios
    await this.save();
    await recipient.save();
};

module.exports = mongoose.model("User", UserSchema);
