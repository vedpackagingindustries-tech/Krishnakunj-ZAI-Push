'use client'
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className='min-h-screen flex items-center justify-center bg-[#FFF9ED]'>
      <div className='text-center p-8'>
        <h2 className='text-2xl font-bold text-[#5A3A24] mb-4'>कुछ गड़बड़ हो गई</h2>
        <p className='text-[#5A3A24]/70 mb-6'>कृपया पुनः प्रयास करें।</p>
        <button onClick={reset} className='px-6 py-3 bg-[#C17A2A] text-white rounded-lg hover:bg-[#A66A22]'>पुनः प्रयास करें</button>
      </div>
    </div>
  )
}
