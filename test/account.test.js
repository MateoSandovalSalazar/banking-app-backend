const request = require("supertest");
const app = require("../index"); // Archivo principal de tu aplicación
const mongoose = require("mongoose");
const User = require("../models/User");

describe("Account Routes", () => {
    let token;
    let userId;
    let recipientId;

    beforeAll(async () => {
        // Cerrar conexiones existentes si las hay
        if (mongoose.connection.readyState) {
            await mongoose.disconnect();
        }

        // Conectar a la base de datos de pruebas
        await mongoose.connect("mongodb://127.0.0.1/banking_test");

        // Limpiar la base de datos
        await mongoose.connection.dropDatabase();

        // Crear un usuario para pruebas
        const userResponse = await request(app)
        .post("/api/auth/register")
        .send({
            name: "Test User",
            email: "test@example.com",
            password: "password123",
        });

        token = userResponse.body.token; // Obtener token para autenticación
        userId = userResponse.body.user.id;

        // Crear un segundo usuario para transferencias
        const recipientResponse = await request(app)
        .post("/api/auth/register")
        .send({
            name: "Recipient User",
            email: "recipient@example.com",
            password: "password123",
        });

        recipientId = recipientResponse.body.user.id;
    });

    afterAll(async () => {
        // Limpiar la base de datos y cerrar la conexión
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
    });

    test('Admin should view all users', async () => {
        const adminToken = await getAdminToken(); // Función que genera un token de admin

        const response = await request(app)
        .get('/api/account/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test('Non-admin user should not access admin routes', async () => {
        const response = await request(app)
        .get('/api/account/admin/users')
        .set('Authorization', `Bearer ${token}`); // Token de usuario normal

        expect(response.status).toBe(403);
    });


    test("Should deposit money", async () => {
        const response = await request(app)
        .post("/api/account/deposit")
        .set("Authorization", `Bearer ${token}`)
        .send({ amount: 100 });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Depósito realizado con éxito");
        expect(response.body.balance).toBe(100);
    });

    test("Should withdraw money", async () => {
        const response = await request(app)
        .post("/api/account/withdraw")
        .set("Authorization", `Bearer ${token}`)
        .send({ amount: 50 });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Retiro realizado con éxito");
        expect(response.body.balance).toBe(50);
    });

    test("Should transfer money to another user", async () => {
        const response = await request(app)
        .post("/api/account/transfer")
        .set("Authorization", `Bearer ${token}`)
        .send({ amount: 25, recipientEmail: "recipient@example.com" });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Transferencia realizada con éxito");
    });

    test("Should fetch balance", async () => {
        const response = await request(app)
        .get("/api/account/balance")
        .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.balance).toBe(25);
    });

    test("Should fetch transactions", async () => {
        const response = await request(app)
        .get("/api/account/transactions")
        .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);

        const transactions = response.body.transactions;
        expect(transactions).toHaveLength(3); // Depósito, retiro, transferencia

        // Validar los detalles de las transacciones
        expect(transactions[0]).toMatchObject({ type: 'deposit', amount: 100 });
        expect(transactions[1]).toMatchObject({ type: 'withdraw', amount: 50 });
        expect(transactions[2]).toMatchObject({
            type: 'transfer',
            amount: 25,
            details: 'Transferencia a recipient@example.com',
        });
    });
});
