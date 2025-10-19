import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const app = express();
const prisma = new PrismaClient();
const PORT = parseInt(process.env.PORT || '4000', 10);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EquiOps API',
      version: '1.0.0',
      description: 'API for horse management system',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/server.ts'], // Path to the API files
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Validation schemas
const VitalsSchema = z.object({
  horseId: z.string(),
  temperatureC: z.number().nullable().optional(),
  heartRateBpm: z.number().nullable().optional(),
  respiratoryRateBpm: z.number().nullable().optional(),
  source: z.enum(['manual', 'microchip', 'device_webhook']),
  when: z.string().datetime(),
});

const VaccinationSchema = z.object({
  horseId: z.string(),
  product: z.string(),
  batchNo: z.string().optional(),
  expiryDate: z.string().datetime().optional(),
  doseDatetime: z.string().datetime(),
  site: z.string().optional(),
  vetId: z.string().optional(),
});

const AdministrationSchema = z.object({
  rxItemId: z.string(),
  horseId: z.string(),
  datetimeLocal: z.string().datetime(),
  actualDose: z.number().optional(),
  route: z.string().optional(),
  batchNo: z.string().optional(),
  lotNo: z.string().optional(),
  expiryDate: z.string().datetime().optional(),
  barcodeValue: z.string().optional(),
  notes: z.string().optional(),
});

const PrescriptionItemSchema = z.object({
  medId: z.string(),
  doseAmount: z.number(),
  doseUnit: z.string(),
  route: z.string(),
  frequency: z.string(),
  durationDays: z.number(),
  withholdingHours: z.number().optional(),
});

const PrescriptionSchema = z.object({
  horseId: z.string(),
  vetId: z.string(),
  diagnosis: z.string().optional(),
  items: z.array(PrescriptionItemSchema),
});

/**
 * @swagger
 * /healthz:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 */
app.get('/healthz', (req, res) => {
  res.json({ ok: true });
});

/**
 * @swagger
 * /vitals:
 *   post:
 *     summary: Create a new vitals record
 *     tags: [Vitals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - horseId
 *               - source
 *               - when
 *             properties:
 *               horseId:
 *                 type: string
 *                 description: ID of the horse
 *               temperatureC:
 *                 type: number
 *                 nullable: true
 *                 description: Temperature in Celsius
 *               heartRateBpm:
 *                 type: number
 *                 nullable: true
 *                 description: Heart rate in beats per minute
 *               respiratoryRateBpm:
 *                 type: number
 *                 nullable: true
 *                 description: Respiratory rate in breaths per minute
 *               source:
 *                 type: string
 *                 enum: [manual, microchip, device_webhook]
 *                 description: Source of the vitals data
 *               when:
 *                 type: string
 *                 format: date-time
 *                 description: ISO datetime when vitals were recorded
 *     responses:
 *       201:
 *         description: Vitals record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vitals'
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */
app.post('/vitals', async (req, res) => {
  try {
    const validatedData = VitalsSchema.parse(req.body);
    
    const vitals = await prisma.vitals.create({
      data: {
        horseId: validatedData.horseId,
        temperatureC: validatedData.temperatureC,
        heartRateBpm: validatedData.heartRateBpm,
        respiratoryRateBpm: validatedData.respiratoryRateBpm,
        source: validatedData.source,
        datetimeLocal: new Date(validatedData.when),
      },
    });

    res.status(201).json(vitals);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request data', details: error.errors });
    } else {
      console.error('Error creating vitals:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * @swagger
 * /vaccinations:
 *   post:
 *     summary: Create a new vaccination record
 *     tags: [Vaccinations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - horseId
 *               - product
 *               - doseDatetime
 *             properties:
 *               horseId:
 *                 type: string
 *                 description: ID of the horse
 *               product:
 *                 type: string
 *                 description: Vaccination product name
 *               batchNo:
 *                 type: string
 *                 description: Batch number
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *                 description: Expiry date of the vaccine
 *               doseDatetime:
 *                 type: string
 *                 format: date-time
 *                 description: ISO datetime when vaccination was administered
 *               site:
 *                 type: string
 *                 description: Injection site
 *               vetId:
 *                 type: string
 *                 description: ID of the veterinarian
 *     responses:
 *       201:
 *         description: Vaccination record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vaccination'
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */
app.post('/vaccinations', async (req, res) => {
  try {
    const validatedData = VaccinationSchema.parse(req.body);
    
    const vaccination = await prisma.vaccination.create({
      data: {
        horseId: validatedData.horseId,
        product: validatedData.product,
        batchNo: validatedData.batchNo,
        expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : null,
        doseDatetime: new Date(validatedData.doseDatetime),
        site: validatedData.site,
        vetId: validatedData.vetId,
      },
    });

    res.status(201).json(vaccination);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request data', details: error.errors });
    } else {
      console.error('Error creating vaccination:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * @swagger
 * /administrations:
 *   post:
 *     summary: Create a new administration record
 *     tags: [Administrations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rxItemId
 *               - horseId
 *               - datetimeLocal
 *             properties:
 *               rxItemId:
 *                 type: string
 *                 description: ID of the prescription item
 *               horseId:
 *                 type: string
 *                 description: ID of the horse
 *               datetimeLocal:
 *                 type: string
 *                 format: date-time
 *                 description: ISO datetime when medication was administered
 *               actualDose:
 *                 type: number
 *                 description: Actual dose administered
 *               route:
 *                 type: string
 *                 description: Administration route
 *               batchNo:
 *                 type: string
 *                 description: Batch number
 *               lotNo:
 *                 type: string
 *                 description: Lot number
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *                 description: Expiry date of the medication
 *               barcodeValue:
 *                 type: string
 *                 description: Barcode value scanned
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *     responses:
 *       201:
 *         description: Administration record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Administration'
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */
app.post('/administrations', async (req, res) => {
  try {
    const validatedData = AdministrationSchema.parse(req.body);
    
    const administration = await prisma.administration.create({
      data: {
        rxItemId: validatedData.rxItemId,
        horseId: validatedData.horseId,
        datetimeLocal: new Date(validatedData.datetimeLocal),
        actualDose: validatedData.actualDose,
        route: validatedData.route,
        batchNo: validatedData.batchNo,
        lotNo: validatedData.lotNo,
        expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : null,
        barcodeValue: validatedData.barcodeValue,
        notes: validatedData.notes,
      },
    });

    res.status(201).json(administration);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request data', details: error.errors });
    } else {
      console.error('Error creating administration:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * @swagger
 * /prescriptions:
 *   post:
 *     summary: Create a new prescription with items
 *     tags: [Prescriptions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - horseId
 *               - vetId
 *               - items
 *             properties:
 *               horseId:
 *                 type: string
 *                 description: ID of the horse
 *               vetId:
 *                 type: string
 *                 description: ID of the veterinarian
 *               diagnosis:
 *                 type: string
 *                 description: Diagnosis or reason for prescription
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - medId
 *                     - doseAmount
 *                     - doseUnit
 *                     - route
 *                     - frequency
 *                     - durationDays
 *                   properties:
 *                     medId:
 *                       type: string
 *                       description: ID of the medication
 *                     doseAmount:
 *                       type: number
 *                       description: Dose amount
 *                     doseUnit:
 *                       type: string
 *                       description: Dose unit (ml, mg, etc.)
 *                     route:
 *                       type: string
 *                       description: Administration route (IV, IM, PO, etc.)
 *                     frequency:
 *                       type: string
 *                       description: Frequency (e.g., "BID", "TID", "Q8H")
 *                     durationDays:
 *                       type: number
 *                       description: Duration in days
 *                     withholdingHours:
 *                       type: number
 *                       description: Withholding period in hours
 *     responses:
 *       201:
 *         description: Prescription created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Prescription'
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */
app.post('/prescriptions', async (req, res) => {
  try {
    const validatedData = PrescriptionSchema.parse(req.body);
    
    const prescription = await prisma.prescription.create({
      data: {
        horseId: validatedData.horseId,
        vetId: validatedData.vetId,
        diagnosis: validatedData.diagnosis,
        items: {
          create: validatedData.items.map(item => ({
            medId: item.medId,
            doseAmount: item.doseAmount,
            doseUnit: item.doseUnit,
            route: item.route,
            frequency: item.frequency,
            durationDays: item.durationDays,
            withholdingHours: item.withholdingHours,
          })),
        },
      },
      include: {
        items: {
          include: {
            med: true,
          },
        },
      },
    });

    res.status(201).json(prescription);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request data', details: error.errors });
    } else {
      console.error('Error creating prescription:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * @swagger
 * /horses/{horseId}/prescriptions:
 *   get:
 *     summary: Get prescriptions for a specific horse
 *     tags: [Prescriptions]
 *     parameters:
 *       - in: path
 *         name: horseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the horse
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter for active prescriptions (default true)
 *     responses:
 *       200:
 *         description: Prescriptions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Prescription'
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Internal server error
 */
app.get('/horses/:horseId/prescriptions', async (req, res) => {
  try {
    const { horseId } = req.params;
    const active = req.query.active === 'true' || req.query.active === undefined;
    
    const prescriptions = await prisma.prescription.findMany({
      where: {
        horseId,
        // For now, all prescriptions are considered active
        // In the future, we could add an active field or check dates
      },
      include: {
        items: {
          include: {
            med: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Swagger schema definitions
/**
 * @swagger
 * components:
 *   schemas:
 *     Vitals:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         horseId:
 *           type: string
 *         recordedByUserId:
 *           type: string
 *           nullable: true
 *         datetimeLocal:
 *           type: string
 *           format: date-time
 *         temperatureC:
 *           type: number
 *           nullable: true
 *         heartRateBpm:
 *           type: number
 *           nullable: true
 *         respiratoryRateBpm:
 *           type: number
 *           nullable: true
 *         source:
 *           type: string
 *           enum: [manual, microchip, device_webhook]
 *     Vaccination:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         horseId:
 *           type: string
 *         product:
 *           type: string
 *         batchNo:
 *           type: string
 *           nullable: true
 *         expiryDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         doseDatetime:
 *           type: string
 *           format: date-time
 *         site:
 *           type: string
 *           nullable: true
 *         vetId:
 *           type: string
 *           nullable: true
 *     Administration:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         rxItemId:
 *           type: string
 *         horseId:
 *           type: string
 *         datetimeLocal:
 *           type: string
 *           format: date-time
 *         actualDose:
 *           type: number
 *           nullable: true
 *         route:
 *           type: string
 *           nullable: true
 *         batchNo:
 *           type: string
 *           nullable: true
 *         lotNo:
 *           type: string
 *           nullable: true
 *         expiryDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         barcodeValue:
 *           type: string
 *           nullable: true
 *         notes:
 *           type: string
 *           nullable: true
 *     Prescription:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         horseId:
 *           type: string
 *         vetId:
 *           type: string
 *         diagnosis:
 *           type: string
 *           nullable: true
 *         lockedByVet:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               medId:
 *                 type: string
 *               doseAmount:
 *                 type: number
 *               doseUnit:
 *                 type: string
 *               route:
 *                 type: string
 *               frequency:
 *                 type: string
 *               durationDays:
 *                 type: number
 *               withholdingHours:
 *                 type: number
 *                 nullable: true
 *               med:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   generic:
 *                     type: string
 *                   brand:
 *                     type: string
 *                     nullable: true
 *                   form:
 *                     type: string
 *                     nullable: true
 *                   strength:
 *                     type: string
 *                     nullable: true
 *                   unit:
 *                     type: string
 *                     nullable: true
 *                   routes:
 *                     type: array
 *                     items:
 *                       type: string
 *                   defaultWithholdingHours:
 *                     type: number
 *                     nullable: true
 */

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
  console.log(`API documentation available at http://0.0.0.0:${PORT}/docs`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});