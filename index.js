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

app.get('/request-status', (req, res) => {
    const sql = 'SELECT * FROM request_status';
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error in featching data:', err);
            return res.status(500).send('failed to featch data from database');
        }
        res.status(200).json(result);

    });
});

app.get('/item-status', (req, res) => {
    const sql = 'SELECT * FROM item_status';
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error in featching data:', err);
            return res.status(500).send('failed to featch data from database');
        }
        res.status(200).json(result);

    });
});


app.post('/item-table', (req, res) => {

    const { requestId, itemName, purpuse, quantity, unit, unitPrice, totalPrice, requesterName } = req.body;

    const sql = 'INSERT INTO item_table (requestId, itemName, purpuse, quantity, unit, unitPrice, totalPrice, requesterName) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [requestId, itemName, purpuse, quantity, unit, unitPrice, totalPrice, requesterName];

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

app.patch('/update/comment/:requestID', (req, res) => {
    const requestID = req.params.requestID;
    const { comment, status } = req.body;

    const sql = 'UPDATE requests SET comment = ?, status = ? WHERE requestId = ?';

    db.query(sql, [comment,status,  requestID], (err, result) => {
        if (err) {
            console.error('Error updating comment: ', err);
            res.status(500).json({ error: 'Error updating comment' });
        } else {
            console.log('Comment updated successfully');
            res.status(200).json({ message: 'Comment updated successfully' });
        }
    });
});

// patch both requests and itemTable

app.patch('/update/status/:requestID', (req, res) => {
    const requestID = req.params.requestID;
    const { status } = req.body;

    db.beginTransaction(err => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).json({ error: 'Error starting transaction' });
        }

        const sql1 = 'UPDATE requests SET status = ? WHERE requestId = ?';
        const sql2 = 'UPDATE item_table SET status = ? WHERE requestId = ?';

        db.query(sql1, [status, requestID], (err, result1) => {
            if (err) {
                db.rollback(() => {
                    console.error('Error executing query 1:', err);
                    return res.status(500).json({ error: 'Error updating requests' });
                });
            }

            db.query(sql2, [status, requestID], (err, result2) => {
                if (err) {
                    db.rollback(() => {
                        console.error('Error executing query 2:', err);
                        return res.status(500).json({ error: 'Error updating item_table' });
                    });
                }

                db.commit(err => {
                    if (err) {
                        db.rollback(() => {
                            console.error('Error committing transaction:', err);
                            return res.status(500).json({ error: 'Error committing transaction' });
                        });
                    }

                    console.log('status successfully updated in both request and item_table');
                    return res.json({ message: 'status successfully updated in both request and item_table' });
                });
            });
        });
    });
});


app.listen(PORT, () => {
    console.log(`Server is ON on http://localhost:${PORT}`);
});
