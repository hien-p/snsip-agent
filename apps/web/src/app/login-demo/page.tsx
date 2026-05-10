import { LoginWithSol } from "@/components/login-with-sol";
import { SiteNav } from "@/components/site-nav";
import { PageHero } from "@/components/page-hero";
import { TourRibbon, TourFooter } from "@/components/tour-ribbon";

export default function LoginDemoPage() {
  return (
    <main style={{ maxWidth: "1080px", margin: "0 auto", padding: "1.5rem" }}>
      <SiteNav active="login" />
      <TourRibbon slug="login" />
      <PageHero
        badge="Sign in with .sol"
        title={
          <>
            Your <span style={{ color: "var(--accent-2)" }} className="serif-italic">.sol</span> name is your login.
          </>
        }
        subtitle={
          <>
            No email, no password, no OAuth handshake. Type your <code>.sol</code>, the dApp checks{" "}
            on-chain that your wallet owns it, then asks you to sign a one-time challenge to prove you{" "}
            are the live owner. The same flow third-party Solana apps can drop in with eight lines of code.
          </>
        }
      />
      <div style={{ marginTop: "1.5rem" }}>
        <LoginWithSol />
      </div>
      <TourFooter slug="login" />
    </main>
  );
}
