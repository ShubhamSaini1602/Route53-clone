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
  
  // State to manage Amazon Q Sidebar visibility
  const [isQOpen, setIsQOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    applyMode(Mode.Dark);
  }, []);

  if (!isMounted) {
    return <div style={{ minHeight: "100vh", backgroundColor: "#0f1b2a" }} />;
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: theme === "dark" ? "#0f1b2a" : "#f2f3f3", transition: "background-color 0.2s ease" }}>
      
      {/* --- AMAZON Q TOP NAV ICON HACK --- */}
      {/* Placed absolutely over Cloudscape's TopNav to match the exact AWS layout */}
      <div className={styles.amazonQNavIconWrapper} onClick={() => setIsQOpen(!isQOpen)}>
        <div className={styles.verticalDivider} />
        <img src="/amazon-q-icon.png" alt="Amazon Q" className={styles.amazonQIcon} />
        <div className={styles.verticalDivider} />
      </div>

      {/* --- AMAZON Q SIDEBAR (MOCKED AI WINDOW) --- */}
      <div className={`${styles.qSidebar} ${isQOpen ? styles.qSidebarOpen : ""}`} data-theme={theme}>
        <div className={styles.qSidebarHeader}>
          <div className={styles.qSidebarTitle}>
            <img src="/amazon-q-icon.png" alt="Q" className={styles.qSidebarHeaderIcon} />
            <span>Amazon Q</span>
          </div>
          <div className={styles.qSidebarActions}>
            <button title="New Chat">+</button>
            <button title="History">◷</button>
            <button title="Settings">⚙</button>
            <button title="Close" onClick={() => setIsQOpen(false)}>&lt;</button>
          </div>
        </div>

        {/* Blurred Chat Interface */}
        <div className={styles.qSidebarContentWrapper}>
          <div className={styles.qSidebarBlurredContent}>
            <div className={styles.qSidebarChatHeader}>
              <img src="/amazon-q-icon.png" alt="Q Large" className={styles.qSidebarLargeIcon} />
              <h2>How can I help you today?</h2>
            </div>
            
            <div className={styles.qSidebarSuggestions}>
              <div className={styles.qCard}>
                <strong>How do I add a custom domain to my application?</strong>
                <p>Configure Route 53 or CloudFront for custom domain routing.</p>
                <span className={styles.qTag}>Q&amp;A</span>
              </div>
            </div>

            <div className={styles.qSidebarInputArea}>
              <textarea placeholder="Describe what you want to do with AWS, such as 'List all S3 buckets'." disabled></textarea>
            </div>
          </div>

          {/* Coming Soon Overlay */}
          <div className={styles.qComingSoonOverlay}>
            <div className={styles.qComingSoonBox}>
              <h3>Coming Soon</h3>
              <p>The Amazon Q generative AI assistant mock is currently under construction.</p>
              <Button onClick={() => setIsQOpen(false)}>Dismiss</Button>
            </div>
          </div>
        </div>
      </div>
      {/* --- END AMAZON Q SIDEBAR --- */}

      <TopNavigation
        identity={{
          href: "/",
          title: "    ", // Empty spaces to make room for our absolute Q Icon hack
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
              ]}
              enteredTextLabel={(value) => `Search for "${value}"`}
              ariaLabel="Search AWS services"
              placeholder="Search"
              empty="No results found"
            />
            <div 
              className={styles.searchSuffix} 
              style={{ right: searchValue.length > 0 ? "48px" : "16px", transition: "right 0.2s ease" }}
              onClick={() => setIsQOpen(true)}
            >
              <span>[Alt+S]</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <img src="/amazon-q-icon.png" alt="Q" style={{ width: "16px", height: "16px" }} />
                <span style={{ fontWeight: "bold" }}>Ask Amazon Q</span>
              </div>
            </div>
          </div>
        }
        utilities={[
          /* ... Your existing utilities ... */
          { 
            type: "menu-dropdown", 
            iconName: "settings", 
            ariaLabel: "Settings",
            onItemClick: (e) => {
              if (e.detail.id === "mode-light") {
                setTheme("light");
                applyMode(Mode.Light);
              } else if (e.detail.id === "mode-dark") {
                setTheme("dark");
                applyMode(Mode.Dark);
              }
            },
            items: [
              { id: "settings-header", text: "Current user settings", itemType: "group" },
              {
                id: "visual-mode",
                text: "Visual mode - beta",
                itemType: "group",
                items: [
                  { id: "mode-default", text: "Browser default", disabled: true },
                  { id: "mode-light", text: "Light" },
                  { id: "mode-dark", text: "Dark" }
                ]
              }
            ]
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
        flexShrink: 0,
        zIndex: 10 /* Keep under Q sidebar */
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
                router.push(e.detail.href);
              }}
              items={[
                { type: "link", text: "Dashboard", href: "/" },
                { type: "link", text: "Hosted zones", href: "/hosted-zones" },
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
    </div>
  );
}