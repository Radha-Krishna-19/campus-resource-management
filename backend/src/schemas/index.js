const { z } = require("zod");

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
  role: z.enum(["coordinator", "admin"])
});

const registerSchema = z.object({
  username: z.string().trim().min(3).max(50),
  password: z.string().min(6),
  role: z.enum(["coordinator", "admin"])
});

const createBookingSchema = z.object({
  facultyName: z.string().trim().min(1),
  facultyDepartment: z.string().trim().optional(),
  facultyDesignation: z.string().trim().optional(),
  facultyEmail: z.string().trim().email().optional().or(z.literal("")),
  eventTitle: z.string().trim().min(1),
  eventDescription: z.string().trim().optional(),
  hall: z.string().trim().min(1),
  capacity: z.coerce.number().int().min(1).max(300),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  priority: z.enum(["Normal", "High", "Critical"]).optional(),
  eventType: z.enum(["Academic", "Internal", "Official", "External", "Other"]).optional(),
  overrideRequested: z.boolean().optional(),
  conflictReason: z.string().trim().optional()
});

const roomSchema = z.object({
  name: z.string().trim().min(1).max(100),
  capacity: z.coerce.number().int().min(1).max(1000),
  isActive: z.boolean().optional(),
  features: z.array(z.string().trim()).optional()
});

const roomUpdateSchema = roomSchema.partial();

const parseBookingTextSchema = z.object({
  text: z.string().trim().min(3).max(500)
});

module.exports = {
  loginSchema,
  registerSchema,
  createBookingSchema,
  roomSchema,
  roomUpdateSchema,
  parseBookingTextSchema
};
