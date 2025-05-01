import Link from 'next/link'
import styles from './game.module.css'
import Game from './components/Game'
import Disclaimer from '../components/Disclaimer'

export default function GamePage() {
  return (
    <main className={styles.gameMain}>
      <Link href="/" className={styles.backLink}>
        <span className={styles.arrow}>←</span> Back to Home
      </Link>
      <div className={styles.gameContainer}>
        <h1 className={styles.title}>Beholder&apos;s Realm</h1>
        <div className={styles.gameCanvasWrapper}>
          <Game />
        </div>
        <Disclaimer />
      </div>
    </main>
  )
} 