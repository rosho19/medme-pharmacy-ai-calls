import express from 'express';
import { body } from 'express-validator';
import {
  getCalls,
  getCall,
  createCall,
  updateCallStatus,
  deleteCall,
} from '../controllers/callController';

const router = express.Router();

// Validation rules
const callValidation = [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
];

const statusValidation = [
  body('status').isIn(['PENDING','IN_PROGRESS','COMPLETED','FAILED','CANCELLED']).withMessage('Invalid status'),
  body('summary').optional().isString(),
  body('structuredData').optional().isObject(),
  body('callSid').optional().isString(),
];

// Routes
router.get('/', getCalls);
router.get('/:id', getCall);
router.post('/', callValidation, createCall);
router.patch('/:id/status', statusValidation, updateCallStatus);
router.delete('/:id', deleteCall);

export default router;
