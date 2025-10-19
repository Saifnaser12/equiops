"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = parseInt(process.env.PORT || '4000', 10);
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
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
const specs = (0, swagger_jsdoc_1.default)(swaggerOptions);
app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs));
// Validation schemas
const VitalsSchema = zod_1.z.object({
    horseId: zod_1.z.string(),
    temperatureC: zod_1.z.number().nullable().optional(),
    heartRateBpm: zod_1.z.number().nullable().optional(),
    respiratoryRateBpm: zod_1.z.number().nullable().optional(),
    source: zod_1.z.enum(['manual', 'microchip', 'device_webhook']),
    when: zod_1.z.string().datetime(),
});
const VaccinationSchema = zod_1.z.object({
    horseId: zod_1.z.string(),
    product: zod_1.z.string(),
    batchNo: zod_1.z.string().optional(),
    expiryDate: zod_1.z.string().datetime().optional(),
    doseDatetime: zod_1.z.string().datetime(),
    site: zod_1.z.string().optional(),
    vetId: zod_1.z.string().optional(),
});
const AdministrationSchema = zod_1.z.object({
    rxItemId: zod_1.z.string(),
    horseId: zod_1.z.string(),
    datetimeLocal: zod_1.z.string().datetime(),
    actualDose: zod_1.z.number().optional(),
    route: zod_1.z.string().optional(),
    batchNo: zod_1.z.string().optional(),
    lotNo: zod_1.z.string().optional(),
    expiryDate: zod_1.z.string().datetime().optional(),
    barcodeValue: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Invalid request data', details: error.errors });
        }
        else {
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Invalid request data', details: error.errors });
        }
        else {
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Invalid request data', details: error.errors });
        }
        else {
            console.error('Error creating administration:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
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
 */
// Error handling middleware
app.use((err, req, res, next) => {
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
//# sourceMappingURL=server.js.map