import Image from 'next/image'
import Link from 'next/link'
import styles from './about.module.css'
import Disclaimer from '../components/Disclaimer'

export default function AboutPage() {
  return (
    <main className={styles.main}>
      <Link href="/" className={styles.backLink}>
        <span className={styles.arrow}>←</span> Back to Home
      </Link>
      <div className={styles.content}>
        <Image
          src="https://avatars.githubusercontent.com/u/5231321?v=4"
          alt="Chuck Meyer"
          width={200}
          height={200}
          className={styles.profileImage}
        />
        <h1 className={styles.title}>About the Author</h1>
        <p className={styles.description}>
          Chuck Meyer is a passionate developer who loves creating interactive experiences.
        </p>
      </div>
      <Disclaimer />
    </main>
  )
} 