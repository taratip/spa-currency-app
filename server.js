require('dotenv').config(); // read .env files
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

const bodyParser = require('body-parser');
const { getRates, getSymbols, getHistoricalRate } = require('./lib/fixer-service');
const { convertCurrency } = require('./lib/free-currency-service');

// Set pubic folder as root
app.use(express.static('public'));

// Allow front-end access to node_modules folder
app.use('/scripts', express.static(`${__dirname}/node_modules`));

// parse POST data as URL encoded data
app.use(bodyParser.urlencoded({
  extended: true,
}));

// parse POST data as json
app.use(bodyParser.json());

// Express Error Handle
const errorHandler = (err, req, res) => {
  if (err.response) {
    res.status(403).send({
      title: 'Server responded with an error',
      message: err.message
    });
  } else if (err.request) {
    // The request made but no response
    res.status(503).send({
      title: 'Unable to communicate with server',
      message: err.message
    });
  } else {
    // Something haapened
    res.status(500).send({
      title: 'An unexpected error occurred',
      message: err.message
    });
  }
};

// fetch latest currency rates
app.get('/api/rates', async(req,res) => {
  try {
    const data = await getRates();
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  } catch (error) {
    errorHandler(error, req, res);
  }
});

// Fetch symbols
app.get('/api/symbols', async (req,res) => {
    try {
      const data = await getSymbols();
      res.setHeader('Content-Type', 'application/json');
      res.send(data);
    } catch (error) {
      errorHandler(error, req, res);
    }
});

// Convert currency
app.post('/api/convert', async (req, res) => {
  try {
    const { from , to } = req.body;
    const data = await convertCurrency(from,to);
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  } catch (error) {
    errorHandler(error, req, res);
  }
});

// Fetch currency rates by date
app.post('/api/historical', async (req, res) => {
  try {
    const { date } = req.body;
    const data = await getHistoricalRate(date);
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  } catch (error) {
    errorHandler(error, req, res);
  }
});

// Redirect all traffic to index.html
app.use((req, res) => res.sendFile(`${__dirname}/public/index.html`));

// Listen for HTTP requests on port 3000
app.listen(port, () => {
  console.log('listening on %d', port);
});

// const test = async() => {
//   const data = await getSymbols();
//   console.log(data);
// }

// const test = async() => {
//   const data = await convertCurrency('USD', 'KES');
//   console.log(data);
// }
//
// 
// const test = async() => {
//   const data = await getHistoricalRate('2012-07-14');
//   console.log(data);
// }
// test();
