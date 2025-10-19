import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import puppeteer from 'puppeteer';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { allowRoles, requireAuth } from './middleware/auth';
import { logAuditEvent, createAuditDiff } from './utils/audit';

const app = express();
const prisma = new PrismaClient();
const PORT = parseInt(process.env.PORT || '4000', 10);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.WEB_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(limiter);

// Multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

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

const ChargeSchema = z.object({
  horseId: z.string(),
  date: z.string().datetime(),
  description: z.string(),
  qty: z.number(),
  unitPrice: z.number(),
  category: z.enum(['board', 'training', 'med', 'misc']).optional(),
});

const InvoiceSchema = z.object({
  horseId: z.string().optional(),
  periodFrom: z.string().datetime(),
  periodTo: z.string().datetime(),
});

const InvoiceUpdateSchema = z.object({
  status: z.enum(['draft', 'sent', 'paid']).optional(),
  externalPaymentUrl: z.string().url().optional(),
});

const HorseImportSchema = z.object({
  name: z.string(),
  microchipId: z.string().optional(),
  passportNo: z.string().optional(),
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

    // Log audit event
    await logAuditEvent({
      entityType: 'Vitals',
      entityId: vitals.id,
      action: 'CREATE',
      changedBy: req.user?.id,
      diffJson: JSON.stringify(validatedData),
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
app.post('/vaccinations', allowRoles('MANAGER', 'VET'), async (req, res) => {
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
app.post('/administrations', allowRoles('MANAGER', 'VET'), async (req, res) => {
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
app.post('/prescriptions', allowRoles('MANAGER', 'VET'), async (req, res) => {
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

    // Log audit event
    await logAuditEvent({
      entityType: 'Prescription',
      entityId: prescription.id,
      action: 'CREATE',
      changedBy: req.user?.id,
      diffJson: JSON.stringify(validatedData),
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
app.get('/horses/:horseId/prescriptions', requireAuth, async (req, res) => {
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

/**
 * @swagger
 * /billing/charges:
 *   post:
 *     summary: Create a new charge
 *     tags: [Billing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - horseId
 *               - date
 *               - description
 *               - qty
 *               - unitPrice
 *             properties:
 *               horseId:
 *                 type: string
 *                 description: ID of the horse
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Date of the charge
 *               description:
 *                 type: string
 *                 description: Description of the charge
 *               qty:
 *                 type: number
 *                 description: Quantity
 *               unitPrice:
 *                 type: number
 *                 description: Unit price
 *               category:
 *                 type: string
 *                 enum: [board, training, med, misc]
 *                 description: Charge category
 *     responses:
 *       201:
 *         description: Charge created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Charge'
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */
app.post('/billing/charges', allowRoles('MANAGER', 'BILLING'), async (req, res) => {
  try {
    const validatedData = ChargeSchema.parse(req.body);
    
    const charge = await prisma.charge.create({
      data: {
        horseId: validatedData.horseId,
        date: new Date(validatedData.date),
        description: validatedData.description,
        qty: validatedData.qty,
        unitPrice: validatedData.unitPrice,
        category: validatedData.category,
      },
      include: {
        horse: true,
      },
    });

    res.status(201).json(charge);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request data', details: error.errors });
    } else {
      console.error('Error creating charge:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * @swagger
 * /billing/charges:
 *   get:
 *     summary: Get charges with optional filters
 *     tags: [Billing]
 *     parameters:
 *       - in: query
 *         name: horseId
 *         schema:
 *           type: string
 *         description: Filter by horse ID
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter charges from this date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter charges to this date
 *     responses:
 *       200:
 *         description: Charges retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Charge'
 *       500:
 *         description: Internal server error
 */
app.get('/billing/charges', requireAuth, async (req, res) => {
  try {
    const { horseId, from, to } = req.query;
    
    const where: any = {};
    if (horseId) where.horseId = horseId;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from as string);
      if (to) where.date.lte = new Date(to as string);
    }

    const charges = await prisma.charge.findMany({
      where,
      include: {
        horse: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    res.json(charges);
  } catch (error) {
    console.error('Error fetching charges:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /billing/invoices:
 *   post:
 *     summary: Create an invoice from charges in a date range
 *     tags: [Billing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - periodFrom
 *               - periodTo
 *             properties:
 *               horseId:
 *                 type: string
 *                 description: Filter by horse ID (optional)
 *               periodFrom:
 *                 type: string
 *                 format: date-time
 *                 description: Start date for invoice period
 *               periodTo:
 *                 type: string
 *                 format: date-time
 *                 description: End date for invoice period
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Invoice'
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */
app.post('/billing/invoices', allowRoles('MANAGER', 'BILLING'), async (req, res) => {
  try {
    const validatedData = InvoiceSchema.parse(req.body);
    
    // Find charges in the date range
    const where: any = {
      date: {
        gte: new Date(validatedData.periodFrom),
        lte: new Date(validatedData.periodTo),
      },
    };
    
    if (validatedData.horseId) {
      where.horseId = validatedData.horseId;
    }

    const charges = await prisma.charge.findMany({
      where,
      include: {
        horse: true,
      },
    });

    if (charges.length === 0) {
      return res.status(400).json({ error: 'No charges found in the specified period' });
    }

    // Calculate total
    const total = charges.reduce((sum, charge) => sum + (charge.qty * charge.unitPrice), 0);

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        number: invoiceNumber,
        periodFrom: new Date(validatedData.periodFrom),
        periodTo: new Date(validatedData.periodTo),
        horseId: validatedData.horseId,
        total,
        items: {
          create: charges.map(charge => ({
            chargeId: charge.id,
          })),
        },
      },
      include: {
        items: {
          include: {
            charge: {
              include: {
                horse: true,
              },
            },
          },
        },
        horse: true,
      },
    });

    res.status(201).json(invoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request data', details: error.errors });
    } else {
      console.error('Error creating invoice:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * @swagger
 * /billing/invoices/{id}:
 *   get:
 *     summary: Get invoice by ID
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Invoice'
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Internal server error
 */
app.get('/billing/invoices/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            charge: {
              include: {
                horse: true,
              },
            },
          },
        },
        horse: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /billing/invoices/{id}/pdf:
 *   get:
 *     summary: Generate PDF for invoice
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: PDF generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Internal server error
 */
app.get('/billing/invoices/:id/pdf', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            charge: {
              include: {
                horse: true,
              },
            },
          },
        },
        horse: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.number}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .invoice-details { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { font-weight: bold; font-size: 1.2em; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Invoice ${invoice.number}</h1>
          <p>Period: ${invoice.periodFrom.toLocaleDateString()} - ${invoice.periodTo.toLocaleDateString()}</p>
        </div>
        
        <div class="invoice-details">
          <p><strong>Status:</strong> ${invoice.status}</p>
          ${invoice.horse ? `<p><strong>Horse:</strong> ${invoice.horse.name}</p>` : ''}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${item.charge.date.toLocaleDateString()}</td>
                <td>${item.charge.description}</td>
                <td>${item.charge.qty}</td>
                <td>$${item.charge.unitPrice.toFixed(2)}</td>
                <td>$${(item.charge.qty * item.charge.unitPrice).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="total">
              <td colspan="4">Total</td>
              <td>$${invoice.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;

    await page.setContent(html);
    const pdf = await page.pdf({ format: 'A4' });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.number}.pdf"`);
    res.send(pdf);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /billing/invoices/{id}:
 *   patch:
 *     summary: Update invoice status or external payment URL
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, sent, paid]
 *                 description: Invoice status
 *               externalPaymentUrl:
 *                 type: string
 *                 format: uri
 *                 description: External payment URL
 *     responses:
 *       200:
 *         description: Invoice updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Invoice'
 *       404:
 *         description: Invoice not found
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */
app.patch('/billing/invoices/:id', allowRoles('MANAGER', 'BILLING'), async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = InvoiceUpdateSchema.parse(req.body);
    
    const invoice = await prisma.invoice.update({
      where: { id },
      data: validatedData,
      include: {
        items: {
          include: {
            charge: {
              include: {
                horse: true,
              },
            },
          },
        },
        horse: true,
      },
    });

    res.json(invoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request data', details: error.errors });
    } else {
      console.error('Error updating invoice:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * @swagger
 * /import/horses-csv:
 *   post:
 *     summary: Import horses from CSV file
 *     tags: [Import/Export]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file with horse data
 *     responses:
 *       200:
 *         description: Horses imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imported:
 *                   type: number
 *                   description: Number of horses imported
 *                 horses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Horse'
 *       400:
 *         description: Invalid CSV file
 *       500:
 *         description: Internal server error
 */
app.post('/import/horses-csv', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const csvData = req.file.buffer.toString('utf-8');
    const lines = csvData.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV file must have at least a header and one data row' });
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const horses = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) continue;

      const horseData: any = {};
      headers.forEach((header, index) => {
        const value = values[index];
        if (value && value !== '') {
          switch (header.toLowerCase()) {
            case 'name':
              horseData.name = value;
              break;
            case 'microchipid':
              horseData.microchipId = value;
              break;
            case 'passportno':
              horseData.passportNo = value;
              break;
          }
        }
      });

      if (horseData.name) {
        const horse = await prisma.horse.create({
          data: horseData,
        });
        horses.push(horse);
      }
    }

    res.json({ imported: horses.length, horses });
  } catch (error) {
    console.error('Error importing horses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /export/vaccinations.csv:
 *   get:
 *     summary: Export vaccinations to CSV
 *     tags: [Import/Export]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Export vaccinations from this date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Export vaccinations to this date
 *     responses:
 *       200:
 *         description: CSV file generated successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       500:
 *         description: Internal server error
 */
app.get('/export/vaccinations.csv', async (req, res) => {
  try {
    const { from, to } = req.query;
    
    const where: any = {};
    if (from || to) {
      where.doseDatetime = {};
      if (from) where.doseDatetime.gte = new Date(from as string);
      if (to) where.doseDatetime.lte = new Date(to as string);
    }

    const vaccinations = await prisma.vaccination.findMany({
      where,
      include: {
        horse: true,
      },
      orderBy: {
        doseDatetime: 'desc',
      },
    });

    const csvHeaders = 'Horse Name,Product,Batch No,Expiry Date,Dose Date,Site,Vet ID\n';
    const csvRows = vaccinations.map(v => 
      `"${v.horse.name}","${v.product}","${v.batchNo || ''}","${v.expiryDate?.toISOString().split('T')[0] || ''}","${v.doseDatetime.toISOString().split('T')[0]}","${v.site || ''}","${v.vetId || ''}"`
    ).join('\n');

    const csv = csvHeaders + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="vaccinations.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting vaccinations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /export/administrations.csv:
 *   get:
 *     summary: Export administrations to CSV
 *     tags: [Import/Export]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Export administrations from this date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Export administrations to this date
 *     responses:
 *       200:
 *         description: CSV file generated successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       500:
 *         description: Internal server error
 */
app.get('/export/administrations.csv', async (req, res) => {
  try {
    const { from, to } = req.query;
    
    const where: any = {};
    if (from || to) {
      where.datetimeLocal = {};
      if (from) where.datetimeLocal.gte = new Date(from as string);
      if (to) where.datetimeLocal.lte = new Date(to as string);
    }

    const administrations = await prisma.administration.findMany({
      where,
      include: {
        horse: true,
        rxItem: {
          include: {
            med: true,
          },
        },
      },
      orderBy: {
        datetimeLocal: 'desc',
      },
    });

    const csvHeaders = 'Horse Name,Medication,Actual Dose,Route,Batch No,Lot No,Expiry Date,Barcode,Notes,Date\n';
    const csvRows = administrations.map(a => 
      `"${a.horse.name}","${a.rxItem.med.generic}","${a.actualDose || ''}","${a.route || ''}","${a.batchNo || ''}","${a.lotNo || ''}","${a.expiryDate?.toISOString().split('T')[0] || ''}","${a.barcodeValue || ''}","${a.notes || ''}","${a.datetimeLocal.toISOString().split('T')[0]}"`
    ).join('\n');

    const csv = csvHeaders + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="administrations.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting administrations:', error);
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
 *     Charge:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         horseId:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         description:
 *           type: string
 *         qty:
 *           type: number
 *         unitPrice:
 *           type: number
 *         category:
 *           type: string
 *           enum: [board, training, med, misc]
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         horse:
 *           $ref: '#/components/schemas/Horse'
 *     Invoice:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         number:
 *           type: string
 *         periodFrom:
 *           type: string
 *           format: date-time
 *         periodTo:
 *           type: string
 *           format: date-time
 *         horseId:
 *           type: string
 *           nullable: true
 *         total:
 *           type: number
 *         status:
 *           type: string
 *           enum: [draft, sent, paid]
 *         externalPaymentUrl:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         horse:
 *           $ref: '#/components/schemas/Horse'
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               chargeId:
 *                 type: string
 *               charge:
 *                 $ref: '#/components/schemas/Charge'
 *     Horse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         microchipId:
 *           type: string
 *           nullable: true
 *         passportNo:
 *           type: string
 *           nullable: true
 *         eahsNo:
 *           type: string
 *           nullable: true
 *         feiNo:
 *           type: string
 *           nullable: true
 *         noRide:
 *           type: boolean
 *         medicalAlert:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
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