import Link from 'next/link'
export default function NotFound() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-[#FFF9ED]'>
      <div className='text-center p-8'>
        <h2 className='text-6xl font-bold text-[#C17A2A] mb-4'>404</h2>
        <p className='text-xl text-[#5A3A24] mb-2'>यह पृष्ठ नहीं मिला</p>
        <p className='text-[#5A3A24]/70 mb-6'>आप जिस पृष्ठ की तलाश कर रहे हैं वह मौजूद नहीं है।</p>
        <Link href='/' className='px-6 py-3 bg-[#C17A2A] text-white rounded-lg hover:bg-[#A66A22] inline-block'>मुख्य पृष्ठ पर जाएं</Link>
      </div>
    </div>
  )
}
