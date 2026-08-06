// Chameleon Tracker - Backend Server
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const connectDB = require('./db');
const fingerprintRoutes = require('./routes/fingerprint');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors()); // Enable CORS for frontend
app.use(bodyParser.json({ limit: '5mb' })); // Increased limit for canvas data
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/fingerprint', fingerprintRoutes);

// Root route - serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log('\n🚀 Chameleon Tracker Server Started');
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`🌐 Open http://localhost:${PORT} in your browser`);
    console.log(`💾 MongoDB URI: ${process.env.MONGO_URI}`);
    console.log('\n✨ Ready to track fingerprints!\n');
});