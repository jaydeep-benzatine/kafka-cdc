import { Router, type Request, type Response } from "express";
import { db } from "./db/client";
import { userTable, productTable, purchasedProductTable } from "./db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { asyncHandler } from "./utils/async-handler";
import { validateSchema } from "./utils/validate-schema";
import { createUserSchema, updateUserSchema } from "./validators/users.validators";
import { createProductSchema, updateProductSchema } from "./validators/product.validators";
import { createPurchasedProductSchema } from "./validators/purchased-product.validators";

const router = Router();

router.get(
  "/users",
  asyncHandler(async (req: Request, res: Response) => {
    const users = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        createdAt: userTable.createdAt,
      })
      .from(userTable)
      .orderBy(desc(userTable.createdAt))
      .limit(10);

    return res.status(200).json({ message: "Users list", data: users });
  }),
);

router.get(
  "/users/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (!id || isNaN(id)) return res.status(400).json({ message: "Please provide valid user Id" });

    const user = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        createdAt: userTable.createdAt,
      })
      .from(userTable)
      .where(eq(userTable.id, id));

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User details", data: user[0] });
  }),
);

router.post(
  "/users",
  asyncHandler(async (req: Request, res: Response) => {
    console.log(req.body);
    const data = validateSchema(createUserSchema, req.body);

    const existingUser = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, data.email))
      .limit(1);

    if (existingUser.length > 0)
      return res.status(400).json({
        message: "User already exist with same email address",
      });

    const newUser = await db.insert(userTable).values(data);

    return res.status(200).json({
      message: "User created successfully",
      data: newUser,
    });
  }),
);

router.put(
  "/users/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (!id || isNaN(id)) return res.status(400).json({ message: "Please provide valid user Id" });

    const data = validateSchema(updateUserSchema, req.body);

    const user = await db.select().from(userTable).where(eq(userTable.id, id)).limit(1);

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    if (Object.keys(data).length === 0)
      return res.status(400).json({
        message: "No data found to update",
      });

    if (data.email) {
      const userWithSameEmail = await db
        .select()
        .from(userTable)
        .where(eq(userTable.email, data.email));

      if (userWithSameEmail.length > 0)
        return res.status(400).json({
          message: "User already exist with same email address",
        });
    }

    const updatedUser = await db.update(userTable).set(data).where(eq(userTable.id, id));

    return res.status(200).json({
      message: "User updated successfully",
      data: updatedUser,
    });
  }),
);

router.delete(
  "/users/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (!id || isNaN(id)) return res.status(400).json({ message: "Please provide valid user Id" });

    const existingUser = await db.select().from(userTable).where(eq(userTable.id, id)).limit(1);

    if (existingUser.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    await db.delete(userTable).where(eq(userTable.id, id));

    return res.status(200).json({
      message: "User deleted successfully",
    });
  }),
);

router.get(
  "/products",
  asyncHandler(async (req: Request, res: Response) => {
    const products = await db
      .select({
        id: productTable.id,
        name: productTable.name,
        description: productTable.description,
        sku: productTable.sku,
        quantity: productTable.quantity,
        createdAt: productTable.createdAt,
        status: sql<string>`
          CASE
            WHEN ${productTable.quantity} > 0 THEN 'In Stock'
            ELSE 'Out Of Stock'
          END
        `.as("status"),
      })
      .from(productTable)
      .orderBy(desc(productTable.createdAt))
      .limit(10);

    return res.status(200).json({ message: "Products list", data: products });
  }),
);

router.get(
  "/products/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (!id || isNaN(id))
      return res.status(400).json({ message: "Please provide valid product Id" });

    const product = await db
      .select({
        id: productTable.id,
        name: productTable.name,
        description: productTable.description,
        sku: productTable.sku,
        quantity: productTable.quantity,
        createdAt: productTable.createdAt,
      })
      .from(productTable)
      .where(eq(productTable.id, id));

    if (product.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({ message: "Product details", data: product[0] });
  }),
);

router.post(
  "/products",
  asyncHandler(async (req: Request, res: Response) => {
    const data = validateSchema(createProductSchema, req.body);

    const existingProduct = await db
      .select()
      .from(productTable)
      .where(eq(productTable.sku, data.sku))
      .limit(1);

    if (existingProduct.length > 0)
      return res.status(400).json({
        message: "Product already exist with same SKU",
      });

    const newProduct = await db.insert(productTable).values(data);

    return res.status(200).json({
      message: "Product created successfully",
      data: newProduct,
    });
  }),
);

router.put(
  "/products/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (!id || isNaN(id))
      return res.status(400).json({ message: "Please provide valid product Id" });

    const data = validateSchema(updateProductSchema, req.body);

    const product = await db.select().from(productTable).where(eq(productTable.id, id)).limit(1);

    if (product.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (Object.keys(data).length === 0)
      return res.status(400).json({
        message: "No data found to update",
      });

    if (data.sku) {
      const productWithSameSku = await db
        .select()
        .from(productTable)
        .where(eq(productTable.sku, data.sku));

      if (productWithSameSku.length > 0)
        return res.status(400).json({
          message: "Product already exist with same SKU",
        });
    }

    const updatedProduct = await db.update(productTable).set(data).where(eq(productTable.id, id));

    return res.status(200).json({
      message: "Product updated successfully",
      data: updatedProduct,
    });
  }),
);

router.delete(
  "/products/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (!id || isNaN(id))
      return res.status(400).json({ message: "Please provide valid product Id" });

    const existingProduct = await db
      .select()
      .from(productTable)
      .where(eq(productTable.id, id))
      .limit(1);

    if (existingProduct.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    await db.delete(productTable).where(eq(productTable.id, id));

    return res.status(200).json({
      message: "Product deleted successfully",
    });
  }),
);

router.post(
  "/purchases",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = validateSchema(createPurchasedProductSchema, req.body);

      const user = await db.select().from(userTable).where(eq(userTable.id, data.userId)).limit(1);

      if (user.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const [product] = await db
        .select()
        .from(productTable)
        .where(eq(productTable.id, data.productId))
        .limit(1);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const currentProductQuantity = product.quantity!;

      if (currentProductQuantity < data.quantity) {
        return res.status(400).json({
          message: "Insufficient product quantity",
        });
      }

      // Decrement available stock
      await db
        .update(productTable)
        .set({ quantity: currentProductQuantity - data.quantity })
        .where(eq(productTable.id, data.productId))
        .catch((error) => {
          console.log("Error Occurred While Updating products quantity");
          console.log("Error:", error);
        });

      // Merge purchases if the user already purchased the same product.
      const [existingPurchase] = await db
        .select()
        .from(purchasedProductTable)
        .where(
          and(
            eq(purchasedProductTable.userId, data.userId),
            eq(purchasedProductTable.productId, data.productId),
          ),
        )
        .limit(1);

      if (existingPurchase) {
        const updatedQuantity = existingPurchase.quantity + data.quantity;
        const updatedPurchase = await db
          .update(purchasedProductTable)
          .set({ quantity: updatedQuantity })
          .where(
            and(
              eq(purchasedProductTable.userId, data.userId),
              eq(purchasedProductTable.productId, data.productId),
            ),
          );

        return res.status(200).json({
          message: "Product purchased updated successfully",
          data: updatedPurchase,
        });
      }

      const newPurchase = await db.insert(purchasedProductTable).values(data);
      return res.status(200).json({
        message: "Product purchased successfully",
        data: newPurchase,
      });
    } catch (error) {
      console.log("Error Occurred");
      console.log(error);
    }
  }),
);

router.get(
  "/users/:id/purchases",
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ message: "Please provide valid user Id" });

    const user = await db.select().from(userTable).where(eq(userTable.id, id)).limit(1);
    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const purchasedProducts = await db
      .select({
        userId: purchasedProductTable.userId,
        productId: purchasedProductTable.productId,
        quantity: purchasedProductTable.quantity,
        purchasedAt: purchasedProductTable.createdAt,
        name: productTable.name,
        description: productTable.description,
        sku: productTable.sku,
      })
      .from(purchasedProductTable)
      .innerJoin(productTable, eq(purchasedProductTable.productId, productTable.id))
      .where(eq(purchasedProductTable.userId, id));

    return res.status(200).json({
      message: "Purchased products list",
      data: purchasedProducts,
    });
  }),
);

export default router;
