const express = require('express');
const cors = require('cors');
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

app.use(cors());
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

app.get('/requester-name', (req, res) => {
    const sql = 'SELECT * FROM requester_name';
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error in featching data:', err);
            return res.status(500).send('failed to featch data from database');
        }
        res.status(200).json(result);
    });
});

app.get('/item-table',(req, res)=>{
    const sql = 'SELECT * FROM item_table';
    db.query(sql, (err, result)=>{
        if(err){
            console.error('Error in featching data:', err);
            return res.status(500).send('failed to featc data from item table');
        }
        res.status(200).json(result);
    });
});

app.get('/request', (req,res)=>{
    const sql= 'SELECT * FROM requests';
    db.query(sql, (err, result)=>{
        if(err){
            console.error('Error in featching request',err);
            return res.status(500).send('failed to featc data from item table');
        }
            res.status(200).json(result);
    });
});

app.post('/item-table', (req, res) => {
    const items = req.body;

    const sql = 'INSERT INTO item_table (requestId, itemId, itemName, purpuse, quantity, unit, unitPrice, totalPrice, requesterName, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

    // const insertPromises = items.map(item => {
        const { requestId, itemId, itemName, purpuse, quantity, unit, unitPrice, totalPrice, requesterName, status } = items;
        const values = [requestId, itemId, itemName, purpuse, quantity, unit, unitPrice, totalPrice, requesterName, status];
        
        return new Promise((resolve, reject) => {
            db.query(sql, values, (err, result) => {
                if (err) {
                    console.error('Error in inserting data', err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    // });

    Promise.all(insertPromises)
        .then(() => {
            res.status(200).send('Data inserted successfully');
        })
        .catch(error => {
            res.status(500).send('Error in inserting data into the database');
        });
});



app.post('/requests', (req, res) => {
    const requests = req.body;

    const sql = 'INSERT INTO requests (requestId, date, status, createdBy) VALUES (?, ?, ?, ?)';

    const insertPromises = requests.map(request => {
        const { requestId, date, status, createdBy } = request;
        const values = [requestId, date, status, createdBy];
        
        return new Promise((resolve, reject) => {
            db.query(sql, values, (err, result) => {
                if (err) {
                    console.error('Error in inserting data', err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    });

    Promise.all(insertPromises)
        .then(() => {
            res.status(200).send('Data inserted successfully');
        })
        .catch(error => {
            res.status(500).send('Error in inserting data into the database');
        });
});


app.patch('/update/comment/:requestID', (req, res) => {
    const requestID = req.params.requestID;
    const { comment, status } = req.body;

    db.beginTransaction(err => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).json({ error: 'Error starting transaction' });
        }

        const updateRequestsQuery = 'UPDATE requests SET comment = ?, status = ? WHERE requestId = ?';
        const updateItemTableQuery = 'UPDATE item_table SET status = ? WHERE requestId = ?';

        db.query(updateRequestsQuery, [comment, status, requestID], (err, result1) => {
            if (err) {
                db.rollback(() => {
                    console.error('Error executing query 1:', err);
                    return res.status(500).json({ error: 'Error updating requests' });
                });
            }

            db.query(updateItemTableQuery, [status, requestID], (err, result2) => {
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

                    console.log('Comment and status successfully updated');
                    return res.json({ message: 'Comment and status updated successfully' });
                });
            });
        });
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

app.patch('/status/itemId/:itemId', (req, res) => {
    const itemId = req.params.itemId; // Extract itemId from URL parameter
    const newStatus = req.body.status; // Assuming status is sent in the request body

    if (!newStatus) {
        return res.status(400).json({ error: 'Missing status in request body' });
    }

    const sql = 'UPDATE item_table SET status = ? WHERE itemId = ?';
    db.query(sql, [newStatus, itemId], (err, result) => {
        if (err) {
            console.error('Error updating data:', err);
            return res.status(500).json({ error: 'Failed to update data in the database' });
        }
        res.status(200).json({ message: 'Data updated successfully'});
    });
});


// get by status
    // -get by request status

app.get('/request/status/:status', (req, res) => {
    const requestStatus = req.params.status;
    const sql = 'SELECT * FROM requests WHERE status = ?';
    db.query(sql, [requestStatus], (err, result) => {
        if (err) {
            console.error('Error in fetching requests', err);
            return res.status(500).send('Failed to fetch data from requests table');
        }

        if (result.length === 0) {
            const errorMessage = `No data with status ${requestStatus} not found`;
            return res.status(404).json({ error: errorMessage });
        }

        res.status(200).json(result);
    });
});

// -get by item_table status

app.get('/item-table/status/:status', (req, res) => {
    const itemStatus = req.params.status;
    const sql = 'SELECT * FROM item_table WHERE status = ?';
    db.query(sql, [itemStatus], (err, result) => {
        if (err) {
            console.error('Error in fetching requests', err);
            return res.status(500).send('Failed to fetch data from requests table');
        }

        if (result.length === 0) {
            const errorMessage = `No data with status ${itemStatus} not found`;
            return res.status(404).json({ error: errorMessage });
        }

        res.status(200).json(result);
    });
});

    // 
    app.get('/item-table/requestId/:requestId', (req, res) => {
        const requestId = req.params.requestId;  
        const sql = 'SELECT * FROM item_table WHERE requestId = ?';
        db.query(sql, [requestId], (err, result) => {
            if (err) {
                console.error('Error in fetching requests', err);
                return res.status(500).send('Failed to fetch data from requests table');
            }
    
            if (result.length === 0) {
                const errorMessage = `Data of requestId ${requestId} not found`; 
                return res.status(404).json({ error: errorMessage });
            }
            res.status(200).json(result);
        });
    });
    


app.listen(PORT, () => {
    console.log(`Server is ON on http://localhost:${PORT}`);
});
