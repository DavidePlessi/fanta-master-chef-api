const express = require('express');
const cors = require('cors');
const connectDb = require('./config/db');

const app = express();
connectDb();

app.use(cors());
app.use(express.json());

app.get(
  '/',
  (req, res) => {
    res.send("I'm alive!")
  }
);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/deployments', require('./routes/deployments'));
app.use('/api/episodes', require('./routes/episodes'));
app.use('/api/fantaBrigades', require('./routes/fantaBrigades'));
app.use('/api/participants', require('./routes/participants'));
app.use('/api/users', require('./routes/users'));


const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`server started on port ${PORT}`));