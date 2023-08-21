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

app.get('/requests',(req, res)=>{
    const sql= 'SELECT * FROM requests';

    db.query(sql, (err, result)=>{
        if(err){
            console.error('Error in featchin data', err);
            return res.status(500).send('Error fetching data from database');
        }
        res.status(200).json(result);
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

    const sql = 'INSERT INTO item_table (requestId, itemId, itemName, purpuse, quantity, unit, unitPrice, totalPrice,createdBy, requesterName, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)';

        const { requestId, itemId, itemName, purpuse, quantity, unit, unitPrice, totalPrice,createdBy, requesterName, status } = items;
        const values = [requestId, itemId, itemName, purpuse, quantity, unit, unitPrice, totalPrice,createdBy, requesterName, status];
        
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



app.post('/requests', async (req, res) => {
    const requests = req.body;

        const { requestId, date, status, createdBy } = requests;
        const values = [requestId, date, status, createdBy];

        const sqlCheckDuplicate = 'SELECT COUNT(*) AS count FROM requests WHERE requestId = ?';
        const duplicateCheckResult = await new Promise((resolve, reject) => {
            db.query(sqlCheckDuplicate, [requestId], (err, result) => {
                if (err) {
                    console.error('Error in checking duplicate', err);
                    reject(err);
                } else {
                    resolve(result[0].count);
                }
            });
        });

        if (duplicateCheckResult === 0) {
            return new Promise((resolve, reject) => {
                const sqlInsert = 'INSERT INTO requests (requestId, date, status, createdBy) VALUES (?, ?, ?, ?)';
                db.query(sqlInsert, values, (err, result) => {
                    if (err) {
                        console.error('Error in inserting data', err);
                        reject(err);
                    } else {
                        resolve(result);
                        console.log("Inserted request");
                    }
                });
            });
        } else {
            return `Request with ID ${requestId} already exists.`;
        }
    });


app.patch('/update/comment/:requestID', (req, res) => {
    const requestID = req.params.requestID;
    const { comment, status,approveBy, approveDate } = req.body;

    db.beginTransaction(err => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).json({ error: 'Error starting transaction' });
        }

        const updateRequestsQuery = 'UPDATE requests SET comment = ?, status = ?, reviewer=?, reviewDate=? WHERE requestId = ?';
        const updateItemTableQuery = 'UPDATE item_table SET status = ?, reviewer=?, reviewDate=? WHERE requestId = ?';

        db.query(updateRequestsQuery, [comment, status,approveBy, approveDate, requestID], (err, result1) => {
            if (err) {
                db.rollback(() => {
                    console.error('Error executing query 1:', err);
                    return res.status(500).json({ error: 'Error updating requests' });
                });
            }

            db.query(updateItemTableQuery, [status,approveBy, approveDate,requestID], (err, result2) => {
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
    const { status,approveBy, approveDate  } = req.body;

    db.beginTransaction(err => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).json({ error: 'Error starting transaction' });
        }

        const sql1 = "UPDATE requests SET status = ?, reviewer = ?, reviewDate = ? WHERE requestId = ? AND status <> 'Semi-Finished'";
        const sql2 = 'UPDATE item_table SET status = ?, reviewer=?, reviewDate=? WHERE requestId = ?';

        db.query(sql1, [status,approveBy, approveDate, requestID], (err, result1) => {
            if (err) {
                db.rollback(() => {
                    console.error('Error executing query 1:', err);
                    return res.status(500).json({ error: 'Error updating requests' });
                });
            }

            db.query(sql2, [status,approveBy, approveDate, requestID], (err, result2) => {
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
    const itemId = req.params.itemId;
    const { newStatus, approveBy, approveDate, requestID } = req.body;

    if (!newStatus && !approveBy && !approveDate) {
        return res.status(400).json({ error: 'Missing status in request body' });
    }

    const sql = 'UPDATE item_table SET status = ?, reviewer = ?, reviewDate = ? WHERE itemId = ?';
    const updateReq = 'UPDATE requests SET status = ?, reviewer = ?, reviewDate = ? WHERE requestId = ?'; // Use placeholders

    db.query(sql, [newStatus, approveBy, approveDate, itemId], (err, result) => {
        if (err) {
            console.error('Error updating data:', err);
            return res.status(500).json({ error: 'Failed to update data in the database' });
        }
        db.query(updateReq, ['Semi-Finished',approveBy, approveDate, requestID], (err, result) => {
            if (err) {
                console.error('Error updating data:', err);
                return res.status(500).json({ error: 'Failed to update data in requests' });
            }
            res.status(200).json({ message: 'Data updated successfully' });
        });
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

app.get('/item-table/status/:status/', (req, res) => {
    const itemStatus = req.params.status;
    const sql = 'SELECT * FROM item_table WHERE status = ?';
    const updateReq= 
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
    
    app.delete('/delete/itemId/:itemId', (req,res)=>{
        const itemId = req.params.itemId;
        const sql= 'DELETE FROM item_table WHERE itemId= ?;'
        db.query(sql, [itemId], (err, result) => {
            if (err) {
                console.error('Error in Deleteing Item', err);
                return res.status(500).send('Failed to Delete Item from item table');
            } else{
                console.log('Deleted successfully');
            }
    
            res.status(200).json(result);
        });
    })

    app.patch('/update/item/:itemId/status', (req, res) => {
        const itemId = req.params.itemId; 
        const { comment, status, approveBy, approveDate, requestID } = req.body;
    
        const updateItemSql = 'UPDATE item_table SET comment=?, status=?, reviewer=?, reviewDate=? WHERE itemId=?';
        const updateRequestSql = 'UPDATE requests SET status=?, reviewer=?, reviewDate=? WHERE requestId=?';
    
        // Update item_table
        db.query(updateItemSql, [comment, status, approveBy, approveDate, itemId], (err, itemResult) => {
            if (err) {
                console.error('Error updating item status:', err);
                return res.status(500).json({ error: 'Error updating item status' });
            } else {
                console.log("Comment added and status updated for item:", itemId);
                
                // Update requests
                db.query(updateRequestSql, ['Semi-Finished',approveBy, approveDate, requestID], (err, requestResult) => {
                    if (err) {
                        console.error('Error updating request status:', err);
                        return res.status(500).json({ error: 'Error updating request status' });
                    } else {
                        console.log("Status updated for request:", requestID);
                        return res.status(200).json({ message: 'Status updated successfully' });
                    }
                });
            }
        });
    });
    

app.patch('/edit/item/:itemId', (req, res) => {
    const itemId = req.params.itemId;
    const { itemName, purpuse, quantity, unit, unitPrice, totalPrice, createdBy, requesterName, status } = req.body;

    if (!itemId) {
        return res.status(400).json({ message: 'Missing itemId in URL' });
    }

    if (!itemName && !purpuse && !quantity && !unit && !unitPrice && !totalPrice && !createdBy && !requesterName && !status) {
        return res.status(400).json({ message: 'Request body is empty' });
    }

    const sql = 'UPDATE item_table SET itemName =?, purpuse=?, quantity=?, unit=?, unitPrice=?, totalPrice=?, createdBy=?, requesterName=?, status=? WHERE  itemId = ?';
    db.query(sql, [itemName, purpuse, quantity, unit, unitPrice, totalPrice, createdBy, requesterName, status, itemId], (err, result) => {
        if (err) {
            console.error('Error in Editing Items', err);
            return res.status(500).json({ message: 'Error in editing Item' });
        } else {
            console.log(itemId, ": Edit item Sucessfully");
            return res.status(200).json({ message: 'Edit item Sucessfully' });
        }
    });
})



app.listen(PORT, () => {
    console.log(`Server is ON on http://localhost:${PORT}`);
});
