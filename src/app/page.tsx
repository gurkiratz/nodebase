import { Button } from '@/components/ui/button'
import Image from 'next/image'

const Page = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <p>Hello World</p>
      <Button variant={'outline'}>Click me</Button>
    </div>
  )
}

export default Page
