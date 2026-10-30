import ProductArt from './ProductArt'

export const productPhotos = new Set(['latte','pie-limon','italiano','brownie','fajita','ensalada-grande'])
export default function ProductImage({product}) {
  return productPhotos.has(product.id)
    ? <img className="product-photo" src={`/menu/${product.id}-photo.jpg`} alt={`${product.name} · imagen de estilo fotográfico referencial`} loading="lazy" decoding="async" width={1254} height={1254}/>
    : <ProductArt product={product}/>
}
