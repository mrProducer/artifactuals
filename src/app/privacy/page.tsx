import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What data Artifactuals collects, why, and your choices.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
      <p className="font-mono text-label uppercase text-fg-subtle">Privacy</p>
      <h1 className="mt-3 text-h1 text-fg">Privacy policy</h1>
      <p className="mt-2 font-mono text-meta text-fg-subtle">
        Last updated {new Date().getFullYear()}
      </p>
      <p className="mt-4 text-body text-fg-muted">
        This policy explains what Artifactuals collects, why, and the choices
        you have. It&apos;s written in plain language on purpose.
      </p>

      <section className="mt-10">
        <h2 className="text-h2 text-fg">What we collect</h2>
        <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-body text-fg-muted">
          <li>
            <strong>Account info.</strong> When you sign in with Google or
            GitHub, we receive your email address and basic profile details
            (name, avatar) from that provider.
          </li>
          <li>
            <strong>Profile you create.</strong> Your username, display name,
            bio, avatar, and any links you add.
          </li>
          <li>
            <strong>Content you publish.</strong> The artifacts, comments,
            likes, and follows you create on the platform.
          </li>
          <li>
            <strong>Basic usage data.</strong> Aggregate counts like artifact
            views, and standard server logs needed to run and secure the
            service.
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-h2 text-fg">How we use it</h2>
        <p className="mt-3 text-body text-fg-muted">
          To operate the product: authenticate you, display your public
          profile and artifacts, power the feed and social features, generate
          share previews, and keep the platform safe (including reviewing
          reported content). We don&apos;t sell your personal data.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-h2 text-fg">What&apos;s public</h2>
        <p className="mt-3 text-body text-fg-muted">
          Artifactuals is a public portfolio product. Your profile, published
          artifacts, comments, and follower/following counts are visible to
          anyone and may appear in search engines and link previews. Your email
          address is not shown publicly.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-h2 text-fg">Service providers</h2>
        <p className="mt-3 text-body text-fg-muted">
          We use third parties to run the service — including Supabase
          (authentication, database, and file storage) and our hosting
          provider. They process data on our behalf under their own security
          and privacy terms.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-h2 text-fg">Your choices</h2>
        <p className="mt-3 text-body text-fg-muted">
          You can edit your profile, delete your artifacts, and delete your
          comments at any time. To delete your account and associated data,
          reach out and we&apos;ll take care of it.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-h2 text-fg">Changes</h2>
        <p className="mt-3 text-body text-fg-muted">
          We may update this policy as the product evolves. Material changes
          will be reflected by the &ldquo;last updated&rdquo; date above.
        </p>
      </section>
    </main>
  );
}
