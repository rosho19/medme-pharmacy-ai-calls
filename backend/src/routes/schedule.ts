import express from 'express'
import { createSchedule, listSchedules, getSchedule, cancelSchedule, scheduleValidation } from '../controllers/scheduleController'

const router = express.Router()

router.get('/', listSchedules)
router.get('/:id', getSchedule)
router.post('/', scheduleValidation as any, createSchedule)
router.post('/:id/cancel', cancelSchedule)

export default router


