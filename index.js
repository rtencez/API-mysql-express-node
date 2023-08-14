// Create your own REST Service API using Express js, Node js, and mysql
// install npm install express
//         npm install mysql2 -mysql workbench
//         npm install nodemon -rerun code when changes is done automatically

const express = require('express');
const app = express();
const PORT = 8080;
const mysql = require('mysql2');

app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root@123',
    database: 'material_request'
});

app.get('/units', (req, res) => {
    const sql = 'SELECT * FROM units';

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.status(500).send('Error fetching data from database');
        }

        res.status(200).json(results);
    });
});

app.get('/request-status', (req, res)=>{
    const sql= 'SELECT * FROM request_status';
    db.query(sql,(err ,result)=> {
        if(err){
            console.error('Error in featching data:', err);
            return res.status(500).send('failed to featch data from database');
        }
        res.status(200).json(result);

    });
});

app.get('/item-status', (req, res)=>{
    const sql= 'SELECT * FROM item_status';
    db.query(sql,(err ,result)=> {
        if(err){
            console.error('Error in featching data:', err);
            return res.status(500).send('failed to featch data from database');
        }
        res.status(200).json(result);

    });
});


app.post('/item-table', (req, res) => {

    const { requestId, itemName, purpuse, quantity, unit, unitPrice, totalPrice, requesterName, status } = req.body;

    const sql = 'INSERT INTO item_table (requestId, itemName, purpuse, quantity, unit, unitPrice, totalPrice, requesterName, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [requestId, itemName, purpuse, quantity, unit, unitPrice, totalPrice, requesterName, status];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error in inserting data', err);
            return res.status(500).send('Error in inserting data into the database');
        }
        res.status(200).send('Data inserted successfully');
    });
});


app.post('/requests', (req, res) => {
    const { requestId, date, status, createdBy } = req.body;
    const sql = 'INSERT INTO requests (requestId, date, status, createdBy) VALUES (?, ?, ?, ?)';
    const values = [requestId, date, status, createdBy];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error in inserting data', err);
            return res.status(500).send('Error in inserting data into the database');
        }
        res.status(200).send('Data inserted successfully');
    });
});


app.post('/tshirt', (req, res) => {
    const { tshirt, size } = req.body;

    const sql = 'INSERT INTO tshirts (tshirt, size) VALUES (?, ?)';
    const values = [tshirt, size];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).send('Error inserting data into database');
        }
        
        console.log('Data inserted successfully:', result);
        res.status(201).send('Data inserted successfully');
    });
});


app.listen(PORT, () => {
    console.log(`Server is ON on http://localhost:${PORT}`);
});
