import { SiteNav } from "@/components/site-nav";
import { PageHero } from "@/components/page-hero";
import { McpDocs } from "@/components/mcp-docs";
import { TourRibbon, TourFooter } from "@/components/tour-ribbon";

export default function McpPage() {
  return (
    <main style={{ maxWidth: "1080px", margin: "0 auto", padding: "1.5rem" }}>
      <SiteNav active="mcp" />
      <TourRibbon slug="mcp" />
      <PageHero
        badge="MCP server · headline integration"
        title={
          <>
            Plug{" "}
            <span style={{ color: "var(--accent-2)" }} className="serif-italic">
              .sol agent identity
            </span>{" "}
            into Claude Desktop, Cursor, anything that speaks MCP.
          </>
        }
        subtitle={
          <>
            <code>@snsip/mcp</code> exposes four tools any MCP-aware AI assistant can call to read{" "}
            <code>.sol</code> agent identities and check their on-chain permissions live. Ask Claude{" "}
            <em>"can swap-bot.sol swap 500 USDC?"</em> and Claude refuses <em>in its own voice</em>{" "}
            because the on-chain cap is 100. That's the moment.
          </>
        }
      />
      <div style={{ marginTop: "1.5rem" }}>
        <McpDocs />
      </div>
      <TourFooter slug="mcp" />
    </main>
  );
}
