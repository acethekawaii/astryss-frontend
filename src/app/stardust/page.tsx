import { Metadata } from 'next'

import StardustBoard from './components/stardust-board'

export const metadata: Metadata = {
  title: 'Stardust - astryss*',
  description: 'A collaborative pixel art canvas. Paint together, in real time.',
}

export default function StardustPage() {
  return (
    // Wider than the site's usual max-w-7xl container: the board grows to use the whole screen.
    <main className="mx-auto w-full px-4 pt-22 pb-8 md:pt-28 lg:px-6">
      <StardustBoard />
    </main>
  )
}
