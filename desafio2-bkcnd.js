const fs = require('fs');
const path = require('path');

class ProductManager {
  constructor(filePath) {
    this.filePath = filePath;
    this.initializeFile();
  }

  initializeFile() {
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, '[]', 'utf8');
    }
  }

  async getProducts() {
    return new Promise((resolve, reject) => {
      fs.readFile(this.filePath, 'utf8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(JSON.parse(data));
        }
      });
    });
  }

  async saveProducts(products) {
    return new Promise(async (resolve, reject) => {
      try {
        await fs.promises.writeFile(this.filePath, JSON.stringify(products, null, 2), 'utf8');
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  async addProduct(product) {
    const products = await this.getProducts();

    // Encuentra el ID máximo actual
    let maxId = 0;
    products.forEach((p) => {
      const idNumber = parseInt(p.id.substr(1), 10);
      if (!isNaN(idNumber) && idNumber > maxId) {
        maxId = idNumber;
      }
    });

    // Incrementa el ID máximo y crea el nuevo ID
    const newId = '_' + (maxId + 1);

    // Validación del objeto producto
    if (this.isValidProduct(product)) {
      const newProduct = { id: newId, ...product };
      products.push(newProduct);
      await this.saveProducts(products);
      return newProduct;
    } else {
      throw new Error('El objeto de producto no es válido');
    }
  }
  
  // Agrega un método para validar el objeto de producto
  isValidProduct(product) {
    if (
      product &&
      typeof product === 'object' &&
      'title' in product &&
      'description' in product &&
      'price' in product &&
      'thumbnail' in product &&
      'code' in product &&
      'stock' in product
    ) {
      return true;
    }
    return false;
  }

  async getProductById(id) {
    const products = await this.getProducts();
    const product = products.find((p) => p.id === id);
    if (product) {
      return product;
    } else {
      throw new Error('Producto no encontrado');
    }
  }

  async updateProduct(id, updatedFields) {
    const products = await this.getProducts();
    const productIndex = products.findIndex((p) => p.id === id);
    if (productIndex !== -1) {
      updatedFields.id = id;
      products[productIndex] = updatedFields;
      await this.saveProducts(products);
      return updatedFields;
    } else {
      throw new Error('Producto no encontrado');
    }
  }

  async deleteProduct(id) {
    const products = await this.getProducts();
    const productIndex = products.findIndex((p) => p.id === id);
    if (productIndex === -1) {
      throw new Error('Producto no encontrado');
    }
    const deletedProduct = products.splice(productIndex, 1)[0];
    await this.saveProducts(products);
    return deletedProduct;
  }
}

// Ruta al archivo 'products.json'
const filePath = path.join(__dirname, 'products.json');

// Ejemplo
const productManager = new ProductManager(filePath);

async function test() {
  try {
    const initialProducts = await productManager.getProducts();
    console.log('Productos iniciales:', initialProducts);

    const newProduct = await productManager.addProduct({
      title: 'producto prueba',
      description: 'Este es un producto prueba',
      price: 200,
      thumbnail: 'Sin imagen',
      code: 'abc123',
      stock: 25,
    });

    console.log('Producto agregado:', newProduct);

    const updatedProduct = await productManager.updateProduct(newProduct.id, {
      description: 'Descripción actualizada',
      price: 250,
    });

    console.log('Producto actualizado:', updatedProduct);

    const productsAfterUpdate = await productManager.getProducts();
    console.log('Productos después de la actualización:', productsAfterUpdate);

    const productById = await productManager.getProductById(newProduct.id);
    console.log('Producto por ID:', productById);

    const deletedProduct = await productManager.deleteProduct(newProduct.id);
    console.log('Producto eliminado:', deletedProduct);

    const productsAfterDelete = await productManager.getProducts();
    console.log('Productos después de la eliminación:', productsAfterDelete);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();