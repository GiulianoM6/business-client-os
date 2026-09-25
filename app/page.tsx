import Link from "next/link";
import { ArrowUpRight, Check, Command } from "lucide-react";
import styles from "./public.module.css";

export default function Home() {
  return <div className={styles.page}>
    <a href="#content" className={styles.skip}>Skip to content</a>
    <header className={styles.header}>
      <Link href="/" className={styles.brand}><Command size={23} /> Business Client <span>OS</span></Link>
      <nav aria-label="Public navigation"><a href="#workspace">Workspace</a><a href="#workflow">How it works</a><a href="#access">Lifetime access</a></nav>
      <Link href="/auth/login" className={styles.signIn}>Sign in <ArrowUpRight size={15} /></Link>
    </header>
    <main id="content">
      <section className={styles.hero}>
        <div><p className={styles.eyebrow}>A home for your client business</p>
          <h1>Less scattered.<br />More <em>in control.</em></h1>
          <p className={styles.intro}>The client, the next conversation, the work to deliver. Bring it all into one calm workspace — and get back to doing what you do best.</p>
          <a href="#access" className={styles.cta}>Get lifetime access <ArrowUpRight size={18} /></a>
          <p className={styles.note}>Built for independent businesses and small teams.</p>
        </div>
        <div className={styles.preview} aria-label="Illustrative workspace dashboard">
          <div className={styles.previewTop}><span><Command size={16} /> Studio workspace</span><span>Illustrative example</span></div>
          <div className={styles.previewBody}>
            <div className={styles.previewNav}><span className={styles.selected}>Overview</span><span>Clients</span><span>Projects</span><span>Tasks</span><span>Follow-ups</span></div>
            <div className={styles.previewMain}>
              <p className={styles.smallLabel}>YOUR WORK, AT A GLANCE</p><h2>A clearer next step.</h2>
              <div className={styles.statRow}><div><span>To focus on</span><strong>03</strong></div><div><span>In progress</span><strong>02</strong></div><div><span>Follow-up</span><strong>01</strong></div></div>
              <div className={styles.listTitle}>Today’s focus</div>
              <div className={styles.task}><span className={styles.checkbox} /><div><strong>Send the project outline</strong><small>Brand project · Ready for review</small></div><i>High</i></div>
              <div className={styles.task}><span className={styles.checkbox} /><div><strong>Prepare for the client call</strong><small>Website project · In progress</small></div><i>Normal</i></div>
              <div className={styles.insight}>↳ One conversation to pick up.<p>Review your pending follow-up before the day gets busy.</p></div>
            </div>
          </div>
        </div>
      </section>
      <section id="workspace" className={styles.workspace}>
        <p className={styles.eyebrow}>Everything has its place</p><h2>A business has moving parts.<br /><span>Your workspace should connect them.</span></h2>
        <div className={styles.featureGrid}>{[
          ["01", "Client relationships", "Keep the whole relationship in view.", "Clients, leads and follow-ups belong together. Keep the next conversation close to the work it moves forward."],
          ["02", "Daily operations", "Know what needs your attention.", "Bring projects, tasks and deadlines into a shared workspace. Start with what is due, then decide what comes next."],
          ["03", "Assisted thinking", "Ask better questions of your business.", "Use your workspace assistant to review work and prepare drafts. You stay in control of the decisions and changes."],
        ].map(([n,label,title,copy])=><article key={n}><div className={styles.featureNumber}>{n}<span>{label}</span></div><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </section>
      <section id="workflow" className={styles.workflow}>
        <div><p className={styles.eyebrow}>A simple daily rhythm</p><h2>Open your workspace.<br /><em>Find your next move.</em></h2></div>
        <ol>{[["See the picture", "Review your clients, active work and upcoming commitments."],["Choose your focus", "Use due dates and priorities to decide what deserves your attention."],["Move the work forward", "Update a task, prepare a follow-up or review a draft. Every decision stays yours."]].map(([title,copy])=><li key={title}><h3>{title}</h3><p>{copy}</p></li>)}</ol>
      </section>
      <section id="access" className={styles.access}>
        <div><p className={styles.eyebrow}>Your business, in one place</p><h2>Make room for<br /><em>your best work.</em></h2><p>Lifetime access to Business Client OS. Review the final price and purchase terms at checkout when available.</p></div>
        <div className={styles.accessCard}><p className={styles.smallLabel}>BUSINESS CLIENT OS</p><h3>One connected workspace.</h3><ul>{["Clients, leads and follow-ups", "Projects, tasks and daily priorities", "Money and invoice tracking", "Workspace assistant and drafts"].map(item=><li key={item}><Check size={16}/>{item}</li>)}</ul><Link href="/checkout" className={styles.cta}>Get lifetime access <ArrowUpRight size={18}/></Link><p className={styles.note}>AI availability depends on your workspace configuration.</p></div>
      </section>
    </main>
    <footer className={styles.footer}><span>Business Client OS</span><span>A clearer way to work.</span><Link href="/auth/login">Sign in ↗</Link></footer>
  </div>;
}
