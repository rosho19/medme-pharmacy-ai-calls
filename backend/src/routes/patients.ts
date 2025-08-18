import express from 'express';
import { body } from 'express-validator';
import {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
} from '../controllers/patientController';

const router = express.Router();

// Validation rules
const patientValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').isMobilePhone('any').withMessage('Valid phone number is required'),
  body('address').optional().isString(),
  body('medicationInfo').optional().isObject(),
];

// Routes
router.get('/', getPatients);
router.get('/:id', getPatient);
router.post('/', patientValidation, createPatient);
router.put('/:id', patientValidation, updatePatient);
router.delete('/:id', deletePatient);

export default router;
