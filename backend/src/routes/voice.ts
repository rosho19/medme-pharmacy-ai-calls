import express from 'express';
import { handleVapiWebhook } from '../controllers/voiceController';
import { verifyVapiSignature } from '../middleware/verifyVapiSignature';

const router = express.Router();

router.post('/webhook', verifyVapiSignature, handleVapiWebhook);

export default router;
