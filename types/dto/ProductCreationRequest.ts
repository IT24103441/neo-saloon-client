import z from "zod";


const ProductStatusEnum = z.enum(["ACTIVE", "INACTIVE", "DELETED"]);
const MediaTypeEnum = z.enum(["IMAGE", "VIDEO"]);
const ProductCreationRequestSchema = z.object({
    sku: z.string().max(50),
    name: z.string().max(100),
    altNames: z.array(z.string().max(100)).optional().default([]),
    description: z.string(),
    stock: z.number().int().min(0),
    status: ProductStatusEnum.optional().default("ACTIVE"),
    price: z.number().min(0),
    compareAt: z.number().min(0).optional(),
    brand: z.string().max(100).optional(),
    model: z.string().max(100).optional(),
    media: z.array(
        z.object({
            url: z.url(),
            type: MediaTypeEnum
        })
    )
})
