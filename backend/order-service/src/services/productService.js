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

async function getProducts(filters = {}) {
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filters.limit) || 12, 1), 100);
  const query = buildProductQuery(filters);

  const [items, total] = await Promise.all([
    Product.find(query)
      .sort({
        title: 1,
      })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(query),
  ]);

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  };
}

function buildProductQuery({ search = "" } = {}) {
  const query = {};
  const normalizedSearch = String(search || "").trim();

  if (normalizedSearch) {
    query.$or = [
      { title: { $regex: normalizedSearch, $options: "i" } },
      { category: { $regex: normalizedSearch, $options: "i" } },
      { brand: { $regex: normalizedSearch, $options: "i" } },
    ];
  }

  return query;
}

async function getPublicProducts(filters = {}) {
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filters.limit) || 1000, 1), 1000);
  const query = buildProductQuery(filters);

  const [items, total] = await Promise.all([
    Product.find(query)
      .select("productId title category price thumbnail stock")
      .sort({
        title: 1,
      })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(query),
  ]);

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  };
}

async function getProductById(id) {
  return await Product.findOne({
    productId: id,
  });
}

module.exports = {
  syncProducts,
  getProducts,
  getPublicProducts,
  getProductById,
};
