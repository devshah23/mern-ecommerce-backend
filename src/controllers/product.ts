import { Request } from "express";
import { TryCatch } from "../middlewares/error.js";
import {
  BaseQuery,
  NewProductRequestBody,
  SearchRequestQuery,
} from "../types/types.js";
import { Product } from "../models/product.js";
import ErrorHandler from "../utils/utility-class.js";
import { rm, unlink } from "fs";
import fs from "fs";
import { faker } from "@faker-js/faker";
import { myCache } from "../app.js";
import { invalidateCache } from "../utils/features.js";
import multer from "multer";
import dotenv from "dotenv";

import { v2 as cloudinary } from "cloudinary";

dotenv.config();
const upload = multer({ dest: "uploads/" });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const newProduct = TryCatch(async (req, res, next) => {
  console.log(cloudinary.config());
  console.log("Received File:", req.file);

  if (!req.file) {
    return next(new ErrorHandler("Photo is require", 400));
  }

  try {
    console.log("Uploading file to Cloudinary:", req.file.path);

    const cloudinaryResponse = await cloudinary.uploader.upload(req.file.path, {
      folder: process.env.CLOUDINARY_UPLOAD_FOLDER || "ZenithStoreImages",
    });

    console.log("Cloudinary Upload Response:", cloudinaryResponse);

    await Product.create({
      name: req.body.name,
      category: req.body.category.toLowerCase(),
      photo: cloudinaryResponse.secure_url,
      stock: req.body.stock,
      price: req.body.price,
    });

    unlink(req.file.path, (err) => {
      if (err) console.error("Error deleting local file:", err);
      else console.log("Local file deleted successfully");
    });

    res.status(201).json({
      message: "Product created successfully",
      product: {
        name: req.body.name,
        category: req.body.category,
        stock: req.body.stock,
        price: req.body.price,
        photo: cloudinaryResponse.secure_url,
      },
    });
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return next(new ErrorHandler("Failed to upload image", 500));
  }
});

export const latestProducts = TryCatch(async (req: Request, res, next) => {
  let products = [];
  if (myCache.has("latest-products")) {
    products = JSON.parse(myCache.get("latest-products") as string);
  } else {
    products = await Product.find().sort({ createdAt: -1 }).limit(50);
    myCache.set("latest-products", JSON.stringify(products));
  }

  return res.status(200).json({
    products,
  });
});

export const getAllCategories = TryCatch(async (req: Request, res, next) => {
  let categories;
  if (myCache.has("categories")) {
    categories = JSON.parse(myCache.get("categories") as string);
  } else {
    categories = await Product.find().distinct("category");
    myCache.set("categories", JSON.stringify(categories));
  }
  return res.status(200).json({
    categories,
  });
});

export const getAdminProducts = TryCatch(async (req: Request, res, next) => {
  let products;
  if (myCache.has("all-products")) {
    products = JSON.parse(myCache.get("all-products") as string);
  } else {
    products = await Product.find();
    myCache.set("all-products", JSON.stringify(products));
  }
  return res.status(200).json({
    products,
  });
});

export const getSingleProduct = TryCatch(async (req, res, next) => {
  let product;
  if (myCache.has(`product-${req.params.id}`)) {
    product = JSON.parse(myCache.get(`product-${req.params.id}`) as string);
  } else {
    product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }
    myCache.set(`product-${req.params.id}`, JSON.stringify(product));
  }
  return res.status(200).json({
    product,
  });
});

export const updateProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { name, category, stock, price } = req.body;
  const photo = req.file;

  const product = await Product.findById(id);
  if (!product) return next(new ErrorHandler("Product Not Found", 400));

  if (photo) {
    if (product.photo) {
      const publicId = product.photo.split("/").pop()?.split(".")[0];
      await cloudinary.uploader.destroy(publicId!);
    }

    const cloudinaryResult = await cloudinary.uploader.upload(photo.path, {
      folder: process.env.CLOUDINARY_UPLOAD_FOLDER || "ZenithStoreImages",
    });

    product.photo = cloudinaryResult.secure_url;

    fs.unlinkSync(photo.path);
  }

  if (name) product.name = name;
  if (category) product.category = category;
  if (stock) product.stock = stock;
  if (price) product.price = price;

  await product.save();
  invalidateCache({
    product: true,
    productId: String(product._id),
    admin: true,
  });

  res.status(200).json({ message: "Product updated successfully" });
});

export const deleteProduct = TryCatch(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product not found", 404));

  if (product.photo) {
    const publicId = product.photo.split("/").pop()?.split(".")[0];
    await cloudinary.uploader.destroy(publicId!);
  }

  await Product.deleteOne({ _id: req.params.id });
  invalidateCache({
    product: true,
    productId: String(product._id),
    admin: true,
  });

  res.status(200).json({ message: "Product deleted successfully" });
});

export const getAllproduct = TryCatch(
  async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {
    const { search, price, category, sort } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(process.env.PRODUCT_PER_PAGE) || 20;
    const skip = (page - 1) * limit;
    const baseQuery: BaseQuery = {};
    if (search) {
      baseQuery.name = {
        $regex: search,
        $options: "i",
      };
    }
    if (price) {
      baseQuery.price = {
        $lte: Number(price),
      };
    }
    if (category) {
      baseQuery.category = category;
    }
    const productsPromise = Product.find(baseQuery)
      .sort(sort && { price: sort === "asc" ? 1 : -1 })
      .limit(limit)
      .skip(skip);

    const [products, filteredProducts] = await Promise.all([
      productsPromise,
      Product.find(baseQuery),
    ]);
    const totalPage = Math.ceil(filteredProducts.length / limit);

    return res.status(200).json({
      success: true,
      products,
      totalPage,
    });
  }
);

const generateRandomProducts = async (count: number = 10) => {
  const products = [];
  for (let i = 0; i < count; i++) {
    const product = {
      name: faker.commerce.productName(),
      photo: "uploads\\products\\2021-09-07T14-07-07.000Z-162.jpg",
      category: faker.commerce.department(),
      price: faker.commerce.price({ min: 1500, max: 80000, dec: 0 }),
      stock: faker.datatype.number({ min: 1, max: 100 }),
      createdAt: new Date(faker.date.past()),
      updatedAt: new Date(faker.date.recent()),
      _v: 0,
    };
    products.push(product);
  }
  await Product.create(products);
  console.log("Products created");
};

const deleteRandomProducts = async (count: number = 10) => {
  const products = await Product.find({}).skip(2);
  products.forEach(async (product) => {
    await Product.deleteOne({ _id: product._id });
  });
  console.log("Products deleted");
};
