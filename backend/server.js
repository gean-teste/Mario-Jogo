const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mario'
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao MySQL:', err);
        return;
    }
    console.log('Conectado ao MySQL');
});

app.get('/usuarios', (req, res) => {
    const sql = 'SELECT * FROM usuarios';
    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.send(result);
    });
});

app.post('/usuario', (req, res) => {
    const { username, email, coins, score } = req.body;
    const sql = 'INSERT INTO usuarios (username, email, coins, score) VALUES (?, ?, ?, ?)';
    db.query(sql, [username, email, coins, score], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.send(result);
    });
});



app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});


// CREATE TABLE usuarios (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     username VARCHAR(255) NOT NULL,
//     email VARCHAR(255) NOT NULL,
//     coins INT DEFAULT 0,
//     score INT DEFAULT 0
// );


// ou


// CREATE DATABASE nome_do_seu_banco_de_dados;

// USE nome_do_seu_banco_de_dados;

// CREATE TABLE usuarios (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   username VARCHAR(255) NOT NULL,
//   email VARCHAR(255) NOT NULL,
//   coins INT DEFAULT 0,
//   score INT DEFAULT 0
// );

