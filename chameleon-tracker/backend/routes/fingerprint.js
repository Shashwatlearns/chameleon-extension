// Fingerprint API Routes
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Fingerprint Schema
const fingerprintSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    fingerprint: {
        type: Object,
        required: true
    },
    firstSeen: {
        type: Date,
        default: Date.now
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    visitCount: {
        type: Number,
        default: 1
    }
});

const Fingerprint = mongoose.model('Fingerprint', fingerprintSchema);

let memoryStore = [];

// POST /api/fingerprint - Save or update fingerprint
router.post('/', async (req, res) => {
    try {
        const { id, fingerprint } = req.body;

        if (!id || !fingerprint) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: id and fingerprint'
            });
        }

        if (global.mongoConnected === false) {
            let existing = memoryStore.find(f => f.id === id);
            if (existing) {
                existing.lastSeen = new Date();
                existing.visitCount += 1;
                existing.fingerprint = fingerprint;
                return res.status(200).json({
                    success: true, isNewVisitor: false, message: 'Returning visitor detected',
                    ...existing
                });
            } else {
                let newRecord = { id, fingerprint, firstSeen: new Date(), lastSeen: new Date(), visitCount: 1 };
                memoryStore.push(newRecord);
                return res.status(201).json({
                    success: true, isNewVisitor: true, message: 'New visitor recorded',
                    ...newRecord
                });
            }
        }

        // Check if fingerprint already exists
        let existingFingerprint = await Fingerprint.findOne({ id });

        if (existingFingerprint) {
            // Returning visitor - update lastSeen and increment visitCount
            existingFingerprint.lastSeen = new Date();
            existingFingerprint.visitCount += 1;
            existingFingerprint.fingerprint = fingerprint; // Update fingerprint data
            
            await existingFingerprint.save();

            return res.status(200).json({
                success: true,
                isNewVisitor: false,
                message: 'Returning visitor detected',
                id: existingFingerprint.id,
                firstSeen: existingFingerprint.firstSeen,
                lastSeen: existingFingerprint.lastSeen,
                visitCount: existingFingerprint.visitCount
            });
        } else {
            // New visitor - create new record
            const newFingerprint = new Fingerprint({
                id,
                fingerprint
            });

            await newFingerprint.save();

            return res.status(201).json({
                success: true,
                isNewVisitor: true,
                message: 'New visitor recorded',
                id: newFingerprint.id,
                firstSeen: newFingerprint.firstSeen,
                lastSeen: newFingerprint.lastSeen,
                visitCount: newFingerprint.visitCount
            });
        }
    } catch (error) {
        console.error('Error saving fingerprint:', error);
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Fingerprint ID already exists'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// GET /api/fingerprint/all - Retrieve all fingerprints
router.get('/all', async (req, res) => {
    try {
        if (global.mongoConnected === false) {
            const fingerprints = [...memoryStore].sort((a, b) => b.lastSeen - a.lastSeen);
            return res.status(200).json({
                success: true,
                count: fingerprints.length,
                data: fingerprints
            });
        }

        const fingerprints = await Fingerprint.find()
            .select('id firstSeen lastSeen visitCount')
            .sort({ lastSeen: -1 });

        return res.status(200).json({
            success: true,
            count: fingerprints.length,
            data: fingerprints
        });
    } catch (error) {
        console.error('Error retrieving fingerprints:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// GET /api/fingerprint/:id - Get specific fingerprint by ID
router.get('/:id', async (req, res) => {
    try {
        const fingerprint = await Fingerprint.findOne({ id: req.params.id });

        if (!fingerprint) {
            return res.status(404).json({
                success: false,
                message: 'Fingerprint not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: fingerprint
        });
    } catch (error) {
        console.error('Error retrieving fingerprint:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});
// DELETE /api/fingerprint/all - Clear all records (dashboard use only)
router.delete('/all', async (req, res) => {
    try {
        await Fingerprint.deleteMany({});
        return res.status(200).json({
            success: true,
            message: 'All fingerprint records deleted'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});
module.exports = router;