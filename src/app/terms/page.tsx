import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The terms for using Artifactuals.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
      <p className="font-mono text-label uppercase text-fg-subtle">Terms</p>
      <h1 className="mt-3 text-h1 text-fg">Terms of service</h1>
      <p className="mt-2 font-mono text-meta text-fg-subtle">
        Last updated {new Date().getFullYear()}
      </p>
      <p className="mt-4 text-body text-fg-muted">
        By using Artifactuals, you agree to these terms. If you don&apos;t
        agree, please don&apos;t use the service.
      </p>

      <section className="mt-10">
        <h2 className="text-h2 text-fg">Your account</h2>
        <p className="mt-3 text-body text-fg-muted">
          You&apos;re responsible for activity on your account and for keeping
          your sign-in secure. You must be old enough to form a binding
          agreement in your jurisdiction to use Artifactuals.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-h2 text-fg">Your content</h2>
        <p className="mt-3 text-body text-fg-muted">
          You keep ownership of the artifacts and other content you publish. By
          posting, you grant Artifactuals a non-exclusive license to host,
          display, and share it as needed to run the service (including
          generating preview images and rendering your artifact publicly). You
          confirm you have the rights to everything you post.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-h2 text-fg">Acceptable use</h2>
        <p className="mt-3 text-body text-fg-muted">
          You must follow our{" "}
          <Link href="/guidelines" className="text-accent underline">
            community guidelines
          </Link>
          . We may remove content or suspend accounts that violate them or these
          terms. Removed content is hidden from the public but may be retained
          for review and appeals.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-h2 text-fg">Artifacts run untrusted code</h2>
        <p className="mt-3 text-body text-fg-muted">
          Artifacts are built by other users and run in a sandboxed iframe with
          no access to your Artifactuals session. Even so, use normal caution —
          we don&apos;t review every artifact and aren&apos;t responsible for
          what user-submitted code does.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-h2 text-fg">Service &ldquo;as is&rdquo;</h2>
        <p className="mt-3 text-body text-fg-muted">
          Artifactuals is provided on an &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo; basis, without warranties of any kind. To the extent
          permitted by law, we&apos;re not liable for indirect or consequential
          damages arising from your use of the service. We may change or
          discontinue features at any time.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-h2 text-fg">Changes</h2>
        <p className="mt-3 text-body text-fg-muted">
          We may update these terms as the product evolves. Continued use after
          changes means you accept the updated terms.
        </p>
      </section>
    </main>
  );
}
