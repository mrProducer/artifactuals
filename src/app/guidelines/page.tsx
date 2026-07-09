import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community guidelines",
  description:
    "What belongs on Artifactuals, what doesn't, and how moderation works.",
};

export default function GuidelinesPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
      <p className="font-mono text-label uppercase text-fg-subtle">
        Community guidelines
      </p>
      <h1 className="mt-3 text-h1 text-fg">Keeping Artifactuals worth sharing</h1>
      <p className="mt-4 text-body text-fg-muted">
        Artifactuals is a place to publish the interactive things you build with
        AI and share them under your own name. These guidelines keep it useful
        and safe. By posting, you agree to follow them.
      </p>

      <section className="mt-10">
        <h2 className="text-h2 text-fg">What belongs here</h2>
        <p className="mt-3 text-body text-fg-muted">
          Single-file, self-contained HTML/CSS/JS artifacts you made — games,
          tools, visualizations, experiments, art. Post work that&apos;s yours
          to share, with a clear title and description.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-h2 text-fg">What&apos;s not allowed</h2>
        <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-body text-fg-muted">
          <li>
            Malware, phishing, credential harvesting, crypto drainers, or
            anything designed to deceive or harm the people who open it.
          </li>
          <li>
            Content that infringes someone else&apos;s copyright, trademark, or
            other rights.
          </li>
          <li>
            Harassment, hate speech, threats, or targeting of individuals or
            groups.
          </li>
          <li>
            Sexual content involving minors, or non-consensual intimate
            imagery — ever.
          </li>
          <li>
            Spam, misleading metadata, or mass-posting to game the feed.
          </li>
          <li>Anything illegal under applicable law.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-h2 text-fg">Reporting &amp; moderation</h2>
        <p className="mt-3 text-body text-fg-muted">
          Every artifact and comment has a <strong>Report</strong> button. Reports
          go to our moderators, who review them and can remove content or suspend
          accounts that break these rules. Removed content is hidden from the
          public but retained for review and appeals rather than immediately
          erased.
        </p>
        <p className="mt-3 text-body text-fg-muted">
          Artifacts run in a sandboxed iframe with no access to your
          Artifactuals session — but the code is still written by other people,
          so use the same judgment you would on any website.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-h2 text-fg">Appeals</h2>
        <p className="mt-3 text-body text-fg-muted">
          If your content was removed and you think it was a mistake, reach out
          and we&apos;ll take another look.
        </p>
      </section>
    </main>
  );
}
