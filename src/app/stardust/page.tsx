import { Metadata } from 'next'

import StardustBoard from './components/stardust-board'

export const metadata: Metadata = {
  title: 'Stardust - astryss*',
  description: 'A collaborative pixel art canvas. Paint together, in real time.',
}

export default function StardustPage() {
  return (
    <main className="main-container pt-22 pb-8 md:pt-28">
      <StardustBoard />
    </main>
  )
}
