import express from 'express';

import { adminOnly } from '../middlewares/auth.js';
import { singleUpload } from '../middlewares/multer.js';
import { deleteProduct, getAdminProducts, getAllCategories, getAllproduct, getSingleProduct, latestProducts, newProduct, updateProduct } from '../controllers/product.js';
const app=express.Router();

app.post('/new',singleUpload,newProduct);
app.get('/latest',latestProducts);
app.get('/categories',getAllCategories);
app.get('/all',getAllproduct);
app.get('/admin-products',adminOnly,getAdminProducts);
app.route('/:id').get(getSingleProduct).put(adminOnly,singleUpload,updateProduct).delete(adminOnly,deleteProduct);

export default app;