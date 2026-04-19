import { redirect } from 'next/navigation'
import Homepage from '@/components/Homepage'

export default function HomePageRoute() {
  const productSurface = process.env.PRODUCT_SURFACE || process.env.NEXT_PUBLIC_PRODUCT_SURFACE

  if (productSurface === 'value-office') {
    redirect('/value-office')
  }

  return <Homepage />
}
