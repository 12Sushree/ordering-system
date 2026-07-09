const axios = require("axios");
const Product = require("../../../shared/models/productModel");

async function syncProducts() {
  const response = await axios.get("https://dummyjson.com/products?limit=100");

  const products = response.data.products;

  for (const product of products) {
    await Product.findOneAndUpdate(
      {
        productId: product.id,
      },
      {
        productId: product.id,
        title: product.title,
        description: product.description,
        category: product.category,
        brand: product.brand,
        price: product.price,
        stock: product.stock,
        thumbnail: product.thumbnail,
      },
      {
        upsert: true,
        new: true,
      },
    );
  }

  return {
    totalProducts: products.length,
  };
}

async function getProducts() {
  return await Product.find().sort({
    title: 1,
  });
}

async function getProductById(id) {
  return await Product.findOne({
    productId: id,
  });
}

module.exports = {
  syncProducts,
  getProducts,
  getProductById,
};
