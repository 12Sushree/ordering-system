const { sendSuccess } = require("../../../shared/utils/response");
const productService = require("../services/productService");

function createHttpError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function syncProducts(req, res, next) {
  try {
    const result = await productService.syncProducts();
    return sendSuccess(res, {
      message: "Products synchronized successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

async function getProducts(req, res, next) {
  try {
    const products = await productService.getProducts(req.query);
    return sendSuccess(res, {
      data: products,
    });
  } catch (error) {
    next(error);
  }
}

async function getPublicProducts(req, res, next) {
  try {
    const products = await productService.getPublicProducts(req.query);
    return sendSuccess(res, {
      data: products,
    });
  } catch (error) {
    next(error);
  }
}

async function getProduct(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) {
      throw createHttpError("Product id required", 400);
    }

    const product = await productService.getProductById(id);
    if (!product) {
      throw createHttpError("Product not found", 404);
    }

    return sendSuccess(res, {
      data: product,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  syncProducts,
  getProducts,
  getPublicProducts,
  getProduct,
};
