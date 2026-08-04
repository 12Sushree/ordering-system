const axios = require("axios");
const Product = require("../models/productModel");

async function syncProducts() {
  try {
    const response = await axios.get(process.env.DUMMYJSON_PRODUCTS_URL, {
      timeout: 5000,
    });

    const products = response.data.products || [];
    if (!products.length) {
      return {
        totalProducts: 0,
      };
    }

    await Product.bulkWrite(
      products.map((product) => ({
        updateOne: {
          filter: {
            productId: String(product.id),
          },
          update: {
            $set: {
              productId: String(product.id),
              title: product.title,
              description: product.description,
              category: product.category,
              brand: product.brand,
              price: product.price,
              stock: product.stock,
              thumbnail: product.thumbnail,
            },
          },
          upsert: true,
        },
      })),
    );

    return {
      totalProducts: products.length,
    };
  } catch (error) {
    throw new Error(`Product sync failed: ${error.message}`);
  }
}

function buildProductQuery({ search = "" } = {}) {
  const query = {};

  const normalizedSearch = String(search).trim();
  if (normalizedSearch) {
    query.$or = [
      {
        title: {
          $regex: normalizedSearch,
          $options: "i",
        },
      },
      {
        category: {
          $regex: normalizedSearch,
          $options: "i",
        },
      },
      {
        brand: {
          $regex: normalizedSearch,
          $options: "i",
        },
      },
      {
        productId: {
          $regex: normalizedSearch,
          $options: "i",
        },
      },
    ];
  }

  return query;
}

async function getProducts(filters = {}) {
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filters.limit) || 12, 1), 100);
  const query = buildProductQuery(filters);

  const [items, total] = await Promise.all([
    Product.find(query)
      .sort({ title: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
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

async function getPublicProducts(filters = {}) {
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filters.limit) || 100, 1), 100);
  const query = buildProductQuery(filters);

  const [items, total] = await Promise.all([
    Product.find(query)
      .select("productId title category price stock thumbnail")
      .sort({ title: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
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
  return Product.findOne({ productId: String(id) })
    .select("productId title category price stock")
    .lean();
}

module.exports = {
  syncProducts,
  getProducts,
  getPublicProducts,
  getProductById,
};
