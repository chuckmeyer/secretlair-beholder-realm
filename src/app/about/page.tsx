import Image from 'next/image'
import Link from 'next/link'
import styles from '../page.module.css'

export default function About() {
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
        <h1 className={styles.title}>About Chuck Meyer</h1>
        <p className={styles.text}>
          Chuck Meyer is vibe coding. As a DevRel Engineer at Algolia and a search and discovery 
          enthusiast, he's passionate about creating great developer experiences and building 
          innovative solutions. Based in Columbus, OH, Chuck combines technical expertise with 
          a vibrant approach to coding and developer relations.
        </p>
      </div>
    </main>
  )
} 