const API_URL = "https://dummyjson.com/products?limit=100";

async function fetchProductos() {
  const respuesta = await fetch(API_URL);
  const datos = await respuesta.json();
  return datos.products;
}
