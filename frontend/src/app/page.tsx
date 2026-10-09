"use client";

import ConsoleLayout from "@/components/ConsoleLayout";
import { 
  Container, 
  Header, 
  Input, 
  Button, 
  Box, 
  SpaceBetween, 
  ColumnLayout, 
  Link,
  Table,
  TextFilter,
  Pagination,
  Icon
} from "@cloudscape-design/components";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [domainSearch, setDomainSearch] = useState("");
  const [notificationSearch, setNotificationSearch] = useState("");

  return (
    <ConsoleLayout
      activeHref="/dashboard"
      pageTitle="Route 53 Dashboard"
      breadcrumbs={[
        { text: "Route 53", href: "/" },
        { text: "Dashboard", href: "/" },
      ]}
    >
      <SpaceBetween size="l">
        
        {/* --- TOP QUICK ACTIONS CONTAINER --- */}
        <Container>
          <ColumnLayout columns={4} variant="text-grid">
            
            {/* Column 1: DNS Management */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "12px", padding: "8px" }}>
              <span style={{ fontSize: "16px", fontWeight: "700" }}>DNS management</span>
              <div style={{ minHeight: "60px" }}>
                <Box color="text-body-secondary" fontSize="body-m">
                  A hosted zone tells Route 53 how to respond to DNS queries for a domain such as example.com.
                </Box>
              </div>
              <Button onClick={() => router.push("/hosted-zones/create")}>Create hosted zone</Button>
            </div>

            {/* Column 2: Availability Monitoring */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "12px", padding: "8px" }}>
              <span style={{ fontSize: "16px", fontWeight: "700" }}>Availability monitoring</span>
              <div style={{ minHeight: "60px" }}>
                <Box color="text-body-secondary" fontSize="body-m">
                  Health checks monitor your applications and web resources, and direct DNS queries to healthy resources.
                </Box>
              </div>
              <div style={{ cursor: "not-allowed" }}>
                <div style={{ pointerEvents: "none" }}>
                  <Button>Create health check</Button>
                </div>
              </div>
            </div>

            {/* Column 3: Traffic Management */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "12px", padding: "8px" }}>
              <span style={{ fontSize: "16px", fontWeight: "700" }}>Traffic management</span>
              <div style={{ minHeight: "60px" }}>
                <Box color="text-body-secondary" fontSize="body-m">
                  A visual tool that lets you easily create policies for multiple endpoints in complex configurations.
                </Box>
              </div>
              <div style={{ cursor: "not-allowed" }}>
                <div style={{ pointerEvents: "none" }}>
                  <Button>Create policy</Button>
                </div>
              </div>
            </div>

            {/* Column 4: Domain Registration (Error State) */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "12px", padding: "8px" }}>
              <span style={{ fontSize: "16px", fontWeight: "700" }}>Domain registration</span>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "8px", marginTop: "12px" }}>
                <Box color="text-status-error" fontSize="heading-xl" fontWeight="normal">Error</Box>
                <span style={{ fontSize: "14px" }}>Domains</span>
              </div>
            </div>

          </ColumnLayout>
        </Container>

        {/* --- DOMAIN SEARCH CONTAINER --- */}
        <Container
          header={
            <Header variant="h2">
              Register domain
            </Header>
          }
        >
          <SpaceBetween size="l">
            <Box fontSize="body-m">
              Find and register an available domain, or <Link href="#">transfer your existing domains</Link> to Route 53.
            </Box>
            
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "100%", maxWidth: "800px" }}>
                <Input
                  value={domainSearch}
                  onChange={({ detail }) => setDomainSearch(detail.value)}
                  placeholder="Enter a domain name"
                />
              </div>
              <Button>Check</Button>
            </div>
            
            <div style={{ marginTop: "-8px" }}>
              <Box fontSize="body-s" color="text-body-secondary">
                Each label (each part between dots) can be up to 63 characters long and must start with a-z or 0-9. Maximum length: 255 characters, including dots. Valid characters: a-z, 0-9, and - (hyphen)
              </Box>
            </div>
          </SpaceBetween>
        </Container>

        {/* --- NOTIFICATIONS TABLE --- */}
        <Table
          columnDefinitions={[
            { id: "resource", header: "Resource", cell: (item: any) => item.resource },
            { id: "status", header: "Status", cell: (item: any) => item.status },
            { id: "lastUpdate", header: "Last update", cell: (item: any) => item.lastUpdate }
          ]}
          items={[]}
          empty={
            <Box textAlign="center" color="inherit">
              No notifications to display
            </Box>
          }
          filter={
            <TextFilter 
              filteringPlaceholder="Find notifications" 
              filteringText={notificationSearch} 
              onChange={({ detail }) => setNotificationSearch(detail.filteringText)} 
            />
          }
          header={
            <Header
              variant="h2"
              actions={<Button iconName="refresh" variant="icon" ariaLabel="Refresh" />}
            >
              Notifications
            </Header>
          }
          pagination={<Pagination currentPageIndex={1} pagesCount={1} />}
        />

        {/* --- MORE RESOURCES CONTAINER --- */}
        <Container
          header={
            <Header variant="h2">
              More resources <Icon name="external" size="inherit" />
            </Header>
          }
          disableContentPaddings
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[
              "Documentation",
              "API reference",
              "FAQs",
              "Forum - DNS and health checks",
              "Forum - Domain name registration",
              "Request a limit increase"
            ].map((text, index, array) => (
              <div key={text}>
                <div style={{ padding: "12px 20px" }}>
                  <Link href="#">{text}</Link>
                </div>
                {index !== array.length - 1 && (
                  <div style={{ 
                    height: "1px", 
                    backgroundColor: "var(--color-border-divider-default, #424650)", 
                    marginLeft: "20px", 
                    marginRight: "20px" 
                  }} />
                )}
              </div>
            ))}
          </div>
        </Container>

        {/* --- SERVICE HEALTH CONTAINER --- */}
        <Container
          header={<Header variant="h2">Service health</Header>}
        >
          <Box fontSize="body-m">
            To view the current status of Route 53, see the <Link href="#" external>AWS Service Health Dashboard</Link>.
          </Box>
        </Container>

      </SpaceBetween>
    </ConsoleLayout>
  );
}