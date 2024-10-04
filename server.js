// server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config(); // Load environment variables from .env file



const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:3000', // Specify the frontend URL
  methods: ['GET', 'POST'], // Specify the allowed HTTP methods (optional)
  credentials: true, // If your requests require cookies or authentication
}));
app.use(express.json());


// Function to get PayPal access token
const getPayPalAccessToken = async () => {
  const response = await axios({
    url: 'https://api-m.sandbox.paypal.com/v1/oauth2/token',
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      auth: {
        username: process.env.PAYPAL_CLIENT_ID,
        password: process.env.PAYPAL_SECRET
      },
      data: 'grant_type=client_credentials',
  });

  return response.data.access_token;
};

app.post('/api/paypal/create-order', async (req, res) => {
  try {
    const { amount } = req.body; // Get amount from request body

    const accessToken = await getPayPalAccessToken();

    const response = await axios({
        url: 'https://api-m.sandbox.paypal.com/v2/checkout/orders',
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        data: {
          intent: 'AUTHORIZE', // Set the intent to authorize
          purchase_units: [
            {
              amount: {
                currency_code: 'USD',
                value: amount,
              },
            },
          ],
        },
      });
      // console.log(response.data)
      res.json({ id: response.data.id });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
});

app.post('/api/paypal/authorize-order', async (req, res) => {
    const { orderID } = req.body;
  
    try {
      const accessToken = await getPayPalAccessToken();
  
      const response = await axios({
        url: `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/authorize`,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      console.log(response, response.data)
      if (response.status === 201) {
        res.json({ success: true, message: 'Order authorized successfully!', data: response.data});
      } else {
        res.status(400).json({ success: false, message: 'Failed to authorize order' });
      }
    } catch (error) {
      console.error('Error during authorization:', error);
      res.status(500).json({ success: false, message: 'Server error while authorizing order' });
    }
  });

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});