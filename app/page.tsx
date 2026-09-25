import Link from "next/link";
import { ArrowUpRight, Check, Command, Sparkles } from "lucide-react";
import styles from "./public.module.css";

const modules = [
  "Clients",
  "Leads",
  "Projects",
  "Tasks",
  "Follow-ups",
  "Invoices",
  "Money",
  "Notifications",
  "AI Command Center",
];

const faq = [
  {
    question: "What is included?",
    answer:
      "Business Client OS includes clients, leads, projects, tasks, follow-ups, invoices, money tracking, notifications, workspace settings and the AI Command Center in one web app.",
  },
  {
    question: "Who is it for?",
    answer:
      "It is built for freelancers, consultants and small service businesses managing multiple clients, conversations and pieces of work at the same time.",
  },
  {
    question: "Is it a subscription?",
    answer:
      "The launch offer is £50 as a one-time payment for lifetime access. There is no monthly subscription for the core product.",
  },
  {
    question: "How does the AI help?",
    answer:
      "The workspace assistant can surface priorities, summarize business context, flag overdue work and help prepare drafts. Business changes stay under your control and require review before they are saved.",
  },
  {
    question: "Does it work on mobile?",
    answer:
      "Yes. Business Client OS is a responsive web app, so you can use the same workspace from desktop, tablet or phone.",
  },
];

export default function Home() {
  return (
    <div className={styles.page}>
      <a href="#content" className={styles.skip}>
        Skip to content
      </a>

      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <Command size={23} /> Business Client <span>OS</span>
        </Link>

        <nav aria-label="Public navigation">
          <a href="#workspace">What you get</a>
          <a href="#ai">AI</a>
          <a href="#workflow">How it works</a>
          <a href="#access">Pricing</a>
          <a href="#faq">FAQ</a>
        </nav>

        <Link href="/auth/login" className={styles.signIn}>
          Sign in <ArrowUpRight size={15} />
        </Link>
      </header>

      <main id="content">
        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Client management without the tool sprawl</p>
            <h1>
              Run your client business
              <br />
              from <em>one workspace.</em>
            </h1>
            <p className={styles.intro}>
              Manage leads, clients, projects, tasks, follow-ups, invoices and money in
              one place — with an AI workspace assistant to help you see what needs
              attention next.
            </p>

            <div className={styles.heroActions}>
              <a href="#access" className={styles.cta}>
                Get lifetime access <ArrowUpRight size={18} />
              </a>
              <span className={styles.heroPrice}>£50 launch price · one-time</span>
            </div>

            <p className={styles.note}>
              Built for freelancers, consultants and small service businesses managing
              multiple clients.
            </p>

            <div className={styles.moduleStrip} aria-label="Included modules">
              {modules.map((module) => (
                <span key={module}>{module}</span>
              ))}
            </div>
          </div>

          <div className={styles.preview} aria-label="Business Client OS product preview">
            <div className={styles.previewTop}>
              <span>
                <Command size={16} /> Northstar Studio
              </span>
              <span>Live workspace</span>
            </div>

            <div className={styles.previewBody}>
              <div className={styles.previewNav}>
                <span className={styles.selected}>Dashboard</span>
                <span>Clients</span>
                <span>Leads</span>
                <span>Projects</span>
                <span>Tasks</span>
                <span>Follow-ups</span>
                <span>Invoices</span>
                <span>Money</span>
                <span>AI</span>
              </div>

              <div className={styles.previewMain}>
                <p className={styles.smallLabel}>BUSINESS OVERVIEW</p>
                <h2>Your next moves, already visible.</h2>

                <div className={styles.statRow}>
                  <div>
                    <span>Active clients</span>
                    <strong>12</strong>
                  </div>
                  <div>
                    <span>Open leads</span>
                    <strong>07</strong>
                  </div>
                  <div>
                    <span>Outstanding</span>
                    <strong>£2.4k</strong>
                  </div>
                </div>

                <div className={styles.listTitle}>Today&apos;s focus</div>

                <div className={styles.task}>
                  <span className={styles.checkbox} />
                  <div>
                    <strong>Send proposal follow-up to Maya Chen</strong>
                    <small>Brand strategy · Due today</small>
                  </div>
                  <i>High</i>
                </div>

                <div className={styles.task}>
                  <span className={styles.checkbox} />
                  <div>
                    <strong>Review landing page milestone</strong>
                    <small>Greenline Studio · In progress</small>
                  </div>
                  <i>Normal</i>
                </div>

                <div className={styles.insight}>
                  <Sparkles size={14} /> AI priority
                  <p>
                    Two leads need attention and one sent invoice is overdue. Start with
                    the proposal-stage lead.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="workspace" className={styles.workspace}>
          <p className={styles.eyebrow}>What you get for £50</p>
          <h2>
            The core of your client business.
            <br />
            <span>Connected instead of scattered.</span>
          </h2>

          <div className={styles.moduleGrid}>
            {[
              ["Clients", "Keep contacts, companies, notes and status in one place."],
              ["Leads", "Track opportunities from first contact through the pipeline."],
              ["Projects", "Keep delivery work connected to the right client."],
              ["Tasks", "See what is due, urgent and worth doing next."],
              ["Follow-ups", "Keep important conversations from slipping through."],
              ["Invoices", "Track issued, paid and overdue invoices."],
              ["Money", "See income and expenses in your workspace currency."],
              ["Notifications", "Keep important workspace activity visible."],
              ["AI Command Center", "Ask about your workspace, priorities and next actions."],
            ].map(([title, copy]) => (
              <article key={title}>
                <Check size={16} />
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="ai" className={styles.aiSection}>
          <div className={styles.aiCopy}>
            <p className={styles.eyebrow}>AI that works with your business context</p>
            <h2>
              Don&apos;t just store the work.
              <br />
              <em>Know what to do next.</em>
            </h2>
            <p>
              Business Client OS can use workspace context to surface priorities, summarize
              client work, highlight overdue items and help prepare follow-up drafts.
            </p>

            <ul>
              <li>
                <Check size={16} /> Which leads need attention?
              </li>
              <li>
                <Check size={16} /> What should I focus on today?
              </li>
              <li>
                <Check size={16} /> Which invoices are overdue?
              </li>
              <li>
                <Check size={16} /> Prepare a follow-up draft for this client.
              </li>
            </ul>
          </div>

          <div className={styles.aiDemo}>
            <div className={styles.aiPrompt}>
              <span>You</span>
              <p>Which lead should I follow up with first?</p>
            </div>
            <div className={styles.aiAnswer}>
              <span>
                <Sparkles size={14} /> Business Client OS
              </span>
              <p>
                Start with Maya Chen. Her lead is already at proposal stage and has been
                waiting longer than your other open opportunities. Draft a short follow-up
                that references the proposal and asks whether she wants to move forward.
              </p>
            </div>
            <div className={styles.aiProposal}>
              <strong>Suggested next step</strong>
              <span>Prepare follow-up draft → review → save or send yourself</span>
            </div>
          </div>
        </section>

        <section id="workflow" className={styles.workflow}>
          <div>
            <p className={styles.eyebrow}>Built around the real client workflow</p>
            <h2>
              From first lead
              <br />
              to <em>paid work.</em>
            </h2>
          </div>

          <ol>
            {[
              [
                "Capture the opportunity",
                "Add a lead, keep the conversation visible and move it through your pipeline.",
              ],
              [
                "Turn it into delivery",
                "Connect the client to projects, tasks, deadlines and follow-ups.",
              ],
              [
                "Close the loop",
                "Track invoices, money and the next conversation without switching between tools.",
              ],
            ].map(([title, copy]) => (
              <li key={title}>
                <h3>{title}</h3>
                <p>{copy}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="access" className={styles.access}>
          <div>
            <p className={styles.eyebrow}>Launch pricing</p>
            <h2>
              £50.
              <br />
              <em>One payment.</em>
            </h2>
            <p>
              Lifetime access to Business Client OS at the launch price. No monthly
              subscription for the core product.
            </p>
          </div>

          <div className={styles.accessCard}>
            <p className={styles.smallLabel}>BUSINESS CLIENT OS · LIFETIME ACCESS</p>
            <div className={styles.priceRow}>
              <h3>£50</h3>
              <span>one-time</span>
            </div>

            <ul>
              {[
                "Clients, leads and follow-ups",
                "Projects, tasks and priorities",
                "Invoices and money tracking",
                "Notifications and workspace settings",
                "AI Command Center",
                "Desktop and mobile access",
              ].map((item) => (
                <li key={item}>
                  <Check size={16} />
                  {item}
                </li>
              ))}
            </ul>

            <Link href="/checkout" className={styles.cta}>
              Get lifetime access <ArrowUpRight size={18} />
            </Link>

            <p className={styles.note}>Checkout will show the final purchase terms before payment.</p>
          </div>
        </section>

        <section id="faq" className={styles.faq}>
          <div>
            <p className={styles.eyebrow}>FAQ</p>
            <h2>Know what you&apos;re buying.</h2>
          </div>

          <div className={styles.faqList}>
            {faq.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <span>Business Client OS</span>
        <span>For freelancers, consultants and small service businesses.</span>
        <a href="mailto:margelugiuliano@gmail.com">Support: margelugiuliano@gmail.com</a>
        <Link href="/auth/login">Sign in ↗</Link>
      </footer>
    </div>
  );
}
