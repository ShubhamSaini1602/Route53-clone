"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AppLayout,
  TopNavigation,
  SideNavigation,
  BreadcrumbGroup,
  ContentLayout,
  Header,
  Autosuggest,
  Link,
  Modal,
  Box,
  Button
} from "@cloudscape-design/components";
import { applyMode, Mode } from "@cloudscape-design/global-styles";
import styles from "./ConsoleLayout.module.css";

interface ConsoleLayoutProps {
  children: React.ReactNode;
  activeHref?: string;
  breadcrumbs?: Array<{ text: string; href: string }>;
  pageTitle?: string;
}

export default function ConsoleLayout({
  children,
  activeHref = "/dashboard",
  breadcrumbs = [
    { text: "Route 53", href: "/" },
    { text: "Dashboard", href: "/dashboard" },
  ],
  pageTitle,
}: ConsoleLayoutProps) {
  const router = useRouter();
  const [navigationOpen, setNavigationOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  const [searchValue, setSearchValue] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // --- NEW: Coming Soon Modal States ---
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);
  const [featureName, setFeatureName] = useState("");

  useEffect(() => {
    setIsMounted(true);

    // Session Persistence Check ---
    const token = localStorage.getItem("aws-mock-token");
    if (!token) {
      router.push("/login");
      return;
    }

    const savedTheme = localStorage.getItem("aws-theme-preference");
    if (savedTheme === "light") {
      setTheme("light");
      applyMode(Mode.Light);
    } else {
      setTheme("dark");
      applyMode(Mode.Dark);
    }
  }, [router]);

  if (!isMounted) {
    return <div style={{ minHeight: "100vh", backgroundColor: "#0f1b2a" }} />;
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: theme === "dark" ? "#0f1b2a" : "#f2f3f3", transition: "background-color 0.2s ease" }}>
      <TopNavigation
        identity={{
          href: "/",
          title: "Amazon Route 53",
          logo: { src: "/aws-logo.png", alt: "AWS" },
          onFollow: (e) => {
            e.preventDefault();
            router.push("/");
          },
        }}
        search={
          <div style={{ width: "100%", maxWidth: "800px", position: "relative" }} className={styles.customSearch}>
            <Autosuggest
              value={searchValue}
              onChange={({ detail }) => setSearchValue(detail.value)}
              options={[
                { value: "Route 53", description: "Scalable DNS and Domain Name Registration" },
                { value: "EC2", description: "Virtual Servers in the Cloud" },
                { value: "S3", description: "Scalable Storage in the Cloud" },
                { value: "RDS", description: "Managed Relational Database Service" },
                { value: "VPC", description: "Isolated Cloud Resources" },
                { value: "IAM", description: "Manage Access to Services and Resources" },
              ]}
              enteredTextLabel={(value) => `Search for "${value}"`}
              ariaLabel="Search AWS services"
              placeholder="Search"
              empty="No results found"
            />
            <div 
              className={styles.searchSuffix} 
              style={{ right: searchValue.length > 0 ? "48px" : "16px", transition: "right 0.2s ease" }}
            >
              <span>[Alt+S]</span>
              <span style={{ fontWeight: "bold" }}>Ask Amazon Q</span>
            </div>
          </div>
        }
        utilities={[
          {
            type: "menu-dropdown",
            iconUrl: "/grid-icon.png",
            iconAlt: "Services",
            ariaLabel: "Services",
            title: "Services",
            items: [
              {
                id: "recently-visited",
                text: "Recently visited",
                itemType: "group",
                items: [
                  { 
                    id: "route53", 
                    text: (
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontWeight: 700, color: theme === "dark" ? "#fff" : "#16191f" }}>Route 53</span>
                        <span style={{ fontSize: "12px", color: "#aab7b8", fontWeight: 400 }}>Scalable DNS and Domain Name Registration</span>
                      </div>
                    ) as unknown as string
                  }
                ]
              },
              {
                id: "all-services",
                text: "All services",
                itemType: "group",
                items: [
                  { id: "analytics", text: "Analytics", disabled: true },
                  { id: "compute", text: "Compute", disabled: true },
                  { id: "database", text: "Database", disabled: true },
                  { id: "ml", text: "Machine Learning", disabled: true },
                  { id: "storage", text: "Storage", disabled: true },
                ]
              }
            ]
          },
          { 
            type: "menu-dropdown", 
            iconName: "notification", 
            ariaLabel: "Notifications",
            badge: true,
            items: [
              { id: "notif-header", text: "Notifications Center", itemType: "group" },
              { id: "most-recent", text: "Most recent", itemType: "group", items: [
                { 
                  id: "notif-1", 
                  text: (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", whiteSpace: "normal", maxWidth: "320px", padding: "4px 0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 700, color: "#44b9d6" }}>AWS Health Event</span>
                        <span style={{ fontSize: "12px", color: "#aab7b8", fontWeight: 400 }}>9 hours ago</span>
                      </div>
                      <span style={{ fontSize: "13px", color: theme === "dark" ? "#eaeded" : "#16191f", lineHeight: "1.4" }}>
                        Health Event: AWS ACCOUNT CUSTOMER VERIFICATION SUCCESS in us-east-1 on account 284874841508.
                      </span>
                    </div>
                  ) as unknown as string
                }
              ]}
            ]
          },
          { 
            type: "menu-dropdown", 
            iconName: "settings", 
            ariaLabel: "Settings",
            onItemClick: (e) => {
              if (e.detail.id === "mode-light") {
                setTheme("light");
                applyMode(Mode.Light);
                localStorage.setItem("aws-theme-preference", "light");
              } else if (e.detail.id === "mode-dark") {
                setTheme("dark");
                applyMode(Mode.Dark);
                localStorage.setItem("aws-theme-preference", "dark");
              }
            },
            items: [
              { id: "settings-header", text: "Current user settings", itemType: "group" },
              { 
                id: "language", 
                text: (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: 700 }}>Language</span>
                    <span style={{ fontSize: "12px", color: "#aab7b8", fontWeight: 400 }}>Browser default</span>
                  </div>
                ) as unknown as string
              },
              {
                id: "visual-mode",
                text: "Visual mode - beta",
                itemType: "group",
                items: [
                  { id: "mode-default", text: "Browser default", disabled: true },
                  { id: "mode-light", text: "Light" },
                  { id: "mode-dark", text: "Dark" }
                ]
              },
              { 
                id: "all-settings", 
                text: <span style={{ color: "#44b9d6", fontWeight: 700 }}>See all user settings</span> as unknown as string 
              }
            ]
          },
          {
            type: "menu-dropdown",
            text: "Shubham Saini (284874841508)",
            iconName: "user-profile",
            items: [
              {
                id: "free-plan",
                text: "Free plan status",
                itemType: "group",
                items: [
                  { 
                    id: "credits", 
                    text: (
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontWeight: 700, color: theme === "dark" ? "#fff" : "#16191f" }}>Credits remaining</span>
                        <span style={{ fontSize: "12px", color: "#44b9d6", fontWeight: 400 }}>$100.00 USD</span>
                      </div>
                    ) as unknown as string
                  },
                  { 
                    id: "days", 
                    text: (
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px" }}>
                        <span style={{ fontWeight: 700, color: theme === "dark" ? "#fff" : "#16191f" }}>Days remaining</span>
                        <span style={{ fontSize: "12px", color: "#aab7b8", fontWeight: 400 }}>183 days</span>
                      </div>
                    ) as unknown as string
                  }
                ]
              },
              {
                id: "account-details",
                text: "Account Details",
                itemType: "group",
                items: [
                  { 
                    id: "account-id", 
                    text: (
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 700 }}>Account ID</span>
                        <span style={{ fontSize: "12px", color: "#aab7b8", fontWeight: 400 }}>2848-7484-1508</span>
                      </div>
                    ) as unknown as string
                  },
                  { 
                    id: "account-name", 
                    text: (
                      <div style={{ display: "flex", flexDirection: "column", marginTop: "4px" }}>
                        <span style={{ fontWeight: 700 }}>Account name</span>
                        <span style={{ fontSize: "12px", color: "#aab7b8", fontWeight: 400 }}>Shubham Saini</span>
                      </div>
                    ) as unknown as string
                  },
                ]
              },
              { id: "account", text: "Account" },
              { id: "organization", text: "Organization" },
              { id: "quotas", text: "Service Quotas" },
              { id: "billing", text: "Billing and Cost Management" },
              { id: "security", text: "Security credentials" },
              { 
                id: "signout-buttons", 
                text: (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px", paddingTop: "8px", paddingBottom: "4px" }}>
                    <div style={{ padding: "4px 16px", borderRadius: "20px", border: "1px solid #44b9d6", color: "#44b9d6", fontWeight: 700, fontSize: "13px" }}>
                      Turn on multi-session support
                    </div>
                    <div 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent dropdown from closing prematurely
                          localStorage.removeItem("aws-mock-token");
                          router.push("/login");
                        }}
                        style={{ padding: "6px 20px", backgroundColor: "#ff9900", color: "#16191f", borderRadius: "20px", fontWeight: 700, fontSize: "14px" }}
                      >
                      Sign out
                    </div>
                  </div>
                ) as unknown as string 
              },
            ],
          },
        ]}
      />

      {/* CUSTOM FULL-WIDTH BREADCRUMB BAR */}
      <div style={{
        display: "flex",
        alignItems: "center",
        backgroundColor: theme === "dark" ? "#161D26" : "#ffffff",
        padding: "6px 16px",
        borderBottom: theme === "dark" ? "1px solid #424650" : "1px solid #C6C6CD",
        gap: "16px",
        flexShrink: 0
      }}>
        <button
          onClick={() => setNavigationOpen(!navigationOpen)}
          style={{
            backgroundColor: navigationOpen ? "#30abee" : "transparent",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "background-color 0.2s"
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={navigationOpen ? "#010101" : (theme === "dark" ? "#ffffff" : "#1d1e1f")} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <BreadcrumbGroup
          items={breadcrumbs}
          onFollow={(e) => {
            e.preventDefault();
            router.push(e.detail.href);
          }}
        />
      </div>

      <div className={styles.customLayoutWrapper} data-theme={theme}>
        <AppLayout
          navigationOpen={navigationOpen}
          onNavigationChange={(e) => setNavigationOpen(e.detail.open)}
          navigation={
            <SideNavigation
              activeHref={activeHref}
              header={{ href: "/", text: "Route 53" }}
              onFollow={(e) => {
                e.preventDefault();
                const href = e.detail.href;
                
                // --- NEW: Intercept mock routes and trigger Coming Soon Modal ---
                const isRealRoute = href === "/" || href === "/dashboard" || href.startsWith("/hosted-zones");
                
                if (!isRealRoute) {
                  setFeatureName(e.detail.text || "This");
                  setIsComingSoonOpen(true);
                } else {
                  router.push(href);
                }
              }}
              items={[
                { type: "link", text: "Dashboard", href: "/" },
                { type: "link", text: "Hosted zones", href: "/hosted-zones" },
                { type: "link", text: "Health checks", href: "/health-checks" },
                { type: "link", text: "Profiles", href: "/profiles" },
                { type: "divider" },
                {
                  type: "section",
                  text: "Global Resolver",
                  items: [
                    { type: "link", text: "Global resolvers", href: "/resolvers" },
                    { type: "link", text: "Shared DNS views", href: "/dns-views" },
                  ],
                },
                {
                  type: "section",
                  text: "VPC Resolver",
                  items: [
                    { type: "link", text: "VPCs", href: "/vpcs" },
                    { type: "link", text: "Inbound endpoints", href: "/inbound" },
                    { type: "link", text: "Outbound endpoints", href: "/outbound" },
                    { type: "link", text: "Rules", href: "/rules" },
                    { type: "link", text: "Query logging", href: "/queryLogging" },
                    { type: "link", text: "Outposts", href: "/outposts" },
                  ],
                }
              ]}
            />
          }
          content={
            <ContentLayout
              header={
                pageTitle ? (
                  <Header variant="h1" info={<Link variant="info">Info</Link>}>
                    {pageTitle}
                  </Header>
                ) : undefined
              }
            >
              {children}
            </ContentLayout>
          }
          toolsHide={true}
        />
      </div>

      {/* --- NEW: Coming Soon Modal Component --- */}
      <Modal
        onDismiss={() => setIsComingSoonOpen(false)}
        visible={isComingSoonOpen}
        header="Coming soon"
        footer={
          <Box float="right">
            <Button variant="primary" onClick={() => setIsComingSoonOpen(false)}>
              OK
            </Button>
          </Box>
        }
      >
        <Box variant="p">
          The <b>{featureName}</b> feature is currently under development and will be available in a future release.
        </Box>
      </Modal>

    </div>
  );
}