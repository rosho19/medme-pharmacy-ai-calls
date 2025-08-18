import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';

// @desc    Get all patients
// @route   GET /api/patients
// @access  Public
export const getPatients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = search
      ? {
          OR: [
            { name: { contains: String(search), mode: 'insensitive' as const } },
            { phone: { contains: String(search) } },
          ],
        }
      : {};

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          calls: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      }),
      prisma.patient.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: patients,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single patient
// @route   GET /api/patients/:id
// @access  Public
export const getPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        calls: {
          orderBy: { createdAt: 'desc' },
          include: {
            callLogs: {
              orderBy: { timestamp: 'desc' },
            },
          },
        },
      },
    });

    if (!patient) {
      res.status(404).json({
        success: false,
        error: 'Patient not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new patient
// @route   POST /api/patients
// @access  Public
export const createPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
      return;
    }

    const { name, phone, address, medicationInfo } = req.body;

    // Check if patient with phone already exists
    const existingPatient = await prisma.patient.findUnique({
      where: { phone },
    });

    if (existingPatient) {
      res.status(400).json({
        success: false,
        error: 'Patient with this phone number already exists',
      });
      return;
    }

    const patient = await prisma.patient.create({
      data: {
        name,
        phone,
        address,
        medicationInfo,
      },
    });

    res.status(201).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Public
export const updatePatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
      return;
    }

    const { id } = req.params;
    const { name, phone, address, medicationInfo } = req.body;

    // Check if patient exists
    const existingPatient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!existingPatient) {
      res.status(404).json({
        success: false,
        error: 'Patient not found',
      });
      return;
    }

    // Check if phone is being changed and if it conflicts with another patient
    if (phone !== existingPatient.phone) {
      const phoneConflict = await prisma.patient.findUnique({
        where: { phone },
      });

      if (phoneConflict) {
        res.status(400).json({
          success: false,
          error: 'Phone number already exists for another patient',
        });
        return;
      }
    }

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        name,
        phone,
        address,
        medicationInfo,
      },
    });

    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Public
export const deletePatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      res.status(404).json({
        success: false,
        error: 'Patient not found',
      });
      return;
    }

    await prisma.patient.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Patient deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
